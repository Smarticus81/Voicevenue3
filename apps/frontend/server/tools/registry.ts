import fs from "node:fs";
import path from "node:path";
import type ts from "typescript";

export type ToolDef = {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  handlerPath: string;
};

export type LoadedTool = ToolDef & {
  handler: (params: any, ctx: ToolCtx) => Promise<any>;
};

export type ToolCtx = {
  venueId: string;
  agentId: string;
  // room for auth, tracing, etc.
};

// Resolve tools directory relative to the Next.js app cwd (apps/frontend)
const TOOLS_DIR = path.resolve(process.cwd(), "server", "tools");

export function loadRegistry(): Record<string, LoadedTool> {
  const tools: Record<string, LoadedTool> = {};
  if (!fs.existsSync(TOOLS_DIR)) return tools;
  const entries = fs.readdirSync(TOOLS_DIR, { withFileTypes: true });

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const dir = path.join(TOOLS_DIR, ent.name);
    const defPath = path.join(dir, "definition.json");
    // Support multiple handler extensions
    const handlerCandidates = [
      path.join(dir, "handler.js"),
      path.join(dir, "handler.mjs"),
      path.join(dir, "handler.cjs"),
      path.join(dir, "handler.ts"),
      path.join(dir, "index.js"),
      path.join(dir, "index.ts"),
    ];
    const handlerPath = handlerCandidates.find((p) => fs.existsSync(p));

    if (!fs.existsSync(defPath) || !handlerPath) continue;

    try {
      const def = JSON.parse(fs.readFileSync(defPath, "utf-8")) as ToolDef;
      
      // Use dynamic import for better Next.js compatibility
      let mod: any;
      try {
        // Prefer native require for CJS/JS handlers
        if (handlerPath.endsWith(".js") || handlerPath.endsWith(".cjs")) {
          mod = require(handlerPath);
        } else if (handlerPath.endsWith(".mjs")) {
          // For build-time compatibility, avoid top-level await. Fallback to require if possible.
          const esmPath = handlerPath;
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            mod = require(esmPath);
          } catch {
            // As a last resort, skip this tool in non-runtime contexts.
            console.warn(`[tools] ${ent.name}: skipping ESM handler during build`);
            continue;
          }
        } else {
          // .ts handler — transpile to CJS on the fly
          const code = fs.readFileSync(handlerPath, "utf-8");
          let output = code;
          try {
            // Lazy import typescript to avoid bundling in edge runtimes
            const tsImpl: typeof ts = require("typescript");
            output = tsImpl.transpileModule(code, {
              compilerOptions: {
                module: tsImpl.ModuleKind.CommonJS,
                target: tsImpl.ScriptTarget.ES2019,
                esModuleInterop: true,
                jsx: tsImpl.JsxEmit.React,
              },
              fileName: path.basename(handlerPath),
            }).outputText;
          } catch (e) {
            console.warn(`[tools] ${ent.name}: TS transpile failed, evaluating raw code`);
          }
          const moduleExports: any = {};
          // Local require that resolves relative paths to the tool dir
          const localRequire = (p: string) => {
            if (p.startsWith(".") || p.startsWith("/")) {
              const resolved = require.resolve(path.join(dir, p));
              return require(resolved);
            }
            return require(p);
          };
          const moduleContext = {
            exports: moduleExports,
            module: { exports: moduleExports },
            require: localRequire,
            __filename: handlerPath,
            __dirname: dir,
            console,
            process,
          } as const;
          const func = new Function(...Object.keys(moduleContext), output);
          func(...(Object.values(moduleContext) as any[]));
          mod = moduleExports;
        }
      } catch (requireError) {
        console.error(`[tools] ${ent.name}: failed to load:`, requireError);
        continue;
      }
      
      const handler = mod.handler || mod.default;
      if (typeof handler !== "function") {
        // eslint-disable-next-line no-console
        console.error(`[tools] ${ent.name}: handler.ts must export function 'handler'`);
        continue;
      }
      tools[def.name] = { ...def, handlerPath, handler } as any;
    } catch (error) {
      console.error(`[tools] ${ent.name}: failed to load:`, error);
      continue;
    }
  }
  return tools;
}


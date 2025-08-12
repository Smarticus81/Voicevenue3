export const runtime = 'nodejs';

import YAML from 'yaml';
import { z } from 'zod';

const IntentSchema = z.object({
  name: z.string().min(1),
  utterances: z.array(z.string().min(1)).min(1),
  slots: z.record(z.string(), z.string()).optional(),
  tool: z.string().min(1),
  confirmation: z.string().optional(),
});
const FileSchema = z.object({ intents: z.array(IntentSchema).min(1) });

export async function POST(req: Request) {
  try {
    const { yaml } = await req.json();
    const parsed = YAML.parse(String(yaml || ''));
    const result = FileSchema.safeParse(parsed);
    if (!result.success) {
      const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return new Response(JSON.stringify({ ok: false, errors }), { status: 400 });
    }
    return new Response(JSON.stringify({ ok: true, parsed: result.data }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errors: [e?.message || 'Invalid YAML'] }), { status: 400 });
  }
}


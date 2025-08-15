"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAgentPresetPersonality } from "@/server/prompts/system-prompts";

interface QuickBuilderProps {
  venueId?: string;
  onComplete?: (agentData: any) => void;
}

const QUICK_PRESETS = {
  basic: {
    personality: getAgentPresetPersonality("basic"),
    voice: "sage",
    lane: "openai",
    tools: ["cart_add", "cart_view", "cart_create_order", "search_drinks", "list_drinks"],
    wake: { phrase: "hey bev", fuzz: 2 }
  },
  retail: {
    personality: getAgentPresetPersonality("retail"),
    voice: "sage", 
    lane: "openai",
    tools: ["cart_add", "cart_view", "cart_create_order", "search_drinks", "list_drinks", "inventory_check"],
    wake: { phrase: "hey assistant", fuzz: 2 }
  },
  Bar: {
    personality: getAgentPresetPersonality("bar"),
    voice: "sage",
    lane: "openai", 
    tools: ["cart_add", "cart_view", "cart_create_order", "search_drinks", "list_drinks", "table_management"],
    wake: { phrase: "hey order", fuzz: 2 }
  },
  rag: {
    personality: getAgentPresetPersonality("rag"),
    voice: "sage",
    lane: "openai",
    tools: ["search_documents", "upload_document", "list_documents", "delete_document", "summarize_document"],
    wake: { phrase: "hey assistant", fuzz: 2 }
  },
  "flexible-rag": {
    personality: "You are a flexible data assistant capable of working with various data sources and formats.",
    voice: "sage",
    lane: "openai",
    tools: ["analyze_document", "query_database", "read_spreadsheet", "write_spreadsheet", "search_web", "transform_data", "generate_report", "connect_api"],
    wake: { phrase: "hey data assistant", fuzz: 2 }
  }
};

const POS_TEMPLATES = [
  { id: "drinks", name: "Bar/Drinks", description: "Perfect for bars, pubs, and beverage service" },
  { id: "retail", name: "Retail Store", description: "General retail with inventory management" },
  { id: "Bar", name: "Bar", description: "Full service Bar with orders" },
  { id: "rag", name: "Voice RAG Assistant", description: "AI assistant with document knowledge base" },
  { id: "flexible-rag", name: "Flexible Data Assistant", description: "AI assistant for any data source - databases, spreadsheets, APIs" },
  { id: "custom", name: "Custom Setup", description: "Start with basic POS and customize" }
];

export default function QuickAgentBuilder({ venueId = "demo-venue", onComplete }: QuickBuilderProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agentData, setAgentData] = useState({
    agentId: `agent-${Date.now()}`,
    venueId,
    businessName: "",
    posTemplate: "drinks",
    preset: "basic",
    lane: "openai", // "openai" | "dg11"
    inventorySource: "template", // "template", "upload", "database"
    inventoryFile: null as File | null,
    databaseUrl: "",
    customInstructions: "",
    useCustomInstructions: false,
    ragDocuments: [] as File[],
    deploymentType: "kiosk" // "kiosk" | "standalone"
  });

  const handleQuickSetup = async () => {
    setLoading(true);
    try {
      // Step 1: Handle setup based on template type
      if (agentData.posTemplate === "rag") {
        // Handle RAG agent setup
        if (agentData.ragDocuments.length > 0) {
          const formData = new FormData();
          agentData.ragDocuments.forEach((file, index) => {
            formData.append(`document_${index}`, file);
          });
          formData.append("venueId", agentData.venueId);
          formData.append("agentId", agentData.agentId);
          formData.append("businessName", agentData.businessName);
          
          await fetch("/api/rag/upload-documents", {
            method: "POST",
            body: formData
          });
        }
        
        // Set deployment type for RAG agents
        agentData.deploymentType = "standalone";
      } else {
        // Handle inventory setup for POS agents
        if (agentData.inventorySource === "template") {
          // Use template data
          await fetch("/api/pos/quick-setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              venueId: agentData.venueId,
              template: agentData.posTemplate,
              businessName: agentData.businessName,
              source: "template"
            })
          });
        } else if (agentData.inventorySource === "upload" && agentData.inventoryFile) {
          // Handle file upload
          const formData = new FormData();
          formData.append("file", agentData.inventoryFile);
          formData.append("venueId", agentData.venueId);
          formData.append("businessName", agentData.businessName);
          
          await fetch("/api/inventory/upload", {
            method: "POST",
            body: formData
          });
        } else if (agentData.inventorySource === "database") {
          // Handle database connection
          await fetch("/api/inventory/connect-database", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              venueId: agentData.venueId,
              databaseUrl: agentData.databaseUrl,
              businessName: agentData.businessName
            })
          });
        }
      }

      // Step 2: Create agent with preset
      const preset = QUICK_PRESETS[agentData.preset as keyof typeof QUICK_PRESETS];
      const agentResponse = await fetch("/api/agents/quick-create", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...agentData,
          ...preset,
          lane: agentData.lane,
          businessName: agentData.businessName,
          customInstructions: agentData.useCustomInstructions ? agentData.customInstructions : null,
          useCustomInstructions: agentData.useCustomInstructions
        })
      });

      if (!agentResponse.ok) throw new Error("Failed to create agent");

      // Step 3: Auto-configure MCP tools
      await fetch("/api/mcp/auto-configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: agentData.venueId,
          agentId: agentData.agentId,
          tools: preset.tools
        })
      });

      // Step 4: Deploy the agent
      const deployResponse = await fetch("/api/agents/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agentData.agentId,
          venueId: agentData.venueId,
          deploymentType: agentData.deploymentType
        })
      });

      const deployResult = await deployResponse.json();
      const result = await agentResponse.json();
      
      onComplete?.({ ...result, deployment: deployResult });
      setStep(6); // Success step

    } catch (error) {
      console.error("Quick setup failed:", error);
      alert("Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openKiosk = () => {
    let url;
    if (agentData.posTemplate === "rag") {
      url = `/rag-agent?venueId=${agentData.venueId}&agentId=${agentData.agentId}&lane=${agentData.lane}`;
    } else if (agentData.posTemplate === "flexible-rag") {
      url = `/flexible-rag?venueId=${agentData.venueId}&agentId=${agentData.agentId}&lane=${agentData.lane}`;
    } else {
      url = `/kiosk?venueId=${agentData.venueId}&agentId=${agentData.agentId}&lane=${agentData.lane}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= num ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/50'
            }`}>
              {num}
            </div>
            {num < 5 && <div className={`w-12 h-0.5 ${step > num ? 'bg-emerald-500' : 'bg-white/20'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Business Information</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-white/70 mb-1">Business Name</label>
              <input
                value={agentData.businessName}
                onChange={(e) => setAgentData({ ...agentData, businessName: e.target.value })}
                placeholder="e.g., Mike's Bar & Grill"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Agent ID</label>
              <input
                value={agentData.agentId}
                onChange={(e) => setAgentData({ ...agentData, agentId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white"
              />
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!agentData.businessName.trim()}
            className="w-full px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">POS & Inventory Setup</h2>
          
          {/* POS Template Selection */}
          <div className="space-y-3">
            <div className="text-sm text-white/70">Choose POS Template</div>
            <div className="grid gap-2">
              {POS_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setAgentData({ ...agentData, posTemplate: template.id })}
                  className={`p-3 rounded-xl text-left border text-sm ${
                    agentData.posTemplate === template.id 
                      ? 'border-emerald-400 bg-emerald-400/10' 
                      : 'border-white/15 bg-white/5'
                  }`}
                >
                  <div className="font-semibold">{template.name}</div>
                  <div className="text-xs text-white/70">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Source Selection */}
          <div className="space-y-3">
            <div className="text-sm text-white/70">Inventory Source</div>
            <div className="grid gap-2">
              <button
                onClick={() => setAgentData({ ...agentData, inventorySource: "template" })}
                className={`p-3 rounded-xl text-left border text-sm ${
                  agentData.inventorySource === "template" 
                    ? 'border-emerald-400 bg-emerald-400/10' 
                    : 'border-white/15 bg-white/5'
                }`}
              >
                <div className="font-semibold">Use Template Data</div>
                <div className="text-xs text-white/70">Start with sample inventory for your business type</div>
              </button>
              
              <button
                onClick={() => setAgentData({ ...agentData, inventorySource: "upload" })}
                className={`p-3 rounded-xl text-left border text-sm ${
                  agentData.inventorySource === "upload" 
                    ? 'border-emerald-400 bg-emerald-400/10' 
                    : 'border-white/15 bg-white/5'
                }`}
              >
                <div className="font-semibold">Upload CSV/Excel</div>
                <div className="text-xs text-white/70">Import your existing inventory data</div>
              </button>
              
              <button
                onClick={() => setAgentData({ ...agentData, inventorySource: "database" })}
                className={`p-3 rounded-xl text-left border text-sm ${
                  agentData.inventorySource === "database" 
                    ? 'border-emerald-400 bg-emerald-400/10' 
                    : 'border-white/15 bg-white/5'
                }`}
              >
                <div className="font-semibold">Connect Database</div>
                <div className="text-xs text-white/70">Link to your existing POS/inventory database</div>
              </button>
            </div>
          </div>

          {/* File Upload for CSV */}
          {agentData.inventorySource === "upload" && (
            <div className="space-y-2">
              <label className="block text-sm text-white/70">Upload Inventory File</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setAgentData({ ...agentData, inventoryFile: e.target.files?.[0] || null })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-emerald-500 file:text-black file:font-semibold"
              />
              <div className="text-xs text-white/50">
                Supported formats: CSV, Excel (.xlsx, .xls)<br/>
                Required columns: name, category, price, inventory
              </div>
            </div>
          )}

          {/* Database Connection */}
          {agentData.inventorySource === "database" && (
            <div className="space-y-2">
              <label className="block text-sm text-white/70">Database Connection URL</label>
              <input
                type="text"
                placeholder="postgresql://user:pass@host:port/database"
                value={agentData.databaseUrl}
                onChange={(e) => setAgentData({ ...agentData, databaseUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white"
              />
              <div className="text-xs text-white/50">
                Supports PostgreSQL, MySQL, and SQL Server connections
              </div>
            </div>
          )}

          {/* RAG Document Upload */}
          {agentData.posTemplate === "rag" && (
            <div className="space-y-3">
              <div className="text-sm text-white/70">Knowledge Base Documents</div>
              <div className="space-y-2">
                <label className="block text-sm text-white/70">Upload Documents (Optional)</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md,.docx,.doc"
                  onChange={(e) => setAgentData({ ...agentData, ragDocuments: Array.from(e.target.files || []) })}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-emerald-500 file:text-black file:font-semibold"
                />
                <div className="text-xs text-white/50">
                  Supported formats: PDF, TXT, Markdown, Word documents<br/>
                  You can add more documents later even when installed as PWA
                </div>
                {agentData.ragDocuments.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-white/70 mb-1">Selected documents:</div>
                    <div className="space-y-1">
                      {agentData.ragDocuments.map((file, index) => (
                        <div key={index} className="text-xs text-white/60 flex items-center justify-between bg-black/20 px-2 py-1 rounded">
                          <span>{file.name}</span>
                          <button
                            onClick={() => setAgentData({
                              ...agentData,
                              ragDocuments: agentData.ragDocuments.filter((_, i) => i !== index)
                            })}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={agentData.inventorySource === "upload" && !agentData.inventoryFile}
              className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Agent Personality & Instructions</h2>
          
          {/* Preset Selection */}
          <div className="space-y-3">
            <div className="text-sm text-white/70">Choose Base Personality</div>
            <div className="grid gap-2">
              {Object.entries(QUICK_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setAgentData({ ...agentData, preset: key })}
                  className={`p-3 rounded-xl text-left border text-sm ${
                    agentData.preset === key 
                      ? 'border-emerald-400 bg-emerald-400/10' 
                      : 'border-white/15 bg-white/5'
                  }`}
                >
                  <div className="font-semibold capitalize">{key} Assistant</div>
                  <div className="text-xs text-white/70">{preset.personality}</div>
                  <div className="text-xs text-white/50 mt-1">
                    Wake phrase: &quot;{preset.wake.phrase}&quot; • Voice: {preset.voice}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Pipeline Selection */}
          <div className="space-y-3">
            <div className="text-sm text-white/70">Choose Voice Pipeline</div>
            <div className="grid gap-2">
              <button
                onClick={() => setAgentData({ ...agentData, lane: "openai" })}
                className={`p-3 rounded-xl text-left border text-sm ${agentData.lane === 'openai' ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/15 bg-white/5'}`}
              >
                <div className="font-semibold">OpenAI Realtime</div>
                <div className="text-xs text-white/70">Ultra-low latency two-way streaming, best contextual intelligence</div>
              </button>
              <button
                onClick={() => setAgentData({ ...agentData, lane: "dg11" })}
                className={`p-3 rounded-xl text-left border text-sm ${agentData.lane === 'dg11' ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/15 bg-white/5'}`}
              >
                <div className="font-semibold">Deepgram + ElevenLabs</div>
                <div className="text-xs text-white/70">ASR via Deepgram with natural ElevenLabs TTS</div>
              </button>
            </div>
          </div>

          {/* System Instructions Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="customInstructions"
                checked={agentData.useCustomInstructions}
                onChange={(e) => setAgentData({ ...agentData, useCustomInstructions: e.target.checked })}
                className="w-4 h-4 text-emerald-500 bg-black/30 border-white/20 rounded focus:ring-emerald-500"
              />
              <label htmlFor="customInstructions" className="text-sm text-white/70">
                Customize System Instructions
              </label>
            </div>
            
            {!agentData.useCustomInstructions && (
              <div className="p-3 rounded-lg bg-black/20 border border-white/10">
                <div className="text-xs text-white/60 mb-2">Default Instructions Include:</div>
                <ul className="text-xs text-white/50 space-y-1">
                  <li>• Professional bartender/service assistant personality</li>
                  <li>• Ultra-concise responses (≤15 words)</li>
                  <li>• Past tense during order operations</li>
                  <li>• Tool-first approach for all business actions</li>
                  <li>• Smart wake/sleep behavior</li>
                </ul>
              </div>
            )}

            {agentData.useCustomInstructions && (
              <div className="space-y-2">
                <label className="block text-sm text-white/70">Custom System Instructions</label>
                <textarea
                  value={agentData.customInstructions}
                  onChange={(e) => setAgentData({ ...agentData, customInstructions: e.target.value })}
                  placeholder="You are an AI assistant for [Business Name]. Be helpful and professional..."
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white h-32 resize-none"
                />
                <div className="text-xs text-white/50">
                  These instructions will be combined with the base personality settings above.
                  Leave blank to use only the default hardwired instructions.
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Review & Confirm</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Business:</span>
              <span>{agentData.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">POS Template:</span>
              <span>{POS_TEMPLATES.find(t => t.id === agentData.posTemplate)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Inventory Source:</span>
              <span className="capitalize">
                {agentData.inventorySource === "template" && "Template Data"}
                {agentData.inventorySource === "upload" && `File: ${agentData.inventoryFile?.name}`}
                {agentData.inventorySource === "database" && "External Database"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Agent Style:</span>
              <span className="capitalize">{agentData.preset}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Instructions:</span>
              <span>{agentData.useCustomInstructions ? "Custom" : "Default Bartender"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Voice Pipeline:</span>
              <span>{agentData.lane === 'openai' ? 'OpenAI Realtime' : 'Deepgram + ElevenLabs'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Wake Phrase:</span>
              <span>&quot;{QUICK_PRESETS[agentData.preset as keyof typeof QUICK_PRESETS].wake.phrase}&quot;</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20"
            >
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold"
            >
              Create Agent
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Setting Up Your Agent</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Creating POS system</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Configuring voice agent</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'} flex items-center justify-center`}>
                {loading ? (
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span>Connecting to POS system</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'} flex items-center justify-center`}>
                {loading ? (
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span>Deploying agent</span>
            </div>
          </div>
          <button
            onClick={handleQuickSetup}
            disabled={loading}
            className="w-full px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Complete Setup"}
          </button>
        </div>
      )}

      {step === 6 && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Agent Ready!</h2>
            <p className="text-white/70 text-sm">Your voice agent is live and ready to take orders.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openKiosk}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold"
            >
{agentData.posTemplate === "rag" ? "Open RAG Agent" : agentData.posTemplate === "flexible-rag" ? "Open Data Assistant" : "Open Kiosk"}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20"
            >
              Dashboard
            </button>
          </div>
          
          <div className="text-xs text-white/50 text-center">
            Say &quot;{QUICK_PRESETS[agentData.preset as keyof typeof QUICK_PRESETS].wake.phrase}&quot; to wake your agent
          </div>
        </div>
      )}
    </div>
  );
}

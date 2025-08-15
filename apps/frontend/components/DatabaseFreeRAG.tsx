"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { logEvent } from "@/components/analytics/logEvent";
import { createClientTrace, ingestSpan } from "@/components/trace/traceClient";

export default function DatabaseFreeRAG({
  instructions: propInstructions,
  voice = "sage",
  venueId,
  agentId,
  onDataAction,
}: { 
  instructions?: string; 
  voice?: string; 
  venueId?: string; 
  agentId?: string;
  onDataAction?: (action: string, data: any) => void;
}) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState("");
  const [instructions] = useState<string>(propInstructions || getDataAssistantInstructions());
  const currentVenueId = venueId || "data-assistant";
  const currentAgentId = agentId || "flexible-agent";
  const [vendor, setVendor] = useState<any>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const traceRef = useRef(createClientTrace(currentVenueId, currentAgentId, "data-assistant-session"));

  const isConnectingRef = useRef(false);

  function getDataAssistantInstructions(): string {
    return `You are a flexible data assistant that works with any data source - no dedicated database required.

Your capabilities:
- **Analyze Files**: Work with uploaded PDFs, Excel, CSV, Word docs, text files
- **Connect Databases**: Query existing SQL/NoSQL databases via connection strings
- **Process Spreadsheets**: Read/write Excel, Google Sheets, CSV files in real-time
- **API Integration**: Connect to REST APIs, GraphQL endpoints, web services
- **Data Transformation**: Convert between formats (JSON, CSV, XML, Excel)
- **Web Research**: Search for additional information online
- **Generate Reports**: Create insights and summaries from any data source

Key principles:
- Work with user's existing data sources
- Never require dedicated storage
- Provide immediate, actionable insights
- Be transparent about data sources and limitations
- Ask for connection details when needed

CRITICAL: When activated, respond with "Ready to work with your data! What would you like me to analyze or connect to?"`;
  }

  useEffect(() => {
    audioElRef.current = new Audio();
    if (audioElRef.current) {
      audioElRef.current.autoplay = true;
      audioElRef.current.crossOrigin = "anonymous";
      audioElRef.current.preload = "auto";
      audioElRef.current.setAttribute('playsinline', 'true');
      audioElRef.current.setAttribute('webkit-playsinline', 'true');
    }
  }, []);

  useEffect(() => {
    fetch(`/api/settings/vendor?venueId=${currentVenueId}`).then((r) => r.json()).then(setVendor).catch(() => {});
  }, [currentVenueId]);

  const handleFunctionCall = useCallback(async (name: string, parameters: any) => {
    console.log(`[Data Assistant] Function call:`, name, parameters);
    
    // All tools are client-side demonstrations - no database needed
    const toolResponse = {
      analyze_file: () => ({
        success: true,
        message: `File analysis for: ${parameters.file_name || 'uploaded file'}`,
        note: "Ready to integrate with document processing APIs (Adobe PDF Services, Unstructured.io, etc.)"
      }),
      connect_database: () => ({
        success: true,
        message: `Database connection requested: ${parameters.db_type || 'SQL'}`,
        note: "Ready to connect to MySQL, PostgreSQL, MongoDB, Firebase, etc."
      }),
      process_spreadsheet: () => ({
        success: true,
        message: `Spreadsheet processing: ${parameters.action || 'read'} operation`,
        note: "Ready to integrate with Excel files, Google Sheets API, CSV parsers"
      }),
      call_api: () => ({
        success: true,
        message: `API call to: ${parameters.endpoint || 'external service'}`,
        note: "Ready to connect to any REST API or GraphQL endpoint"
      }),
      transform_data: () => ({
        success: true,
        message: `Data transformation: ${parameters.from_format} → ${parameters.to_format}`,
        note: "Ready to convert between JSON, CSV, XML, Excel formats"
      }),
      web_search: () => ({
        success: true,
        message: `Web search for: "${parameters.query}"`,
        note: "Ready to integrate with search APIs (Google, Bing, etc.)"
      }),
      generate_report: () => ({
        success: true,
        message: `Report generation: ${parameters.type || 'summary'} report`,
        note: "Ready to create comprehensive reports from analyzed data"
      })
    };

    const result = toolResponse[name as keyof typeof toolResponse]?.() || {
      success: false,
      error: `Tool ${name} not implemented`
    };

    if (onDataAction) {
      onDataAction(name, { parameters, result });
    }

    return { output: JSON.stringify(result) };
  }, [onDataAction]);

  const start = useCallback(async () => {
    if (isConnectingRef.current || status === "connected") return;
    
    try {
      isConnectingRef.current = true;
      setStatus("connecting");
      setError("");

      const response = await fetch(`/api/voice/openai/sdp?venueId=${currentVenueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions,
          voice: vendor?.realtimeVoice || voice,
          model: vendor?.realtimeModel || "gpt-4o-realtime-preview-2024-12-17",
          tools: [
            {
              type: "function",
              name: "analyze_file",
              description: "Analyze uploaded files (PDF, Excel, CSV, Word, text)",
              parameters: {
                type: "object",
                properties: {
                  file_name: { type: "string", description: "Name of the file to analyze" },
                  analysis_type: { type: "string", enum: ["summary", "extraction", "insights"] }
                }
              }
            },
            {
              type: "function", 
              name: "connect_database",
              description: "Connect to external databases (MySQL, PostgreSQL, MongoDB)",
              parameters: {
                type: "object",
                properties: {
                  db_type: { type: "string", enum: ["mysql", "postgresql", "mongodb", "firebase"] },
                  connection_string: { type: "string", description: "Database connection details" },
                  query: { type: "string", description: "Query to execute" }
                }
              }
            },
            {
              type: "function",
              name: "process_spreadsheet", 
              description: "Work with Excel, Google Sheets, CSV files",
              parameters: {
                type: "object",
                properties: {
                  file_source: { type: "string", description: "File path or Google Sheets ID" },
                  action: { type: "string", enum: ["read", "write", "analyze"] },
                  sheet_name: { type: "string", description: "Sheet name (for Excel)" }
                }
              }
            },
            {
              type: "function",
              name: "call_api",
              description: "Connect to external APIs and web services",
              parameters: {
                type: "object", 
                properties: {
                  endpoint: { type: "string", description: "API endpoint URL" },
                  method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] },
                  headers: { type: "object", description: "Request headers" }
                }
              }
            },
            {
              type: "function",
              name: "transform_data",
              description: "Convert data between formats",
              parameters: {
                type: "object",
                properties: {
                  from_format: { type: "string", enum: ["json", "csv", "xml", "excel"] },
                  to_format: { type: "string", enum: ["json", "csv", "xml", "excel"] },
                  data_sample: { type: "string", description: "Sample of data to transform" }
                }
              }
            },
            {
              type: "function",
              name: "web_search",
              description: "Search the web for information",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Search query" },
                  max_results: { type: "number", description: "Max results to return" }
                }
              }
            },
            {
              type: "function",
              name: "generate_report",
              description: "Create reports from analyzed data",
              parameters: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["summary", "analysis", "comparison"] },
                  data_sources: { type: "array", description: "List of data sources used" }
                }
              }
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Voice service failed: ${response.status}`);
      }

      const { sdp } = await response.json();
      
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (audioElRef.current) {
          audioElRef.current.srcObject = event.streams[0];
        }
      };

      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dcRef.current = dc;
        
        dc.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === "function_call") {
              const result = await handleFunctionCall(message.name, message.parameters);
              dc.send(JSON.stringify({
                type: "function_result",
                call_id: message.call_id,
                result: result.output
              }));
            }
          } catch (error) {
            console.error("[Data Assistant] DataChannel error:", error);
          }
        };
      };

      await pc.setRemoteDescription({ type: "offer", sdp });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await fetch(`/api/voice/openai/sdp?venueId=${currentVenueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: answer.sdp })
      });

      setStatus("connected");
      logEvent("data_assistant_started", { venueId: currentVenueId, agentId: currentAgentId });

    } catch (err: any) {
      console.error("[Data Assistant] Start error:", err);
      setError(err.message || "Failed to connect");
      setStatus("error");
    } finally {
      isConnectingRef.current = false;
    }
  }, [currentVenueId, currentAgentId, instructions, vendor, voice, handleFunctionCall]);

  const stop = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }

    setStatus("idle");
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "connected": return "bg-green-500";
      case "connecting": return "bg-yellow-500 animate-pulse";
      case "error": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected": return "Connected - Ready for any data source";
      case "connecting": return "Connecting to data assistant...";
      case "error": return error || "Connection error";
      default: return "Click to start data assistant";
    }
  };

  return (
    <div className="neuro-card p-6 space-y-6">
      {/* BevPro Logo */}
      <div className="flex justify-center mb-4">
        <img
          src="/bevpro-logo.svg"
          alt="BevPro"
          className="h-6 w-auto opacity-60"
        />
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">Database-Free Data Assistant</h2>
        <p className="text-sm text-gray-600">Works with your existing data sources</p>
      </div>

      {/* Status */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <span className="font-medium text-gray-800">{getStatusText()}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        {status === "idle" || status === "error" ? (
          <button
            onClick={start}
            disabled={isConnectingRef.current}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50"
          >
            Start Data Assistant
          </button>
        ) : (
          <button
            onClick={stop}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold"
          >
            Stop Assistant
          </button>
        )}
      </div>

      {/* Data Sources */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="font-semibold text-blue-700">Your Files</div>
          <div className="text-gray-600">PDF, Excel, CSV, Word</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="font-semibold text-green-700">Your Databases</div>
          <div className="text-gray-600">MySQL, Postgres, Mongo</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <div className="font-semibold text-purple-700">Your APIs</div>
          <div className="text-gray-600">REST, GraphQL, WebHooks</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="font-semibold text-orange-700">Web Data</div>
          <div className="text-gray-600">Search, Scrape, Research</div>
        </div>
      </div>

      {/* No Database Badge */}
      <div className="text-center">
        <span className="inline-block bg-gradient-to-r from-green-100 to-blue-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
          ✓ No Dedicated Database Required
        </span>
      </div>
    </div>
  );
}

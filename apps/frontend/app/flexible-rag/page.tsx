"use client";
import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import PWAInstall from "@/components/PWAInstall";
import { 
  Database, 
  FileSpreadsheet, 
  FileText, 
  Globe,
  Zap,
  BarChart3,
  Settings,
  Play,
  Upload,
  X
} from "lucide-react";

// Dynamic import for voice components
const FlexibleRAGAgent = dynamic(() => import("@/components/FlexibleRAGAgent"), { ssr: false });

export default function FlexibleRAGPage() {
  const [systemInstructions, setSystemInstructions] = useState("");
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [dataActions, setDataActions] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingInstructions, setIsSavingInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDataAction = useCallback((action: string, data: any) => {
    console.log(`Data action: ${action}`, data);
    setDataActions(prev => [{
      id: Date.now(),
      action,
      timestamp: new Date().toISOString(),
      ...data
    }, ...prev.slice(0, 9)]); // Keep last 10 actions
  }, []);

  // Load existing instructions on page load
  useEffect(() => {
    const loadInstructions = async () => {
      try {
        const response = await fetch('/api/rag/instructions?venueId=flexible-rag&agentId=data-assistant');
        if (response.ok) {
          const data = await response.json();
          if (data.instructions) {
            setSystemInstructions(data.instructions);
          }
        }
      } catch (error) {
        console.log('No existing instructions found');
      }
    };
    
    loadInstructions();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        const allowedTypes = [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'application/json'
        ];
        return allowedTypes.includes(file.type) || 
               file.name.endsWith('.md') || 
               file.name.endsWith('.txt') ||
               file.name.endsWith('.csv') ||
               file.name.endsWith('.json');
      });
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Clear the input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('venueId', 'flexible-rag');
      formData.append('agentId', 'data-assistant');
      formData.append('businessName', 'Flexible RAG Assistant');
      
      uploadedFiles.forEach((file, index) => {
        formData.append(`document_${index}`, file);
      });

      const response = await fetch('/api/rag/upload-documents', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        handleDataAction('upload_files', {
          files: uploadedFiles.map(f => f.name),
          count: uploadedFiles.length,
          message: 'Files uploaded and processed successfully'
        });
        setUploadedFiles([]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        const allowedTypes = [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'application/json'
        ];
        return allowedTypes.includes(file.type) || 
               file.name.endsWith('.md') || 
               file.name.endsWith('.txt') ||
               file.name.endsWith('.csv') ||
               file.name.endsWith('.json');
      });
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const saveInstructions = async () => {
    if (!systemInstructions.trim()) return;
    
    setIsSavingInstructions(true);
    try {
      // Save in both formats: RAG-specific and agent config format
      const [ragResponse, agentResponse] = await Promise.all([
        // Save RAG-specific instructions
        fetch('/api/rag/instructions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            venueId: 'flexible-rag', 
            agentId: 'data-assistant', 
            instructions: systemInstructions 
          })
        }),
        // Save as agent config for voice API
        fetch('/api/agents/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venueId: 'flexible-rag',
            agentId: 'data-assistant',
            config: {
              personality: systemInstructions,
              rules: [],
              model: {
                provider: 'openai',
                name: 'gpt-4o-realtime-preview-2024-12-17'
              }
            }
          })
        })
      ]);

      if (ragResponse.ok && agentResponse.ok) {
        handleDataAction('save_instructions', {
          message: 'Instructions saved successfully for voice agent',
          preview: systemInstructions.substring(0, 100) + '...'
        });
      } else {
        throw new Error('Failed to save instructions');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save instructions. Please try again.');
    } finally {
      setIsSavingInstructions(false);
    }
  };

  const demoScenarios = [
    {
      id: "database",
      title: "Database Operations",
      description: "Query customer data, analyze sales trends",
      icon: Database,
      color: "blue",
      example: "Show me all customers who purchased in the last 30 days"
    },
    {
      id: "spreadsheet", 
      title: "Spreadsheet Analysis",
      description: "Process Excel files, generate reports",
      icon: FileSpreadsheet,
      color: "green", 
      example: "Analyze this sales spreadsheet and create a summary report"
    },
    {
      id: "documents",
      title: "Document Processing",
      description: "Extract insights from PDFs, contracts",
      icon: FileText,
      color: "purple",
      example: "Extract key terms from this contract document"
    },
    {
      id: "api",
      title: "API Integration", 
      description: "Connect to external services, fetch data",
      icon: Globe,
      color: "indigo",
      example: "Get weather data for our store locations"
    },
    {
      id: "automation",
      title: "Data Automation",
      description: "Transform, clean, and merge datasets", 
      icon: Zap,
      color: "yellow",
      example: "Convert this CSV to JSON and merge with user data"
    },
    {
      id: "analytics",
      title: "Advanced Analytics",
      description: "Pattern recognition, predictive insights",
      icon: BarChart3, 
      color: "red",
      example: "Analyze customer behavior patterns and predict churn"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Flexible RAG Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered assistant that works with any data source - databases, spreadsheets, documents, APIs, and more
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Voice Assistant */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <FlexibleRAGAgent
              instructions={systemInstructions}
              venueId="flexible-rag"
              agentId="data-assistant"
              onDataAction={handleDataAction}
            />
          </motion.div>

          {/* Controls & Settings */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Custom Instructions */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Custom Instructions</h3>
              </div>
              <textarea
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.target.value)}
                placeholder="Enter custom instructions for your data assistant..."
                rows={4}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm text-gray-900 placeholder-gray-500"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">
                  Customize how the assistant should handle your specific data tasks
                </p>
                <button
                  onClick={saveInstructions}
                  disabled={!systemInstructions.trim() || isSavingInstructions}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSavingInstructions ? 'Saving...' : 'Save Instructions'}
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Upload Files</h3>
              </div>
              
              <div className="space-y-4">
                {/* File Input */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.csv,.json"
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop files here or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Choose Files
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports: PDF, TXT, MD, DOC, DOCX, XLS, XLSX, CSV, JSON
                  </p>
                </div>

                {/* Selected Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={uploadFiles}
                      disabled={isUploading}
                      className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
                    >
                      {isUploading ? 'Processing...' : `Process ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PWA Install */}
            <PWAInstall />

            {/* Recent Actions */}
            {dataActions.length > 0 && (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Actions</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dataActions.map((action) => (
                    <div key={action.id} className="text-xs bg-gray-50 p-2 rounded border-l-2 border-blue-400">
                      <div className="font-medium text-gray-700">{action.action}</div>
                      <div className="text-gray-500">{new Date(action.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Demo Scenarios */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            What can you do with it?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoScenarios.map((scenario, index) => {
              const Icon = scenario.icon;
              const isActive = activeDemo === scenario.id;
              
              return (
                <motion.div
                  key={scenario.id}
                  className={`bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6 cursor-pointer transition-all hover:shadow-2xl ${
                    isActive ? `ring-2 ring-${scenario.color}-400` : ''
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  onClick={() => setActiveDemo(isActive ? null : scenario.id)}
                >
                  <div className={`w-12 h-12 rounded-lg bg-${scenario.color}-100 flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 text-${scenario.color}-600`} />
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 mb-2">{scenario.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                  
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="border-t pt-3 mt-3"
                    >
                      <div className="text-xs text-gray-500 mb-2">Example:</div>
                      <div className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded">
                        &quot;{scenario.example}&quot;
                      </div>
                      <button className={`mt-3 px-3 py-1 text-xs bg-${scenario.color}-500 text-white rounded-lg hover:bg-${scenario.color}-600 transition-colors flex items-center gap-1`}>
                        <Play className="w-3 h-3" />
                        Try This
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Key Features */}
        <motion.div 
          className="mt-12 bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            No Dedicated Database Required
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Any Database</h3>
              <p className="text-sm text-gray-600">MySQL, PostgreSQL, MongoDB, Firebase - connect to existing databases</p>
            </div>
            
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Live Spreadsheets</h3>
              <p className="text-sm text-gray-600">Excel files, Google Sheets, CSV - real-time analysis and updates</p>
            </div>
            
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Document Upload</h3>
              <p className="text-sm text-gray-600">PDF, Word, TXT - drag & drop any document for instant analysis</p>
            </div>
            
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                <Globe className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">API Integration</h3>
              <p className="text-sm text-gray-600">REST APIs, GraphQL - pull data from any online service</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

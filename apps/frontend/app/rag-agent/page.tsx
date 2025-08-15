"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import PWAInstall from "@/components/PWAInstall";
import { 
  Mic, 
  Upload, 
  FileText, 
  Trash2, 
  Search,
  Book,
  MessageCircle,
  Settings,
  Download,
  Plus,
  X
} from "lucide-react";

// Dynamic import for voice components
const VoiceRAGAgent = dynamic(() => import("@/components/VoiceRAGAgent"), { ssr: false });

interface Document {
  id: string;
  filename: string;
  type: string;
  size: number;
  uploadedAt: string;
  contentLength: number;
}

export default function RAGAgentPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  
  const venueId = searchParams?.get('venueId') || "rag-venue";
  const agentId = searchParams?.get('agentId') || "rag-agent";
  const lane = searchParams?.get('lane') || "openai";
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'settings'>('chat');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [agentName, setAgentName] = useState("AI Assistant");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [systemInstructions, setSystemInstructions] = useState("");
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [savingInstructions, setSavingInstructions] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/rag/list-documents?venueId=${venueId}&agentId=${agentId}`);
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [venueId, agentId]);

  const loadSystemInstructions = useCallback(async () => {
    try {
      const response = await fetch(`/api/rag/instructions?venueId=${venueId}&agentId=${agentId}`);
      const data = await response.json();
      setSystemInstructions(data.instructions || "");
    } catch (error) {
      console.error('Failed to load system instructions:', error);
    }
  }, [venueId, agentId]);

  const saveSystemInstructions = async () => {
    setSavingInstructions(true);
    try {
      const response = await fetch('/api/rag/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venueId, 
          agentId, 
          instructions: systemInstructions 
        })
      });

      if (response.ok) {
        setEditingInstructions(false);
      } else {
        throw new Error('Failed to save instructions');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save system instructions. Please try again.');
    } finally {
      setSavingInstructions(false);
    }
  };

  // Load documents and instructions on component mount
  useEffect(() => {
    loadDocuments();
    loadSystemInstructions();
  }, [venueId, agentId, loadDocuments, loadSystemInstructions]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => {
      const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'];
      return allowedTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt');
    });
    
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const uploadDocuments = async () => {
    if (pendingFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('venueId', venueId);
      formData.append('agentId', agentId);
      formData.append('businessName', agentName);
      
      pendingFiles.forEach((file, index) => {
        formData.append(`document_${index}`, file);
      });

      const response = await fetch('/api/rag/upload-documents', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setPendingFiles([]);
        setShowUploadModal(false);
        await loadDocuments();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch('/api/rag/delete-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, venueId, agentId })
      });

      if (response.ok) {
        await loadDocuments();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const searchDocuments = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/rag/search-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery, 
          venueId, 
          agentId,
          limit: 10 
        })
      });

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <title>{`${agentName} - Voice RAG Assistant`}</title>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Book size={24} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-white">{agentName}</h1>
                    <img 
                      src="/bevpro-logo.svg" 
                      alt="BevPro" 
                      className="h-5 w-auto opacity-60"
                    />
                  </div>
                  <p className="text-sm text-white/60">Level 1 - RAG/Standalone Agent</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <PWAInstall />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mt-4">
              {[
                { id: 'chat', label: 'Voice Chat', icon: MessageCircle },
                { id: 'documents', label: 'Knowledge Base', icon: FileText },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Voice Chat Tab */}
            {activeTab === 'chat' && (
              <div className="h-[calc(100vh-200px)] flex gap-4">
                {/* Voice Interface - Left Side */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 glass rounded-2xl p-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-white mb-2">Voice Assistant</h2>
                    <p className="text-white/60 text-sm">Ask questions about your documents using voice or text</p>
                  </div>
                  
                  <div className="max-w-md mx-auto">
                    <VoiceRAGAgent
                      venueId={venueId}
                      agentId={agentId}
                      voice="sage"
                      onDocumentSearch={(query, results) => {
                        console.log("Document search:", query, results);
                        setSearchQuery(query);
                        setSearchResults(results);
                      }}
                    />
                  </div>
                </motion.div>

                {/* Quick Search & Knowledge Base - Right Side */}
                <div className="w-80 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass rounded-2xl p-4"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Search</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                          placeholder="Search documents..."
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-white/40 text-sm"
                        />
                        <button
                          onClick={searchDocuments}
                          disabled={isSearching}
                          className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          <Search size={16} />
                        </button>
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {searchResults.map((result, index) => (
                            <div key={index} className="p-2 bg-white/5 rounded-lg">
                              <div className="text-xs font-medium text-white mb-1">{result.filename}</div>
                              <div className="text-xs text-white/60 line-clamp-2">{result.matches?.[0]?.context}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Document Summary */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass rounded-2xl p-4"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Knowledge Base</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <div className="text-lg font-bold text-emerald-400">{documents.length}</div>
                          <div className="text-xs text-white/60">Documents</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <div className="text-lg font-bold text-emerald-400">
                            {formatFileSize(documents.reduce((sum, doc) => sum + doc.size, 0))}
                          </div>
                          <div className="text-xs text-white/60">Total Size</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <Plus size={16} />
                        <span>Add Documents</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Knowledge Base Documents</h2>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition-colors flex items-center gap-2 font-semibold"
                  >
                    <Upload size={16} />
                    <span>Upload</span>
                  </button>
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} className="text-white/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No documents uploaded</h3>
                    <p className="text-white/60 mb-6 text-sm">Upload PDFs, Word docs, or text files to get started</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition-colors font-semibold"
                    >
                      Upload Your First Document
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {documents.map((doc) => (
                      <motion.div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <FileText size={20} className="text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{doc.filename}</h3>
                            <div className="text-sm text-white/60">
                              {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="w-10 h-10 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-colors flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">Settings</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Assistant Name</label>
                      <input
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Agent ID</label>
                      <input
                        type="text"
                        value={agentId}
                        disabled
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Voice Pipeline</label>
                    <input
                      type="text"
                      value="OpenAI Realtime"
                      disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50"
                    />
                  </div>

                  {/* System Instructions Editor */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-white">System Instructions</label>
                      {!editingInstructions ? (
                        <button
                          onClick={() => setEditingInstructions(true)}
                          className="px-3 py-1 text-sm bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingInstructions(false);
                              loadSystemInstructions(); // Reset to saved value
                            }}
                            className="px-3 py-1 text-sm bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveSystemInstructions}
                            disabled={savingInstructions}
                            className="px-3 py-1 text-sm bg-emerald-500 text-black rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            {savingInstructions ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {editingInstructions ? (
                      <textarea
                        value={systemInstructions}
                        onChange={(e) => setSystemInstructions(e.target.value)}
                        rows={8}
                        placeholder="Enter custom system instructions for your RAG agent..."
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-white placeholder-white/40"
                      />
                    ) : (
                      <div className="w-full min-h-[200px] px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white whitespace-pre-wrap">
                        {systemInstructions || "No custom instructions set. Click Edit to add custom system instructions for your RAG agent."}
                      </div>
                    )}
                    
                    <p className="text-xs text-white/60 mt-2">
                      These instructions will be used to customize how your RAG agent behaves and responds to users.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              className="glass rounded-2xl shadow-2xl max-w-md w-full p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Upload Documents</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-400/30 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400/50 transition-colors bg-emerald-500/5"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Upload size={24} className="text-emerald-400" />
                  </div>
                  <p className="text-white mb-2">Click to select files</p>
                  <p className="text-sm text-white/60">PDF, Word, Text, Markdown</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md,.docx,.doc"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />

                {pendingFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-white">Selected Files:</h4>
                    {pendingFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-sm text-white truncate">{file.name}</span>
                        <button
                          onClick={() => setPendingFiles(files => files.filter((_, i) => i !== index))}
                          className="w-6 h-6 text-red-400 hover:text-red-300 flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={uploadDocuments}
                    disabled={pendingFiles.length === 0 || isUploading}
                    className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition-colors disabled:opacity-50 font-semibold"
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}

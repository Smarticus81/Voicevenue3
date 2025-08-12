"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Mic, 
  Settings, 
  Zap, 
  Shield, 
  BarChart3,
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react";

import { NeuroButton } from "@/components/ui/NeuroButton";
import { NeuroCard, NeuroCardHeader, NeuroCardTitle, NeuroCardDescription, NeuroCardContent } from "@/components/ui/NeuroCard";
import { NeuroInput, NeuroTextarea, NeuroSelect } from "@/components/ui/NeuroInput";
import { NeuroToggle, NeuroRadioGroup, NeuroRadio } from "@/components/ui/NeuroToggle";
import { NeuroModal, NeuroModalFooter } from "@/components/ui/NeuroModal";

export default function NeumorphicDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(75);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="min-h-screen p-8 space-y-12 fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-16"
        >
          <h1 className="heading-primary">
            <span className="text-gradient">Neumorphic</span> Design System
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            A comprehensive showcase of BevPro Studio's cutting-edge neumorphic components
          </p>
        </motion.div>

        {/* Buttons Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="space-y-8"
        >
          <NeuroCard>
            <NeuroCardHeader>
              <NeuroCardTitle>Interactive Buttons</NeuroCardTitle>
              <NeuroCardDescription>
                Tactile neumorphic buttons with smooth animations and visual feedback
              </NeuroCardDescription>
            </NeuroCardHeader>
            <NeuroCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white/80">Primary Actions</h4>
                  <div className="space-y-3">
                    <NeuroButton variant="primary" size="lg" icon={<Sparkles size={20} />}>
                      Start Voice Agent
                    </NeuroButton>
                    <NeuroButton variant="secondary" size="md" icon={<Mic size={18} />}>
                      Record Audio
                    </NeuroButton>
                    <NeuroButton variant="default" size="sm" icon={<Settings size={16} />}>
                      Settings
                    </NeuroButton>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white/80">Interactive States</h4>
                  <div className="space-y-3">
                    <NeuroButton 
                      variant="primary" 
                      icon={isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? "Pause" : "Play"}
                    </NeuroButton>
                    <NeuroButton 
                      variant="ghost" 
                      icon={isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? "Unmute" : "Mute"}
                    </NeuroButton>
                    <NeuroButton loading>
                      Processing...
                    </NeuroButton>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white/80">Special Actions</h4>
                  <div className="space-y-3">
                    <NeuroButton variant="danger" icon={<Shield size={18} />}>
                      Emergency Stop
                    </NeuroButton>
                    <NeuroButton 
                      variant="ghost" 
                      onClick={() => setIsModalOpen(true)}
                      icon={<Zap size={18} />}
                    >
                      Open Modal
                    </NeuroButton>
                  </div>
                </div>
              </div>
            </NeuroCardContent>
          </NeuroCard>
        </motion.section>

        {/* Forms Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-8"
        >
          <NeuroCard>
            <NeuroCardHeader>
              <NeuroCardTitle>Form Controls</NeuroCardTitle>
              <NeuroCardDescription>
                Elegant input fields and controls with neumorphic styling
              </NeuroCardDescription>
            </NeuroCardHeader>
            <NeuroCardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <NeuroInput
                    label="Agent Name"
                    placeholder="Enter agent name"
                    icon={<Mic size={16} />}
                  />
                  
                  <NeuroInput
                    label="API Key"
                    type="password"
                    placeholder="Enter your API key"
                    icon={<Shield size={16} />}
                  />
                  
                  <NeuroSelect label="Voice Model">
                    <option value="gpt-4o">GPT-4o Realtime</option>
                    <option value="whisper">Whisper + TTS</option>
                    <option value="deepgram">Deepgram + ElevenLabs</option>
                  </NeuroSelect>
                  
                  <NeuroTextarea
                    label="System Instructions"
                    placeholder="Enter system instructions for the AI..."
                    rows={4}
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-white/80">Toggles & Controls</h4>
                    
                    <NeuroToggle
                      checked={isEnabled}
                      onChange={setIsEnabled}
                      label="Enable Voice Recognition"
                      description="Allow the system to process voice commands"
                    />
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white/80">
                        Volume Level: {volume}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-2 rounded-neuro bg-gradient-neuro appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-white/80">Plan Selection</h4>
                    <NeuroRadioGroup value={selectedPlan} onChange={setSelectedPlan}>
                      <NeuroRadio
                        value="basic"
                        label="Basic Plan"
                        description="Essential features for small venues"
                      />
                      <NeuroRadio
                        value="pro"
                        label="Professional Plan"
                        description="Advanced features and integrations"
                      />
                      <NeuroRadio
                        value="enterprise"
                        label="Enterprise Plan"
                        description="Full-scale deployment with priority support"
                      />
                    </NeuroRadioGroup>
                  </div>
                </div>
              </div>
            </NeuroCardContent>
          </NeuroCard>
        </motion.section>

        {/* Cards Showcase */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="space-y-8"
        >
          <h2 className="heading-secondary text-center">
            Card Variants & <span className="text-gradient">Interactions</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NeuroCard variant="default" hover>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-neuro bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-glow">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Analytics</h3>
                  <p className="text-white/60 text-sm">Real-time performance metrics</p>
                </div>
              </div>
            </NeuroCard>

            <NeuroCard variant="glass" interactive>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-neuro bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center shadow-glow-violet">
                  <Mic size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Voice Engine</h3>
                  <p className="text-white/60 text-sm">Advanced speech processing</p>
                </div>
              </div>
            </NeuroCard>

            <NeuroCard variant="elevated">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-neuro bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-glow-cyan">
                  <Zap size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Performance</h3>
                  <p className="text-white/60 text-sm">Sub-200ms response times</p>
                </div>
              </div>
            </NeuroCard>
          </div>
        </motion.section>

        {/* Stats Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Active Agents", value: "147", change: "+12%" },
              { label: "Response Time", value: "180ms", change: "-5ms" },
              { label: "Accuracy Rate", value: "99.8%", change: "+0.2%" },
              { label: "Uptime", value: "99.99%", change: "0%" },
            ].map((stat, i) => (
              <NeuroCard key={i} variant="inset" className="text-center p-6">
                <div className="text-2xl font-bold text-gradient mb-1">{stat.value}</div>
                <div className="text-sm text-white/80 mb-2">{stat.label}</div>
                <div className="text-xs text-emerald-400">{stat.change}</div>
              </NeuroCard>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Modal Demo */}
      <NeuroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Neumorphic Modal"
        description="This is a demonstration of the neumorphic modal component with glassmorphism effects."
      >
        <div className="space-y-6">
          <p className="text-white/80">
            This modal showcases the glassmorphic design with backdrop blur, 
            neumorphic shadows, and smooth animations. The modal automatically 
            handles focus management and accessibility.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-neuro-sm text-center">
              <div className="text-lg font-semibold text-emerald-400">Fast</div>
              <div className="text-xs text-white/60">Ultra-responsive</div>
            </div>
            <div className="glass-panel p-4 rounded-neuro-sm text-center">
              <div className="text-lg font-semibold text-cyan-400">Smooth</div>
              <div className="text-xs text-white/60">Seamless transitions</div>
            </div>
          </div>
          
          <NeuroModalFooter>
            <NeuroButton variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirm
            </NeuroButton>
          </NeuroModalFooter>
        </div>
      </NeuroModal>
    </div>
  );
}

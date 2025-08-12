"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import WaveformDemo from "@/components/ui/WaveformDemo";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Ultra-minimal background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800" />
      
      {/* Subtle ambient elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        
        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 tracking-tight">
            Voice-First
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Bar AI
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/60 mb-4 font-light max-w-2xl mx-auto leading-relaxed">
            Transform your Bar with AI voice commands
          </p>
          
          <p className="text-white/40 text-sm font-light">
            Real-time inventory • Seamless orders • Zero training
          </p>
        </motion.div>

        {/* Interactive Waveform Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="mb-16"
        >
          <WaveformDemo />
        </motion.div>

        {/* Minimal CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-2">
                <span>Start Building</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          </Link>
          
          <Link href="/demo">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full transition-all duration-300 font-light"
            >
              View Demo
            </motion.button>
          </Link>
        </motion.div>

        {/* Ultra-minimal stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 flex justify-center items-center gap-12 text-white/30 text-sm font-light"
        >
          <div className="text-center">
            <div className="text-white/60 font-medium">&lt; 200ms</div>
            <div>Response</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-white/60 font-medium">99.8%</div>
            <div>Accuracy</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-white/60 font-medium">24/7</div>
            <div>Uptime</div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}


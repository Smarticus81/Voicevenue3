"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic, MessageSquare, BarChart3, Zap, Users, Clock, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800" />
      
      {/* Animated background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/3 rounded-full blur-2xl animate-pulse delay-500" />
      
      {/* Header with Logo */}
      <header className="relative z-20 pt-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/bevpro-logo.svg" alt="BevPro" className="h-8 w-auto" />
            <span className="text-white/60 font-medium">VenueVoice</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-white/60 hover:text-white transition-colors">
              Demo
            </Link>
            <Link href="/login" className="text-white/60 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6 tracking-tight">
              Talk to your
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Bar
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-white/70 mb-6 font-light max-w-3xl mx-auto leading-relaxed">
              Give your venue a voice with AI that understands your business
            </p>
            
            <p className="text-white/50 text-lg font-light">
              Voice-powered assistants that know your menu, handle orders, and boost sales
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2">
                  <span>Start Free Trial</span>
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
                See it in Action
              </motion.button>
            </Link>
          </motion.div>

          {/* Dynamic Workflow Animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mb-20"
          >
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="relative"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Mic size={24} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Speak Naturally</h3>
                  <p className="text-white/60 text-sm">Customers talk to your venue like they're talking to a person</p>
                </div>
                <motion.div
                  animate={{ x: [0, 20, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-emerald-400"
                >
                  <ArrowRight size={20} />
                </motion.div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="relative"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                    <MessageSquare size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">AI Understands</h3>
                  <p className="text-white/60 text-sm">Our AI knows your menu, prices, and can handle complex requests</p>
                </div>
                <motion.div
                  animate={{ x: [0, 20, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-blue-400"
                >
                  <ArrowRight size={20} />
                </motion.div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Zap size={24} className="text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Orders Processed</h3>
                  <p className="text-white/60 text-sm">Orders flow directly to your POS system in real-time</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="flex justify-center items-center gap-12 text-white/30 text-sm font-light"
          >
            <div className="text-center">
              <div className="text-white/60 font-medium">&lt; 200ms</div>
              <div>Response Time</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-white/60 font-medium">99.8%</div>
              <div>Accuracy</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-white/60 font-medium">24/7</div>
              <div>Available</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Why VenueVoice?</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Built specifically for bars and venues that want to serve customers faster
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Handle Crowds",
                description: "Serve multiple customers simultaneously without waiting"
              },
              {
                icon: Clock,
                title: "Faster Service",
                description: "Reduce order time from minutes to seconds"
              },
              {
                icon: BarChart3,
                title: "Boost Sales",
                description: "Upsell and cross-sell with intelligent suggestions"
              },
              {
                icon: Shield,
                title: "Always Reliable",
                description: "Works even when your staff is busy or short-handed"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon size={20} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}


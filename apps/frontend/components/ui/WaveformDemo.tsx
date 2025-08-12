"use client";
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Play, Pause } from 'lucide-react';

export default function WaveformDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isActive, setIsActive] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const phaseRef = useRef(0);

  // Generate smooth waveform data
  const generateWaveform = (phase: number, amplitude: number = 1) => {
    const points = 120;
    const data = [];
    
    for (let i = 0; i < points; i++) {
      const x = (i / points) * Math.PI * 4;
      const base = Math.sin(x + phase) * 0.3;
      const harmonic1 = Math.sin(x * 2 + phase * 1.5) * 0.2;
      const harmonic2 = Math.sin(x * 0.5 + phase * 0.8) * 0.15;
      const noise = (Math.random() - 0.5) * 0.1;
      
      data.push((base + harmonic1 + harmonic2 + noise) * amplitude);
    }
    
    return data;
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const centerY = height / 2;
    
    ctx.clearRect(0, 0, width, height);
    
    // Generate waveform data
    const amplitude = isActive ? 0.8 : 0.1;
    const waveformData = generateWaveform(phaseRef.current, amplitude);
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    if (isDemo) {
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)'); // emerald
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.8)'); // blue
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)'); // purple
    } else {
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.6)'); // indigo
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.6)'); // violet
      gradient.addColorStop(1, 'rgba(219, 39, 119, 0.6)'); // pink
    }
    
    // Draw waveform
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    
    waveformData.forEach((value, index) => {
      const x = (index / waveformData.length) * width;
      const y = centerY + value * (height * 0.3);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = isDemo ? 'rgba(34, 197, 94, 0.5)' : 'rgba(139, 92, 246, 0.3)';
    ctx.shadowBlur = 15;
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Update phase for animation
    if (isActive) {
      phaseRef.current += 0.1;
    } else {
      phaseRef.current += 0.02;
    }
    
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  useEffect(() => {
    drawWaveform();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isDemo]);

  const handleDemo = async () => {
    setIsDemo(true);
    setIsActive(true);
    
    // Simulate voice demo sequence
    setTimeout(() => setIsActive(false), 1500);
    setTimeout(() => setIsActive(true), 2000);
    setTimeout(() => setIsActive(false), 3500);
    setTimeout(() => setIsActive(true), 4000);
    setTimeout(() => {
      setIsActive(false);
      setIsDemo(false);
    }, 5500);
  };

  return (
    <div className="relative">
      {/* Waveform Canvas */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full max-w-2xl h-auto"
        />
        
        {/* Overlay gradient for better blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      </motion.div>
      
      {/* Demo Control */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={handleDemo}
          disabled={isDemo}
          className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-4 hover:bg-white/20 hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDemo ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
          ) : (
            <Play size={24} className="text-white/80 group-hover:text-white ml-1" />
          )}
          
          {/* Ripple effect */}
          {isActive && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-ping" />
          )}
        </button>
      </motion.div>
      
      {/* Demo Text */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center"
        >
          <p className="text-white/70 text-sm">
            "Hey Bev, add two margaritas to the order"
          </p>
        </motion.div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2,
  Volume2,
  Loader2,
  CheckCircle,
  Building2,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Clock,
  Activity,
  PieChart,
  Calendar,
  Target,
  Zap,
  Eye,
  Settings,
  Maximize2,
  CreditCard
} from "lucide-react";
import { embeddedDrinks } from "@/lib/embedded-drinks";
import { logEvent } from "@/components/analytics/logEvent";
import { createClientTrace } from "@/components/trace/traceClient";

function VoiceKiosk() {
  const searchParams = useSearchParams();
  const venueId = searchParams?.get('venueId') || "venue1";
  const agentId = searchParams?.get('agentId') || "default-agent";
  const level = searchParams?.get('level') || "1";
  const isLevel3 = level === "3";

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState("");
  const [cart, setCart] = useState<Array<{ name: string; quantity: number; price: number }>>([]);
  const [drinks, setDrinks] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [venueName, setVenueName] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [currentView, setCurrentView] = useState<"pos" | "dashboard" | "split">(isLevel3 ? "split" : "pos");
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState({
    todaySales: 2847,
    ordersToday: 156,
    avgOrderValue: 18.25,
    peakHour: "7:00 PM",
    topItems: [
      { name: "Craft Beer", sales: 89, revenue: 1245 },
      { name: "Wine", sales: 67, revenue: 1072 },
      { name: "Cocktails", sales: 45, revenue: 810 },
      { name: "Coffee", sales: 134, revenue: 536 }
    ],
    hourlyData: [
      { hour: "12 PM", sales: 245, orders: 12 },
      { hour: "1 PM", sales: 389, orders: 18 },
      { hour: "2 PM", sales: 267, orders: 15 },
      { hour: "3 PM", sales: 198, orders: 9 },
      { hour: "4 PM", sales: 334, orders: 19 },
      { hour: "5 PM", sales: 456, orders: 24 },
      { hour: "6 PM", sales: 523, orders: 31 },
      { hour: "7 PM", sales: 689, orders: 42 },
      { hour: "8 PM", sales: 634, orders: 38 },
      { hour: "9 PM", sales: 445, orders: 26 },
      { hour: "10 PM", sales: 267, orders: 16 }
    ],
    inventory: [
      { item: "Craft Beer", stock: 45, threshold: 20, status: "good" },
      { item: "Wine Bottles", stock: 12, threshold: 15, status: "low" },
      { item: "Coffee Beans", stock: 8, threshold: 10, status: "critical" },
      { item: "Cocktail Mix", stock: 34, threshold: 20, status: "good" }
    ]
  });

  // Real-time updates for analytics
  useEffect(() => {
    if (!isLevel3) return;
    
    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        ...prev,
        todaySales: prev.todaySales + Math.floor(Math.random() * 50),
        ordersToday: prev.ordersToday + (Math.random() > 0.7 ? 1 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isLevel3]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isConnectingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioElRef.current = new Audio();
    if (audioElRef.current) {
      audioElRef.current.autoplay = true;
      audioElRef.current.crossOrigin = "anonymous";
    }
  }, []);

  // Load venue data
  useEffect(() => {
    console.log(`[Kiosk] Loading data for venue: ${venueId}`);
    
    // Load venue settings
    fetch(`/api/venue/settings?venueId=${venueId}`)
      .then(r => r.json())
      .then(data => {
        setVenueName(data.venueName || venueId.charAt(0).toUpperCase() + venueId.slice(1));
      })
      .catch(() => {
        setVenueName(venueId.charAt(0).toUpperCase() + venueId.slice(1));
      });

    // Load drinks
    fetch(`/api/drinks/list?venueId=${venueId}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.drinks && data.drinks.length > 0) {
          setDrinks(data.drinks.map((d: any) => ({
            id: d.id || d.name,
            name: d.name,
            price: d.price
          })));
        } else {
          setDrinks(embeddedDrinks.map((d, index) => ({
            id: `drink-${index}`,
            name: d.name,
            price: d.price
          })));
        }
      })
      .catch(() => {
        setDrinks(embeddedDrinks.map((d, index) => ({
          id: `drink-${index}`,
          name: d.name,
          price: d.price
        })));
      });
  }, [venueId]);

  const cleanup = useCallback(() => {
    try { abortRef.current?.abort(); } catch {}
    abortRef.current = null;

    try { dcRef.current?.close(); } catch {}
    dcRef.current = null;

    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;

    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    streamRef.current = null;

    isConnectingRef.current = false;
  }, []);

  const ensureMicrophone = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { 
        echoCancellation: true, 
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        sampleSize: 16,
        channelCount: 1,
        latency: 0.01,
        volume: 1.0
      },
      video: false,
    });
    return stream;
  };

  const startVoice = useCallback(async () => {
    if (isConnectingRef.current || status === "connected") return;
    isConnectingRef.current = true;

    try {
      setStatus("connecting");
      setError("");
      setIsListening(true);
      cleanup();

      const localAbort = new AbortController();
      abortRef.current = localAbort;

      // Get microphone
      const stream = await ensureMicrophone();
      if (localAbort.signal.aborted) throw new Error("aborted");
      streamRef.current = stream;

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({ 
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      pcRef.current = pc;

      // Add audio track
      const track = stream.getAudioTracks()[0];
      if (track) pc.addTrack(track, stream);

      // Handle remote audio
      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        if (audioElRef.current && remote) {
          audioElRef.current.srcObject = remote as any;
          audioElRef.current.play().catch(() => {});
        }
      };

      // Create data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

             dc.onopen = () => {
         setStatus("connected");
         console.log("[Kiosk] Voice connection established");
       };

             dc.onmessage = (event) => {
         try {
           const data = JSON.parse(event.data);
           console.log("[Kiosk] Received message:", data.type);
           
           if (data.type === "conversation.item.input_audio_transcription.completed") {
             setLastTranscript(data.transcript || "");
           }
           
           if (data.type === "response.text.delta") {
             setLastResponse(prev => prev + (data.delta || ""));
           }
           
           if (data.type === "response.text.done") {
             // Response is complete
             console.log("[Kiosk] Response complete");
           }

           if (data.type === "response.function_call_arguments.done") {
             // Handle function call
             const args = JSON.parse(data.arguments || "{}");
             if (data.name === "add_to_cart") {
               addToCart(args.drink_name, args.quantity || 1);
             }
           }
         } catch (e) {
           console.error("[Kiosk] Message parse error:", e);
         }
       };

      dc.onerror = (error) => {
        console.error("[Kiosk] Data channel error:", error);
        setError("Connection error");
        setStatus("error");
      };

      // Create offer and connect
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

             const response = await fetch(`/api/voice/openai/sdp?venueId=${venueId}&agentId=${agentId}`, {
         method: "POST",
         headers: { "Content-Type": "application/sdp" },
         body: offer.sdp,
       });

             if (!response.ok) {
         const errorText = await response.text();
         console.error("[Kiosk] SDP exchange failed:", response.status, errorText);
         throw new Error(`SDP exchange failed: ${response.status} - ${errorText}`);
       }

       const answerSdp = await response.text();
       console.log("[Kiosk] Received SDP answer:", answerSdp.substring(0, 100) + "...");
       await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    } catch (err: any) {
      console.error("[Kiosk] Voice connection failed:", err);
      setError(err.message || "Connection failed");
      setStatus("error");
      setIsListening(false);
      cleanup();
    } finally {
      isConnectingRef.current = false;
    }
  }, [venueId, agentId, venueName]);

  const stopVoice = useCallback(() => {
    setIsListening(false);
    setStatus("idle");
    cleanup();
  }, [cleanup]);

  const addToCart = (drinkName: string, quantity: number = 1) => {
    const drink = drinks.find(d => d.name.toLowerCase().includes(drinkName.toLowerCase()));
    if (drink) {
      setCart(prev => {
        const existing = prev.find(item => item.name === drink.name);
        if (existing) {
          return prev.map(item => 
            item.name === drink.name 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { name: drink.name, quantity, price: drink.price }];
      });
    }
  };

  const updateCartItem = (itemName: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.name !== itemName));
    } else {
      setCart(prev => prev.map(item => 
        item.name === itemName ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Render Analytics Dashboard Component
  const renderAnalyticsDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={24} className="text-emerald-400" />
            <div className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
              +12.5%
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">${analyticsData.todaySales.toLocaleString()}</div>
          <div className="text-sm text-white/60">Today's Sales</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <ShoppingCart size={24} className="text-blue-400" />
            <div className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
              +8.3%
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{analyticsData.ordersToday}</div>
          <div className="text-sm text-white/60">Orders Today</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={24} className="text-purple-400" />
            <div className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
              +15.2%
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">${analyticsData.avgOrderValue}</div>
          <div className="text-sm text-white/60">Avg Order Value</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <Clock size={24} className="text-orange-400" />
            <div className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">
              Peak
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{analyticsData.peakHour}</div>
          <div className="text-sm text-white/60">Peak Hour</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Sales Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Hourly Sales</h3>
            <BarChart3 size={20} className="text-violet-400" />
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {analyticsData.hourlyData.map((data, index) => (
              <div key={data.hour} className="flex flex-col items-center gap-2">
                <div 
                  className="w-8 bg-gradient-to-t from-violet-500 to-violet-300 rounded-t-lg transition-all duration-1000"
                  style={{ height: `${(data.sales / 700) * 100}%` }}
                />
                <div className="text-xs text-white/60 transform -rotate-45 whitespace-nowrap">
                  {data.hour}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Items */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Top Selling Items</h3>
            <Target size={20} className="text-emerald-400" />
          </div>
          <div className="space-y-4">
            {analyticsData.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-white/60">{item.sales} sold</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">${item.revenue}</div>
                  <div className="text-xs text-white/60">revenue</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Inventory Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Inventory Status</h3>
          <Package size={20} className="text-blue-400" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {analyticsData.inventory.map((item) => (
            <div key={item.item} className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{item.item}</div>
                <div className={`w-3 h-3 rounded-full ${
                  item.status === 'good' ? 'bg-emerald-500' :
                  item.status === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              </div>
              <div className="text-2xl font-bold mb-1">{item.stock}</div>
              <div className="text-xs text-white/60">Threshold: {item.threshold}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // Render POS System Component
  const renderPOSSystem = () => (
    <div className="h-full flex gap-6">
      {/* Menu Grid - Left Side */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <img 
            src="/bevpro-logo.svg" 
            alt="BevPro" 
            className="h-6 w-auto opacity-60"
          />
        </div>
        <div className="grid grid-cols-3 gap-6 h-[calc(100%-80px)] overflow-y-auto">
          {drinks.map((drink) => (
            <motion.button
              key={drink.id}
              onClick={() => addToCart(drink.name, 1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="aspect-square p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 transition-all flex flex-col items-center justify-center text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-3">
                <Plus size={20} className="text-cyan-400" />
              </div>
              <h3 className="font-semibold text-base mb-2 line-clamp-2 text-white">{drink.name}</h3>
              <p className="text-xl font-bold text-cyan-400">
                ${(drink.price / 100).toFixed(2)}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Cart - Right Side */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="w-96 glass rounded-2xl p-6 flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Cart</h3>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-white/60 h-full flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <ShoppingCart size={32} className="opacity-50" />
                </div>
                <p className="text-base">No items in cart</p>
                <p className="text-sm text-white/40 mt-2">Use voice commands or tap items to add</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-white">{item.name}</h4>
                        <p className="text-sm text-white/60">
                          ${(item.price / 100).toFixed(2)} each
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateCartItem(item.name, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-semibold text-base text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.name, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-lg font-bold text-cyan-400">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {cart.length > 0 && (
          <div className="pt-6 border-t border-white/10 mt-6">
            <div className="flex items-center justify-between text-xl font-bold mb-4">
              <span className="text-white">Total:</span>
              <span className="text-cyan-400">${(getCartTotal() / 100).toFixed(2)}</span>
            </div>
            
            <button className="w-full py-4 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors text-lg">
              Process Order
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Premium Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{venueName}</h1>
                <p className="text-sm text-white/60">
                  {isLevel3 ? "Integrated Management Platform" : "Voice-powered ordering system"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isLevel3 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView("pos")}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      currentView === "pos" || currentView === "split" 
                        ? "bg-violet-500 text-black" 
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    POS
                  </button>
                  <button
                    onClick={() => setCurrentView("dashboard")}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      currentView === "dashboard" || currentView === "split" 
                        ? "bg-violet-500 text-black" 
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setCurrentView("split")}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      currentView === "split" 
                        ? "bg-violet-500 text-black" 
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              )}

              {cart.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShoppingCart size={18} />
                  <span className="font-medium">{cart.length} items</span>
                  <span className="text-sm">• ${(getCartTotal() / 100).toFixed(2)}</span>
                </div>
              )}

              {/* Voice Status */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                  status === "connected" ? "bg-emerald-500/20 text-emerald-400" :
                  status === "connecting" ? "bg-blue-500/20 text-blue-400" :
                  status === "error" ? "bg-red-500/20 text-red-400" :
                  "bg-white/10 text-white/60"
                }`}>
                  {status === "connecting" && <Loader2 size={14} className="animate-spin" />}
                  {status === "connected" && <CheckCircle size={14} />}
                  <Mic size={14} />
                  {status === "connected" ? "Voice Ready" : 
                   status === "connecting" ? "Connecting..." :
                   status === "error" ? "Voice Error" : "Voice Offline"}
                </div>

                <button
                  onClick={isListening ? stopVoice : startVoice}
                  disabled={status === "connecting"}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isListening 
                      ? "bg-emerald-500 hover:bg-emerald-400 text-white animate-pulse" 
                      : "bg-white/10 hover:bg-white/20 text-white/80"
                  } ${status === "connecting" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {status === "connecting" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : isListening ? (
                    <Mic size={20} />
                  ) : (
                    <MicOff size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLevel3 ? (
          currentView === "split" ? (
            <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
              <div className="space-y-6 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={20} className="text-violet-400" />
                  <h2 className="text-lg font-semibold">Point of Sale</h2>
                </div>
                {renderPOSSystem()}
              </div>
              <div className="space-y-6 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={20} className="text-violet-400" />
                  <h2 className="text-lg font-semibold">Analytics Dashboard</h2>
                </div>
                {renderAnalyticsDashboard()}
              </div>
            </div>
          ) : currentView === "dashboard" ? (
            renderAnalyticsDashboard()
          ) : (
            renderPOSSystem()
          )
        ) : (
          <div className="h-[calc(100vh-120px)]">
            {renderPOSSystem()}
          </div>
        )}
      </div>
      
      <audio ref={audioElRef} hidden />
    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    }>
      <VoiceKiosk />
    </Suspense>
  );
}
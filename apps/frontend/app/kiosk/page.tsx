"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const OpenAIRealtimeWidget = dynamic(() => import("@/components/OpenAIRealtimeWidget"), { ssr: false });
import { 
  Mic, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Send,
  Trash2,
  Sparkles,
  Coffee,
  Wine,
  Utensils,
  Clock,
  User,
  Package,
  BarChart3,
  Volume2,
  VolumeX,
  Grid3X3,
  Eye,
  Settings,
  Package2
} from "lucide-react";

// Import embedded drinks data
import embeddedDrinks from '@/lib/embedded-drinks';



const categories = [
  { id: 'all', name: 'All Items', icon: Grid3X3 },
  { id: 'beer', name: 'Beer', icon: Coffee },
  { id: 'wine', name: 'Wines', icon: Wine },
  { id: 'cocktails', name: 'Cocktails', icon: Utensils },
  { id: 'spirits', name: 'Spirits', icon: Coffee },
  { id: 'non-alcoholic', name: 'Non-Alcoholic', icon: Coffee },
];

// Default menu items - these will be replaced by drinks.json if available
const defaultMenuItems = [
  { id: '1', name: 'Mimosa', price: '8.00', category: 'cocktails', inventory: 25 },
  { id: '2', name: 'Martini', price: '12.00', category: 'cocktails', inventory: 15 },
  { id: '3', name: 'Chardonnay', price: '10.00', category: 'wine', inventory: 8 },
  { id: '4', name: 'IPA Beer', price: '6.00', category: 'beer', inventory: 32 },
  { id: '5', name: 'Whiskey', price: '15.00', category: 'spirits', inventory: 12 },
  { id: '6', name: 'Coca Cola', price: '3.00', category: 'non-alcoholic', inventory: 45 },
  { id: '7', name: 'Old Fashioned', price: '14.00', category: 'cocktails', inventory: 18 },
  { id: '8', name: 'Pinot Noir', price: '12.00', category: 'wine', inventory: 6 },
];

export default function VoiceKiosk() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  
  const venueId = searchParams?.get('venueId') || "demo-venue";
  const agentId = searchParams?.get('agentId') || "demo-agent";
  const lane = searchParams?.get('lane') || "openai";
  
  const [activeView, setActiveView] = useState<'pos' | 'inventory'>('pos');
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [tableName, setTableName] = useState("Table 1");
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverName, setServerName] = useState("Server");
  const [venueName, setVenueName] = useState("Demo Venue");
  
  // Voice state
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [instructions, setInstructions] = useState<string>("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Refs for current state (for voice callbacks)
  const cartRef = useRef(cart);
  const listRef = useRef(list);

  // Update refs when state changes
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  // Load venue settings and embedded drinks
  useEffect(() => {
    // Load venue settings
    fetch(`/api/venue/settings?venueId=${venueId}`)
      .then(r => r.json())
      .then(data => {
        if (data.venueName) {
          setVenueName(data.venueName);
        }
      })
      .catch(err => {
        console.error('Failed to load venue settings:', err);
      });

    // Load embedded drinks data
    try {
      const drinksData = embeddedDrinks.map((drink: any, index: number) => ({
        id: String(index + 1),
        name: drink.name,
        price: drink.price.toString(),
        category: drink.category.toLowerCase(),
        inventory: drink.inventory || 0
      }));
      setList(drinksData);
      console.log(`Loaded ${drinksData.length} drinks from embedded data`);
    } catch (err) {
      console.error('Failed to load embedded drinks:', err);
      // Fallback to default items
      setList(defaultMenuItems);
    }
  }, [venueId]);


  useEffect(() => {
    // Initialize audio element
    audioElRef.current = new Audio();
    if (audioElRef.current) {
      audioElRef.current.autoplay = true;
      audioElRef.current.crossOrigin = "anonymous";
    }
    
    // Load drinks data from JSON file
    loadDrinksData();
    
    // Load custom agent instructions
    if (venueId && agentId) {
      console.log(`[Kiosk] Loading instructions for venue: ${venueId}, agent: ${agentId}`);
      fetch(`/api/agents/instructions?venueId=${venueId}&agentId=${agentId}`)
        .then(r => r.json())
        .then(data => {
          console.log(`[Kiosk] Received instructions response:`, data);
          if (data.instructions) {
            console.log(`[Kiosk] Setting custom instructions: ${data.instructions.substring(0, 100)}...`);
            setInstructions(data.instructions);
          } else {
            console.log(`[Kiosk] No custom instructions found, using default`);
            setInstructions(`You are Bev, an expert bartender and voice assistant working at a live bar/Bar. This is NOT a simulation - you are handling real voice orders and inventory management.

Your role:
- You work behind the bar taking voice orders from staff and customers
- You manage drink inventory (shots, bottles, mixers)
- You know the menu and can answer questions about drinks
- You process orders for specific tables and tabs
- You can search inventory, check stock levels, and manage the POS system

How to respond:
- Keep ALL responses SHORT (1-2 sentences maximum)
- Be conversational and natural like a real bartender
- For orders: "Got it, two shots of tequila for table five" or "Adding that to your tab"
- For inventory: "We have about 15 shots of whiskey left" or "Vodka is running low"
- For questions: "That drink has rum and pineapple juice" or "Sure, we can make that"
- For inventory checks: "Let me check that for you" then use inventory_get_level
- For searches: "I'll search our inventory" then use inventory_search

Available tools:
- cart_add: Add drinks to the current order (use for each item in multi-item orders)
- cart_view: Show what's currently in the cart
- cart_create_order: Process the current order
- inventory_get_level: Check stock levels for specific items
- inventory_search: Search for items in inventory
- pos_order: Create orders with multiple items

Important: You are NOT an AI assistant discussing topics or providing quotes. You are a working bartender focused ONLY on bar operations, orders, and drinks. Stay in character always.

CRITICAL: When activated by wake word, immediately respond with "Yes, I'm listening" or "How can I help?" to acknowledge you heard them.

REAL-TIME INTERACTION: You are a real-time voice assistant. Process all function calls immediately and continue speaking without waiting. For multi-item orders, call cart_add for each item in rapid succession, then respond naturally. Never pause or wait for confirmation - maintain continuous conversation flow.`);
          }
        })
        .catch((err) => {
          console.error(`[Kiosk] Failed to load instructions:`, err);
          setInstructions(`You are Bev, an expert bartender and voice assistant working at a live bar/Bar. This is NOT a simulation - you are handling real voice orders and inventory management.

Your role:
- You work behind the bar taking voice orders from staff and customers
- You manage drink inventory (shots, bottles, mixers)
- You know the menu and can answer questions about drinks
- You process orders for specific tables and tabs
- You can search inventory, check stock levels, and manage the POS system

How to respond:
- Keep ALL responses SHORT (1-2 sentences maximum)
- Be conversational and natural like a real bartender
- For orders: "Got it, two shots of tequila for table five" or "Adding that to your tab"
- For inventory: "We have about 15 shots of whiskey left" or "Vodka is running low"
- For questions: "That drink has rum and pineapple juice" or "Sure, we can make that"
- For inventory checks: "Let me check that for you" then use inventory_get_level
- For searches: "I'll search our inventory" then use inventory_search

Available tools:
- cart_add: Add drinks to the current order (use for each item in multi-item orders)
- cart_view: Show what's currently in the cart
- cart_create_order: Process the current order
- inventory_get_level: Check stock levels for specific items
- inventory_search: Search for items in inventory
- pos_order: Create orders with multiple items

Important: You are NOT an AI assistant discussing topics or providing quotes. You are a working bartender focused ONLY on bar operations, orders, and drinks. Stay in character always.

CRITICAL: When activated by wake word, immediately respond with "Yes, I'm listening" or "How can I help?" to acknowledge you heard them.

REAL-TIME INTERACTION: You are a real-time voice assistant. Process all function calls immediately and continue speaking without waiting. For multi-item orders, call cart_add for each item in rapid succession, then respond naturally. Never pause or wait for confirmation - maintain continuous conversation flow.`);
        });
    }
    
    // Update clock every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, [venueId, agentId]);

  const loadDrinksData = async () => {
    try {
      console.log('[Kiosk] Loading drinks data from /drinks.json...');
      const response = await fetch('/drinks.json');
      if (response.ok) {
        const drinksData = await response.json();
        console.log('[Kiosk] Loaded drinks data:', drinksData.length, 'items');
        setList(drinksData);
      } else {
        console.log('[Kiosk] drinks.json not found, using default data');
        setList(defaultMenuItems);
      }
    } catch (error) {
      console.log('[Kiosk] Error loading drinks.json, using default data:', error);
      setList(defaultMenuItems);
    }
  };

  const add = (item: { id: string; name: string; price: string; inventory: number }) => {
    // Update inventory
    setList(prev => prev.map(i => 
      i.id === item.id ? { ...i, inventory: Math.max(0, i.inventory - 1) } : i
    ));
    
    setCart((prev) => {
      const i = prev.findIndex((x) => x.name === item.name);
      if (i >= 0) {
        const copy = [...prev];
        copy[i].qty += 1;
        return copy;
      }
      return [...prev, { name: item.name, qty: 1, price: Number(item.price) }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(0, item.qty + delta);
        return newQty === 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean) as typeof prev);
  };

  const removeItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const filteredItems = activeCategory === 'all' 
    ? list 
    : list.filter(item => item.category === activeCategory);

  const cartTotal = cart.reduce((sum, item) => {
    return sum + (item.price * item.qty);
  }, 0);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const order = async () => {
    if (!cart.length) return;
    
    console.log("[Kiosk] Processing order with items:", cart);
    
    // Update inventory for each item in cart
    const updatedList = list.map(item => {
      const cartItem = cart.find(c => c.name === item.name);
      if (cartItem) {
        return {
          ...item,
          inventory: Math.max(0, item.inventory - cartItem.qty)
        };
      }
      return item;
    });
    
    setList(updatedList);
    setCart([]);
    
    console.log("[Kiosk] Order processed, cart cleared");
    
    // Send order confirmation via websocket if connected
    if (dcRef.current?.readyState === "open") {
      try {
        dcRef.current.send(JSON.stringify({
          type: "response.audio_transcript.delta",
          delta: `Order processed for ${tableName}! Total: $${(cartTotal * 1.0825).toFixed(2)}`
        }));
        console.log("[Kiosk] Order confirmation sent via websocket");
      } catch (e) {
        console.error("[Kiosk] Failed to send order confirmation:", e);
      }
    }
  };

  const getInventoryStatus = (inventory: number) => {
    if (inventory === 0) return { color: 'text-red-600', status: 'Out of Stock' };
    if (inventory <= 5) return { color: 'text-yellow-600', status: 'Low Stock' };
    return { color: 'text-green-600', status: 'In Stock' };
  };

  const startVoice = async () => {
    if (voiceStatus !== "idle") return;
    
    try {
      setVoiceStatus("connecting");
      
      // Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      streamRef.current = stream;

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      // Add mic track
      const track = stream.getAudioTracks()[0];
      if (track) pc.addTrack(track, stream);

      // Handle remote audio
      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        if (audioElRef.current && remote) {
          audioElRef.current.srcObject = remote as any;
          audioElRef.current.volume = 1.0;
          audioElRef.current.muted = false;
          audioElRef.current.play().catch(console.error);
        }
      };

      // Create data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      
      dc.onopen = () => {
        setVoiceStatus("connected");
        
        // Send session configuration
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: instructions || `You are Bev, an expert bartender and voice assistant working at a live bar/Bar. This is NOT a simulation - you are handling real voice orders and inventory management.

Your role:
- You work behind the bar taking voice orders from staff and customers
- You manage drink inventory (shots, bottles, mixers)
- You know the menu and can answer questions about drinks
- You process orders for specific tables and tabs
- You can search inventory, check stock levels, and manage the POS system

How to respond:
- Keep ALL responses SHORT (1-2 sentences maximum)
- Be conversational and natural like a real bartender
- For orders: "Got it, two shots of tequila for table five" or "Adding that to your tab"
- For inventory: "We have about 15 shots of whiskey left" or "Vodka is running low"
- For questions: "That drink has rum and pineapple juice" or "Sure, we can make that"
- For inventory checks: "Let me check that for you" then use inventory_get_level
- For searches: "I'll search our inventory" then use inventory_search

Available tools:
- cart_add: Add drinks to the current order (use for each item in multi-item orders)
- cart_view: Show what's currently in the cart
- cart_create_order: Process the current order
- inventory_get_level: Check stock levels for specific items
- inventory_search: Search for items in inventory
- pos_order: Create orders with multiple items

Important: You are NOT an AI assistant discussing topics or providing quotes. You are a working bartender focused ONLY on bar operations, orders, and drinks. Stay in character always.

CRITICAL: When activated by wake word, immediately respond with "Yes, I'm listening" or "How can I help?" to acknowledge you heard them.

MULTI-ITEM ORDERS: When customers order multiple items at once, you MUST call cart_add for EACH item separately before responding. For example, if they say "add a mimosa and a beer", call cart_add for mimosa, then call cart_add for beer, then respond. Do not wait for user input between items - process all items in their order immediately.

Available items: ${listRef.current.map(item => item.name).join(', ')}

When customers order drinks:
- Use the cart_add function to add items (can handle multiple items in one order)
- For multiple items, add each one separately using cart_add
- Confirm what you added: "Added [quantity] [drink] to your order"
- Be helpful and suggest popular items if they ask
- If they order multiple items at once, add them all before responding

When they ask about the menu:
- Describe available drinks briefly
- Mention any specialties or popular choices

When they want to see their cart or place an order:
- Use cart_view to show current items
- Use cart_create_order when they're ready to order

When they ask about inventory:
- Use inventory_get_level to check specific items
- Use inventory_search to find items by name or category
- Report stock levels accurately and suggest alternatives if needed`,
            voice: "sage",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: { 
              type: "server_vad",
              threshold: 0.05,
              prefix_padding_ms: 50,
              silence_duration_ms: 100
            },
            tools: [
              {
                type: "function",
                name: "cart_add",
                description: "Add a drink to the cart",
                parameters: {
                  type: "object",
                  properties: {
                    drink_name: { type: "string", description: "Name of the drink" },
                    quantity: { type: "number", description: "Quantity to add" }
                  },
                  required: ["drink_name"]
                }
              },
              {
                type: "function", 
                name: "cart_view",
                description: "View the current cart contents",
                parameters: { type: "object", properties: {} }
              },
              {
                type: "function",
                name: "cart_create_order", 
                description: "Create an order from the cart",
                parameters: { type: "object", properties: {} }
              },
              {
                type: "function",
                name: "inventory_get_level",
                description: "Check inventory levels for items",
                parameters: {
                  type: "object",
                  properties: {
                    item_name: { type: "string", description: "Name of the item to check" }
                  },
                  required: ["item_name"]
                }
              },
              {
                type: "function",
                name: "inventory_search",
                description: "Search for items in inventory",
                parameters: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "Search query" }
                  },
                  required: ["query"]
                }
              },
              {
                type: "function",
                name: "pos_order",
                description: "Create a POS order",
                parameters: {
                  type: "object",
                  properties: {
                    items: { 
                      type: "array", 
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          quantity: { type: "number" },
                          price: { type: "number" }
                        }
                      }
                    },
                    table: { type: "string", description: "Table number or name" }
                  },
                  required: ["items"]
                }
              }
            ],
            tool_choice: "auto",
            temperature: 0.6,
            max_response_output_tokens: 150
          }
        }));
      };

      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          console.log("[Kiosk] Received message:", msg.type, msg);
          
          // Handle function calls immediately without blocking
          if (msg.type === "response.function_call_arguments.done") {
            const args = JSON.parse(msg.arguments || "{}");
            console.log("[Kiosk] Function call:", msg.name, args);
            
            // Process function calls asynchronously
            setTimeout(() => {
              if (msg.name === "cart_add") {
                const item = listRef.current.find(i => 
                  i.name.toLowerCase().includes(args.drink_name.toLowerCase())
                );
                if (item) {
                  for (let i = 0; i < (args.quantity || 1); i++) {
                    add(item);
                  }
                  console.log(`[Kiosk] Added ${args.quantity || 1} ${item.name} to cart`);
                }
              } else if (msg.name === "cart_view") {
                // Cart view - already visible in UI
                console.log("Cart view requested:", cartRef.current);
              } else if (msg.name === "cart_create_order") {
                // Process the order
                console.log("[Kiosk] Processing order...");
                order();
              } else if (msg.name === "inventory_get_level") {
                const item = listRef.current.find(i => 
                  i.name.toLowerCase().includes(args.item_name.toLowerCase())
                );
                if (item) {
                  console.log(`Inventory level for ${item.name}: ${item.inventory}`);
                }
              } else if (msg.name === "inventory_search") {
                const results = listRef.current.filter(i => 
                  i.name.toLowerCase().includes(args.query.toLowerCase()) ||
                  i.category.toLowerCase().includes(args.query.toLowerCase())
                );
                console.log("Inventory search results:", results);
              } else if (msg.name === "pos_order") {
                // Create a POS order with the provided items
                const orderItems = args.items || [];
                const orderTableName = args.table || tableName;
                
                // Add items to cart
                orderItems.forEach((orderItem: any) => {
                  const item = listRef.current.find(i => 
                    i.name.toLowerCase().includes(orderItem.name.toLowerCase())
                  );
                  if (item) {
                    for (let i = 0; i < (orderItem.quantity || 1); i++) {
                      add(item);
                    }
                  }
                });
                
                // Process the order
                order();
              }
            }, 0); // Immediate async execution
          }
          
          // Handle streaming audio transcript
          if (msg.type === "response.audio_transcript.delta" && msg.delta) {
            console.log("[Kiosk] Streaming transcript:", msg.delta);
          }
          
          // Handle response completion
          if (msg.type === "response.done") {
            console.log("[Kiosk] Response completed, all function calls processed");
          }
          
          // Handle any errors
          if (msg.type === "error") {
            console.error("[Kiosk] OpenAI error:", msg);
          }
        } catch (e) {
          console.error("Error parsing message:", e);
        }
      };

      // Create offer and connect to OpenAI
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      const response = await fetch(`/api/voice/openai/sdp?venueId=${venueId}&agentId=${agentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error(`SDP API error: ${response.status} ${await response.text()}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    } catch (error) {
      console.error("Voice start error:", error);
      setVoiceStatus("idle");
    }
  };

  const stopVoice = () => {
    try {
      dcRef.current?.close();
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
      } catch {}
    
    dcRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
    setVoiceStatus("idle");
  };



  return (
    <>
      <title>{venueName} - POS System</title>
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

      {/* Main POS Container */}
      <div className="relative z-10 flex-1 flex max-w-7xl mx-auto my-6 gap-8 px-8">
        {/* Left Panel - Menu */}
        <div className="flex-1 flex flex-col">
          <div className="neumorphic-card p-8 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-lg">
                  <Sparkles size={24} className="text-white" />
                </div>
                                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {venueName}
                    </h1>
                    <div className="text-sm text-gray-500">Voice-Controlled Point of Sale</div>
                  </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{formatDate(currentTime)}</div>
                <div className="text-xl font-bold text-gray-800">{formatTime(currentTime)}</div>
              </div>
            </div>

            {/* Voice Status & Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button 
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                    voiceStatus === "connected" 
                      ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20" 
                      : voiceStatus === "connecting"
                      ? "bg-gradient-to-br from-yellow-500 to-orange-500 shadow-yellow-500/20 animate-pulse"
                      : "bg-gradient-to-br from-gray-600 to-gray-700 shadow-gray-500/20 hover:shadow-gray-500/30"
                  }`}
                  onClick={() => {
                    if (voiceStatus === "idle") {
                      startVoice();
                    } else {
                      stopVoice();
                    }
                  }}
                >
                  <Mic size={20} className="text-white" />
                  {voiceStatus === "connected" && (
                    <div className="absolute inset-0 rounded-2xl bg-red-500/30 animate-ping" />
                  )}
                </button>
                <div className="text-sm">
                  <div className="font-medium text-gray-800">
                    {voiceStatus === "connected" ? "Bev is listening" : 
                     voiceStatus === "connecting" ? "Connecting..." : "Voice ready"}
                  </div>
                  <div className="text-gray-500">Agent: {agentId}</div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="neumorphic-card p-1">
                <button 
                  onClick={() => setActiveView('pos')}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeView === 'pos' 
                      ? 'neumorphic-card-inset text-gray-700' 
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  <ShoppingCart size={16} />
                  <span>Menu</span>
                </button>
                <button 
                  onClick={() => setActiveView('inventory')}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeView === 'inventory' 
                      ? 'neumorphic-card-inset text-gray-700' 
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  <Package size={16} />
                  <span>Inventory</span>
                </button>
              </div>
            </div>
          </div>

            {/* Menu Content */}
            {activeView === 'pos' ? (
              <div className="neumorphic-card p-8 flex-1">
                {/* Category Tabs */}
                <div className="flex items-center space-x-3 mb-8 overflow-x-auto invisible-scroll">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex items-center space-x-2 px-4 py-3 font-medium transition-all duration-300 whitespace-nowrap ${
                          activeCategory === category.id
                            ? 'neumorphic-card-inset text-gray-700' 
                            : 'text-gray-600 hover:text-gray-700'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-4 gap-6 overflow-y-auto max-h-96 invisible-scroll">
                  {filteredItems.map((item) => (
                    <motion.button
                      key={`${item.id}-${item.name}`}
                      onClick={() => add(item)}
                      disabled={item.inventory === 0}
                      className={`japanese-card p-4 transition-all duration-300 group ${
                        item.inventory === 0 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:scale-105 cursor-pointer'
                      }`}
                      whileHover={item.inventory > 0 ? { scale: 1.02 } : {}}
                      whileTap={item.inventory > 0 ? { scale: 0.98 } : {}}
                    >
                      <div className="h-full flex flex-col justify-between">
                        <div className="text-sm font-medium text-gray-700 truncate mb-2">{item.name}</div>
                        <div className="text-lg font-bold text-gray-700">${Number(item.price).toFixed(2)}</div>
                        <div className={`text-xs font-medium ${getInventoryStatus(item.inventory).color}`}>
                          {item.inventory} in stock
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              // Inventory View
              <div className="neumorphic-card p-8 flex-1">
                                  <div className="flex items-center space-x-3 mb-6">
                    <Package size={24} className="text-gray-600" />
                    <h2 className="text-xl font-bold text-gray-800">{venueName} - Inventory Management</h2>
                  </div>
                
                <div className="grid gap-6 overflow-y-auto max-h-96 invisible-scroll">
                  {list.map((item) => {
                    const status = getInventoryStatus(item.inventory);
                    return (
                      <motion.div
                        key={`${item.id}-${item.name}`}
                        className="japanese-card p-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                              <Coffee size={20} className="text-gray-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{item.name}</h3>
                              <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-700">${item.price}</div>
                            <div className={`text-sm font-medium ${status.color}`}>
                              {item.inventory} units
                            </div>
                          </div>
                        </div>
                        
                        {item.inventory <= 5 && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <div className="text-xs text-yellow-700">
                              ⚠️ {item.inventory === 0 ? 'Out of stock' : 'Low inventory - reorder soon'}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        {/* Right Panel - Order Summary */}
        <div className="w-96 flex flex-col">
          {activeView === 'pos' && (
            <div className="neumorphic-card p-8 flex-1">
                              {/* Tab Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-700">{venueName} - {tableName}'s Tab</h2>
                    <div className="text-sm text-gray-600 font-medium">Active</div>
                  </div>
                <select
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-4 py-3 neumorphic-card-inset text-gray-700 text-sm focus:outline-none"
                >
                  <option value="Table 1">Table 1</option>
                  <option value="Table 2">Table 2</option>
                  <option value="Table 3">Table 3</option>
                  <option value="Bar 1">Bar 1</option>
                  <option value="Bar 2">Bar 2</option>
                  <option value="Patio A">Patio A</option>
                </select>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto max-h-80 mb-6 invisible-scroll">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No items added yet</p>
                    <p className="text-sm">Use voice: "Add a mimosa"</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, i) => (
                      <motion.div 
                        key={`${item.name}-${i}`} 
                        className="japanese-card p-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-gray-700 text-sm truncate flex-1 mr-3">{item.name}</div>
                          <button
                            onClick={() => removeItem(i)}
                            className="text-red-500 hover:text-red-600 flex-shrink-0 p-1 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(i, -1)}
                              className="neumorphic-button w-7 h-7 flex items-center justify-center"
                            >
                              <Minus size={12} className="text-gray-600" />
                            </button>
                            <span className="w-8 text-center font-bold text-gray-700">{item.qty}</span>
                            <button
                              onClick={() => updateQuantity(i, 1)}
                              className="neumorphic-button w-7 h-7 flex items-center justify-center"
                            >
                              <Plus size={12} className="text-gray-600" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">${item.price.toFixed(2)} each</div>
                            <div className="font-bold text-gray-700">${(item.price * item.qty).toFixed(2)}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              {cart.length > 0 && (
                <div className="japanese-card p-4 mb-4">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-700">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (8.25%)</span>
                      <span className="font-semibold text-gray-700">${(cartTotal * 0.0825).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-700">Total</span>
                        <span className="text-gray-900">${(cartTotal * 1.0825).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => setCart([])}
                      className="w-full japanese-button py-3"
                    >
                      Clear Order
                    </button>
                    <motion.button
                      onClick={order}
                      className="w-full japanese-button-primary py-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Send Order
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <audio ref={audioElRef} hidden />
    </div>
    </>
  );
}

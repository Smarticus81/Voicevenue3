"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
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
  DollarSign,
  Hash,
  MicIcon,
  Volume2,
  VolumeX,
  Grid3X3,
  Save,
  Eye,
  Settings,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

const OpenAIRealtimeWidget = dynamic(() => import("@/components/OpenAIRealtimeWidget"), { ssr: false });

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
  { id: '1', name: 'Mimosa', price: '8.00', category: 'cocktails' },
  { id: '2', name: 'Martini', price: '12.00', category: 'cocktails' },
  { id: '3', name: 'Chardonnay', price: '10.00', category: 'wine' },
  { id: '4', name: 'IPA Beer', price: '6.00', category: 'beer' },
  { id: '5', name: 'Whiskey', price: '15.00', category: 'spirits' },
  { id: '6', name: 'Coca Cola', price: '3.00', category: 'non-alcoholic' },
  { id: '7', name: 'Old Fashioned', price: '14.00', category: 'cocktails' },
  { id: '8', name: 'Pinot Noir', price: '12.00', category: 'wine' },
];

export default function POSDesigner() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  
  const venueId = searchParams?.get('venueId') || "demo-venue";
  const agentId = searchParams?.get('agentId') || "demo-agent";
  const lane = searchParams?.get('lane') || "openai";
  const [list, setList] = useState(defaultMenuItems);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [tableName, setTableName] = useState("Table 1");
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverName, setServerName] = useState("Server");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceWaves, setVoiceWaves] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    
    // Load drinks data from JSON file
    loadDrinksData();
    
    // Update clock every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const loadDrinksData = async () => {
    try {
      const response = await fetch('/drinks.json');
      if (response.ok) {
        const drinksData = await response.json();
        setList(drinksData);
      }
    } catch (error) {
      console.log('Using default drinks data');
      // Keep using defaultMenuItems
    }
  };

  const add = (item: { name: string; price: string }) => {
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

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive) {
      setVoiceWaves(true);
      
      // Start voice recognition session
      startVoiceSession();
      
      // Simulate voice recognition waves
      const waveInterval = setInterval(() => {
        setVoiceWaves(prev => !prev);
      }, 1000);
      
      // Stop waves after 3 seconds
      setTimeout(() => {
        clearInterval(waveInterval);
        setVoiceWaves(false);
        setIsVoiceActive(false);
      }, 3000);
    }
  };

  const startVoiceSession = async () => {
    try {
      setIsVoiceActive(true);
      setVoiceWaves(true);
      console.log(`Starting REAL OpenAI voice session for venue: ${venueId}, agent: ${agentId}, lane: ${lane}`);
      
      // Connect to OpenAI Realtime API via our voice server
      const wsUrl = 'ws://localhost:8787';
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Connected to voice server');
        
        // Send session configuration for wake word detection
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are Bev, the AI voice assistant for Knotting Hill Place Estate.
Be ultra-concise (<=15 words). Speak in past tense during order operations.
Never ask "anything else"; stop talking on termination phrases and return to wake mode.
Use tools for ALL business actions — no generic replies.

WAKE WORD PROTOCOL:
- Start in wake word mode - only respond to "Hey Bev", "Hi Bev", or "Bev"
- When wake word detected, say "Hello! How can I help you?" and enter conversation mode
- Ignore all other speech until wake word is detected

CONVERSATION MODE:
- Process drink/food orders using cart_add tool
- Answer menu questions using search_drinks tool
- Keep responses ultra-concise (<=15 words)
- Available items: ${list.map(item => item.name).join(', ')}

TERMINATION PROTOCOL:
- On "stop listening", "end call", "bye bev", "thanks bev": return to wake word mode
- On "shut down", "shutdown", "turn off": complete shutdown

TOOL CALLING:
- Use cart_add when user orders items
- Use search_drinks for menu questions
- Always confirm actions taken in past tense`,
            voice: 'shimmer',
            temperature: 0.4,
            max_tokens: 1500,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.2,
              prefix_padding_ms: 150,
              silence_duration_ms: 600
            },
            tools: [
              {
                type: 'function',
                name: 'cart_add',
                description: 'Add a drink to the cart',
                parameters: {
                  type: 'object',
                  properties: {
                    drink_name: {
                      type: 'string',
                      description: 'Name of the drink'
                    },
                    quantity: {
                      type: 'number',
                      description: 'Quantity to add',
                      default: 1
                    }
                  },
                  required: ['drink_name']
                }
              },
              {
                type: 'function', 
                name: 'search_drinks',
                description: 'Search for drinks by name or category',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Search query for drinks'
                    }
                  },
                  required: ['query']
                }
              },
              {
                type: 'function',
                name: 'cart_view',
                description: 'View current cart contents',
                parameters: {
                  type: 'object',
                  properties: {}
                }
              }
            ]
          }
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Voice server response:', data.type);
          
          switch (data.type) {
            case 'session.created':
              console.log('OpenAI session created');
              break;
              
            case 'conversation.item.input_audio_transcription.completed':
              const transcript = data.transcript;
              console.log('User said:', transcript);
              break;
              
            case 'response.audio.delta':
              // Handle audio response from Bev
              if (data.delta) {
                playAudioDelta(data.delta);
              }
              break;
              
            case 'response.function_call_arguments.done':
              // Handle tool calls
              if (data.name === 'cart_add') {
                const args = JSON.parse(data.arguments);
                const item = list.find(i => 
                  i.name.toLowerCase().includes(args.drink_name.toLowerCase())
                );
                if (item) {
                  for (let i = 0; i < (args.quantity || 1); i++) {
                    add(item);
                  }
                  console.log(`Added ${args.quantity || 1}x ${item.name} to cart`);
                }
              } else if (data.name === 'search_drinks') {
                const args = JSON.parse(data.arguments);
                const menuInfo = list.filter(item =>
                  item.name.toLowerCase().includes(args.query.toLowerCase()) ||
                  item.category.toLowerCase().includes(args.query.toLowerCase())
                );
                console.log('Drinks search requested:', menuInfo);
              } else if (data.name === 'cart_view') {
                console.log('Cart view requested:', cart);
              }
              break;
              
            case 'response.done':
              console.log('Response completed');
              break;
              
            case 'error':
              console.error('OpenAI API error:', data);
              break;
          }
        } catch (e) {
          console.error('Error parsing voice message:', e);
        }
      };
      
      ws.onerror = (error) => {
        console.error('Voice connection error:', error);
        setIsVoiceActive(false);
        setVoiceWaves(false);
      };
      
      ws.onclose = () => {
        console.log('Voice connection closed');
        setIsVoiceActive(false);
        setVoiceWaves(false);
      };
      
      // Start audio capture
      startAudioCapture(ws);
      
    } catch (error) {
      console.error("Real voice session error:", error);
      setIsVoiceActive(false);
      setVoiceWaves(false);
    }
  };
  
  const startAudioCapture = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputBuffer.length);
          
          for (let i = 0; i < inputBuffer.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
          }
          
          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: Array.from(pcm16)
          }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('Audio capture started');
      
    } catch (error) {
      console.error('Error starting audio capture:', error);
    }
  };
  
  const playAudioDelta = (audioData: string) => {
    try {
      // Convert base64 audio to playable format
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioContext = new AudioContext();
      audioContext.decodeAudioData(bytes.buffer).then(audioBuffer => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const order = async () => {
    if (!cart.length) return;
    
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
    alert(`Order processed for ${tableName}! Total: $${(cartTotal * 1.0825).toFixed(2)}`);
  };

  return (
    <div className="min-h-screen fade-in" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Designer Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/studio" className="text-white/70 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gradient">POS Designer</h1>
              <p className="text-sm text-white/60">Design and preview your point-of-sale interface</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="glass px-4 py-2 rounded-neuro text-sm font-medium hover:bg-white/5 transition-colors flex items-center space-x-2">
              <Save size={16} />
              <span>Save Design</span>
            </button>
            <button className="glass px-4 py-2 rounded-neuro text-sm font-medium hover:bg-white/5 transition-colors flex items-center space-x-2">
              <Eye size={16} />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* POS Interface */}
      <div className="h-screen flex flex-col bg-white text-gray-900 border-4 border-white/20 rounded-lg m-4 overflow-hidden">
        {/* Top Header Bar */}
        <div className="h-16 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{formatTime(currentTime)}</div>
              <div className="text-gray-600">{formatDate(currentTime)}</div>
            </div>
            <div className="w-px h-8 bg-gray-300" />
            <div className="text-sm">
              <div className="text-gray-600">Server</div>
              <div className="font-medium text-gray-900">{serverName}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Voice Integration - Subtle Button */}
            <motion.button
              onClick={handleVoiceToggle}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isVoiceActive 
                  ? 'bg-blue-500 shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <MicIcon size={14} className={isVoiceActive ? 'text-white' : 'text-gray-600'} />
              {isVoiceActive && (
                <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
              )}
            </motion.button>
            
            <div className="text-sm text-right">
              <div className="text-gray-600">VenueVoice</div>
              <div className="font-medium text-gray-900">Silver Pkg.</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Panel - Categories & Items */}
          <div className="flex-1 flex flex-col">
            {/* Category Tabs */}
            <div className="h-16 bg-gray-100 border-b border-gray-200 flex items-center px-4 space-x-1">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeCategory === category.id
                        ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>



            {/* Items Grid */}
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="grid grid-cols-6 gap-2">
                {filteredItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => add(item)}
                    className="h-20 bg-white border border-gray-200 rounded-lg p-2 hover:border-blue-300 hover:shadow-md transition-all group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-full flex flex-col justify-between">
                      <div className="text-xs font-medium text-gray-900 truncate">{item.name}</div>
                      <div className="text-sm font-bold text-blue-600">${Number(item.price).toFixed(2)}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Order Summary */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
            {/* Order Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">{tableName}'s Tab</h2>
                <div className="text-sm text-gray-600">Active now</div>
              </div>
              <select
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              >
                <option>Table 1</option>
                <option>Table 2</option>
                <option>Table 3</option>
                <option>Bar 1</option>
                <option>Bar 2</option>
                <option>Patio A</option>
              </select>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto">
                              {cart.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No items added yet</p>
                  <p className="text-sm mt-1">Try the voice button: "Add a mimosa"</p>
                  {isVoiceActive && (
                    <div className="mt-3 text-blue-600 text-sm font-medium">
                      🎤 Listening for voice commands...
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {cart.map((item, i) => (
                    <motion.div 
                      key={i} 
                      className="bg-white border border-gray-200 rounded-lg p-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <button
                          onClick={() => removeItem(i)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(i, -1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.qty}</span>
                          <button
                            onClick={() => updateQuantity(i, 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">${item.price.toFixed(2)} each</div>
                          <div className="font-semibold text-gray-900">${(item.price * item.qty).toFixed(2)}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Total & Actions */}
            {cart.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (8.25%)</span>
                    <span className="font-medium">${(cartTotal * 0.0825).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${(cartTotal * 1.0825).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setCart([])}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Clear Order
                  </button>
                  <motion.button
                    onClick={order}
                    className="w-full px-4 py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Send Order
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <audio ref={audioRef} hidden />
    </div>
  );
}

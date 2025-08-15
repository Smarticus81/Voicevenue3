"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Store,
  Package,
  Settings,
  Check,
  ArrowRight,
  Coffee,
  Wine,
  Utensils,
  ChevronRight,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  AlertCircle
} from "lucide-react";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

interface VenueTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  items: any[];
}

const templates: VenueTemplate[] = [
  {
    id: "drinks",
    name: "Bar & Drinks",
    description: "Perfect for bars, pubs, and beverage-focused venues",
    icon: Wine,
    items: [
      { name: "Beer", price: 500, category: "Alcohol", stock: 100 },
      { name: "Wine", price: 800, category: "Alcohol", stock: 50 },
      { name: "Cocktail", price: 1200, category: "Alcohol", stock: 75 },
      { name: "Soda", price: 300, category: "Non-Alcohol", stock: 200 },
      { name: "Water", price: 200, category: "Non-Alcohol", stock: 150 },
      { name: "Coffee", price: 400, category: "Hot Drinks", stock: 100 }
    ]
  },
  {
    id: "retail",
    name: "Retail & Merchandise",
    description: "For shops selling clothing, accessories, and merchandise",
    icon: Package,
    items: [
      { name: "T-Shirt", price: 2500, category: "Clothing", stock: 50 },
      { name: "Hat", price: 1500, category: "Accessories", stock: 30 },
      { name: "Mug", price: 1000, category: "Merchandise", stock: 75 },
      { name: "Keychain", price: 500, category: "Accessories", stock: 100 }
    ]
  },
  {
    id: "Bar",
    name: "Restaurant & Food",
    description: "Full-service restaurants with food and beverages",
    icon: Utensils,
    items: [
      { name: "Burger", price: 1200, category: "Mains", stock: 50 },
      { name: "Pizza", price: 1500, category: "Mains", stock: 30 },
      { name: "Salad", price: 900, category: "Starters", stock: 40 },
      { name: "Fries", price: 600, category: "Sides", stock: 100 },
      { name: "Dessert", price: 700, category: "Desserts", stock: 25 }
    ]
  }
];

export default function POSSetup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [venueId, setVenueId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customItems, setCustomItems] = useState<any[]>([]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState<string>("");

  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: "venue-info",
      title: "Venue Information", 
      description: "Basic details about your venue",
      icon: Store,
      completed: false
    },
    {
      id: "template-selection",
      title: "Business Template",
      description: "Choose a template that matches your business",
      icon: BarChart3,
      completed: false
    },
    {
      id: "inventory-setup",
      title: "Inventory Setup",
      description: "Configure your products and pricing",
      icon: Package,
      completed: false
    },
    {
      id: "final-setup",
      title: "Complete Setup",
      description: "Finalize and deploy your POS system",
      icon: Settings,
      completed: false
    }
  ]);

  useEffect(() => {
    // Get venue ID from URL params
    const params = new URLSearchParams(window.location.search);
    const urlVenueId = params.get('venueId') || `venue-${Date.now()}`;
    setVenueId(urlVenueId);
  }, []);

  const markStepComplete = (stepIndex: number) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, completed: true } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      markStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const addCustomItem = () => {
    setCustomItems(prev => [...prev, {
      name: "",
      price: 0,
      category: "Other",
      stock: 0
    }]);
  };

  const updateCustomItem = (index: number, field: string, value: any) => {
    setCustomItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeCustomItem = (index: number) => {
    setCustomItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickSetup = async () => {
    if (!businessName.trim() || !selectedTemplate) {
      setSetupError("Please fill in all required fields");
      return;
    }

    setSetupLoading(true);
    setSetupError("");

    try {
      const response = await fetch('/api/pos/quick-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId,
          template: selectedTemplate,
          businessName: businessName.trim(),
          source: "template"
        })
      });

      const result = await response.json();
      
      if (result.ok) {
        setSetupComplete(true);
        markStepComplete(3);
        console.log('POS setup completed successfully');
      } else {
        setSetupError(result.error || 'Setup failed');
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      setSetupError(error.message || 'Network error during setup');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleAdvancedSetup = async () => {
    if (!businessName.trim()) {
      setSetupError("Business name is required");
      return;
    }

    setSetupLoading(true);
    setSetupError("");

    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const allItems = [
        ...(template?.items || []),
        ...customItems.filter(item => item.name.trim())
      ];

      const setupData = {
        venueId,
        menu: allItems.map(item => ({
          name: item.name,
          category: item.category,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          imgUrl: null,
          recipeNote: null
        })),
        tables: [
          { name: "Table 1" },
          { name: "Table 2" },
          { name: "Table 3" },
          { name: "Bar 1" },
          { name: "Bar 2" }
        ],
        ingredients: allItems.map(item => ({
          name: item.name,
          unit: "ml"
        })),
        inventory: []
      };

      const response = await fetch('/api/pos/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData)
      });

      const result = await response.json();
      
      if (result.ok) {
        setSetupComplete(true);
        markStepComplete(3);
        console.log('Advanced POS setup completed successfully');
      } else {
        setSetupError(result.error || 'Setup failed');
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      setSetupError(error.message || 'Network error during setup');
    } finally {
      setSetupLoading(false);
    }
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center">
            <Check size={48} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Setup Complete!</h1>
            <p className="text-white/70 mb-6">Your POS system is ready to use</p>
            <div className="space-y-3">
              <motion.button
                onClick={() => window.location.href = `/kiosk?venueId=${venueId}`}
                className="w-full bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Open POS System
              </motion.button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full glass border border-white/20 text-white/70 px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs tracking-wide mb-4">
            <Sparkles size={12} />
            POS System Setup
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3">
            Configure Your POS System
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Set up your point of sale system with inventory and menu management
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = step.completed;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={20} />
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>
                    <div className="text-xs mt-2 text-center max-w-20">
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 transition-colors duration-300 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-3xl p-8"
        >
          {/* Step 1: Venue Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Tell us about your venue</h2>
                <p className="text-white/70">We'll use this information to customize your POS system</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter your business name"
                    className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Venue ID</label>
                  <input
                    type="text"
                    value={venueId}
                    onChange={(e) => setVenueId(e.target.value)}
                    placeholder="Unique venue identifier"
                    className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!businessName.trim() || !venueId.trim()}
                className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Choose your business type</h2>
                <p className="text-white/70">Select a template that matches your business to get started quickly</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate === template.id;
                  
                  return (
                    <motion.div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : 'border-white/20 hover:border-white/40 glass'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-emerald-500' : 'bg-white/10'
                        }`}>
                          <Icon size={24} className={isSelected ? 'text-white' : 'text-white/70'} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{template.name}</h3>
                          <p className="text-sm text-white/70">{template.description}</p>
                        </div>
                      </div>
                      
                      <div className="text-sm text-white/60">
                        Includes {template.items.length} sample items
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="glass border border-white/20 text-white/70 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!selectedTemplate}
                  className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Inventory Setup */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Review your inventory</h2>
                <p className="text-white/70">These items will be added to your POS system. You can add custom items or use quick setup.</p>
              </div>

              {/* Template Items Preview */}
              {selectedTemplate && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Template Items</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {templates.find(t => t.id === selectedTemplate)?.items.map((item, index) => (
                      <div key={index} className="p-4 glass border border-white/10 rounded-xl">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-white">{item.name}</div>
                            <div className="text-sm text-white/60">{item.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">${(item.price / 100).toFixed(2)}</div>
                            <div className="text-sm text-white/60">{item.stock} in stock</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Custom Items</h3>
                  <button
                    onClick={addCustomItem}
                    className="flex items-center space-x-2 glass border border-white/20 text-white/70 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Plus size={16} />
                    <span>Add Item</span>
                  </button>
                </div>

                {customItems.map((item, index) => (
                  <div key={index} className="p-4 glass border border-white/10 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateCustomItem(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 glass border border-white/10 rounded-lg"
                      />
                      <select
                        value={item.category}
                        onChange={(e) => updateCustomItem(index, 'category', e.target.value)}
                        className="px-3 py-2 glass border border-white/10 rounded-lg"
                      >
                        <option value="Other">Other</option>
                        <option value="Alcohol">Alcohol</option>
                        <option value="Non-Alcohol">Non-Alcohol</option>
                        <option value="Food">Food</option>
                        <option value="Merchandise">Merchandise</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Price ($)"
                        value={item.price}
                        onChange={(e) => updateCustomItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 glass border border-white/10 rounded-lg"
                        step="0.01"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={item.stock}
                        onChange={(e) => updateCustomItem(index, 'stock', parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 glass border border-white/10 rounded-lg"
                      />
                      <button
                        onClick={() => removeCustomItem(index)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="glass border border-white/20 text-white/70 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Final Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Complete your setup</h2>
                <p className="text-white/70">Choose your setup method to finalize your POS system</p>
              </div>

              {setupError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3">
                  <AlertCircle size={20} className="text-red-400" />
                  <span className="text-red-300">{setupError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  onClick={handleQuickSetup}
                  disabled={setupLoading}
                  className="p-6 border-2 border-emerald-500/20 rounded-xl hover:border-emerald-500 glass transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Clock size={24} className="text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white">Quick Setup</h3>
                      <p className="text-sm text-white/70">Fast deployment with template items</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    Uses our optimized database structure for fastest performance
                  </p>
                </motion.button>

                <motion.button
                  onClick={handleAdvancedSetup}
                  disabled={setupLoading}
                  className="p-6 border-2 border-blue-500/20 rounded-xl hover:border-blue-500 glass transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Settings size={24} className="text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white">Advanced Setup</h3>
                      <p className="text-sm text-white/70">Full configuration with custom items</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    Includes all template and custom items with full POS features
                  </p>
                </motion.button>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={setupLoading}
                  className="glass border border-white/20 text-white/70 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              </div>

              {setupLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-white/70">Setting up your POS system...</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

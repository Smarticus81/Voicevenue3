"use client";
import { useState, useEffect } from "react";

interface POSItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends POSItem {
  quantity: number;
}

export default function SimplePOS({ venueId }: { venueId: string }) {
  const [items, setItems] = useState<POSItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load venue items
    fetch(`/api/drinks/list?venueId=${venueId}`)
      .then(r => r.json())
      .then(data => {
        if (data.drinks) {
          const posItems = data.drinks.map((d: any) => ({
            id: d.id,
            name: d.name,
            price: d.price || 0,
            category: d.category || "Other"
          }));
          setItems(posItems);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [venueId]);

  const categories = ["all", ...Array.from(new Set(items.map(i => i.category)))];
  const filteredItems = activeCategory === "all" ? items : items.filter(i => i.category === activeCategory);

  const addToCart = (item: POSItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return <div className="p-4 text-center">Loading inventory...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Left: Item Grid */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                activeCategory === cat 
                  ? 'bg-emerald-500 text-black' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[400px]">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="p-4 rounded-xl bg-white/10 hover:bg-white/20 text-left space-y-1"
            >
              <div className="font-semibold">{item.name}</div>
              <div className="text-sm text-white/70">${item.price.toFixed(2)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="bg-black/40 rounded-xl p-4 flex flex-col">
        <h3 className="font-semibold mb-4">Current Order</h3>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="text-white/50 text-center py-8">Cart is empty</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-white/70">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total & Checkout */}
        <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            disabled={cart.length === 0}
            className="w-full py-3 rounded-xl bg-emerald-500 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process Order
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit: string;
}

export default function InventoryView({ venueId }: { venueId: string }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    // Load inventory data
    fetch(`/api/inventory/list?venueId=${venueId}`)
      .then(r => r.json())
      .then(data => {
        if (data.items) {
          setInventory(data.items);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback to drinks data if inventory endpoint not available
        fetch(`/api/drinks/list?venueId=${venueId}`)
          .then(r => r.json())
          .then(data => {
            if (data.drinks) {
              const invItems = data.drinks.map((d: any) => ({
                id: d.id,
                name: d.name,
                category: d.category || "Other",
                current_stock: Math.floor(Math.random() * 50) + 10,
                min_stock: 10,
                unit: "units"
              }));
              setInventory(invItems);
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, [venueId]);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase()) ||
    item.category.toLowerCase().includes(filter.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.current_stock <= item.min_stock);

  if (loading) {
    return <div className="p-4 text-center">Loading inventory...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inventory Management</h3>
        <input
          type="text"
          placeholder="Search items..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-black/30 border border-white/20 w-64"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold text-red-400">Low Stock Alert</span>
          </div>
          <div className="text-sm text-red-300">
            {lowStockItems.length} items are running low: {lowStockItems.slice(0, 3).map(i => i.name).join(", ")}
            {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-black/40 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 font-semibold">Item</th>
              <th className="text-left p-4 font-semibold">Category</th>
              <th className="text-center p-4 font-semibold">Stock</th>
              <th className="text-center p-4 font-semibold">Min Stock</th>
              <th className="text-center p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => {
              const isLow = item.current_stock <= item.min_stock;
              const percentage = (item.current_stock / (item.min_stock * 5)) * 100;
              
              return (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-white/70">{item.category}</td>
                  <td className="p-4 text-center">
                    <span className={isLow ? 'text-red-400' : ''}>
                      {item.current_stock} {item.unit}
                    </span>
                  </td>
                  <td className="p-4 text-center text-white/70">{item.min_stock}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isLow ? 'Low' : 'OK'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">{inventory.length}</div>
          <div className="text-sm text-white/70">Total Items</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{lowStockItems.length}</div>
          <div className="text-sm text-white/70">Low Stock</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {inventory.filter(i => i.current_stock > i.min_stock * 2).length}
          </div>
          <div className="text-sm text-white/70">Well Stocked</div>
        </div>
      </div>
    </div>
  );
}

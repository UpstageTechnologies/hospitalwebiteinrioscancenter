import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  TrendingDown,
  Truck,
  RotateCcw,
  Building,
  Calendar,
  X
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: 'Consumables' | 'Surgical' | 'Linen' | 'Stationery' | 'Diagnostic Reagents';
  currentStock: number;
  minLevel: number;
  unit: string;
  supplier: string;
  lastRestocked: string;
  unitCost: number;
}

export const StoreDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'suppliers' | 'adjust'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'Sterile Surgical Gloves (Size 7.5)', category: 'Surgical', currentStock: 450, minLevel: 200, unit: 'Pairs', supplier: 'MedEquip Surgical Ltd', lastRestocked: '2026-11-10', unitCost: 35 },
    { id: '2', name: 'N95 Respirator Masks', category: 'Consumables', currentStock: 80, minLevel: 150, unit: 'Pieces', supplier: 'Apex Healthcare Supplies', lastRestocked: '2026-11-02', unitCost: 45 },
    { id: '3', name: 'Disposable Syringes 5ml with Needle', category: 'Consumables', currentStock: 1200, minLevel: 500, unit: 'Pieces', supplier: 'Hindustan Syringes Corp', lastRestocked: '2026-11-15', unitCost: 6 },
    { id: '4', name: 'ICU Bed Sheet & Pillowcase Set (Linen)', category: 'Linen', currentStock: 35, minLevel: 60, unit: 'Sets', supplier: 'Kaveri Hospital Textiles', lastRestocked: '2026-10-25', unitCost: 480 },
    { id: '5', name: 'Biochemistry Analyzer Lyse Reagent 500ml', category: 'Diagnostic Reagents', currentStock: 12, minLevel: 20, unit: 'Bottles', supplier: 'Siemens Diagnostics India', lastRestocked: '2026-11-05', unitCost: 2800 },
    { id: '6', name: 'IV Cannula 20G (Pink)', category: 'Surgical', currentStock: 650, minLevel: 300, unit: 'Units', supplier: 'BD Medical Systems', lastRestocked: '2026-11-12', unitCost: 42 }
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState([
    { id: 'PO-2026-081', supplier: 'Apex Healthcare Supplies', item: 'N95 Masks (500 Pcs)', amount: 22500, status: 'ordered', orderDate: '2026-11-18', eta: '2026-11-22' },
    { id: 'PO-2026-082', supplier: 'Kaveri Hospital Textiles', item: 'Hospital Bed Sheets (100 Sets)', amount: 48000, status: 'received', orderDate: '2026-11-12', eta: '2026-11-17' },
    { id: 'PO-2026-083', supplier: 'Siemens Diagnostics India', item: 'Biochemistry Reagent Pack', amount: 56000, status: 'pending_approval', orderDate: '2026-11-19', eta: '2026-11-25' }
  ]);

  const lowStockItems = inventory.filter(i => i.currentStock <= i.minLevel);

  const filteredInventory = inventory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleQuickRestock = (id: string, qty: number) => {
    setInventory(inventory.map(item => item.id === id ? { ...item, currentStock: item.currentStock + qty, lastRestocked: new Date().toISOString().split('T')[0] } : item));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Central Hospital Store & General Inventory</h1>
              <p className="text-xs text-slate-500">
                Consumables • Surgical Supplies • Purchase Orders • Goods Receipt • Low Stock Triggers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
              Active SKUs: <strong className="text-slate-900">{inventory.length}</strong>
            </span>
            {lowStockItems.length > 0 && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{lowStockItems.length} Low Stock Alerts</span>
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pt-5 border-t border-slate-100 mt-5">
          {[
            { id: 'inventory', label: 'General Inventory', icon: Package, badge: inventory.length },
            { id: 'orders', label: 'Purchase Orders', icon: Truck, badge: purchaseOrders.length },
            { id: 'suppliers', label: 'Suppliers Directory', icon: Building, badge: 4 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search inventory items, surgicals or suppliers..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Surgical">Surgical</option>
                <option value="Consumables">Consumables</option>
                <option value="Linen">Linen</option>
                <option value="Diagnostic Reagents">Diagnostic Reagents</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Item Name & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Stock Balance</th>
                    <th className="py-3 px-4">Min Reorder Level</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Stock Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map(item => {
                    const isLow = item.currentStock <= item.minLevel;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Last restocked: {item.lastRestocked}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold text-sm ${isLow ? 'text-amber-700' : 'text-slate-900'}`}>
                              {item.currentStock} {item.unit}
                            </span>
                            {isLow && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                LOW
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {item.minLevel} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {item.supplier}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          ₹{item.unitCost}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleQuickRestock(item.id, 50)}
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100"
                          >
                            +50 Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Purchase Orders & Goods Inward</h3>
            <span className="text-xs text-slate-500">{purchaseOrders.length} Orders</span>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Ordered Items</th>
                  <th className="py-3 px-4">PO Amount</th>
                  <th className="py-3 px-4">ETA</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold font-mono text-purple-700">{po.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{po.supplier}</td>
                    <td className="py-3 px-4 text-slate-700">{po.item}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">₹{po.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{po.eta}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        po.status === 'received' ? 'bg-emerald-100 text-emerald-800' :
                        po.status === 'ordered' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Apex Healthcare Supplies', category: 'Consumables & PPE', city: 'Gurugram', phone: '+91 124 492 8810', terms: 'Net 30 Days' },
            { name: 'MedEquip Surgical Ltd', category: 'Surgical Instruments & Gloves', city: 'New Delhi', phone: '+91 11 2589 1100', terms: 'Net 15 Days' },
            { name: 'Siemens Diagnostics India', category: 'Pathology Reagents', city: 'Mumbai', phone: '+91 22 3910 4400', terms: 'Advance 50%' },
            { name: 'Kaveri Hospital Textiles', category: 'Bed Linens & Uniforms', city: 'Panipat', phone: '+91 180 264 5500', terms: 'Net 30 Days' }
          ].map(sup => (
            <div key={sup.name} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">{sup.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">{sup.category}</span>
              </div>
              <div className="text-xs text-slate-500">Location: {sup.city} • Phone: {sup.phone}</div>
              <div className="text-[11px] text-emerald-700 font-semibold pt-2 border-t border-slate-100">Credit Terms: {sup.terms}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

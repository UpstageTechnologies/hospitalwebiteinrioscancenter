import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Medicine } from '../../types/pharmacy';
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  Package,
  CheckCircle2,
  Calendar,
  X,
  Sparkles
} from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const { medicines, patients, dispensePrescription } = useHospital();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [dispenseQty, setDispenseQty] = useState('1');

  const lowStockMedicines = medicines.filter(m => m.currentStock <= m.minStockAlertLevel);

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDispenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === selectedPatientId);
    const med = medicines.find(m => m.id === selectedMedId);
    if (!pat || !med) return;

    const qty = parseInt(dispenseQty) || 1;
    const batch = med.batches[0] || { batchNumber: 'DEFAULT-BATCH', sellingPricePerUnit: 100 };
    const unitPrice = batch.sellingPricePerUnit;
    const subtotal = unitPrice * qty;
    const tax = Math.round(subtotal * 0.05);

    dispensePrescription({
      patientId: pat.id,
      patientName: pat.name,
      patientUhid: pat.uhid,
      prescribedDoctorName: 'Dr. Vikram Malhotra',
      dispensedByPharmacistName: currentUser?.name || 'Suresh Singhania (Pharmacist)',
      items: [
        {
          medicineId: med.id,
          medicineName: med.name,
          batchNumber: batch.batchNumber,
          quantity: qty,
          unitPrice,
          totalPrice: subtotal
        }
      ],
      subtotal,
      discount: 0,
      tax,
      grandTotal: subtotal + tax,
      paymentStatus: 'paid'
    });

    setShowDispenseModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-600" />
            Pharmacy & FEFO Batch Inventory Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescription Dispensing • First-Expiry-First-Out (FEFO) Protocol • Threshold Alerts
          </p>
        </div>

        <button
          onClick={() => setShowDispenseModal(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Dispense Prescription
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockMedicines.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Low Stock Alert ({lowStockMedicines.length} Medicines Critical)
              </h4>
              <p className="text-[11px] text-amber-700">
                {lowStockMedicines.map(m => `${m.name} (${m.currentStock} units)`).join(', ')} below minimum threshold.
              </p>
            </div>
          </div>
          <button className="text-xs font-semibold text-amber-800 bg-amber-200/60 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
            Reorder Stock
          </button>
        </div>
      )}

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search medicine by trade name or generic..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500">{medicines.length} Medicines in formulary</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold">Medicine</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Manufacturer</th>
                <th className="p-3 font-semibold">Batch & Expiry</th>
                <th className="p-3 font-semibold">Stock</th>
                <th className="p-3 font-semibold">Price (MRP)</th>
                <th className="p-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map((med) => {
                const batch = med.batches[0];
                const isLow = med.currentStock <= med.minStockAlertLevel;

                return (
                  <tr key={med.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{med.name}</div>
                      <div className="text-[10px] text-slate-400 italic">{med.genericName}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                        {med.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{med.manufacturer}</td>
                    <td className="p-3">
                      <div className="font-mono text-slate-800 font-semibold">{batch?.batchNumber || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">Exp: {batch?.expiryDate || 'N/A'}</div>
                    </td>
                    <td className="p-3">
                      <div className={`font-extrabold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {med.currentStock} {med.unit}
                      </div>
                      <div className="text-[9px] text-slate-400">Min alert: {med.minStockAlertLevel}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      ₹{batch?.mrp || 100}
                    </td>
                    <td className="p-3 text-right">
                      {isLow ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Adequate
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DISPENSE MEDICINE */}
      {showDispenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Dispense Prescription (FEFO Stock)</h3>
              <button onClick={() => setShowDispenseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleDispenseSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine to Dispense</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stock: {m.currentStock} - Batch: {m.batches[0]?.batchNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispenseModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Confirm & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

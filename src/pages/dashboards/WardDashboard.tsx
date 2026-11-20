import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import type { Bed } from '../../types/admission';
import {
  Bed as BedIcon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Wrench,
  Users,
  X
} from 'lucide-react';

export const WardDashboard: React.FC = () => {
  const { wards, beds, admissions, updateBedStatus, transferBed } = useHospital();

  const [selectedWardId, setSelectedWardId] = useState<string>('all');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetBedId, setTargetBedId] = useState('');

  const filteredBeds = beds.filter(b => {
    if (selectedWardId === 'all') return true;
    return b.wardId === selectedWardId;
  });

  const availableCount = beds.filter(b => b.status === 'available').length;
  const occupiedCount = beds.filter(b => b.status === 'occupied').length;
  const cleaningCount = beds.filter(b => b.status === 'cleaning').length;
  const maintenanceCount = beds.filter(b => b.status === 'maintenance').length;

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed?.admissionId || !targetBedId) return;

    transferBed(selectedBed.admissionId, targetBedId);
    setShowTransferModal(false);
    setSelectedBed(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BedIcon className="w-5 h-5 text-cyan-600" />
            Ward Census, Bed Management & Transfer Coordination
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-Time Floor Bed Map • Bed Turnover (Available / Occupied / Sanitizing) • Inter-Ward Transfers
          </p>
        </div>
      </div>

      {/* Bed Census Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Available Beds</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">{availableCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Occupied Beds</div>
            <div className="text-2xl font-extrabold text-rose-600 mt-0.5">{occupiedCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <BedIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Cleaning / Sanitizing</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{cleaningCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Maintenance</div>
            <div className="text-2xl font-extrabold text-slate-700 mt-0.5">{maintenanceCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ward Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-500 mr-2">Filter Ward:</span>
        <button
          onClick={() => setSelectedWardId('all')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            selectedWardId === 'all'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Wards ({beds.length})
        </button>
        {wards.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWardId(w.id)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedWardId === w.id
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {w.name} ({w.floor})
          </button>
        ))}
      </div>

      {/* Interactive Bed Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const statusConfigs = {
            available: { border: 'border-emerald-200 hover:border-emerald-400 bg-white', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Available' },
            occupied: { border: 'border-rose-200 hover:border-rose-400 bg-white', badge: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Occupied' },
            cleaning: { border: 'border-amber-200 hover:border-amber-400 bg-white', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Cleaning' },
            maintenance: { border: 'border-slate-200 bg-slate-50', badge: 'bg-slate-200 text-slate-700 border-slate-300', text: 'Maintenance' },
            reserved: { border: 'border-blue-200 bg-white', badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Reserved' }
          };

          const config = statusConfigs[bed.status];

          return (
            <div
              key={bed.id}
              className={`p-4 rounded-xl border shadow-xs transition-all flex flex-col justify-between ${config.border}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BedIcon className="w-4 h-4 text-slate-500" />
                    {bed.bedNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
                    {config.text}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-1 font-medium">{bed.wardName}</div>
                <div className="text-[10px] text-slate-400">{bed.wardType} • ₹{bed.dailyRate}/day</div>

                {bed.status === 'occupied' && (
                  <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{bed.currentPatientName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{bed.currentPatientUhid}</div>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {bed.status === 'cleaning' && (
                  <button
                    onClick={() => updateBedStatus(bed.id, 'available')}
                    className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg shadow-xs"
                  >
                    Mark Ready (Cleaned)
                  </button>
                )}
                {bed.status === 'available' && (
                  <button
                    onClick={() => updateBedStatus(bed.id, 'maintenance')}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                  >
                    Set Maintenance
                  </button>
                )}
                {bed.status === 'maintenance' && (
                  <button
                    onClick={() => updateBedStatus(bed.id, 'cleaning')}
                    className="w-full text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded-lg"
                  >
                    Repair Done → Cleaning
                  </button>
                )}
                {bed.status === 'occupied' && (
                  <button
                    onClick={() => {
                      setSelectedBed(bed);
                      setShowTransferModal(true);
                    }}
                    className="w-full text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white py-1.5 rounded-lg shadow-xs"
                  >
                    Transfer Patient
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: BED TRANSFER */}
      {showTransferModal && selectedBed && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Inter-Ward Bed Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>Patient: <strong className="text-slate-800">{selectedBed.currentPatientName}</strong></div>
                <div>Current Bed: <strong className="text-slate-800">{selectedBed.bedNumber} ({selectedBed.wardName})</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Available Destination Bed *</label>
                <select
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                >
                  <option value="">-- Choose Target Bed --</option>
                  {beds.filter(b => b.status === 'available').map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} - {b.wardName} (₹{b.dailyRate}/day)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-xs"
                >
                  Execute Bed Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

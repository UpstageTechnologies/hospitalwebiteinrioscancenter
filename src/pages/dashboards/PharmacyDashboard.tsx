import React, { useState, useEffect } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import type { PosMedicine } from '../../services/posIntegrationService';
import { NurseHelpDialog } from '../../components/nurse/NurseHelpDialog';
import {
  Pill,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  HeartPulse
} from 'lucide-react';

interface QueuedPrescription {
  id: string;
  appointmentId: string;
  consultationId?: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorName: string;
  status: string; // 'Queued' | 'Dispensed'
  prescribedAt: string;
  items: {
    medicineId: string;
    posMedicineId?: string;
    medicineName: string;
    dosage: string;
    quantity: number;
    unitPrice: number;
    isDispensed?: boolean;
  }[];
}

export const PharmacyDashboard: React.FC = () => {
  const { currentHospital, currentUser } = useAuth();
  const { posMedicines, posConnection, dispensePrescriptionAtomic } = useHospital();

  const [activeTab, setActiveTab] = useState<'queue' | 'inventory'>('queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [prescriptionsQueue, setPrescriptionsQueue] = useState<QueuedPrescription[]>([]);
  const [dispensingId, setDispensingId] = useState<string | null>(null);

  // Nurse Help Dialog State
  const [nurseHelpOpen, setNurseHelpOpen] = useState(false);
  const [nurseHelpContext, setNurseHelpContext] = useState<{
    patientId?: string;
    patientName?: string;
    patientUhid?: string;
    defaultTaskType?: string;
    clinicalOrderDetails?: any;
  } | null>(null);

  // Subscribe to real-time prescriptions subcollection
  useEffect(() => {
    const unsub = firestoreService.subscribeToCollection<QueuedPrescription>(
      currentHospital.id,
      'prescriptions',
      (data) => {
        if (data) {
          setPrescriptionsQueue(data);
        }
      }
    );
    return () => unsub();
  }, [currentHospital.id]);

  const handleDispenseRx = async (rx: QueuedPrescription) => {
    setDispensingId(rx.id);
    try {
      const itemsToDispense = rx.items.map(item => {
        const matchedPos = posMedicines.find(m => m.id === (item.posMedicineId || item.medicineId) || m.name === item.medicineName);
        return {
          medicineId: item.medicineId,
          posMedicineId: matchedPos?.id || item.posMedicineId || item.medicineId,
          medicineName: item.medicineName,
          quantity: item.quantity || 1,
          unitPrice: matchedPos?.sellingPrice || item.unitPrice || 50
        };
      });

      await dispensePrescriptionAtomic({
        prescriptionId: rx.id,
        patientId: rx.patientId,
        patientName: rx.patientName,
        patientUhid: rx.patientUhid,
        doctorName: rx.doctorName,
        itemsToDispense
      });
    } finally {
      setDispensingId(null);
    }
  };

  const filteredQueue = prescriptionsQueue.filter(rx => {
    const q = searchTerm.toLowerCase();
    return rx.patientName.toLowerCase().includes(q) ||
      rx.patientUhid.toLowerCase().includes(q) ||
      rx.doctorName.toLowerCase().includes(q);
  });

  const filteredMeds = posMedicines.filter(m => {
    const q = searchTerm.toLowerCase();
    return m.name.toLowerCase().includes(q) ||
      (m.genericName && m.genericName.toLowerCase().includes(q)) ||
      m.category.toLowerCase().includes(q);
  });

  const pendingCount = prescriptionsQueue.filter(rx => rx.status === 'Queued').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-600" />
            Pharmacy Work Queue & Kadai POS Stock Dispensing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connected to Kadai POS ({posConnection?.shopName || 'Kadai Medicals'}) • Atomic Stock Deduction on Dispense
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setNurseHelpContext({ defaultTaskType: 'Injection Administration' });
              setNurseHelpOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title="Request nurse assistance for medicine administration or injection"
          >
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Nurse Help</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'queue' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Prescriptions Queue ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-slate-600" />
            POS Drug Master ({posMedicines.length})
          </button>
        </div>
      </div>
    </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'queue' ? "Search patient, UHID, doctor..." : "Search medicine name, generic name, category..."}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          />
        </div>
      </div>

      {/* TAB 1: PRESCRIPTIONS WORK QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {filteredQueue.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
              <Pill className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No Prescriptions Queued</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Consultations submitted by doctors with prescribed medicines will appear here for atomic dispensing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredQueue.map(rx => {
                const isDispensed = rx.status === 'Dispensed';
                return (
                  <div
                    key={rx.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                      isDispensed
                        ? 'border-slate-200/60 bg-slate-50/50'
                        : 'border-slate-200/80 hover:border-emerald-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{rx.patientName}</h3>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {rx.patientUhid} • Prescribed by {rx.doctorName}
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isDispensed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {(rx.status || 'pending').toUpperCase()}
                      </span>
                    </div>

                    {/* Prescribed Items Table */}
                    <div className="rounded-xl border border-slate-200/80 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px]">
                          <tr>
                            <th className="py-2 px-3">Medicine</th>
                            <th className="py-2 px-3">Dosage</th>
                            <th className="py-2 px-3">Req Qty</th>
                            <th className="py-2 px-3">POS Stock</th>
                            <th className="py-2 px-3">Unit Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rx.items.map((item, idx) => {
                            const matchedPos = posMedicines.find(
                              m => m.id === (item.posMedicineId || item.medicineId) || m.name === item.medicineName
                            );
                            const available = matchedPos ? matchedPos.currentStock : 100;
                            const isStockSufficient = available >= item.quantity;

                            return (
                              <tr key={idx} className="hover:bg-slate-50/60">
                                <td className="py-2 px-3 font-semibold text-slate-900">
                                  {item.medicineName}
                                </td>
                                <td className="py-2 px-3 text-slate-600">
                                  {item.dosage}
                                </td>
                                <td className="py-2 px-3 font-bold text-slate-800">
                                  {item.quantity}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isStockSufficient
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {available} units
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-800">
                                  ₹{matchedPos?.sellingPrice || item.unitPrice || 50}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        {isDispensed ? 'Inventory deducted & added to patient bill' : 'Stock will deduct in Kadai POS upon dispense'}
                      </div>

                      {isDispensed ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Dispensed Successfully
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDispenseRx(rx)}
                          disabled={dispensingId === rx.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          {dispensingId === rx.id ? 'Deducting Stock...' : 'Dispense & Deduct POS Stock'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KADAI POS DRUG MASTER */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kadai POS Live Medicine Catalog</h3>
              <p className="text-xs text-slate-500">Synchronized in real-time from Kadai POS inventory</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              {filteredMeds.length} Products Synced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Dosage / Instructions</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeds.map(med => (
                  <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{med.name}</div>
                      <div className="text-[10px] text-slate-400">{med.genericName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {med.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {med.dosage || 'As directed by physician'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={`px-2.5 py-1 rounded-lg ${
                        med.currentStock > (med.minStockAlert || 10)
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {med.currentStock} {med.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{med.sellingPrice}
                    </td>
                    <td className="py-3.5 px-4">
                      {med.currentStock > (med.minStockAlert || 10) ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          In Stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Low Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Reusable Nurse Help Dialog */}
      <NurseHelpDialog
        isOpen={nurseHelpOpen}
        onClose={() => {
          setNurseHelpOpen(false);
          setNurseHelpContext(null);
        }}
        patientId={nurseHelpContext?.patientId}
        patientName={nurseHelpContext?.patientName}
        patientUhid={nurseHelpContext?.patientUhid}
        defaultTaskType={nurseHelpContext?.defaultTaskType || 'Injection Administration'}
        clinicalOrderDetails={nurseHelpContext?.clinicalOrderDetails}
      />
    </div>
  );
};

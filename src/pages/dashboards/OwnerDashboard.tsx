import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  Users,
  ShieldCheck,
  Bed,
  Receipt,
  Pill,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldAlert,
  Building2,
  Calendar,
  CheckCircle2,
  Globe,
  Database,
  Unlink,
  Check,
  ChevronRight,
  Stethoscope,
  Microscope,
  DollarSign
} from 'lucide-react';

interface OwnerDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigateTab }) => {
  const { currentHospital, currentUser } = useAuth();
  const {
    patients,
    appointments,
    admissions,
    beds,
    invoices,
    roleRequests,
    posConnection,
    posMedicines,
    posLabTests,
    posRooms,
    handleConnectPos,
    handleDisconnectPos
  } = useHospital();

  const [posInputId, setPosInputId] = useState(posConnection?.posUserId || 'upstageuser1015');
  const [isConnectingPos, setIsConnectingPos] = useState(false);

  const totalPatients = patients.length;
  const activeAdmissions = admissions.filter(a => a.status === 'active').length;
  const totalBeds = beds.length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const bedOccupancyRate = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const pendingRoleApprovals = roleRequests.filter(r => r.status === 'pending').length;

  const onConnectPosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posInputId.trim()) return;
    setIsConnectingPos(true);
    try {
      await handleConnectPos(posInputId.trim());
    } finally {
      setIsConnectingPos(false);
    }
  };

  // Department-wise revenue breakdown
  const doctorRev = invoices.reduce((sum, inv) => {
    const docItems = inv.items?.filter(i => i.department === 'doctor' || i.category === 'Consultation' || i.category === 'Procedure') || [];
    return sum + docItems.reduce((acc, cur) => acc + cur.total, 0);
  }, 0);

  const pharmRev = invoices.reduce((sum, inv) => {
    const medItems = inv.items?.filter(i => i.department === 'pharmacy' || i.category === 'Pharmacy') || [];
    return sum + medItems.reduce((acc, cur) => acc + cur.total, 0);
  }, 0);

  const labRev = invoices.reduce((sum, inv) => {
    const labItems = inv.items?.filter(i => i.department === 'laboratory' || i.category === 'Lab Test') || [];
    return sum + labItems.reduce((acc, cur) => acc + cur.total, 0);
  }, 0);

  const wardRev = invoices.reduce((sum, inv) => {
    const wardItems = inv.items?.filter(i => i.department === 'ward' || i.category === 'Bed Charges') || [];
    return sum + wardItems.reduce((acc, cur) => acc + cur.total, 0);
  }, 0);

  // Compute Patient Journey Stages for active journeys
  const patientJourneys = patients.slice(0, 8).map(p => {
    const apt = appointments.find(a => a.patientId === p.id);
    const inv = invoices.find(i => i.patientId === p.id);
    const adm = admissions.find(a => a.patientId === p.id && a.status === 'active');

    let currentStage = 'Reception Desk';
    let progressPercent = 20;

    if (inv && inv.paymentStatus === 'paid') {
      currentStage = 'Journey Completed & Settled';
      progressPercent = 100;
    } else if (adm) {
      currentStage = `Inpatient Care (${adm.wardName})`;
      progressPercent = 80;
    } else if (inv && inv.items?.some(i => i.department === 'pharmacy' || i.department === 'laboratory')) {
      currentStage = 'Pharmacy & Diagnostic Orders';
      progressPercent = 60;
    } else if (apt && apt.status === 'completed') {
      currentStage = 'Consultation Completed';
      progressPercent = 40;
    } else if (apt && (apt.status === 'waiting' || apt.status === 'in_consultation')) {
      currentStage = 'Doctor Consultation';
      progressPercent = 30;
    }

    return {
      patient: p,
      appointment: apt,
      invoice: inv,
      admission: adm,
      currentStage,
      progressPercent
    };
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Executive Control & Patient Journey Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Hospital: <span className="font-semibold text-slate-800">{currentHospital.name}</span> • Multi-Tenant Isolated Healthcare Cloud
          </p>
        </div>

        {/* Quick Org Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-200/80 flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All 17 Hospital Roles Online
          </span>
        </div>
      </div>

      {/* KADAI POS ACCOUNT CONNECTION PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Kadai POS Connected Account
                {posConnection?.status === 'connected' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Connected & Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Disconnected
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Secondary Firebase Cloud Sync (`scaner-billing`) for Pharmacy Medicine Inventory, Lab Tests, and Room Tariffs
              </p>
            </div>
          </div>

          {posConnection?.status === 'connected' && (
            <button
              onClick={() => handleDisconnectPos()}
              className="px-3.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Unlink className="w-3.5 h-3.5" /> Disconnect POS
            </button>
          )}
        </div>

        {posConnection?.status === 'connected' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="text-slate-400 font-medium">Shop Name & Type</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{posConnection.shopName}</div>
              <div className="text-emerald-700 font-semibold text-[10px] mt-1">Type: {posConnection.shopType}</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70">
              <div className="text-slate-500 font-medium">POS User ID / UID</div>
              <div className="font-mono font-bold text-emerald-900 text-sm mt-0.5">{posConnection.posUserId}</div>
              <div className="text-slate-400 text-[10px] mt-1 font-mono">{posConnection.ownerUid}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="text-slate-400 font-medium">Live Synced Catalogs</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {posMedicines.length} Meds • {posLabTests.length} Labs
              </div>
              <div className="text-slate-500 text-[10px] mt-1">{posRooms.length} Ward Room Classes</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="text-slate-400 font-medium">Stock Deduction Policy</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">Atomic on Dispense</div>
              <div className="text-emerald-600 font-semibold text-[10px] mt-1">Prescriptions do not deduct</div>
            </div>
          </div>
        ) : (
          <form onSubmit={onConnectPosSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              required
              value={posInputId}
              onChange={(e) => setPosInputId(e.target.value)}
              placeholder="Enter Kadai POS User ID (e.g. upstageuser1015)..."
              className="w-full sm:flex-1 text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
            />
            <button
              type="submit"
              disabled={isConnectingPos}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isConnectingPos ? 'Verifying...' : 'Verify & Connect Account'}
            </button>
          </form>
        )}
      </div>

      {/* DEPARTMENT-WISE REVENUE & SERVICE BREAKDOWN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400">Doctor Consultations</div>
            <Stethoscope className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">₹{doctorRev.toLocaleString()}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">OPD Consultation & Care</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400">Pharmacy Dispensing</div>
            <Pill className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">₹{pharmRev.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Kadai POS Atomic Sales</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400">Diagnostic Laboratory</div>
            <Microscope className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">₹{labRev.toLocaleString()}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Pathology Tests Completed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400">Inpatient Ward Stay</div>
            <Bed className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">₹{wardRev.toLocaleString()}</div>
          <div className="text-[11px] text-cyan-600 font-medium mt-1">Bed Charges & Nursing</div>
        </div>
      </div>

      {/* REAL-TIME PATIENT JOURNEY PROGRESS TRACKER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Real-Time Patient Journey Progress Tracker</h3>
            <p className="text-xs text-slate-500">Live multi-department lifecycle tracking from Front Desk to Billing Discharge</p>
          </div>
          <button
            onClick={() => onNavigateTab('reception_dashboard')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            Reception Queue <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {patientJourneys.map((j, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{j.patient.name}</span>
                  <span className="font-mono text-slate-400 text-xs ml-2">({j.patient.uhid})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">
                    Stage: <span className="text-emerald-700 font-bold">{j.currentStage}</span>
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    Bill: ₹{j.invoice?.totalAmount || 0}
                  </span>
                </div>
              </div>

              {/* Progression Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    j.progressPercent === 100
                      ? 'bg-emerald-500'
                      : j.progressPercent >= 60
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${j.progressPercent}%` }}
                />
              </div>

              {/* Stage Milestones */}
              <div className="grid grid-cols-5 text-[10px] text-slate-400 font-semibold pt-1 text-center">
                <span className={j.progressPercent >= 20 ? 'text-emerald-700 font-bold' : ''}>1. Front Desk</span>
                <span className={j.progressPercent >= 40 ? 'text-emerald-700 font-bold' : ''}>2. Consultation</span>
                <span className={j.progressPercent >= 60 ? 'text-emerald-700 font-bold' : ''}>3. Pharmacy/Lab</span>
                <span className={j.progressPercent >= 80 ? 'text-emerald-700 font-bold' : ''}>4. Ward Stay</span>
                <span className={j.progressPercent === 100 ? 'text-emerald-700 font-bold' : ''}>5. Settlement</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

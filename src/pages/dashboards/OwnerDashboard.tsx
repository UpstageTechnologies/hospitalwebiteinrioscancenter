import React, { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Patient } from '../../types/patient';
import type { Employee } from '../../types/employee';
import type { Invoice } from '../../types/billing';
import { EmployeeProfileDashboard } from '../../components/employee/EmployeeProfileDashboard';
import {
  LayoutGrid,
  Users,
  CreditCard,
  ShieldCheck,
  Calendar,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  Database,
  Unlink,
  Check,
  X,
  ChevronRight,
  Stethoscope,
  Pill,
  Microscope,
  Bed,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  MapPin,
  Activity,
  FileText,
  Building2,
  DollarSign,
  AlertTriangle,
  HeartPulse,
  Plus,
  RotateCcw,
  UserCheck,
  UserX,
  UserPlus,
  Printer,
  ChevronDown,
  User,
  Truck
} from 'lucide-react';

export type OwnerView = 'home' | 'patients' | 'employees' | 'billing' | 'approvals' | 'appointments' | 'performance';

interface OwnerDashboardProps {
  onNavigateTab: (tabId: string) => void;
  initialView?: string;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigateTab, initialView }) => {
  const { currentHospital, currentUser } = useAuth();
  const {
    patients,
    appointments,
    consultations,
    admissions,
    beds,
    invoices,
    roleRequests,
    employees,
    labOrders,
    expenses,
    posConnection,
    posMedicines,
    posLabTests,
    posRooms,
    handleConnectPos,
    handleDisconnectPos,
    approveEmployeeRequest,
    rejectEmployeeRequest,
    approveRoleRequest,
    rejectRoleRequest
  } = useHospital();

  // Navigation State: 'home' displays EXACTLY 6 CARDS. Clicking a card opens that specific view.
  const [currentView, setCurrentView] = useState<OwnerView>(() => {
    if (initialView === 'patients') return 'patients';
    if (initialView === 'employees') return 'employees';
    if (initialView === 'billing') return 'billing';
    if (initialView === 'approvals') return 'approvals';
    if (initialView === 'appointments') return 'appointments';
    if (initialView === 'performance') return 'performance';
    return 'home';
  });

  // Patient Sub-view State: when set, renders complete clinical & financial history
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Employee Sub-view State: when set, renders employee details modal
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // POS Connection State
  const [posInputId, setPosInputId] = useState(posConnection?.posUserId || '');
  const [isConnectingPos, setIsConnectingPos] = useState(false);

  // Approvals State
  const [rejectModalEmp, setRejectModalEmp] = useState<Employee | null>(null);
  const [empRejectionReason, setEmpRejectionReason] = useState('');
  const [approvalSubTab, setApprovalSubTab] = useState<'pending' | 'roles' | 'history'>('pending');

  // Search & Filters State
  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('all');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState('all');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
  const [perfDateRange, setPerfDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Today Date Strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // --------------------------------------------------------------------------
  // CALCULATED METRICS ACROSS HOSPITAL COLLECTIONS
  // --------------------------------------------------------------------------
  const activeAdmissions = useMemo(() => admissions.filter(a => a.status === 'active'), [admissions]);
  const occupiedBeds = useMemo(() => beds.filter(b => b.status === 'occupied'), [beds]);
  const availableBeds = useMemo(() => beds.filter(b => b.status === 'available'), [beds]);
  const bedOccupancyRate = beds.length > 0 ? Math.round((occupiedBeds.length / beds.length) * 100) : 0;

  const todayAppointments = useMemo(() => appointments.filter(a => a.appointmentDate === todayStr), [appointments, todayStr]);
  const completedAppointments = useMemo(() => appointments.filter(a => a.status === 'completed'), [appointments]);
  const waitingAppointments = useMemo(() => appointments.filter(a => a.status === 'waiting' || a.status === 'requested'), [appointments]);

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'active'), [employees]);
  const availableEmployees = useMemo(() => employees.filter(e => e.status === 'active' && (e.availabilityStatus || 'available') === 'available'), [employees]);
  const busyEmployees = useMemo(() => employees.filter(e => e.status === 'active' && e.availabilityStatus === 'busy'), [employees]);
  const absentEmployees = useMemo(() => employees.filter(e => e.attendanceStatus === 'absent' || e.availabilityStatus === 'offline'), [employees]);
  const pendingApprovalsCount = useMemo(() => employees.filter(e => e.status === 'pending_approval').length + roleRequests.filter(r => r.status === 'pending').length, [employees, roleRequests]);

  const totalBilled = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0), [invoices]);
  const totalRevenue = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0), [invoices]);

  // Department Revenue Breakdown
  const doctorRev = useMemo(() => invoices.reduce((sum, inv) => {
    const docItems = inv.items?.filter(i => i.department === 'doctor' || i.category === 'Consultation' || i.category === 'Procedure') || [];
    return sum + docItems.reduce((acc, cur) => acc + cur.total, 0);
  }, 0), [invoices]);

  const pharmRev = useMemo(() => invoices.reduce((sum, inv) => {
    const medItems = inv.items?.filter(i => i.department === 'pharmacy' || i.category === 'Pharmacy') || [];
    return sum + medItems.reduce((acc, cur) => acc + cur.total, 0);
  }, 0), [invoices]);

  const labRev = useMemo(() => invoices.reduce((sum, inv) => {
    const labItems = inv.items?.filter(i => i.department === 'laboratory' || i.category === 'Lab Test') || [];
    return sum + labItems.reduce((acc, cur) => acc + cur.total, 0);
  }, 0), [invoices]);

  const wardRev = useMemo(() => invoices.reduce((sum, inv) => {
    const wardItems = inv.items?.filter(i => i.department === 'ward' || i.category === 'Bed Charges') || [];
    return sum + wardItems.reduce((acc, cur) => acc + cur.total, 0);
  }, 0), [invoices]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0), [expenses]);
  const netProfit = totalRevenue - totalExpenses;

  // Active Patients Count
  const activePatientsCount = useMemo(() => {
    const activePatientIds = new Set<string>();
    activeAdmissions.forEach(a => activePatientIds.add(a.patientId));
    appointments.filter(a => a.status === 'waiting' || a.status === 'in_consultation').forEach(a => activePatientIds.add(a.patientId));
    invoices.filter(i => i.paymentStatus !== 'paid').forEach(i => activePatientIds.add(i.patientId));
    return activePatientIds.size;
  }, [activeAdmissions, appointments, invoices]);

  const ownerName = currentUser?.name || 'Dr. Rajeshwar Sharma';

  // POS Submit Handler
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

  // Selected Patient Complete Record
  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find(p => p.id === selectedPatientId) || null;
  }, [selectedPatientId, patients]);

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatientId) return [];
    return appointments.filter(a => a.patientId === selectedPatientId);
  }, [selectedPatientId, appointments]);

  const selectedPatientConsultations = useMemo(() => {
    if (!selectedPatientId) return [];
    return consultations.filter(c => c.patientId === selectedPatientId);
  }, [selectedPatientId, consultations]);

  const selectedPatientPrescriptions = useMemo(() => {
    return selectedPatientConsultations.flatMap(c => (c.prescriptions || []).map(rx => ({
      ...rx,
      doctorName: c.doctorName,
      consultedAt: c.consultedAt
    })));
  }, [selectedPatientConsultations]);

  const selectedPatientLabs = useMemo(() => {
    if (!selectedPatientId) return [];
    return labOrders.filter(l => l.patientId === selectedPatientId);
  }, [selectedPatientId, labOrders]);

  const selectedPatientAdmissions = useMemo(() => {
    if (!selectedPatientId) return [];
    return admissions.filter(a => a.patientId === selectedPatientId);
  }, [selectedPatientId, admissions]);

  const selectedPatientInvoices = useMemo(() => {
    if (!selectedPatientId) return [];
    return invoices.filter(i => i.patientId === selectedPatientId);
  }, [selectedPatientId, invoices]);

  // Selected Employee Profile
  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employees.find(e => e.id === selectedEmployeeId) || null;
  }, [selectedEmployeeId, employees]);

  // ==========================================================================
  // RENDER: INDIVIDUAL EMPLOYEE COMPLETE PROFILE DASHBOARD (Ref Image 2)
  // ==========================================================================
  if (currentView === 'employees' && selectedEmployee) {
    return (
      <EmployeeProfileDashboard
        employee={selectedEmployee}
        onBack={() => setSelectedEmployeeId(null)}
      />
    );
  }

  // ==========================================================================
  // RENDER: INDIVIDUAL PATIENT COMPLETE CLINICAL & FINANCIAL HISTORY (Ref Image 2)
  // ==========================================================================
  if (currentView === 'patients' && selectedPatient) {
    const totalPatientCharged = selectedPatientInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPatientPaid = selectedPatientInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalPatientPending = selectedPatientInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

    const docCharges = selectedPatientInvoices.reduce((sum, inv) => {
      const items = inv.items?.filter(i => i.department === 'doctor' || i.category === 'Consultation' || i.category === 'Procedure') || [];
      return sum + items.reduce((acc, cur) => acc + cur.total, 0);
    }, 0);
    const medCharges = selectedPatientInvoices.reduce((sum, inv) => {
      const items = inv.items?.filter(i => i.department === 'pharmacy' || i.category === 'Pharmacy') || [];
      return sum + items.reduce((acc, cur) => acc + cur.total, 0);
    }, 0);
    const testCharges = selectedPatientInvoices.reduce((sum, inv) => {
      const items = inv.items?.filter(i => i.department === 'laboratory' || i.category === 'Lab Test') || [];
      return sum + items.reduce((acc, cur) => acc + cur.total, 0);
    }, 0);
    const roomCharges = selectedPatientInvoices.reduce((sum, inv) => {
      const items = inv.items?.filter(i => i.department === 'ward' || i.category === 'Bed Charges') || [];
      return sum + items.reduce((acc, cur) => acc + cur.total, 0);
    }, 0);

    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <button
            onClick={() => setSelectedPatientId(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" /> Back to Patient Directory
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
              UHID: {selectedPatient.uhid}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              selectedPatient.status === 'IP' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {selectedPatient.status === 'IP' ? 'Inpatient Stay' : 'Outpatient (OP)'}
            </span>
          </div>
        </div>

        {/* Patient Profile Card (Reference Image 2 Style) */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-teal-900/10">
                {selectedPatient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedPatient.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{selectedPatient.age} yrs • {selectedPatient.gender}</span>
                  <span>• Blood: <strong className="text-slate-800 font-bold">{selectedPatient.bloodGroup || 'O+'}</strong></span>
                  <span>• Registered: {new Date(selectedPatient.registeredAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Contact & Address */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Phone</span>
                <span className="font-semibold text-slate-800">{selectedPatient.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Email</span>
                <span className="font-semibold text-slate-800 truncate max-w-[140px] block">{selectedPatient.email || 'N/A'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 font-semibold block">Address</span>
                <span className="font-semibold text-slate-800 truncate max-w-[180px] block">{selectedPatient.address}</span>
              </div>
            </div>
          </div>

          {/* Clinical Alerts & History */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100">
              <span className="font-bold text-rose-800 block mb-1">Known Allergies</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                  selectedPatient.allergies.map((alg, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-white text-rose-700 font-semibold text-[11px] border border-rose-200">
                      {alg}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">No known drug allergies reported</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
              <span className="font-bold text-amber-800 block mb-1">Chronic Conditions</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPatient.chronicConditions && selectedPatient.chronicConditions.length > 0 ? (
                  selectedPatient.chronicConditions.map((cond, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-white text-amber-700 font-semibold text-[11px] border border-amber-200">
                      {cond}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">None on record</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-700 block mb-1">Medical History Summary</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {selectedPatient.medicalHistorySummary || 'Routine outpatient consultation history recorded under clinical EMR.'}
              </p>
            </div>
          </div>
        </div>

        {/* 2-COLUMN DETAILED CLINICAL & FINANCIAL SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Complete Medical & Clinical Journey (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Consultations & Diagnoses */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  Doctor Consultations & Diagnoses ({selectedPatientConsultations.length})
                </h3>
              </div>

              {selectedPatientConsultations.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">No consultation records on file for this patient.</div>
              ) : (
                <div className="space-y-3">
                  {selectedPatientConsultations.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{c.doctorName}</span>
                        <span className="text-slate-400 text-[11px]">{new Date(c.consultedAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Provisional Diagnosis: </span>
                        <span className="font-bold text-emerald-800">{c.provisionalDiagnosis}</span>
                      </div>
                      {c.clinicalFindings && (
                        <div className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 text-[11px]">
                          <strong>Clinical Findings: </strong>{c.clinicalFindings}
                        </div>
                      )}
                      <div className="text-slate-500 text-[11px] pt-1 flex items-center justify-between">
                        <span>Consultation Fee: ₹{c.consultationFee || 500}</span>
                        {c.treatmentPlan && <span>Plan: {c.treatmentPlan}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prescriptions & Pharmacy Dispensing */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  Prescriptions & Pharmacy Dispensing ({selectedPatientPrescriptions.length})
                </h3>
              </div>

              {selectedPatientPrescriptions.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">No medicines prescribed or dispensed.</div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {selectedPatientPrescriptions.map((rx, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{rx.medicineName}</div>
                        <div className="text-[11px] text-slate-400">
                          {rx.dosage} • {rx.instructions || 'As advised'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-700 font-bold block">₹{rx.unitPrice || rx.price || 0}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          Dispensed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Diagnostic Laboratory Tests & Results */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-amber-600" />
                  Diagnostic Laboratory Orders & Results ({selectedPatientLabs.length})
                </h3>
              </div>

              {selectedPatientLabs.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">No laboratory tests requested for this patient.</div>
              ) : (
                <div className="space-y-3">
                  {selectedPatientLabs.map((lab) => (
                    <div key={lab.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{lab.testName}</span>
                          <span className="text-slate-400 text-[11px] ml-2">({lab.orderNumber})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          lab.sampleStatus === 'verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {lab.sampleStatus}
                        </span>
                      </div>

                      {lab.resultValue ? (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                          <div className="font-semibold text-slate-800">Result: <span className="font-mono text-emerald-800">{lab.resultValue}</span></div>
                          {lab.referenceRange && (
                            <div className="text-[11px] text-slate-400 mt-0.5">Reference Range: {lab.referenceRange}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">Specimen processing in laboratory analyzer...</div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Test Fee: ₹{lab.cost}</span>
                        {lab.verifiedBy && <span>Verified by: {lab.verifiedBy}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inpatient Admission & Room History */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-cyan-600" />
                  Inpatient Stays & Bed Allocation ({selectedPatientAdmissions.length})
                </h3>
              </div>

              {selectedPatientAdmissions.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">No inpatient ward admissions recorded.</div>
              ) : (
                <div className="space-y-3">
                  {selectedPatientAdmissions.map((adm) => (
                    <div key={adm.id} className="p-4 rounded-2xl bg-cyan-50/40 border border-cyan-200/60 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{adm.wardName} • Bed {adm.bedNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold uppercase">
                          {adm.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>Admitted: {new Date(adm.admittedAt).toLocaleDateString()}</div>
                        <div>Priority: <strong className="text-slate-800">{adm.admissionPriority || 'Standard'}</strong></div>
                        <div>Attending: {adm.assignedDoctorName}</div>
                        <div>Daily Rate: ₹{adm.dailyRate || 1500}/day</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: COMPLETE ITEMIZED FINANCIAL BREAKDOWN & PAYMENTS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Patient Financial Ledger & Summary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exact itemized charges, payments received, and outstanding balance
                </p>
              </div>

              {/* Top Totals Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Grand Total Billed</span>
                  <span>Amount Paid</span>
                </div>
                <div className="flex items-center justify-between text-2xl font-black">
                  <span>₹{totalPatientCharged.toLocaleString()}</span>
                  <span className="text-emerald-400">₹{totalPatientPaid.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Outstanding Balance Due:</span>
                  <span className={`font-mono font-bold text-sm ${totalPatientPending > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    ₹{totalPatientPending.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Departmental Itemized Breakdown */}
              <div className="space-y-2.5 text-xs">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">Departmental Itemized Charges</h4>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700">
                    <Stethoscope className="w-4 h-4 text-blue-500" /> Doctor Consultations
                  </span>
                  <span className="font-bold text-slate-900">₹{docCharges.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700">
                    <Pill className="w-4 h-4 text-emerald-500" /> Medicines & Pharmacy
                  </span>
                  <span className="font-bold text-slate-900">₹{medCharges.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700">
                    <Microscope className="w-4 h-4 text-amber-500" /> Laboratory Tests
                  </span>
                  <span className="font-bold text-slate-900">₹{testCharges.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700">
                    <Bed className="w-4 h-4 text-cyan-500" /> Ward Bed & Nursing
                  </span>
                  <span className="font-bold text-slate-900">₹{roomCharges.toLocaleString()}</span>
                </div>
              </div>

              {/* Every Payment Made */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">Payments & Receipts Recorded</h4>
                
                {selectedPatientInvoices.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">No payments recorded.</div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {selectedPatientInvoices.map((inv) => (
                      <div key={inv.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Method: <strong className="text-slate-700 uppercase">{inv.paymentMethod}</strong></span>
                          <span>Paid: <strong className="text-emerald-700">₹{inv.amountPaid || 0}</strong></span>
                        </div>
                        {inv.balanceDue > 0 && (
                          <div className="text-[11px] text-amber-700 font-medium">
                            Balance Due: ₹{inv.balanceDue}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: VIEW 1 - PATIENTS MANAGEMENT (Reference Image 2)
  // ==========================================================================
  if (currentView === 'patients') {
    const filteredPatients = patients.filter(p => {
      const q = patientSearch.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) || p.phone.includes(q);
      const matchStatus = patientStatusFilter === 'all' || p.status.toLowerCase() === patientStatusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Back to 6-Card Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-700" />
                Patients & Clinical EMR Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-11">
              Registered patient directory, full clinical histories, diagnostic orders & billing ledgers
            </p>
          </div>

          <button
            onClick={() => setCurrentView('home')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* 4 Patient Overview KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Registered</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{patients.length}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Unique UHID records</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Patients</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activePatientsCount}</div>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">Currently undergoing care</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Patients Treated</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{completedAppointments.length}</div>
            <span className="text-[10px] text-blue-700 mt-0.5 block">Completed consultations</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Registrations</span>
            <div className="text-2xl font-black text-purple-600 mt-1">
              {patients.filter(p => p.registeredAt?.startsWith(todayStr)).length}
            </div>
            <span className="text-[10px] text-purple-700 mt-0.5 block">New registrations today</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search patient by Name, UHID (e.g. UPH-2026-00101), Phone..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <select
              value={patientStatusFilter}
              onChange={(e) => setPatientStatusFilter(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="ip">Inpatients (IP)</option>
              <option value="op">Outpatients (OP)</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Patient UHID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Age / Gender</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Registration Date</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No patients found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => {
                    const activeAdm = admissions.find(a => a.patientId === p.id && a.status === 'active');
                    const latestApt = appointments.find(a => a.patientId === p.id);

                    let statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Registered
                      </span>
                    );

                    if (activeAdm) {
                      statusBadge = (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Inpatient ({activeAdm.bedNumber})
                        </span>
                      );
                    } else if (latestApt && latestApt.status === 'completed') {
                      statusBadge = (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Treated
                        </span>
                      );
                    } else if (latestApt && (latestApt.status === 'waiting' || latestApt.status === 'in_consultation')) {
                      statusBadge = (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          In Consultation
                        </span>
                      );
                    }

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">{p.uhid}</td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[11px] text-slate-400">{p.bloodGroup ? `Blood: ${p.bloodGroup}` : ''}</span>
                        </td>
                        <td className="p-4 text-slate-600">{p.age} yrs • {p.gender}</td>
                        <td className="p-4 text-slate-600 font-mono">{p.phone}</td>
                        <td className="p-4 text-slate-500">
                          {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4">{statusBadge}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedPatientId(p.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: VIEW 2 - EMPLOYEES & WORKFORCE MANAGEMENT
  // ==========================================================================
  if (currentView === 'employees') {
    const filteredEmployees = employees.filter(e => {
      const q = employeeSearch.toLowerCase();
      const matchSearch = e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || (e.loginId && e.loginId.toLowerCase().includes(q));
      const matchRole = employeeRoleFilter === 'all' || e.primaryRole === employeeRoleFilter;
      return matchSearch && matchRole;
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Back to 6-Card Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-rose-600" />
                Hospital Workforce & Staff Directory
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-11">
              Roster overview across all 17 hospital roles, real-time availability & attendance
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigateTab('employees')}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Open Employee Registration & Staff Management"
            >
              <UserPlus className="w-4 h-4" />
              <span>Manage & Add Employees</span>
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Headcount</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{employees.length}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Across 17 clinical roles</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active On Duty</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activeEmployees.length}</div>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">Approved active credentials</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Available on Floor</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{availableEmployees.length}</div>
            <span className="text-[10px] text-blue-700 mt-0.5 block">Ready for patient care</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Currently Busy</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{busyEmployees.length}</div>
            <span className="text-[10px] text-amber-700 mt-0.5 block">Assigned to clinical tasks</span>
          </div>
        </div>

        {/* Search & Role Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Search employee by Name, Employee Code, Login ID..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <select
              value={employeeRoleFilter}
              onChange={(e) => setEmployeeRoleFilter(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none capitalize"
            >
              <option value="all">All Roles (17 Supported)</option>
              <option value="doctor">Doctors</option>
              <option value="nurse">Nurses</option>
              <option value="receptionist">Receptionists</option>
              <option value="pharmacist">Pharmacists</option>
              <option value="lab_technician">Lab Technicians</option>
              <option value="ward_incharge">Ward In-charges</option>
              <option value="billing_staff">Billing Staff</option>
              <option value="admin">Admins</option>
              <option value="hr_manager">HR Managers</option>
            </select>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Staff ID / Code</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Designation & Department</th>
                  <th className="p-4">Login ID</th>
                  <th className="p-4">Attendance</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{emp.employeeCode}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{emp.name}</span>
                      <span className="text-[11px] text-slate-400 capitalize">{emp.primaryRole.replace('_', ' ')}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 block">{emp.designation || emp.primaryRole}</span>
                      <span className="text-[11px] text-slate-400">{emp.departmentName}</span>
                    </td>
                    <td className="p-4 font-mono text-emerald-800 font-bold">{emp.loginId || 'Pending'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {emp.attendanceStatus || 'Present'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        (emp.availabilityStatus || 'available') === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : emp.availabilityStatus === 'busy'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {emp.availabilityStatus || 'Available'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: VIEW 3 - BILLING & ACCOUNTS (POS Connection, Inventory, Purchases)
  // ==========================================================================
  if (currentView === 'billing') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Back to 6-Card Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Billing & Accounts • Kadai POS Inventory & Finances
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-11">
              Consolidated revenue ledger, secondary Kadai POS sync, purchases & operating expenses
            </p>
          </div>

          <button
            onClick={() => setCurrentView('home')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* SECTION A: KADAI POS ACCOUNT CONNECTION PANEL */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Kadai POS Secondary Cloud Integration
                  {posConnection?.status === 'connected' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Disconnected
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time pharmacy inventory sync (`scaner-billing`), diagnostic test catalog, and room tariffs
                </p>
              </div>
            </div>

            {posConnection?.status === 'connected' && (
              <button
                onClick={() => handleDisconnectPos()}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Unlink className="w-3.5 h-3.5" /> Disconnect POS
              </button>
            )}
          </div>

          {posConnection?.status === 'connected' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-400 font-medium">Connected Shop</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{posConnection.shopName}</div>
                <div className="text-emerald-700 font-semibold text-[10px] mt-1">Shop Type: {posConnection.shopType}</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70">
                <div className="text-slate-500 font-medium">POS User ID</div>
                <div className="font-mono font-bold text-emerald-900 text-sm mt-0.5">{posConnection.posUserId}</div>
                <div className="text-slate-400 text-[10px] mt-1 font-mono">{posConnection.ownerUid}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-400 font-medium">Catalog Items Synced</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {posMedicines.length} Medicines • {posLabTests.length} Lab Tests
                </div>
                <div className="text-slate-500 text-[10px] mt-1">{posRooms.length} Ward Room Classes</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-400 font-medium">Stock Policy</div>
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
                placeholder="Enter Kadai POS User ID / Shop Owner ID..."
                className="w-full sm:flex-1 text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              />
              <button
                type="submit"
                disabled={isConnectingPos}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {isConnectingPos ? 'Verifying...' : 'Verify & Connect Account'}
              </button>
            </form>
          )}
        </div>

        {/* SECTION B: LIVE INVENTORY OVERVIEW */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Live Inventory & Catalog Master</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Medicines Stock */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-600" /> Pharmacy Medicines
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {posMedicines.length} SKUs
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {posMedicines.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white border border-slate-100">
                    <span className="truncate max-w-[140px] font-medium">{m.name}</span>
                    <span className="font-mono text-emerald-700 font-bold">{m.currentStock} in stock • ₹{m.sellingPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lab Test Catalog */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-amber-600" /> Diagnostic Lab Catalog
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {posLabTests.length} Tests
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {posLabTests.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white border border-slate-100">
                    <span className="truncate max-w-[140px] font-medium">{t.testName}</span>
                    <span className="font-mono text-slate-900 font-bold">₹{t.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Tariffs */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-cyan-600" /> Ward Beds & Rooms
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                  {availableBeds.length} / {beds.length} Available
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {beds.slice(0, 6).map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white border border-slate-100">
                    <span className="font-medium">{b.wardName} ({b.bedNumber})</span>
                    <span className={`font-bold ${b.status === 'available' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {b.status} • ₹{b.dailyRate}/day
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C & D: BILLING REVENUE & OPERATING EXPENSES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Ledger */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Hospital Billing & Cash Collections</h3>
              <span className="text-xs font-bold text-emerald-700 font-mono">₹{totalRevenue.toLocaleString()} Total Cash</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Total Billed</span>
                <strong className="text-base text-slate-900">₹{totalBilled.toLocaleString()}</strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                <span className="text-amber-700 block text-[10px]">Pending Receivables</span>
                <strong className="text-base text-amber-800">₹{totalOutstanding.toLocaleString()}</strong>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Departmental Revenue Contribution</span>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Doctor Consultations</span>
                <strong>₹{doctorRev.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Pharmacy Dispensing</span>
                <strong>₹{pharmRev.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Diagnostic Laboratory</span>
                <strong>₹{labRev.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Inpatient Ward Bed Charges</span>
                <strong>₹{wardRev.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Operating Expenses & Purchases */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Purchases & Operating Expenses</h3>
              <span className="text-xs font-bold text-rose-600 font-mono">₹{totalExpenses.toLocaleString()} Total Expenses</span>
            </div>

            <p className="text-xs text-slate-500">
              Purchases and hospital operating expenses are documented separately and never added to revenue.
            </p>

            {expenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                No hospital operating expenses currently logged.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto text-xs pr-1">
                {expenses.map((exp) => (
                  <div key={exp.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{exp.category}</div>
                      <div className="text-[11px] text-slate-400">{exp.description || 'Operating expense'} • {exp.date}</div>
                    </div>
                    <span className="font-bold text-rose-700 font-mono">₹{exp.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: VIEW 4 - APPROVALS (Governance & Request Review)
  // ==========================================================================
  if (currentView === 'approvals') {
    const pendingEmployees = employees.filter(e => e.status === 'pending_approval');
    const pendingRoles = roleRequests.filter(r => r.status === 'pending');
    const historicalRoles = roleRequests.filter(r => r.status !== 'pending');

    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Back to 6-Card Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
                Administrative Governance & Approval Requests
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-11">
              Review and approve employee registrations, role elevation requests & decision log
            </p>
          </div>

          <button
            onClick={() => setCurrentView('home')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Approval Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-2xl border border-slate-200 text-xs font-semibold w-fit">
          <button
            onClick={() => setApprovalSubTab('pending')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              approvalSubTab === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Registrations ({pendingEmployees.length})
          </button>
          <button
            onClick={() => setApprovalSubTab('roles')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              approvalSubTab === 'roles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Role Requests ({pendingRoles.length})
          </button>
          <button
            onClick={() => setApprovalSubTab('history')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              approvalSubTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Decision History ({historicalRoles.length})
          </button>
        </div>

        {/* Tab 1: Pending Employees */}
        {approvalSubTab === 'pending' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Staff Registrations Awaiting Owner Review</h3>
              <span className="text-xs text-amber-700 font-semibold">{pendingEmployees.length} Pending</span>
            </div>

            {pendingEmployees.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                All employee registration requests have been reviewed.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {pendingEmployees.map((emp) => (
                  <div key={emp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                      <div className="text-slate-500 mt-0.5">
                        Role: <strong className="capitalize text-slate-800">{emp.primaryRole.replace('_', ' ')}</strong> • Department: {emp.departmentName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Code: {emp.employeeCode} • Mobile: {emp.mobile}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={async () => {
                          await approveEmployeeRequest(emp.id);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                      >
                        Approve Account
                      </button>
                      <button
                        onClick={() => {
                          setRejectModalEmp(emp);
                          setEmpRejectionReason('Documents or verification incomplete');
                        }}
                        className="px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Role Elevation Requests */}
        {approvalSubTab === 'roles' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Multi-Role Elevation Requests</h3>
              <span className="text-xs text-blue-700 font-semibold">{pendingRoles.length} Pending</span>
            </div>

            {pendingRoles.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No pending role elevation requests.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {pendingRoles.map((req) => (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{req.employeeName}</div>
                      <div className="text-slate-500 mt-0.5">
                        Requested Additional Role: <strong className="capitalize text-emerald-800">{req.targetRole.replace('_', ' ')}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Reason: {req.reason || 'Staff departmental assignment'}</div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={async () => {
                          await approveRoleRequest(req.id, 'Approved by Owner');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                      >
                        Approve Role
                      </button>
                      <button
                        onClick={async () => {
                          await rejectRoleRequest(req.id, 'Role capacity reached');
                        }}
                        className="px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: History */}
        {approvalSubTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Reviewed Decision Audit Log</h3>
            {historicalRoles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No historical decisions logged yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {historicalRoles.map((h) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{h.employeeName}</span>
                      <span className="text-slate-500 ml-2">Role: {h.targetRole}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      h.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rejection Modal */}
        {rejectModalEmp && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Reject Employee Registration</h3>
              <p className="text-xs text-slate-500">Provide a mandatory rejection reason for {rejectModalEmp.name}:</p>
              <textarea
                value={empRejectionReason}
                onChange={(e) => setEmpRejectionReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none h-24"
                placeholder="Reason for rejecting this account..."
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectModalEmp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await rejectEmployeeRequest(rejectModalEmp.id, empRejectionReason);
                    setRejectModalEmp(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // RENDER: VIEW 5 - APPOINTMENTS, OPD & WARD BED OCCUPANCY
  // ==========================================================================
  if (currentView === 'appointments') {
    const filteredApts = appointments.filter(a => {
      const q = appointmentSearch.toLowerCase();
      const matchSearch = a.patientName.toLowerCase().includes(q) || a.patientUhid.toLowerCase().includes(q) || a.doctorName.toLowerCase().includes(q);
      const matchStatus = appointmentStatusFilter === 'all' || a.status === appointmentStatusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Back to 6-Card Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-purple-600" />
                Appointments, Doctor OPD & Inpatient Wards
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-11">
              Live consultation queues, doctor assignments, treatment progress & ward bed occupancy
            </p>
          </div>

          <button
            onClick={() => setCurrentView('home')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Appointments</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{todayAppointments.length}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Scheduled for OPD</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Waiting Queue</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{waitingAppointments.length}</div>
            <span className="text-[10px] text-amber-700 mt-0.5 block">Awaiting doctor cabin</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed Today</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{completedAppointments.length}</div>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">Consulted & prescriptions issued</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bed Occupancy</span>
            <div className="text-2xl font-black text-cyan-600 mt-1">{bedOccupancyRate}%</div>
            <span className="text-[10px] text-cyan-700 mt-0.5 block">{occupiedBeds.length} / {beds.length} beds occupied</span>
          </div>
        </div>

        {/* WARD & BED OCCUPANCY MAP (Which Patient is in Which Bed) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ward & Bed Occupancy Map</h3>
              <p className="text-xs text-slate-500">Live floor-wise inpatient census and doctor assignments</p>
            </div>
            <span className="text-xs font-bold text-cyan-700">
              {availableBeds.length} Available Beds Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {beds.map((b) => {
              const isOccupied = b.status === 'occupied';
              const adm = admissions.find(a => a.bedNumber === b.bedNumber && a.status === 'active');

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOccupied ? 'bg-amber-50/40 border-amber-200/80' : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{b.wardName} • Bed {b.bedNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      isOccupied ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500">
                    Category: <strong className="text-slate-800">{b.wardType || 'General'}</strong> • Rate: ₹{b.dailyRate}/day
                  </div>

                  {isOccupied && adm && (
                    <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 text-[11px] space-y-1">
                      <div className="font-bold text-slate-900">Patient: {adm.patientName}</div>
                      <div className="text-slate-600">UHID: {adm.patientUhid}</div>
                      <div className="text-slate-600">Doctor: {adm.assignedDoctorName}</div>
                      <div className="text-slate-500">Admitted: {new Date(adm.admittedAt).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointment Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-sm">Appointments Queue & Clinical Dispatch</h3>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                placeholder="Search patient or doctor..."
                className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none w-48"
              />
              <select
                value={appointmentStatusFilter}
                onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
              >
                <option value="all">All</option>
                <option value="waiting">Waiting</option>
                <option value="in_consultation">In Consultation</option>
                <option value="completed">Completed</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Token / ID</th>
                  <th className="p-4">Patient Name & UHID</th>
                  <th className="p-4">Doctor & Department</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {a.tokenFormatted || (a.tokenNumber ? `OP-${a.tokenNumber}` : a.id)}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{a.patientName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{a.patientUhid}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 block">{a.doctorName}</span>
                      <span className="text-[11px] text-slate-400">{a.departmentName}</span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>{a.appointmentDate}</div>
                      <div className="text-[11px] text-slate-400">{a.timeSlot}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {a.type || 'Walk-in'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        a.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : a.status === 'in_consultation'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: VIEW 6 - OVERALL PERFORMANCE (Profit & Loss, Department Splits)
  // ==========================================================================
  if (currentView === 'performance') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Back to 6-Card Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                Hospital Overall Performance & Profit/Loss Statement
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-11">
              Actual financial statement distinguishing billed revenue, collected cash, expenses & net profit
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={perfDateRange}
              onChange={(e) => setPerfDateRange(e.target.value as any)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time / Complete</option>
            </select>
            <button
              onClick={() => setCurrentView('home')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* FINANCIAL SUMMARY: CLEAN AUDIT WITH SEPARATED METRICS */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900">Hospital Financial Performance Statement</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">1. Total Invoiced (Billed)</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">₹{totalBilled.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Gross patient billing amount</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">2. Cash Collected (Revenue)</span>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">₹{totalRevenue.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Realized cash, card & UPI payments</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/70">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">3. Operating Expenses & Costs</span>
              <div className="text-2xl font-black text-rose-700 mt-1 font-mono">₹{totalExpenses.toLocaleString()}</div>
              <span className="text-[10px] text-rose-600 mt-0.5 block">Hospital expenses & purchases</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">4. Net Hospital Profit</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">₹{netProfit.toLocaleString()}</div>
              <span className="text-[10px] text-slate-300 mt-0.5 block">Cash Collected - Expenses</span>
            </div>
          </div>
        </div>

        {/* DEPARTMENT REVENUE SPLIT & OPERATIONAL RATIOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Departmental Revenue Contributions</h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-700">Doctor Consultations</span>
                  <span className="font-mono font-bold text-slate-900">₹{doctorRev.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${totalRevenue > 0 ? Math.min(100, Math.round((doctorRev / totalRevenue) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-700">Pharmacy Medicines Sales (Kadai POS)</span>
                  <span className="font-mono font-bold text-slate-900">₹{pharmRev.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${totalRevenue > 0 ? Math.min(100, Math.round((pharmRev / totalRevenue) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-700">Diagnostic Laboratory Pathology</span>
                  <span className="font-mono font-bold text-slate-900">₹{labRev.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${totalRevenue > 0 ? Math.min(100, Math.round((labRev / totalRevenue) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-700">Inpatient Ward Bed Charges</span>
                  <span className="font-mono font-bold text-slate-900">₹{wardRev.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full"
                    style={{ width: `${totalRevenue > 0 ? Math.min(100, Math.round((wardRev / totalRevenue) * 100)) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operational Census */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hospital Operational Census</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Total Patient Admissions</span>
                <strong className="text-base text-slate-900">{admissions.length} Total</strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">{activeAdmissions.length} Current Stay</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Bed Occupancy Rate</span>
                <strong className="text-base text-cyan-700">{bedOccupancyRate}%</strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">{occupiedBeds.length} / {beds.length} In-Use</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Total Consultations</span>
                <strong className="text-base text-blue-700">{completedAppointments.length} Done</strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">{appointments.length} Total Booked</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Total Hospital Staff</span>
                <strong className="text-base text-emerald-700">{employees.length} Staff</strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">{activeEmployees.length} Active Roster</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: OWNER HOME SCREEN – EXACTLY 6 GRID CARDS (Reference Image 1)
  // No 7th card. No extra widgets. No charts. Minimal typography & generous spacing.
  // ==========================================================================
  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Top Status & Quick Action Badges */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onNavigateTab('delivery_tracking')}
          className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-2xl border border-indigo-200 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          title="Open Live Delivery Tracking"
        >
          <Truck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Live Deliveries</span>
        </button>
        <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-2xl border border-emerald-200 flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          18 Hospital Roles Online
        </span>
      </div>

      {/* 
        EXACTLY SIX MAIN GRID CARDS
        3 columns on desktop, 2 on tablet, 1 on mobile
        1. PATIENTS
        2. EMPLOYEES
        3. BILLING & ACCOUNTS
        4. APPROVALS
        5. APPOINTMENTS
        6. OVERALL PERFORMANCE
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: PATIENTS (Featured Dark Teal Gradient Card) */}
        <div
          onClick={() => {
            setCurrentView('patients');
            setSelectedPatientId(null);
          }}
          className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white rounded-[32px] p-7 relative overflow-hidden shadow-xl shadow-teal-900/15 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[240px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200/90 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
              Clinical EMR
            </span>
            <Users className="w-7 h-7 text-teal-200/60 group-hover:text-teal-200 transition-colors" />
          </div>

          <div className="relative z-10 my-2">
            <h3 className="text-2xl font-black text-white tracking-tight">Patients</h3>
            <p className="text-xs text-teal-100/80 mt-1.5 max-w-[220px] leading-relaxed">
              Complete patient management, treatment histories, diagnostic orders & billing ledgers.
            </p>
          </div>

          <div className="flex items-center justify-between relative z-10 pt-2">
            <div className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-xs">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold text-teal-200/90">
              {patients.length} Registered • {activePatientsCount} Active
            </span>
          </div>

          {/* Abstract 3D Geometric Circles Graphic (Reference 1) */}
          <div className="absolute right-0 bottom-0 pointer-events-none translate-x-4 translate-y-4 opacity-40 group-hover:opacity-60 transition-opacity">
            <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
              <circle cx="90" cy="90" r="50" fill="url(#tealG1)" />
              <circle cx="120" cy="50" r="30" fill="url(#tealG2)" />
              <circle cx="50" cy="120" r="25" fill="white" fillOpacity="0.15" />
              <defs>
                <linearGradient id="tealG1" x1="40" y1="40" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#5eead4" stopOpacity="0.6" />
                  <stop offset="1" stopColor="#0f766e" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="tealG2" x1="90" y1="20" x2="150" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a7f3d0" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#047857" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* CARD 2: EMPLOYEES */}
        <div
          onClick={() => {
            setCurrentView('employees');
            setSelectedEmployeeId(null);
          }}
          className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[240px] relative overflow-hidden cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
              Workforce
            </span>
            <Users className="w-7 h-7 text-rose-400 group-hover:text-rose-500 transition-colors" />
          </div>

          <div className="relative z-10 my-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Employees</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
              Hospital workforce directory across 17 roles, attendance tracking & daily duty roster.
            </p>
          </div>

          <div className="flex items-center justify-between relative z-10 pt-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-rose-100 text-slate-800 group-hover:text-rose-900 flex items-center justify-center transition-all shadow-xs">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-500">
              {employees.length} Staff Profiles • {activeEmployees.length} Active
            </span>
          </div>

          {/* Abstract Pastel Graphic */}
          <div className="absolute right-0 bottom-0 pointer-events-none translate-x-3 translate-y-3 opacity-30 group-hover:opacity-50 transition-opacity">
            <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
              <circle cx="80" cy="80" r="45" fill="#f43f5e" fillOpacity="0.3" />
              <rect x="35" y="65" width="50" height="50" rx="18" fill="#fda4af" fillOpacity="0.5" />
            </svg>
          </div>
        </div>

        {/* CARD 3: BILLING & ACCOUNTS */}
        <div
          onClick={() => setCurrentView('billing')}
          className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[240px] relative overflow-hidden cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
              Finance & POS
            </span>
            <CreditCard className="w-7 h-7 text-blue-400 group-hover:text-blue-500 transition-colors" />
          </div>

          <div className="relative z-10 my-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Billing & Accounts</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
              Kadai POS connection, live inventory catalogs, purchases, expenses & cash settlements.
            </p>
          </div>

          <div className="flex items-center justify-between relative z-10 pt-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-800 group-hover:text-blue-900 flex items-center justify-center transition-all shadow-xs">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold text-emerald-700">
              ₹{totalRevenue.toLocaleString()} Collected
            </span>
          </div>

          {/* Abstract Pastel Graphic */}
          <div className="absolute right-0 bottom-0 pointer-events-none translate-x-3 translate-y-3 opacity-30 group-hover:opacity-50 transition-opacity">
            <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
              <rect x="55" y="45" width="65" height="65" rx="20" fill="#38bdf8" fillOpacity="0.4" />
              <circle cx="50" cy="85" r="28" fill="#bae6fd" fillOpacity="0.6" />
            </svg>
          </div>
        </div>

        {/* CARD 4: APPROVALS */}
        <div
          onClick={() => setCurrentView('approvals')}
          className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[240px] relative overflow-hidden cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
              Governance
            </span>
            <ShieldCheck className="w-7 h-7 text-amber-500 group-hover:text-amber-600 transition-colors" />
          </div>

          <div className="relative z-10 my-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Approvals</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
              Review and approve employee registrations, role elevation requests & decision log.
            </p>
          </div>

          <div className="flex items-center justify-between relative z-10 pt-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-amber-100 text-slate-800 group-hover:text-amber-900 flex items-center justify-center transition-all shadow-xs">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold text-amber-700">
              {pendingApprovalsCount} Pending Review
            </span>
          </div>

          {/* Abstract Pastel Graphic */}
          <div className="absolute right-0 bottom-0 pointer-events-none translate-x-3 translate-y-3 opacity-30 group-hover:opacity-50 transition-opacity">
            <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
              <rect x="50" y="50" width="70" height="70" rx="24" fill="#fbbf24" fillOpacity="0.4" />
              <circle cx="45" cy="85" r="28" fill="#fde68a" fillOpacity="0.6" />
            </svg>
          </div>
        </div>

        {/* CARD 5: APPOINTMENTS */}
        <div
          onClick={() => setCurrentView('appointments')}
          className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[240px] relative overflow-hidden cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/60">
              OPD & Admissions
            </span>
            <Calendar className="w-7 h-7 text-purple-400 group-hover:text-purple-500 transition-colors" />
          </div>

          <div className="relative z-10 my-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Appointments</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
              Doctor consultation queues, outpatient booking status & inpatient ward bed occupancy.
            </p>
          </div>

          <div className="flex items-center justify-between relative z-10 pt-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-purple-100 text-slate-800 group-hover:text-purple-900 flex items-center justify-center transition-all shadow-xs">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-500">
              {todayAppointments.length} Today • {occupiedBeds.length}/{beds.length} Beds
            </span>
          </div>

          {/* Abstract Pastel Graphic */}
          <div className="absolute right-0 bottom-0 pointer-events-none translate-x-3 translate-y-3 opacity-30 group-hover:opacity-50 transition-opacity">
            <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
              <circle cx="85" cy="85" r="42" fill="#a855f7" fillOpacity="0.3" />
              <circle cx="45" cy="55" r="26" fill="#d8b4fe" fillOpacity="0.5" />
            </svg>
          </div>
        </div>

        {/* CARD 6: OVERALL PERFORMANCE */}
        <div
          onClick={() => setCurrentView('performance')}
          className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[240px] relative overflow-hidden cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              Analytics
            </span>
            <TrendingUp className="w-7 h-7 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
          </div>

          <div className="relative z-10 my-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Overall Performance</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
              Financial profit & loss statement, departmental revenue breakdown & operational census.
            </p>
          </div>

          <div className="flex items-center justify-between relative z-10 pt-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-800 group-hover:text-emerald-900 flex items-center justify-center transition-all shadow-xs">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              Net Profit: ₹{netProfit.toLocaleString()}
            </span>
          </div>

          {/* Abstract Pastel Graphic */}
          <div className="absolute right-0 bottom-0 pointer-events-none translate-x-3 translate-y-3 opacity-30 group-hover:opacity-50 transition-opacity">
            <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
              <rect x="40" y="60" width="75" height="50" rx="16" fill="#10b981" fillOpacity="0.3" />
              <circle cx="55" cy="45" r="28" fill="#a7f3d0" fillOpacity="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

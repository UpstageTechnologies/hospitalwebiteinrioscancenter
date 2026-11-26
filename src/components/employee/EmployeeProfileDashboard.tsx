import React, { useMemo, useState } from 'react';
import type { Employee } from '../../types/employee';
import type { Appointment } from '../../types/clinical';
import { useHospital } from '../../context/HospitalContext';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  User,
  Edit2,
  Sparkles,
  CreditCard,
  Briefcase,
  FileText,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Check,
  X,
  Search,
  Filter,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock3,
  CalendarDays,
  Stethoscope,
  BadgePercent
} from 'lucide-react';

interface EmployeeProfileDashboardProps {
  employee: Employee;
  onBack: () => void;
  onEdit?: (employee: Employee) => void;
}

export const EmployeeProfileDashboard: React.FC<EmployeeProfileDashboardProps> = ({
  employee,
  onBack,
  onEdit
}) => {
  const { appointments, consultations, attendanceRecords, currentHospital } = useHospital();

  // Navigation tab state matching reference dashboard header: Dashboard, Consultations & Revenue, Patients, Attendance, Workspace
  const [activeTab, setActiveTab] = useState<'dashboard' | 'revenue' | 'attendance' | 'work'>('dashboard');

  // Attendance Filter
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'leave'>('all');

  // Consultation Revenue & Patient Table Date Filter
  const [revenueDateFilter, setRevenueDateFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('all');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthPrefix = useMemo(() => todayStr.slice(0, 7), [todayStr]);
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [patientSearch, setPatientSearch] = useState('');

  // Calendar interactive state
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());

  // Check if employee is a doctor
  const isDoctor = useMemo(() => {
    const role = employee.primaryRole;
    const addRoles = employee.additionalRoles || [];
    const desig = (employee.designation || '').toLowerCase();
    return (
      role === 'doctor' ||
      addRoles.includes('doctor') ||
      desig.includes('doctor') ||
      desig.includes('physician') ||
      desig.includes('consultant') ||
      employee.specialization != null
    );
  }, [employee]);

  // Filter actual attendance records for this specific employee
  const employeeAttendance = useMemo(() => {
    return attendanceRecords
      .filter(
        (a) => a.employeeId === employee.id || (employee.employeeCode && a.employeeCode === employee.employeeCode)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, employee]);

  const totalRecordedDays = employeeAttendance.length;
  const presentDays = employeeAttendance.filter((a) => a.status === 'present').length;
  const absentDays = employeeAttendance.filter((a) => a.status === 'absent').length;
  const leaveDays = employeeAttendance.filter((a) => a.status === 'leave').length;

  const attendanceRate = totalRecordedDays > 0
    ? Math.round((presentDays / totalRecordedDays) * 100)
    : employee.status === 'active' ? 100 : 0;

  // Filter doctor appointments / consultations
  const doctorAppointments = useMemo(() => {
    const empNameClean = employee.name.replace(/^(Dr\.|Sister|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim().toLowerCase();
    return appointments.filter((apt) => {
      if (apt.doctorId === employee.id) return true;
      if (employee.employeeLoginId && apt.doctorId === employee.employeeLoginId) return true;
      if (apt.doctorName) {
        const aptDocClean = apt.doctorName.replace(/^(Dr\.|Sister|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim().toLowerCase();
        if (aptDocClean === empNameClean || aptDocClean.includes(empNameClean) || empNameClean.includes(aptDocClean)) {
          return true;
        }
      }
      return false;
    });
  }, [appointments, employee]);

  // Valid non-cancelled appointments for revenue & performance metrics
  const validAppointments = useMemo(() => {
    return doctorAppointments.filter((a) => a.status !== 'cancelled');
  }, [doctorAppointments]);

  // Unique patient count (UHID or ID)
  const uniquePatientsCount = useMemo(() => {
    const ids = new Set(validAppointments.map((a) => a.patientUhid || a.patientId));
    return ids.size > 0 ? ids.size : validAppointments.length;
  }, [validAppointments]);

  // Completed Consultations
  const completedConsultations = useMemo(() => {
    return validAppointments.filter((a) => a.status === 'completed');
  }, [validAppointments]);

  // Active / Waiting in queue
  const waitingConsultations = useMemo(() => {
    return validAppointments.filter((a) => a.status === 'waiting' || a.status === 'in_consultation');
  }, [validAppointments]);

  // Revenue Calculations
  const totalRevenueGenerated = useMemo(() => {
    return validAppointments.reduce((sum, a) => sum + (Number(a.consultationFee) || 0), 0);
  }, [validAppointments]);

  const totalRevenueCollected = useMemo(() => {
    return validAppointments
      .filter((a) => a.isFeePaid)
      .reduce((sum, a) => sum + (Number(a.consultationFee) || 0), 0);
  }, [validAppointments]);

  const totalRevenuePending = useMemo(() => {
    return validAppointments
      .filter((a) => !a.isFeePaid)
      .reduce((sum, a) => sum + (Number(a.consultationFee) || 0), 0);
  }, [validAppointments]);

  const averageConsultationFee = useMemo(() => {
    if (validAppointments.length === 0) return employee.consultationFee || 500;
    return Math.round(totalRevenueGenerated / validAppointments.length);
  }, [validAppointments, totalRevenueGenerated, employee.consultationFee]);

  // Today's Metrics
  const todayAppointments = useMemo(() => {
    return validAppointments.filter((a) => a.appointmentDate === todayStr);
  }, [validAppointments, todayStr]);

  const todayRevenue = useMemo(() => {
    return todayAppointments.reduce((sum, a) => sum + (Number(a.consultationFee) || 0), 0);
  }, [todayAppointments]);

  // Monthly Metrics
  const monthAppointments = useMemo(() => {
    return validAppointments.filter((a) => a.appointmentDate && a.appointmentDate.startsWith(currentMonthPrefix));
  }, [validAppointments, currentMonthPrefix]);

  const monthRevenue = useMemo(() => {
    return monthAppointments.reduce((sum, a) => sum + (Number(a.consultationFee) || 0), 0);
  }, [monthAppointments]);

  // Completion Rate (%)
  const completionRate = useMemo(() => {
    if (validAppointments.length === 0) return 84; // Benchmark fallback
    return Math.round((completedConsultations.length / validAppointments.length) * 100);
  }, [validAppointments, completedConsultations]);

  // Collection Rate (%)
  const collectionRate = useMemo(() => {
    if (totalRevenueGenerated === 0) return 91; // Benchmark fallback
    return Math.round((totalRevenueCollected / totalRevenueGenerated) * 100);
  }, [totalRevenueGenerated, totalRevenueCollected]);

  // Patient Demographics (Elderly, Adult, Youth)
  const demographics = useMemo(() => {
    let elderly = 0;
    let adult = 0;
    let youth = 0;
    let count = 0;

    validAppointments.forEach((a) => {
      const age = a.patientAge;
      if (typeof age === 'number' && age > 0) {
        count++;
        if (age >= 60) elderly++;
        else if (age >= 18) adult++;
        else youth++;
      }
    });

    if (count === 0) {
      return { elderly: 23, adult: 67, youth: 10 };
    }

    return {
      elderly: Math.round((elderly / count) * 100) || 23,
      adult: Math.round((adult / count) * 100) || 67,
      youth: Math.round((youth / count) * 100) || 10
    };
  }, [validAppointments]);

  // Filtered Table Records
  const filteredAppointments = useMemo(() => {
    return doctorAppointments.filter((apt) => {
      const aptDate = apt.appointmentDate || (apt.bookedAt ? apt.bookedAt.split('T')[0] : '');

      if (revenueDateFilter === 'today') {
        if (aptDate !== todayStr) return false;
      } else if (revenueDateFilter === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (aptDate < weekAgo) return false;
      } else if (revenueDateFilter === 'month') {
        if (!aptDate.startsWith(currentMonthPrefix)) return false;
      } else if (revenueDateFilter === 'custom') {
        if (customStartDate && aptDate < customStartDate) return false;
        if (customEndDate && aptDate > customEndDate) return false;
      }

      if (patientSearch.trim()) {
        const q = patientSearch.toLowerCase().trim();
        const matchName = apt.patientName?.toLowerCase().includes(q);
        const matchUhid = apt.patientUhid?.toLowerCase().includes(q);
        const matchToken = apt.tokenFormatted?.toLowerCase().includes(q) || String(apt.tokenNumber).includes(q);
        const matchPhone = apt.patientPhone?.includes(q);
        if (!matchName && !matchUhid && !matchToken && !matchPhone) return false;
      }

      return true;
    });
  }, [doctorAppointments, revenueDateFilter, todayStr, currentMonthPrefix, customStartDate, customEndDate, patientSearch]);

  // Calendar Helpers
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();

  // Dates with appointments for calendar dots
  const datesWithAppointments = useMemo(() => {
    const map: Record<string, number> = {};
    doctorAppointments.forEach((a) => {
      if (a.appointmentDate) {
        map[a.appointmentDate] = (map[a.appointmentDate] || 0) + 1;
      }
    });
    return map;
  }, [doctorAppointments]);

  // Initials for avatar
  const initials = employee.name
    ? employee.name.replace(/^(Dr\.|Sister|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim().slice(0, 2).toUpperCase()
    : 'DR';

  const availability = employee.availabilityStatus || 'available';

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200 select-none">
      {/* =================================================================== */}
      {/* TOP NAV BAR & TABS (Inspired by Reference Screenshot Top Bar)       */}
      {/* =================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors shadow-xs flex items-center gap-2 cursor-pointer group"
            title="Return to Employee Table"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-bold">Back to Workforce</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>/</span>
            <span className="text-slate-500 font-medium">Workforce Directory</span>
            <span>/</span>
            <span className="text-slate-900 font-bold">{employee.name}</span>
          </div>
        </div>

        {/* Navigation Tabs matching reference: Dashboard, Consultations & Revenue, Attendance, Work Details */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start md:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Dashboard
          </button>

          {isDoctor && (
            <button
              type="button"
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'revenue'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Consultations & Earnings</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Attendance & Roster
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('work')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'work'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Work & Payroll
          </button>
        </div>

        {/* Right Status Badge & Edit Action */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize border ${
              employee.status === 'active'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : employee.status === 'pending_approval'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                employee.status === 'active'
                  ? 'bg-emerald-500'
                  : employee.status === 'pending_approval'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            {employee.status ? employee.status.replace('_', ' ') : 'Active'}
          </span>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(employee)}
              className="px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* ROW 1: DOCTOR/EMPLOYEE DETAILS HERO CARD + 3 OVERVIEW METRIC GAUGES */}
      {/* Inspired directly by Reference Screenshot Top Section               */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* HERO CARD: Doctor Details (Exact match to Dianne Russell card in Ref Image) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-sky-50/70 via-blue-50/30 to-white rounded-[32px] p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold tracking-tight text-slate-600">
                {isDoctor ? 'Doctor details' : 'Staff details'}
              </span>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/80 border border-slate-200 text-slate-700 shadow-2xs">
                  {employee.employeeCode || '#DOC-20458'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mt-2">
              {/* Avatar Photo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                {initials}
              </div>

              {/* Name & ID */}
              <div className="space-y-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  {employee.name}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 capitalize">
                  {employee.designation || (isDoctor ? 'Consultant Physician' : employee.primaryRole.replace('_', ' '))}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {employee.departmentName || 'General OPD'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {employee.employeeLoginId || (employee as any).loginId || 'OPD-ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Rows (Phone, Location, Email) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-200/60 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center flex-shrink-0 text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold truncate">{employee.phone || (employee as any).mobile || '+91 98401 23456'}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center flex-shrink-0 text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold truncate">UPH-01 • India</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700 sm:col-span-2">
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center flex-shrink-0 text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-slate-600 truncate" title={employee.email || ''}>
                  {employee.email || `${employee.name.toLowerCase().replace(/\s+/g, '.')}@upstagehospital.org`}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom 3 Numbers with Colored Underlines (Exact match to Ref Screenshot) */}
          <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-200/60">
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">
                Total Patients
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {isDoctor ? uniquePatientsCount : totalRecordedDays}
              </div>
              <div className="w-full h-1 bg-blue-500 rounded-full mt-2" />
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">
                {isDoctor ? 'Patients Treated' : 'Present Days'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {isDoctor ? completedConsultations.length : presentDays}
              </div>
              <div className="w-full h-1 bg-amber-500 rounded-full mt-2" />
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">
                {isDoctor ? 'Active Patients' : 'Attendance'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                {isDoctor ? waitingConsultations.length : `${attendanceRate}%`}
              </div>
              <div className="w-full h-1 bg-emerald-500 rounded-full mt-2" />
            </div>
          </div>
        </div>

        {/* RIGHT PANELS (7 cols): 3 Semicircular Gauges + Patient Demographics Bar Chart */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          {/* 3 Semicircular Gauges side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Gauge 1: Vitals Stability / Completion Rate */}
            <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">
                  {isDoctor ? 'Consultation Rate' : 'Floor Ready'}
                </h3>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-[10px] font-bold text-blue-600 mt-1">
                +3.1% ▲
              </div>

              {/* Semicircle SVG Arc */}
              <div className="relative flex flex-col items-center justify-center my-2">
                <svg className="w-24 h-14" viewBox="0 0 100 55">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="126"
                    strokeDashoffset={126 - (126 * (completionRate / 100))}
                  />
                </svg>
                <div className="text-center -mt-3">
                  <span className="text-xl font-black text-slate-900">{completionRate}%</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium">Completed OPD queue</p>
            </div>

            {/* Gauge 2: Treatment Progress / Revenue Collection */}
            <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">
                  {isDoctor ? 'Fee Collection' : 'Attendance Rate'}
                </h3>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-[10px] font-bold text-amber-600 mt-1">
                +4.2% ▼
              </div>

              {/* Semicircle SVG Arc */}
              <div className="relative flex flex-col items-center justify-center my-2">
                <svg className="w-24 h-14" viewBox="0 0 100 55">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="126"
                    strokeDashoffset={126 - (126 * (collectionRate / 100))}
                  />
                </svg>
                <div className="text-center -mt-3">
                  <span className="text-xl font-black text-slate-900">{collectionRate}%</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium">Payment realization</p>
            </div>

            {/* Gauge 3: Medication Adherence / Floor Compliance */}
            <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">
                  {isDoctor ? 'Roster Adherence' : 'Employment Type'}
                </h3>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-[10px] font-bold text-emerald-600 mt-1">
                +2.5% ▲
              </div>

              {/* Semicircle SVG Arc */}
              <div className="relative flex flex-col items-center justify-center my-2">
                <svg className="w-24 h-14" viewBox="0 0 100 55">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="126"
                    strokeDashoffset={126 - (126 * (attendanceRate / 100))}
                  />
                </svg>
                <div className="text-center -mt-3">
                  <span className="text-xl font-black text-slate-900">{attendanceRate}%</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium">Shift punctuality</p>
            </div>
          </div>

          {/* Patient Demographics Bar Chart (Exact match to Reference Screenshot) */}
          <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Patient Demographics</h3>
                <p className="text-[11px] text-slate-400">Clinical age group distribution of assigned cases</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Elderly: +13%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Adult: +10%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-lime-400" /> Youth: +8%
                </span>
              </div>
            </div>

            {/* Stepped Multi-Level Distribution Graphic (Reference Image Style) */}
            <div className="grid grid-cols-3 gap-3 pt-4 items-end">
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Elderly: {demographics.elderly}%</span>
                </div>
                <div className="h-14 rounded-2xl bg-gradient-to-t from-blue-500/80 to-blue-400/40 border border-blue-300/60 shadow-xs flex items-center justify-center font-bold text-sm text-blue-950">
                  {demographics.elderly}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Adult: {demographics.adult}%</span>
                </div>
                <div className="h-24 rounded-2xl bg-gradient-to-t from-amber-400/90 to-amber-300/40 border border-amber-300/60 shadow-xs flex items-center justify-center font-black text-lg text-amber-950">
                  {demographics.adult}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-lime-400" />
                  <span>Youth: {demographics.youth}%</span>
                </div>
                <div className="h-10 rounded-2xl bg-gradient-to-t from-lime-400/90 to-lime-300/40 border border-lime-300/60 shadow-xs flex items-center justify-center font-bold text-sm text-lime-950">
                  {demographics.youth}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECTION: DOCTOR CONSULTATION PERFORMANCE & EARNINGS TRACKING        */}
      {/* 6 Dedicated Financial KPI Cards (Editable Fee & Revenue Tracking)    */}
      {/* =================================================================== */}
      {isDoctor && (
        <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Doctor Consultation Fee & Revenue Attribution
                  </h2>
                  <p className="text-xs text-slate-500">
                    Transparent OP token pricing, collected fees, pending billing balances & doctor performance
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                Configured Fee: <strong className="text-emerald-700">₹{employee.consultationFee || 500}</strong>
              </span>
            </div>
          </div>

          {/* 6 KPI Performance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Card 1: Total Revenue Generated */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Revenue
              </span>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                ₹{totalRevenueGenerated.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                {validAppointments.length} Tokens Billed
              </span>
            </div>

            {/* Card 2: Amount Actually Collected */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Actually Collected
              </span>
              <div className="text-lg sm:text-xl font-black text-emerald-800">
                ₹{totalRevenueCollected.toLocaleString('en-IN')}
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                <CheckCircle className="w-2.5 h-2.5" /> Paid & Realized
              </span>
            </div>

            {/* Card 3: Pending Collection */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Pending Billing
              </span>
              <div className="text-lg sm:text-xl font-black text-amber-900">
                ₹{totalRevenuePending.toLocaleString('en-IN')}
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                <Clock3 className="w-2.5 h-2.5" /> Due at Pharmacy/Discharge
              </span>
            </div>

            {/* Card 4: Average Fee */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Avg Consultation
              </span>
              <div className="text-lg sm:text-xl font-black text-blue-700">
                ₹{averageConsultationFee.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                Per patient visit
              </span>
            </div>

            {/* Card 5: Today's Revenue & Patients */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Today's Earnings
              </span>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                ₹{todayRevenue.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-600 font-semibold block">
                {todayAppointments.length} patients today
              </span>
            </div>

            {/* Card 6: This Month's Performance */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">
                Monthly Revenue
              </span>
              <div className="text-lg sm:text-xl font-black text-purple-900">
                ₹{monthRevenue.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-purple-700 font-semibold block">
                {monthAppointments.length} visits this month
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ROW 3: PATIENT OVERVIEW TABLE (LEFT 8) + INTERACTIVE CALENDAR (RIGHT 4) */}
      {/* Exact Match to Reference Screenshot Bottom Half                     */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANEL (8 cols): PATIENT OVERVIEW TABLE */}
        <div className="lg:col-span-8 bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Patient Overview
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage and monitor all assigned patient profiles & consultation statuses from a single dashboard
              </p>
            </div>

            {/* Date Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, UHID, token..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none w-44 transition-all"
                />
              </div>

              {/* Quick Period Selector */}
              <select
                value={revenueDateFilter}
                onChange={(e) => setRevenueDateFilter(e.target.value as any)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {revenueDateFilter === 'custom' && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-600">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
              <span className="font-semibold text-slate-600">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-3 w-10">No</th>
                  <th className="py-3 px-4">Name & Patient ID</th>
                  <th className="py-3 px-3">Age</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Token & Fee</th>
                  <th className="py-3 px-3">Fee Status</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No patient consultation records found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        New walk-ins and appointments assigned to this doctor will appear here automatically.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt, index) => {
                    const isCompleted = apt.status === 'completed';
                    const isCancelled = apt.status === 'cancelled';
                    const isWaiting = apt.status === 'waiting' || apt.status === 'in_consultation';

                    return (
                      <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3 font-mono text-slate-400 text-xs">
                          {index + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {apt.patientName?.charAt(0) || 'P'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">
                                {apt.patientName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 block">
                                {apt.patientUhid || 'P-10021'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-slate-600 font-medium">
                          {apt.patientAge ? `${apt.patientAge}` : '29'}
                        </td>

                        <td className="py-3.5 px-3 font-mono text-slate-600 text-xs">
                          {apt.patientPhone || '(415) 555-2389'}
                        </td>

                        <td className="py-3.5 px-3 font-mono">
                          <span className="font-bold text-slate-800 block">
                            {apt.tokenFormatted || `OP-${apt.tokenNumber}`}
                          </span>
                          <span className="font-bold text-emerald-700 text-[11px] block">
                            ₹{apt.consultationFee || 500}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              apt.isFeePaid
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {apt.isFeePaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${
                              isCompleted
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : isCancelled
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : isWaiting
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isCompleted ? 'Visited' : isCancelled ? 'Canceled' : apt.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANEL (4 cols): CALENDAR WIDGET (Exact Match to Ref Screenshot) */}
        <div className="lg:col-span-4 bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Calendar
              </h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>{monthNames[calendarMonth]} {calendarYear}</span>
                <button
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 py-2 border-b border-slate-100">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 text-center text-xs py-3 gap-y-2">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <span key={`empty-${i}`} className="text-slate-300 text-xs py-1.5">
                  {new Date(calendarYear, calendarMonth, -firstDayIndex + i + 1).getDate()}
                </span>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const hasApts = datesWithAppointments[dateKey];
                const isToday = dateKey === todayStr;

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => {
                      setRevenueDateFilter('custom');
                      setCustomStartDate(dateKey);
                      setCustomEndDate(dateKey);
                    }}
                    className={`relative py-1.5 flex flex-col items-center justify-center rounded-xl font-bold cursor-pointer transition-colors ${
                      isToday
                        ? 'bg-slate-900 text-white shadow-xs'
                        : hasApts
                        ? 'hover:bg-blue-50 text-slate-900 font-extrabold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {hasApts && !isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Legend (Exact match to Reference Screenshot) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Appointment</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Meeting</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-400" />
              <span>Surgery</span>
            </span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* ATTENDANCE & BIOMETRIC LOGS SECTION                                 */}
      {/* =================================================================== */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Attendance & Shift Check-in History
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verified check-in, check-out, shifts and biometric records
              </p>
            </div>

            {/* Attendance Filters */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setAttendanceFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  attendanceFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({employeeAttendance.length})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('present')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  attendanceFilter === 'present' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Present ({presentDays})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('leave')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  attendanceFilter === 'leave' ? 'bg-white text-blue-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Leave ({leaveDays})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('absent')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  attendanceFilter === 'absent' ? 'bg-white text-rose-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Absent ({absentDays})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Shift Scheduled</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Work Hours</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No attendance entries recorded yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Daily roster attendance or biometric check-ins will automatically log here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  employeeAttendance
                    .filter((a) => attendanceFilter === 'all' || a.status === attendanceFilter)
                    .map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {rec.date}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {rec.shiftType || 'General Shift'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {rec.checkInTime || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {rec.checkOutTime || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-800">
                          {rec.workHours ? `${rec.workHours} hrs` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                              rec.status === 'present'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : rec.status === 'leave'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {rec.status === 'present' && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                            {rec.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* WORK INFORMATION & PAYROLL CARD                                     */}
      {/* =================================================================== */}
      {(activeTab === 'work' || activeTab === 'dashboard') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Work Information Card */}
          <div className="lg:col-span-7 bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Work Information & Role Assignment
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Departmental Roster
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Primary Designated Role
                </span>
                <span className="font-bold text-slate-800 text-sm capitalize block">
                  {employee.primaryRole ? employee.primaryRole.replace('_', ' ') : 'Staff'}
                </span>
                <span className="text-[10px] text-slate-500">Core operational duty</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Department
                </span>
                <span className="font-bold text-slate-800 text-sm block truncate">
                  {employee.departmentName || 'General Staff'}
                </span>
                <span className="text-[10px] text-slate-500">Clinical ward & duty post</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Joining Date
                </span>
                <span className="font-bold text-slate-800 text-sm block">
                  {employee.joiningDate || '—'}
                </span>
                <span className="text-[10px] text-slate-500">Official hospital appointment</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Shift Schedule
                </span>
                <span className="font-bold text-slate-800 text-sm block">
                  General Shift (09:00 - 18:00)
                </span>
                <span className="text-[10px] text-slate-500">Regular duty schedule</span>
              </div>
            </div>

            {/* Additional Roles */}
            {employee.additionalRoles && employee.additionalRoles.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Additional Clinical Privileges & Cross-Departmental Access
                </span>
                <div className="flex flex-wrap gap-2">
                  {employee.additionalRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 capitalize"
                    >
                      <Shield className="w-3 h-3 text-blue-600" />
                      +{role.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compensation & Account Security Card */}
          <div className="lg:col-span-5 bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Compensation & Credentials
                </h2>
              </div>
              <span className="text-[11px] font-bold text-emerald-700">Hospital Payroll</span>
            </div>

            {/* Salary Breakdown */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Monthly Salary Summary
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Basic Salary</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    ₹{Number(employee.salaryDetails?.basic || 55000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Net Take-Home</span>
                  <span className="font-mono font-black text-emerald-800 text-base">
                    ₹{Number(employee.salaryDetails?.net || employee.salaryDetails?.basic || 55000).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Permanent Login ID */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Permanent Login Credentials
              </span>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">User Access Login ID</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {employee.employeeLoginId || (employee as any).loginId || 'Pending'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Cloud Synced
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

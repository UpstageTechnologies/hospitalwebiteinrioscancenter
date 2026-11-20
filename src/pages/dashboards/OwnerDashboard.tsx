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
  CheckCircle2
} from 'lucide-react';

interface OwnerDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigateTab }) => {
  const { currentHospital, currentUser } = useAuth();
  const { patients, appointments, admissions, beds, invoices, employees, roleRequests } = useHospital();

  const totalPatients = patients.length;
  const activeAdmissions = admissions.filter(a => a.status === 'active').length;
  const totalBeds = beds.length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const bedOccupancyRate = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const pendingRoleApprovals = roleRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Greeting Header matching Screenshot 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Good Morning, {currentUser?.name.split(' ')[0] || 'Mallik'}!
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Welcome to <span className="font-semibold text-slate-800">{currentHospital.name}</span> • Multi-Tenant Isolated Healthcare Cloud
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

      {/* Pending Role Requests Notification Banner (if any) */}
      {pendingRoleApprovals > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {pendingRoleApprovals} Additional Role Assignment Request{pendingRoleApprovals > 1 ? 's' : ''} Awaiting Approval
              </h4>
              <p className="text-[11px] text-amber-700/90 mt-0.5">
                Staff have requested additional permissions. Review and approve to activate dynamic access.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('role_requests')}
            className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors flex-shrink-0 w-full sm:w-auto text-center"
          >
            Review Requests
          </button>
        </div>
      )}

      {/* 6-Card Module Launcher Grid (Exactly matching Screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-6">
        {/* Card 1: Active Primary Emerald Card */}
        <div
          onClick={() => onNavigateTab('workspace')}
          className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 sm:p-7 rounded-3xl shadow-lg shadow-emerald-700/15 cursor-pointer overflow-hidden group hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[190px] sm:min-h-[220px]"
        >
          {/* Top Row: Title & Icon */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">Workspace</h3>
              <p className="text-emerald-100 text-xs mt-1.5 max-w-[180px] leading-relaxed">
                See all hospital modules & launch workstations!
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
          </div>

          {/* Bottom Row: Arrow & Abstract Geometric Shapes in corner */}
          <div className="flex items-end justify-between z-10 pt-6">
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>

            {/* Corner Abstract Geometric Graphic */}
            <div className="absolute right-3 -bottom-3 opacity-80 pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <circle cx="90" cy="90" r="30" fill="#34d399" fillOpacity="0.4" />
                <rect x="50" y="60" width="40" height="40" rx="8" fill="#10b981" fillOpacity="0.6" />
                <circle cx="70" cy="40" r="18" fill="#a7f3d0" fillOpacity="0.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Datasets / Patients EMR (Yellow Accent) */}
        <div
          onClick={() => onNavigateTab('patients')}
          className="relative bg-white border border-slate-200/70 p-5 sm:p-7 rounded-3xl shadow-sm hover:shadow-md cursor-pointer overflow-hidden group hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[190px] sm:min-h-[220px]"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                Patient EMR
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-[190px] leading-relaxed">
                Unique UHID directory, clinical histories, and patient records.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-end justify-between z-10 pt-6">
            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-amber-700" />
            </div>

            {/* Corner Abstract Shapes */}
            <div className="absolute right-3 -bottom-3 opacity-80 pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <rect x="60" y="50" width="45" height="50" rx="10" fill="#fef08a" fillOpacity="0.7" />
                <circle cx="85" cy="85" r="24" fill="#fbbf24" fillOpacity="0.8" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: 17 Roles & Governance (Coral/Rose Accent) */}
        <div
          onClick={() => onNavigateTab('roles')}
          className="relative bg-white border border-slate-200/70 p-5 sm:p-7 rounded-3xl shadow-sm hover:shadow-md cursor-pointer overflow-hidden group hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[190px] sm:min-h-[220px]"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors">
                17 Roles
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-[190px] leading-relaxed">
                Dynamic role templates, staff assignments, and approval workflows.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-end justify-between z-10 pt-6">
            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-rose-700" />
            </div>

            <div className="absolute right-3 -bottom-3 opacity-80 pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <path d="M50 85 C50 60, 90 60, 90 85 Z" fill="#fecdd3" />
                <rect x="65" y="65" width="40" height="30" rx="6" fill="#f43f5e" fillOpacity="0.7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Clinical & Bed Map (Purple Accent) */}
        <div
          onClick={() => onNavigateTab('wards')}
          className="relative bg-white border border-slate-200/70 p-5 sm:p-7 rounded-3xl shadow-sm hover:shadow-md cursor-pointer overflow-hidden group hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[190px] sm:min-h-[220px]"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-purple-600 transition-colors">
                Real-Time Beds
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-[190px] leading-relaxed">
                Live floor census, bed turnover, sanitization, and transfers.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 flex-shrink-0">
              <Bed className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-end justify-between z-10 pt-6">
            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-purple-700" />
            </div>

            <div className="absolute right-3 -bottom-3 opacity-80 pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <rect x="55" y="75" width="40" height="25" rx="6" fill="#e9d5ff" />
                <circle cx="85" cy="70" r="18" fill="#a855f7" fillOpacity="0.8" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 5: Billing & Finance (Blue Accent) */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="relative bg-white border border-slate-200/70 p-5 sm:p-7 rounded-3xl shadow-sm hover:shadow-md cursor-pointer overflow-hidden group hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[190px] sm:min-h-[220px]"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Billing & P&L
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-[190px] leading-relaxed">
                Patient invoices, cash/UPI collections, insurance, and receipts.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-end justify-between z-10 pt-6">
            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-blue-700" />
            </div>

            <div className="absolute right-3 -bottom-3 opacity-80 pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <circle cx="80" cy="80" r="28" fill="#bae6fd" />
                <path d="M60 90 L90 60 L100 80 Z" fill="#0284c7" fillOpacity="0.7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 6: Pharmacy & Laboratory (Orange Accent) */}
        <div
          onClick={() => onNavigateTab('pharmacy')}
          className="relative bg-white border border-slate-200/70 p-5 sm:p-7 rounded-3xl shadow-sm hover:shadow-md cursor-pointer overflow-hidden group hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[190px] sm:min-h-[220px]"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                Pharmacy & Lab
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-[190px] leading-relaxed">
                FEFO drug dispensing, expiry tracking, and diagnostic orders.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
              <Pill className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-end justify-between z-10 pt-6">
            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-orange-100 flex items-center justify-center group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-orange-700" />
            </div>

            <div className="absolute right-3 -bottom-3 opacity-80 pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <rect x="65" y="60" width="35" height="40" rx="8" fill="#fed7aa" />
                <circle cx="85" cy="85" r="18" fill="#f97316" fillOpacity="0.8" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Spacious Clean Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-400">Total Registered Patients</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalPatients}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Permanent UHID Index</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-400">Today's OPD Consultations</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{appointments.length}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Live token queuing</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-400">Active Bed Occupancy</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{bedOccupancyRate}%</div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">{availableBeds} beds ready</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-400">Realized Collections</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">₹{totalRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Direct cashier settlements</div>
        </div>
      </div>
    </div>
  );
};

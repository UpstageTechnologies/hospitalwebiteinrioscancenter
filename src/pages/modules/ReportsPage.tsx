import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  Users,
  Activity,
  Bed
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { invoices, patients, appointments, admissions, beds } = useHospital();
  const { currentHospital } = useAuth();

  const [dateRange, setDateRange] = useState('month');

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalDue = invoices.reduce((sum, inv) => sum + Math.max(0, inv.balanceDue), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Executive Clinical & Financial Analytics (MIS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-Ready Revenue Reports • Bed Utilization • Department Activity • Printable Summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Invoiced Revenue</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {invoices.length} invoices</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Realized Collections</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalRevenue.toLocaleString()}</div>
          <p className="text-[11px] text-emerald-600 mt-0.5">Cash, UPI, and Bank settlements</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Receivables & Insurance Dues</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">₹{totalDue.toLocaleString()}</div>
          <p className="text-[11px] text-amber-600 mt-0.5">TPA claims and patient balances</p>
        </div>
      </div>

      {/* Operational Volumes */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hospital Operational Volumes</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Total Registered Patients</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{patients.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">OPD Consultations</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{appointments.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Total Admissions</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{admissions.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Total Bed Inventory</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{beds.length} Beds</div>
          </div>
        </div>
      </div>
    </div>
  );
};

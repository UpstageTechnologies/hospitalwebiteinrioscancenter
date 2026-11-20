import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { HospitalExpense, PaymentMethod } from '../../types/billing';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  PieChart,
  FileSpreadsheet,
  X,
  Printer
} from 'lucide-react';

export const AccountantDashboard: React.FC = () => {
  const { invoices, expenses, payrollRecords, recordExpense } = useHospital();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'collections' | 'reconciliation'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // New Expense Voucher Form State
  const [category, setCategory] = useState<HospitalExpense['category']>('Medical Supplies');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [voucherNumber, setVoucherNumber] = useState(`VCH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [description, setDescription] = useState('');

  // Calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollections = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Math.max(0, inv.balanceDue), 0);

  // Expenses calculations
  const totalOperationalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const totalPayrollDisbursed = payrollRecords
    .filter(p => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.netSalary, 0);
  const combinedExpenses = totalOperationalExpenses + totalPayrollDisbursed;
  const netSurplus = totalCollections - combinedExpenses;

  // Payment Method Breakdown
  const methodTotals = invoices.reduce(
    (acc, inv) => {
      acc[inv.paymentMethod] = (acc[inv.paymentMethod] || 0) + inv.amountPaid;
      return acc;
    },
    { cash: 0, upi: 0, card: 0, insurance: 0, bank_transfer: 0 } as Record<string, number>
  );

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!parsedAmt || parsedAmt <= 0) return;

    recordExpense({
      category,
      amount: parsedAmt,
      paidTo,
      paymentMethod,
      paymentDate,
      voucherNumber,
      description: description || `${category} payment to ${paidTo}`,
      recordedByStaffName: currentUser?.name || 'Sanjay Agarwal (Accountant)'
    });

    setShowAddExpenseModal(false);
    setAmount('');
    setPaidTo('');
    setDescription('');
    setVoucherNumber(`VCH-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const filteredExpenses = expenses.filter(ex =>
    ex.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.paidTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Hospital Financial Accounting & Daily Reconciliation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            General Ledger • Multi-Channel Collections • Operating Expenses • Payroll Outflows • P&L Statement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Record Expense Voucher
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Collections</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">₹{totalCollections.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <span>●</span> Billed ₹{totalInvoiced.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Card 2: Combined Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Outflows</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600">₹{combinedExpenses.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Includes Payroll ₹{totalPayrollDisbursed.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Card 3: Net Operating Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Operating Surplus</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${netSurplus >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold ${netSurplus >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              ₹{netSurplus.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              {netSurplus >= 0 ? 'Operating cash positive' : 'Operating cash deficit'}
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Patient Receivables</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600">₹{totalOutstanding.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-amber-500 font-medium mt-1">Pending patient invoice balance</div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Daily Collections Breakdown
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'bg-slate-900 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Expenses Ledger</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{expenses.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'reconciliation'
              ? 'bg-slate-900 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Daily Audit & P&L Summary
        </button>
      </div>

      {/* TAB 1: COLLECTIONS BREAKDOWN */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Payment Channels Grid (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Collections by Payment Instrument
            </h3>
            <div className="space-y-3">
              {[
                { name: 'UPI & Instant QR Transfer', key: 'upi', color: 'bg-emerald-500', text: 'text-emerald-700' },
                { name: 'Direct Counter Cash', key: 'cash', color: 'bg-amber-500', text: 'text-amber-700' },
                { name: 'POS Debit & Credit Card', key: 'card', color: 'bg-indigo-500', text: 'text-indigo-700' },
                { name: 'TPA Health Insurance Claims', key: 'insurance', color: 'bg-purple-500', text: 'text-purple-700' },
                { name: 'Direct RTGS / NEFT Bank Transfer', key: 'bank_transfer', color: 'bg-blue-500', text: 'text-blue-700' }
              ].map(item => {
                const amt = methodTotals[item.key] || 0;
                const pct = totalCollections > 0 ? Math.round((amt / totalCollections) * 100) : 0;
                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <span className="font-bold text-slate-900">₹{amt.toLocaleString('en-IN')} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Paid Invoices Ledger (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Patient Realizations
              </h3>
              <span className="text-xs text-slate-400">Total {invoices.length} invoices</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.slice(0, 7).map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{inv.patientName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {inv.invoiceType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 uppercase font-semibold text-[10px]">{inv.paymentMethod}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        ₹{inv.amountPaid.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES LEDGER */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search expense voucher #, vendor or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredExpenses.length}</span> expense vouchers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Voucher & Date</th>
                  <th className="py-3 px-4">Expense Category</th>
                  <th className="py-3 px-4">Paid To / Payee</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(ex => (
                  <tr key={ex.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ex.expenseNumber}</div>
                      <div className="text-[10px] text-slate-400">{ex.paymentDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {ex.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{ex.paidTo}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={ex.description}>
                      {ex.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600 uppercase font-semibold text-[10px]">
                      {ex.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600">
                      ₹{ex.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECONCILIATION SUMMARY */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Upstage Hospital — Daily Operating Reconciliation
              </h3>
              <p className="text-xs text-slate-400">
                Generated by {currentUser?.name || 'Sanjay Agarwal (Accountant)'} on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Sheet
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Gross Patient Billing Revenue</span>
              <span className="font-bold text-slate-900">₹{totalInvoiced.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Less: Unpaid Patient Balance (Receivables)</span>
              <span className="font-bold text-amber-600">-₹{totalOutstanding.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 bg-emerald-50/60 px-3 rounded-xl border border-emerald-200/60">
              <span className="font-bold text-emerald-900">Net Realized Patient Collections</span>
              <span className="font-extrabold text-emerald-900 text-sm">₹{totalCollections.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-slate-800 uppercase text-[11px] mb-2 tracking-wider">
                Operational Outflows & Disbursements:
              </h4>
              <div className="space-y-1.5 pl-3 border-l-2 border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Disbursed Hospital Staff Salaries</span>
                  <span className="font-semibold text-slate-800">₹{totalPayrollDisbursed.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Medical Consumables & Oxygen</span>
                  <span className="font-semibold text-slate-800">₹58,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Bulk Pharmacy Procurement</span>
                  <span className="font-semibold text-slate-800">₹1,45,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">High-Tension Commercial Electricity & Fuel</span>
                  <span className="font-semibold text-slate-800">₹1,12,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Bio-medical Equipment AMC (GE Healthcare)</span>
                  <span className="font-semibold text-slate-800">₹85,000</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5 bg-slate-900 text-white px-4 rounded-xl mt-4">
              <span className="font-bold text-xs uppercase tracking-wider">Net Operating Surplus (EBITDA)</span>
              <span className="font-extrabold text-base">₹{netSurplus.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Expense Voucher</h3>
                  <p className="text-xs text-slate-400">Hospital Operational Cost Ledger</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expense Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as HospitalExpense['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Medical Supplies">Medical Supplies</option>
                    <option value="Pharmacy Restock">Pharmacy Restock</option>
                    <option value="Utilities">Utilities & Fuel</option>
                    <option value="Equipment Maintenance">Equipment Maintenance</option>
                    <option value="Salaries">Staff Salaries</option>
                    <option value="Administrative">Administrative</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (₹):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 45000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Paid To / Payee Organization:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inox Air Products Ltd"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="upi">UPI / QR</option>
                    <option value="card">Company Card</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date:</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Voucher Description:</label>
                <textarea
                  rows={2}
                  placeholder="Details of expense, invoice reference..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Record Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

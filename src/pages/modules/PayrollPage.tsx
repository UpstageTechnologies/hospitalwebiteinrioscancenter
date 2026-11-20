import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { PayrollRecord } from '../../types/hr';
import {
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  User,
  Search,
  Filter,
  DollarSign,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ShieldCheck
} from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { employees, payrollRecords, calculateMonthlyPayroll, updatePayrollStatus } = useHospital();
  const { currentHospital } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  // Filter approved active employees
  const approvedEmployees = employees.filter(e => e.status === 'active');

  // Filter payroll records for selected month
  const monthPayrollRecords = payrollRecords.filter(p => p.payrollMonth === selectedMonth);

  // If no records for selectedMonth, auto-calculate or allow manual trigger
  const handleRecalculate = () => {
    calculateMonthlyPayroll(selectedMonth);
  };

  const filteredPayroll = monthPayrollRecords.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.employeeName.toLowerCase().includes(q) ||
      p.employeeCode.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      p.designation.toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const totalGross = monthPayrollRecords.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalDeductions = monthPayrollRecords.reduce((sum, p) => sum + p.totalDeductions, 0);
  const totalNet = monthPayrollRecords.reduce((sum, p) => sum + p.netPayable, 0);
  const paidCount = monthPayrollRecords.filter(p => p.paymentStatus === 'paid').length;

  const handleMarkAsPaid = (payrollId: string) => {
    updatePayrollStatus(payrollId, 'paid', `SAL-NEFT-${Date.now().toString().slice(-6)}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Payroll & Salary Disbursements</h1>
              <p className="text-xs text-slate-500">
                Calculated directly from actual attendance • Deductions • Payslip Generation • Multi-Tenant Audited
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            />

            <button
              onClick={handleRecalculate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Calculate from Attendance</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-slate-100 mt-5">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Staff on Roll</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{approvedEmployees.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{monthPayrollRecords.length} records generated</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Payroll Budget</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">₹{totalGross.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Basic + allowances</div>
          </div>

          <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200/70">
            <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Total Deductions</div>
            <div className="text-xl font-extrabold text-rose-700 mt-0.5">₹{totalDeductions.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">Unpaid absence & tax</div>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/70">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Net Disbursable</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">₹{totalNet.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{paidCount} of {monthPayrollRecords.length} Paid</div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payroll by employee name, ID or department..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Period: <strong className="text-slate-800">{selectedMonth}</strong> • Standard: 26 Working Days
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Basic + Allowances</th>
                <th className="py-3 px-4">Present / Working</th>
                <th className="py-3 px-4">Leaves / Absent</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Payable</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <div>No payroll records found for {selectedMonth}.</div>
                    <button
                      onClick={handleRecalculate}
                      className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Click here to Calculate Payroll from Attendance
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPayroll.map(pay => {
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pay.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {pay.employeeCode} • {pay.department}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-800 font-semibold">₹{pay.grossSalary.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">
                          ₹{pay.basicSalary.toLocaleString('en-IN')} + ₹{pay.allowances.toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-900">{pay.presentDays}</span>
                        <span className="text-slate-400 text-[10px]"> / {pay.totalWorkingDays} days</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700">{pay.leaveDays} Paid Leaves</div>
                        {pay.absentDays > 0 ? (
                          <div className="text-[10px] text-rose-600 font-bold">{pay.absentDays} Unpaid Absent</div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-medium">0 Absent</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-rose-700 font-semibold">
                        -₹{pay.totalDeductions.toLocaleString('en-IN')}
                        {pay.unpaidDeductions > 0 && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            (incl. ₹{pay.unpaidDeductions.toLocaleString('en-IN')} absent cut)
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-base font-extrabold text-emerald-700">
                          ₹{pay.netPayable.toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {pay.paymentStatus === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Disbursed
                          </span>
                        )}
                        {pay.paymentStatus === 'processed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Processed
                          </span>
                        )}
                        {pay.paymentStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPayslip(pay)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Payslip</span>
                          </button>

                          {pay.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(pay.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYSLIP GENERATION MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Payslip Header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
              <div>
                <div className="text-xs font-extrabold tracking-tight uppercase text-emerald-700">{currentHospital.name}</div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">Salary Payslip</h2>
                <p className="text-[11px] text-slate-500 font-mono">Month: {selectedPayslip.payrollMonth} • Multi-Tenant Isolated Ledger</p>
              </div>

              <div className="text-right">
                <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
                <div className="text-[10px] text-slate-400 mt-2 font-mono">{currentHospital.city}</div>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Employee Name</span>
                <span className="font-bold text-slate-900">{selectedPayslip.employeeName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Employee ID</span>
                <span className="font-bold text-slate-900 font-mono">{selectedPayslip.employeeCode}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Department</span>
                <span className="font-semibold text-slate-800">{selectedPayslip.department}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Designation</span>
                <span className="font-semibold text-slate-800">{selectedPayslip.designation}</span>
              </div>
            </div>

            {/* Attendance Snapshot */}
            <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 flex items-center justify-around text-center text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Working Days</div>
                <div className="text-base font-extrabold text-slate-800">{selectedPayslip.totalWorkingDays}</div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-700 font-bold uppercase">Days Present</div>
                <div className="text-base font-extrabold text-emerald-700">{selectedPayslip.presentDays}</div>
              </div>
              <div>
                <div className="text-[10px] text-blue-700 font-bold uppercase">Paid Leaves</div>
                <div className="text-base font-extrabold text-blue-700">{selectedPayslip.leaveDays}</div>
              </div>
              <div>
                <div className="text-[10px] text-rose-700 font-bold uppercase">Unpaid Absent</div>
                <div className="text-base font-extrabold text-rose-700">{selectedPayslip.absentDays}</div>
              </div>
            </div>

            {/* Earnings & Deductions Two-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Earnings Column */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                  <span>Earnings Breakdown</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Basic Salary</span>
                  <span className="font-mono">₹{selectedPayslip.basicSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>HRA & Medical Allowances</span>
                  <span className="font-mono">₹{selectedPayslip.allowances.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                  <span>Gross Earnings</span>
                  <span className="font-mono">₹{selectedPayslip.grossSalary.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                  <span>Deductions Breakdown</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax & Standard Deductions</span>
                  <span className="font-mono text-rose-700">₹{selectedPayslip.taxDeductions.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Unpaid Leave / Absent Cuts</span>
                  <span className="font-mono text-rose-700">₹{selectedPayslip.unpaidDeductions.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-rose-700">
                  <span>Total Deductions</span>
                  <span className="font-mono">-₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Callout */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Net Salary Payable</span>
                <div className="text-xs text-emerald-700 mt-0.5">Disbursed via Direct Bank / NEFT Transfer</div>
              </div>
              <div className="text-2xl font-black text-emerald-800 font-mono">
                ₹{selectedPayslip.netPayable.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Footer / Signature Block */}
            <div className="pt-4 border-t border-slate-100 flex items-end justify-between text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Payment Status</div>
                <div className="font-bold text-slate-800 capitalize mt-0.5">{selectedPayslip.paymentStatus}</div>
                {selectedPayslip.paymentReference && (
                  <div className="text-[10px] text-slate-400 font-mono">Ref: {selectedPayslip.paymentReference}</div>
                )}
              </div>

              <div className="text-center">
                <div className="w-36 border-b border-slate-400 mb-1"></div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Authorized Signatory</div>
                <div className="text-[9px] text-slate-400">Hospital Administration</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Payslip</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

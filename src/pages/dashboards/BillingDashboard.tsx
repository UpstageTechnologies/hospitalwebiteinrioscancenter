import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Invoice, PaymentMethod } from '../../types/billing';
import { NurseHelpDialog } from '../../components/nurse/NurseHelpDialog';
import {
  Receipt,
  Plus,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Printer,
  X,
  FileText,
  Building2,
  Check,
  Stethoscope,
  Pill,
  Microscope,
  Bed,
  HeartPulse
} from 'lucide-react';

export const BillingDashboard: React.FC = () => {
  const { currentHospital, currentUser } = useAuth();
  const { invoices, recordInvoicePayment } = useHospital();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [nurseHelpOpen, setNurseHelpOpen] = useState(false);
  const [nurseHelpContext, setNurseHelpContext] = useState<{
    patientId?: string;
    patientName?: string;
    patientUhid?: string;
    defaultTaskType?: string;
  } | null>(null);

  // Selected Invoice for Payment
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payRef, setPayRef] = useState<string>('');

  // Selected Invoice for Printable Receipt
  const [viewingReceipt, setViewingReceipt] = useState<Invoice | null>(null);

  const handleOpenPayment = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPayAmount(String(inv.balanceDue || inv.totalAmount));
    setPayMethod('upi');
    setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) return;

    await recordInvoicePayment(payingInvoice.id, amount, payMethod, payRef);
    setPayingInvoice(null);
  };

  const filteredInvoices = invoices.filter(inv => {
    const q = searchTerm.toLowerCase();
    const matchSearch = inv.patientName.toLowerCase().includes(q) ||
      inv.patientUhid.toLowerCase().includes(q) ||
      inv.invoiceNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalBilled = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Unified Patient Billing & Payment Settlements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated Invoice (Doctor, Pharmacy, Laboratory, Inpatient Ward) • Cash, Card, UPI, Insurance Settlements
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setNurseHelpContext({ defaultTaskType: 'Patient Assistance' });
              setNurseHelpOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title="Request nurse assistance at Billing Desk"
          >
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Nurse Help</span>
          </button>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl border border-slate-200 text-xs font-semibold">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'unpaid', label: 'Unpaid' },
            { id: 'partial', label: 'Partially Paid' },
            { id: 'paid', label: 'Fully Paid' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                statusFilter === tab.id ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>

      {/* Revenue & Financial Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Billed Charges</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Payments Collected</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">₹{totalCollected.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance Due</div>
            <div className="text-2xl font-black text-amber-600 mt-1">₹{totalOutstanding.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
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
            placeholder="Search invoice by Patient name, UHID, Invoice number (e.g. INV-2026-001)..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 px-2 whitespace-nowrap">
          {filteredInvoices.length} Invoices Found
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Patient / UHID</th>
                <th className="py-3 px-4">Departments Consolidated</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No unified invoices matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const hasDoctor = inv.items?.some(i => i.department === 'doctor' || i.category === 'Consultation' || i.category === 'Procedure');
                  const hasPharmacy = inv.items?.some(i => i.department === 'pharmacy' || i.category === 'Pharmacy');
                  const hasLab = inv.items?.some(i => i.department === 'laboratory' || i.category === 'Lab Test');
                  const hasWard = inv.items?.some(i => i.department === 'ward' || i.category === 'Bed Charges');

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.patientUhid}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hasDoctor && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                              <Stethoscope className="w-2.5 h-2.5" /> Doctor
                            </span>
                          )}
                          {hasPharmacy && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              <Pill className="w-2.5 h-2.5" /> Pharmacy
                            </span>
                          )}
                          {hasLab && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                              <Microscope className="w-2.5 h-2.5" /> Lab
                            </span>
                          )}
                          {hasWard && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700">
                              <Bed className="w-2.5 h-2.5" /> Ward
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{inv.totalAmount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600">
                        ₹{inv.amountPaid?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-700">
                        ₹{inv.balanceDue?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          inv.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {inv.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingReceipt(inv)}
                            className="px-2.5 py-1 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> View Receipt
                          </button>

                          {inv.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" /> Collect Payment
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

      {/* COLLECT PAYMENT MODAL */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Payment Settlement</h3>
                <p className="text-xs text-slate-500">{payingInvoice.patientName} • Invoice #{payingInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setPayingInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 font-medium">Total Bill Amount:</div>
                  <div className="font-extrabold text-slate-900">₹{payingInvoice.totalAmount}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Current Balance Due:</div>
                  <div className="font-extrabold text-amber-700">₹{payingInvoice.balanceDue}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount to Collect (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payingInvoice.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none"
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  Supports full settlement or partial payments. Remaining balance is automatically recomputed.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Channel / Method *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR' },
                    { id: 'card', label: 'Card' },
                    { id: 'cash', label: 'Cash' },
                    { id: 'insurance', label: 'Insurance' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as any)}
                      className={`py-2 px-2 rounded-xl border font-bold text-center text-xs transition-all ${
                        payMethod === m.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction / Reference ID
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI-REF-99210 or Bank Auth Code"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Confirm & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT OFFICIAL INVOICE RECEIPT MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  UP
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{currentHospital.name}</h3>
                  <p className="text-[11px] text-slate-500">Official Consolidated Medical Bill & Receipt</p>
                </div>
              </div>
              <button onClick={() => setViewingReceipt(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient & Invoice Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <div className="text-slate-400 font-medium">Patient Name:</div>
                <div className="font-bold text-slate-900 text-sm">{viewingReceipt.patientName}</div>
                <div className="text-slate-500 font-mono mt-0.5">UHID: {viewingReceipt.patientUhid}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 font-medium">Invoice Number:</div>
                <div className="font-mono font-bold text-slate-900">{viewingReceipt.invoiceNumber}</div>
                <div className="text-slate-500 mt-0.5">{new Date(viewingReceipt.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Service / Charge Description</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingReceipt.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.description}</td>
                      <td className="py-2.5 px-3 text-slate-500 capitalize">{item.department || item.category}</td>
                      <td className="py-2.5 px-3">{item.quantity}</td>
                      <td className="py-2.5 px-3">₹{item.unitPrice}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{viewingReceipt.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Hospital Tax / GST (5%):</span>
                <span className="font-semibold">₹{viewingReceipt.taxAmount || 0}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>₹{viewingReceipt.totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span>₹{viewingReceipt.amountPaid || 0}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Remaining Balance Due:</span>
                <span>₹{viewingReceipt.balanceDue || 0}</span>
              </div>
            </div>

            {/* Receipt Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Authorized Hospital Billing Clearance Seal
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
              </div>
            </div>
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
        defaultTaskType={nurseHelpContext?.defaultTaskType || 'Patient Assistance'}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { Invoice, BillItem, PaymentMethod } from '../../types/billing';
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
  FileText
} from 'lucide-react';

export const BillingDashboard: React.FC = () => {
  const { invoices, patients, createInvoice, recordPayment, updateInvoice } = useHospital();
  const { currentUser } = useAuth();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Edit / Adjust Invoice State
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editDiscount, setEditDiscount] = useState('0');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');

  const handleStartEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditDiscount(String(inv.discountAmount || 0));
    setEditItemDesc('');
    setEditItemPrice('');
  };

  const handleSaveInvoiceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    let updatedItems = [...editingInvoice.items];
    const newPrice = parseFloat(editItemPrice);
    if (editItemDesc.trim() && newPrice && newPrice > 0) {
      updatedItems.push({
        id: `item-${Date.now()}`,
        description: editItemDesc.trim(),
        category: 'Procedure',
        quantity: 1,
        unitPrice: newPrice,
        total: newPrice
      });
    }

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = parseFloat(editDiscount) || 0;
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(taxable * 0.05);
    const totalAmount = taxable + taxAmount;

    updateInvoice(editingInvoice.id, {
      items: updatedItems,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount
    });

    setEditingInvoice(null);
  };

  // New Invoice Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [invoiceType, setInvoiceType] = useState<Invoice['invoiceType']>('OPD');
  const [items, setItems] = useState<BillItem[]>([
    { id: '1', description: 'Consultation Charges', category: 'Consultation', quantity: 1, unitPrice: 1200, total: 1200 }
  ]);
  const [discount, setDiscount] = useState('0');

  // Payment Recording Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [transactionRef, setTransactionRef] = useState('');

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Math.max(0, inv.balanceDue), 0);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: 'Diagnostic / Procedure Fee',
        category: 'Procedure',
        quantity: 1,
        unitPrice: 500,
        total: 500
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === selectedPatientId);
    if (!pat || items.length === 0) return;

    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const disc = parseFloat(discount) || 0;
    const tax = Math.round((subtotal - disc) * 0.05); // 5% tax
    const totalAmount = subtotal - disc + tax;

    createInvoice({
      invoiceType,
      patientId: pat.id,
      patientName: pat.name,
      patientUhid: pat.uhid,
      patientPhone: pat.phone,
      items,
      subtotal,
      discountAmount: disc,
      taxAmount: tax,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      createdByStaffName: currentUser?.name || 'Billing Staff'
    });

    setShowNewModal(false);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;

    recordPayment(
      selectedInvoice.id,
      parseFloat(paymentAmount),
      paymentMethod,
      transactionRef
    );

    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentAmount('');
    setTransactionRef('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Billing Desk, Invoicing & Cashier Settlement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            OPD/IPD Invoices • Multi-Mode Collections (UPI/Card/Cash/TPA) • Tax Receipts
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate New Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Invoiced Amount</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{invoices.length} Invoices generated</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Collected Revenue</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalCollected.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Settled in hospital accounts</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Outstanding Balance</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">₹{totalOutstanding.toLocaleString()}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Pending collections & insurance</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Patient Invoices</h3>
          <span className="text-xs text-slate-400">{invoices.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold">Invoice #</th>
                <th className="p-3 font-semibold">Patient</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Paid</th>
                <th className="p-3 font-semibold">Balance</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const statusBadges = {
                  paid: 'bg-emerald-100 text-emerald-800',
                  partial: 'bg-amber-100 text-amber-800',
                  unpaid: 'bg-rose-100 text-rose-800',
                  refunded: 'bg-slate-100 text-slate-600'
                };

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{inv.patientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.patientUhid}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[10px]">
                        {inv.invoiceType}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-slate-900">₹{inv.totalAmount.toLocaleString()}</td>
                    <td className="p-3 text-emerald-600 font-semibold">₹{inv.amountPaid.toLocaleString()}</td>
                    <td className="p-3 text-amber-600 font-semibold">₹{Math.max(0, inv.balanceDue).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusBadges[inv.paymentStatus]}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEditInvoice(inv)}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          Adjust
                        </button>
                        {inv.paymentStatus !== 'paid' ? (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentAmount(String(inv.balanceDue));
                              setShowPaymentModal(true);
                            }}
                            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded shadow-xs transition-colors"
                          >
                            Collect
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: GENERATE INVOICE */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Generate Patient Bill / Invoice</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.uhid}) - {p.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Type</label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                >
                  <option value="OPD">OPD Consultation & Care</option>
                  <option value="IPD">Inpatient Bed & Procedures</option>
                  <option value="Laboratory">Laboratory Diagnostics</option>
                  <option value="Pharmacy">Pharmacy Dispense</option>
                </select>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Billable Line Items</span>
                  <button type="button" onClick={handleAddItem} className="text-xs text-indigo-600 font-semibold hover:underline">
                    + Add Item
                  </button>
                </div>
                {items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].description = e.target.value;
                        setItems(updated);
                      }}
                      className="flex-1 text-xs p-2 rounded border border-slate-200 bg-slate-50"
                      placeholder="Item description"
                      required
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0;
                        const updated = [...items];
                        updated[idx].unitPrice = price;
                        updated[idx].total = price * updated[idx].quantity;
                        setItems(updated);
                      }}
                      className="w-24 text-xs p-2 rounded border border-slate-200 bg-slate-50 text-right font-bold"
                      placeholder="Amount"
                      required
                    />
                    {items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-500 p-1">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COLLECT PAYMENT */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record Payment & Settle Invoice</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500">Invoice: <strong className="text-slate-800">{selectedInvoice.invoiceNumber}</strong></div>
                <div className="text-slate-500">Patient: <strong className="text-slate-800">{selectedInvoice.patientName}</strong></div>
                <div className="text-slate-500">Total Billed: ₹{selectedInvoice.totalAmount} • Remaining: <strong className="text-amber-700">₹{selectedInvoice.balanceDue}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-emerald-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none capitalize"
                >
                  <option value="upi">UPI / QR Code</option>
                  <option value="cash">Cash Settlement</option>
                  <option value="card">Debit / Credit Card POS</option>
                  <option value="insurance">Insurance / TPA Claim</option>
                  <option value="bank_transfer">Bank NEFT / RTGS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Transaction ID</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI/2611200921/8892 or Bank UTR"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Confirm & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / ADJUST INVOICE */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust / Edit Patient Bill</h3>
                <p className="text-xs text-slate-400">{editingInvoice.invoiceNumber} • {editingInvoice.patientName} ({editingInvoice.patientUhid})</p>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceEdit} className="space-y-4 text-xs">
              {/* Existing Items */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current Line Items</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {editingInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-800">{item.description}</div>
                        <div className="text-[10px] text-slate-400">{item.category} • Qty {item.quantity}</div>
                      </div>
                      <span className="font-bold text-slate-900">₹{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Line Item */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">+ Add Extra Charge / Procedure</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="e.g. ECG Recording / Dressing"
                      value={editItemDesc}
                      onChange={(e) => setEditItemDesc(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Amount ₹"
                      value={editItemPrice}
                      onChange={(e) => setEditItemPrice(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Discount Adjustment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-amber-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save Bill Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

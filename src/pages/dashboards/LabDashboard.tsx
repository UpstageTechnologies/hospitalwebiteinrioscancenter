import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { LabOrder } from '../../types/clinical';
import {
  Microscope,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  FileCheck,
  X,
  XCircle,
  Check,
  ChevronRight,
  User
} from 'lucide-react';

export const LabDashboard: React.FC = () => {
  const { labOrders, updateLabOrderStatus } = useHospital();
  const { currentUser } = useAuth();

  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultVal, setResultVal] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleOpenResultModal = (order: LabOrder) => {
    setSelectedOrder(order);
    setResultVal(order.resultValue || '');
    setIsAbnormal(order.isAbnormal || false);
    setRemarks(order.remarks || '');
    setShowResultModal(true);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !resultVal) return;

    const nextStatus = selectedOrder.sampleStatus === 'verified'
      ? 'verified'
      : 'completed';

    await updateLabOrderStatus(selectedOrder.id, nextStatus, {
      resultValue: resultVal,
      isAbnormal,
      remarks,
      verifiedBy: selectedOrder.verifiedBy || currentUser?.name || 'Lab Technician'
    });

    setShowResultModal(false);
    setSelectedOrder(null);
  };

  const handleAdvanceStatus = async (order: LabOrder) => {
    if (order.sampleStatus === 'pending' || order.sampleStatus === 'pending_collection') {
      await updateLabOrderStatus(order.id, 'collected');
    } else if (order.sampleStatus === 'collected') {
      await updateLabOrderStatus(order.id, 'in_process');
    } else if (order.sampleStatus === 'in_process') {
      handleOpenResultModal(order);
    } else if (order.sampleStatus === 'completed') {
      await updateLabOrderStatus(order.id, 'verified', {
        verifiedBy: currentUser?.name || 'Dr. Pathologist'
      });
    }
  };

  const handleCancelTest = async (orderId: string) => {
    if (window.confirm('Cancel this diagnostic test? The test fee will be set to ₹0 on the patient bill.')) {
      await updateLabOrderStatus(orderId, 'cancelled');
    }
  };

  const filteredOrders = labOrders.filter(o => {
    const q = searchTerm.toLowerCase();
    const matchSearch = o.patientName.toLowerCase().includes(q) ||
      o.patientUhid.toLowerCase().includes(q) ||
      o.testName.toLowerCase().includes(q) ||
      o.orderNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.sampleStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Microscope className="w-5 h-5 text-amber-600" />
            Laboratory Diagnostic Workflow & Specimen Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            5-Stage Pipeline: Pending &rarr; Collected &rarr; Processing &rarr; Completed &rarr; Verified • Automatic Invoicing
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl border border-slate-200 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'all', label: 'All Tests' },
            { id: 'pending', label: 'Pending' },
            { id: 'collected', label: 'Collected' },
            { id: 'in_process', label: 'Processing' },
            { id: 'completed', label: 'Completed' },
            { id: 'verified', label: 'Verified' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                statusFilter === tab.id ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
            placeholder="Search by patient name, UHID, test name (e.g. CBC), order number..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 px-2 whitespace-nowrap">
          {filteredOrders.length} Orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Patient / UHID</th>
                <th className="py-3 px-4">Test Name & Category</th>
                <th className="py-3 px-4">Sample Type</th>
                <th className="py-3 px-4">Result / Observation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Fee (₹)</th>
                <th className="py-3 px-4 text-right">Pipeline Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No laboratory diagnostic orders found for this view.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isCancelled = order.sampleStatus === 'cancelled';
                  const isVerified = order.sampleStatus === 'verified';
                  const isCompleted = order.sampleStatus === 'completed';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{order.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{order.patientUhid} • {order.doctorName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{order.testName}</div>
                        <div className="text-[10px] text-slate-400">{order.testCategory}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {order.sampleType || 'Whole Blood'}
                      </td>
                      <td className="py-3.5 px-4">
                        {order.resultValue ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-mono font-bold ${order.isAbnormal ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {order.resultValue} {order.unit}
                            </span>
                            {order.isAbnormal && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                ABNORMAL
                              </span>
                            )}
                            {!isCancelled && (
                              <button
                                onClick={() => handleOpenResultModal(order)}
                                className="text-[10px] text-amber-700 hover:text-amber-900 underline font-semibold ml-1 cursor-pointer"
                                title="Edit entered diagnostic result"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            {order.sampleStatus === 'in_process' ? (
                              <button
                                onClick={() => handleOpenResultModal(order)}
                                className="text-amber-600 hover:text-amber-800 underline font-semibold cursor-pointer"
                              >
                                Enter Result
                              </button>
                            ) : (
                              'Awaiting specimen'
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          isCompleted ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          order.sampleStatus === 'in_process' ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse' :
                          order.sampleStatus === 'collected' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          isCancelled ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.sampleStatus.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {isCancelled ? (
                          <span className="text-slate-400 line-through">₹{order.cost}</span>
                        ) : (
                          <span>₹{order.cost}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCancelled && !isVerified && (
                            <button
                              onClick={() => handleAdvanceStatus(order)}
                              className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs flex items-center gap-1"
                            >
                              {order.sampleStatus === 'pending' || order.sampleStatus === 'pending_collection'
                                ? 'Collect Sample'
                                : order.sampleStatus === 'collected'
                                ? 'Start Processing'
                                : order.sampleStatus === 'in_process'
                                ? 'Enter Results'
                                : 'Sign & Verify'}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {isVerified && (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}

                          {!isCancelled && !isVerified && (
                            <button
                              onClick={() => handleCancelTest(order.id)}
                              className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Cancel test (zero charges on patient bill)"
                            >
                              Cancel
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

      {/* RESULT ENTRY MODAL */}
      {showResultModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enter Diagnostic Results</h3>
                <p className="text-xs text-slate-500">{selectedOrder.testName} • {selectedOrder.patientName}</p>
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResult} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observed Value / Result *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 13.6, Normal, 98 mg/dL"
                  value={resultVal}
                  onChange={(e) => setResultVal(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biological Reference Range
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedOrder.referenceRange || 'Normal Biological Interval'}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="abnormalCheck"
                  checked={isAbnormal}
                  onChange={(e) => setIsAbnormal(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="abnormalCheck" className="font-bold text-rose-700 cursor-pointer">
                  Mark as ABNORMAL / Critical Pathology Flag
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Technician / Pathologist Remarks
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Notes, methodology, or clinical correlation advised..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save & Sync to Patient Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

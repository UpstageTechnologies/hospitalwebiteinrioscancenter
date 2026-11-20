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
  X
} from 'lucide-react';

export const LabDashboard: React.FC = () => {
  const { labOrders, updateLabOrderResult, verifyLabOrder } = useHospital();
  const { currentUser } = useAuth();

  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultVal, setResultVal] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [remarks, setRemarks] = useState('');

  const handleOpenResultModal = (order: LabOrder) => {
    setSelectedOrder(order);
    setResultVal(order.resultValue || '');
    setIsAbnormal(order.isAbnormal || false);
    setRemarks(order.remarks || '');
    setShowResultModal(true);
  };

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !resultVal) return;

    updateLabOrderResult(selectedOrder.id, resultVal, isAbnormal, remarks);
    setShowResultModal(false);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Microscope className="w-5 h-5 text-amber-600" />
            Laboratory Diagnostic Workflow & Pathologist Verification
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Specimen Tracking • Normal Biological Reference Ranges • Pathologist Sign-off
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Diagnostic Test Orders</h3>
          <span className="text-xs text-slate-400">{labOrders.length} Orders</span>
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold">Order #</th>
                <th className="p-3 font-semibold">Patient</th>
                <th className="p-3 font-semibold">Test Name</th>
                <th className="p-3 font-semibold">Sample Type</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Result Value</th>
                <th className="p-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {labOrders.map((order) => {
                const statusBadges = {
                  pending_collection: 'bg-slate-100 text-slate-700',
                  collected: 'bg-blue-100 text-blue-800',
                  in_process: 'bg-amber-100 text-amber-800',
                  completed: 'bg-purple-100 text-purple-800',
                  verified: 'bg-emerald-100 text-emerald-800 font-bold'
                };

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{order.patientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{order.patientUhid}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{order.testName}</div>
                      <div className="text-[10px] text-slate-400">{order.testCategory}</div>
                    </td>
                    <td className="p-3 text-slate-600">{order.sampleType}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${statusBadges[order.sampleStatus]}`}>
                        {order.sampleStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      {order.resultValue ? (
                        <div>
                          <div className={`font-semibold ${order.isAbnormal ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                            {order.resultValue}
                          </div>
                          <div className="text-[10px] text-slate-400">Ref: {order.referenceRange}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending entry</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {order.sampleStatus !== 'verified' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenResultModal(order)}
                            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded"
                          >
                            Enter Results
                          </button>
                          {order.sampleStatus === 'completed' && (
                            <button
                              onClick={() => verifyLabOrder(order.id, currentUser?.name || 'Dr. Pathologist')}
                              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded shadow-xs"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Verified & Signed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ENTER TEST RESULTS */}
      {showResultModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Enter Diagnostic Findings</h3>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveResult} className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>Test: <strong className="text-slate-800">{selectedOrder.testName}</strong></div>
                <div>Patient: <strong className="text-slate-800">{selectedOrder.patientName}</strong> ({selectedOrder.patientUhid})</div>
                <div className="text-slate-500">Biological Reference Range: {selectedOrder.referenceRange} {selectedOrder.unit}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Result Observation *</label>
                <input
                  type="text"
                  value={resultVal}
                  onChange={(e) => setResultVal(e.target.value)}
                  placeholder="e.g. 154 mg/dL or Negative / Reactive"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="abnormalFlag"
                  checked={isAbnormal}
                  onChange={(e) => setIsAbnormal(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="abnormalFlag" className="text-xs font-semibold text-rose-700 cursor-pointer">
                  Flag as Abnormal / Critical Value Alert
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pathologist Remarks / Impression</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Clinical significance, advice for repeat sample..."
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs"
                >
                  Save Result Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

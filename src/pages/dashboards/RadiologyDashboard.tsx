import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { RadiologyOrder } from '../../types/clinical';
import {
  Scan,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FileText,
  X,
  Eye,
  Camera,
  AlertTriangle,
  Sparkles,
  Download,
  Printer
} from 'lucide-react';

export const RadiologyDashboard: React.FC = () => {
  const { radiologyOrders, updateRadiologyStatus, saveRadiologyReport } = useHospital();
  const { currentUser } = useAuth();

  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrder | null>(null);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [radiologistName, setRadiologistName] = useState(
    currentUser?.name || 'Dr. K. N. Rao (Consultant Radiologist)'
  );

  // DICOM Viewer Simulator Modal State
  const [showDicomModal, setShowDicomModal] = useState(false);
  const [dicomOrder, setDicomOrder] = useState<RadiologyOrder | null>(null);
  const [contrastMode, setContrastMode] = useState<'bone' | 'lung' | 'soft_tissue'>('bone');

  const filteredOrders = radiologyOrders.filter(order => {
    const matchesModality = selectedModality === 'all' || order.modality === selectedModality;
    const matchesSearch =
      order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patientUhid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.bodyPart.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModality && matchesSearch;
  });

  const totalScans = radiologyOrders.length;
  const scheduledCount = radiologyOrders.filter(o => o.status === 'scheduled').length;
  const inProgressCount = radiologyOrders.filter(o => o.status === 'in_progress').length;
  const completedCount = radiologyOrders.filter(o => o.status === 'reported' || o.status === 'verified').length;

  const handleOpenReportModal = (order: RadiologyOrder) => {
    setSelectedOrder(order);
    setFindings(order.findings || 'Bilateral lung fields clear. Cardiac silhouette within normal limits. Diaphragm contours normal.');
    setImpression(order.impression || 'Normal study. No active focal pathology observed.');
    setShowReportModal(true);
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    saveRadiologyReport(selectedOrder.id, findings, impression, radiologistName);
    setShowReportModal(false);
    setSelectedOrder(null);
  };

  const handleOpenDicomViewer = (order: RadiologyOrder) => {
    setDicomOrder(order);
    setShowDicomModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Scan className="w-5 h-5 text-indigo-600" />
            Radiology Diagnostic Imaging & PACS Workstation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Digital Radiography (X-Ray) • 128-Slice CT • 3T MRI • 4D Doppler Ultrasound • Diagnostic Tele-reporting
          </p>
        </div>

        {/* Quick Modality Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold bg-slate-100 p-1 rounded-xl">
          {['all', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'ECG'].map(mod => (
            <button
              key={mod}
              onClick={() => setSelectedModality(mod)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize whitespace-nowrap ${
                selectedModality === mod
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalScans}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all diagnostic modalities</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Scheduled Queue</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{scheduledCount}</div>
          <div className="text-[10px] text-amber-500 mt-0.5">Awaiting patient positioning</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">In Acquisition</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{inProgressCount}</div>
          <div className="text-[10px] text-indigo-500 mt-0.5">Scanning / PACS upload</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Verified Reports</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{completedCount}</div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Signed by Consultant Radiologist</div>
        </div>
      </div>

      {/* Main Radiology Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient Name, UHID, Scan Order # or Body Part..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredOrders.length}</span> active scan orders
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order # & Modality</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Investigation & Clinical Indication</th>
                <th className="py-3 px-4">Prescribing Doctor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workstation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No radiology orders match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const modalityColors: Record<string, string> = {
                    'X-Ray': 'bg-blue-50 text-blue-700 border-blue-200',
                    'CT Scan': 'bg-purple-50 text-purple-700 border-purple-200',
                    'MRI': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    'Ultrasound': 'bg-teal-50 text-teal-700 border-teal-200',
                    'ECG': 'bg-rose-50 text-rose-700 border-rose-200'
                  };

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{order.orderNumber}</div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${modalityColors[order.modality] || 'bg-slate-100 text-slate-700'}`}>
                          {order.modality}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{order.patientName}</div>
                        <div className="text-[11px] text-slate-400">{order.patientUhid}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-800">{order.bodyPart}</div>
                        <div className="text-[11px] text-slate-500 truncate" title={order.clinicalIndication}>
                          Indication: {order.clinicalIndication}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{order.doctorName}</div>
                        <div className="text-[10px] text-slate-400">Clinical Referrer</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            order.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'reported'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : order.status === 'in_progress'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span className="capitalize">{order.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'scheduled' && (
                            <button
                              onClick={() => updateRadiologyStatus(order.id, 'in_progress')}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" /> Start Scan
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDicomViewer(order)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1"
                            title="Open DICOM PACS Viewer Simulator"
                          >
                            <Eye className="w-3.5 h-3.5" /> DICOM
                          </button>

                          {(order.status === 'in_progress' || order.status === 'reported') && (
                            <button
                              onClick={() => handleOpenReportModal(order)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> Report
                            </button>
                          )}

                          {order.status === 'verified' && (
                            <button
                              onClick={() => handleOpenReportModal(order)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> View Signed
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

      {/* Modal 1: Radiologist Report Modal */}
      {showReportModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Radiology Formal Report & Digital Sign-off
                  </h3>
                  <p className="text-xs text-slate-400">
                    Order: <span className="font-semibold text-slate-700">{selectedOrder.orderNumber}</span> • {selectedOrder.modality} ({selectedOrder.bodyPart})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Patient Header Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
                <span className="font-bold text-slate-800">{selectedOrder.patientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">UHID</span>
                <span className="font-bold text-slate-800">{selectedOrder.patientUhid}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Indication</span>
                <span className="font-medium text-slate-700">{selectedOrder.clinicalIndication}</span>
              </div>
            </div>

            <form onSubmit={handleSaveReport} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Detailed Radiological Findings:
                </label>
                <textarea
                  rows={4}
                  required
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Describe anatomy, density, bone cortex, soft tissue margins, presence of mass or effusion..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Impression / Diagnosis Summary:
                </label>
                <textarea
                  rows={2}
                  required
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="Key diagnostic summary e.g. Normal Study, Consolidation Right Lower Lobe..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-semibold font-sans"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Attending Radiologist Digital Signature:
                </label>
                <input
                  type="text"
                  required
                  value={radiologistName}
                  onChange={(e) => setRadiologistName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save & Electronically Sign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: DICOM PACS Viewer Simulator */}
      {showDicomModal && dicomOrder && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    DICOM High-Resolution PACS Workstation
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Patient: <span className="text-white font-semibold">{dicomOrder.patientName}</span> ({dicomOrder.patientUhid}) • Modality: {dicomOrder.modality} • {dicomOrder.bodyPart}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDicomModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DICOM Radiography Screen Simulation */}
            <div className="relative bg-black rounded-2xl h-80 sm:h-96 flex items-center justify-center border border-slate-800 overflow-hidden select-none">
              {/* Radiography Simulation Graphic */}
              <div className="text-center space-y-3">
                <div className="w-48 h-48 mx-auto rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 bg-slate-950 p-4">
                  <Scan className="w-16 h-16 text-indigo-400 animate-pulse mb-2" />
                  <span className="text-xs font-bold text-slate-300">{dicomOrder.modality} Study</span>
                  <span className="text-[10px] text-slate-500">{dicomOrder.bodyPart}</span>
                  <span className="text-[9px] text-emerald-400 font-mono mt-2 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    512 x 512 x 16-bit DICOM
                  </span>
                </div>
              </div>

              {/* Watermark / DICOM Telemetry Overlays */}
              <div className="absolute top-4 left-4 font-mono text-[10px] text-emerald-400/80 leading-relaxed space-y-0.5">
                <div>UPSTAGE HOSPITAL NEW DELHI</div>
                <div>ID: {dicomOrder.patientUhid}</div>
                <div>MOD: {dicomOrder.modality}</div>
                <div>KV: 120 / MAS: 250</div>
              </div>

              <div className="absolute top-4 right-4 font-mono text-[10px] text-emerald-400/80 text-right leading-relaxed space-y-0.5">
                <div>W/L: 400/40 ({contrastMode.toUpperCase()})</div>
                <div>SERIES: 01 / IMAGE: 14</div>
                <div>ZOOM: 100%</div>
              </div>

              <div className="absolute bottom-4 left-4 font-mono text-[10px] text-slate-500">
                LOSSLESS DICOM v3.0 COMPLIANT
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-semibold">Window Presets:</span>
                {(['bone', 'lung', 'soft_tissue'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setContrastMode(mode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                      contrastMode === mode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowDicomModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

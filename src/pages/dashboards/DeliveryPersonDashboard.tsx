import React, { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import type { DeliveryStatus, HospitalDelivery } from '../../types/delivery';
import {
  Truck,
  Package,
  MapPin,
  User,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  PhoneCall,
  Calendar,
  Layers,
  Send,
  Navigation
} from 'lucide-react';

export const DeliveryPersonDashboard: React.FC = () => {
  const { deliveries, acceptDelivery, rejectDelivery, updateDeliveryStatus, employees, updateEmployee } = useHospital();
  const { currentUser, currentHospital } = useAuth();

  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'completed' | 'all'>('active');
  const [rejectModalDelivery, setRejectModalDelivery] = useState<HospitalDelivery | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // Identify current delivery person employee record
  const currentEmployee = useMemo(() => {
    if (!currentUser) return null;
    return employees.find(
      (e) =>
        e.id === currentUser.id ||
        (currentUser.employeeCode && e.employeeCode === currentUser.employeeCode) ||
        (currentUser.employeeLoginId && e.employeeLoginId === currentUser.employeeLoginId)
    ) || currentUser;
  }, [currentUser, employees]);

  const deliveryPersonId = currentEmployee?.id || 'emp-del-01';
  const deliveryPersonName = currentEmployee?.name || 'Hospital Delivery Partner';

  // Strict Security & Isolation: Filter deliveries belonging ONLY to this Delivery Person
  const myDeliveries = useMemo(() => {
    return deliveries
      .filter((d) => d.deliveryPersonId === deliveryPersonId || d.deliveryPersonName === deliveryPersonName)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [deliveries, deliveryPersonId, deliveryPersonName]);

  // Statistics
  const pendingRequests = myDeliveries.filter((d) => d.status === 'Assigned');
  const inTransitDeliveries = myDeliveries.filter((d) => d.status === 'Accepted' || d.status === 'Collected' || d.status === 'On the Way');
  const completedDeliveries = myDeliveries.filter((d) => d.status === 'Delivered');

  // Filtered list
  const filteredDeliveries = useMemo(() => {
    if (activeTab === 'pending') {
      return myDeliveries.filter((d) => d.status === 'Assigned');
    }
    if (activeTab === 'active') {
      return myDeliveries.filter((d) => d.status === 'Assigned' || d.status === 'Accepted' || d.status === 'Collected' || d.status === 'On the Way');
    }
    if (activeTab === 'completed') {
      return myDeliveries.filter((d) => d.status === 'Delivered');
    }
    return myDeliveries;
  }, [myDeliveries, activeTab]);

  // Handle Accept
  const handleAccept = async (deliveryId: string) => {
    setIsUpdatingId(deliveryId);
    try {
      await acceptDelivery(deliveryId, deliveryPersonId);
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Handle Reject Submit
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalDelivery) return;
    setIsUpdatingId(rejectModalDelivery.id);
    try {
      await rejectDelivery(rejectModalDelivery.id, deliveryPersonId, rejectReason.trim() || 'Unavailable at this time');
      setRejectModalDelivery(null);
      setRejectReason('');
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Handle Sequential Next Status Progression
  const handleAdvanceStatus = async (delivery: HospitalDelivery, nextStatus: DeliveryStatus) => {
    setIsUpdatingId(delivery.id);
    try {
      await updateDeliveryStatus(delivery.id, deliveryPersonId, nextStatus);
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Toggle Delivery Person Availability Status
  const handleToggleAvailability = (newStatus: 'available' | 'busy' | 'offline') => {
    if (!currentEmployee?.id) return;
    updateEmployee(currentEmployee.id, {
      availabilityStatus: newStatus,
      lastAvailabilityUpdate: new Date().toISOString()
    });
  };

  const currentAvailability = currentEmployee?.availabilityStatus || 'available';

  return (
    <div className="space-y-6 pb-16 animate-in fade-in select-none">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {deliveryPersonName}
              </h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentEmployee?.employeeCode || 'DP-STAFF'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hospital Delivery Partner • Live Delivery Tracking & Fulfillments
            </p>
          </div>
        </div>

        {/* Live Availability Toggle */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-slate-500 px-2">Status:</span>
          <button
            type="button"
            onClick={() => handleToggleAvailability('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentAvailability === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Available</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleAvailability('busy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentAvailability === 'busy'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Busy</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleAvailability('offline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentAvailability === 'offline'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Offline</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Acceptance */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">New Requests</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {pendingRequests.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Awaiting your accept/reject</span>
        </div>

        {/* Card 2: Active In-Transit */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">In Transit</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {inTransitDeliveries.length}
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1">Accepted, Collected or On Way</span>
        </div>

        {/* Card 3: Delivered Today */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Delivered</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
            {completedDeliveries.length}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1">Successfully fulfilled</span>
        </div>

        {/* Card 4: Compliance / Security */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Assigned</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {myDeliveries.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">All hospital delivery trips</span>
        </div>
      </div>

      {/* Main Deliveries Section */}
      <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>Assigned Hospital Deliveries</span>
            </h2>
            <p className="text-xs text-slate-500">
              Update sequential delivery milestones from collection to final patient delivery
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({inTransitDeliveries.length + pendingRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Requests ({pendingRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delivered ({completedDeliveries.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({myDeliveries.length})
            </button>
          </div>
        </div>

        {/* Deliveries List */}
        {filteredDeliveries.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No deliveries found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === 'pending'
                ? 'No new delivery requests awaiting your response.'
                : activeTab === 'active'
                ? 'No active in-transit deliveries. New assignments from staff will appear here.'
                : 'No delivery history recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => {
              const isAssigned = delivery.status === 'Assigned';
              const isAccepted = delivery.status === 'Accepted';
              const isCollected = delivery.status === 'Collected';
              const isOnTheWay = delivery.status === 'On the Way';
              const isDelivered = delivery.status === 'Delivered';
              const isRejected = delivery.status === 'Rejected';
              const isExpanded = expandedDeliveryId === delivery.id;
              const isBusyThis = isUpdatingId === delivery.id;

              return (
                <div
                  key={delivery.id}
                  className={`rounded-3xl border p-5 sm:p-6 transition-all duration-200 ${
                    isAssigned
                      ? 'bg-amber-50/50 border-amber-200 shadow-sm'
                      : isDelivered
                      ? 'bg-slate-50/60 border-slate-200/80'
                      : 'bg-white border-slate-200/80 shadow-xs hover:border-indigo-200'
                  }`}
                >
                  {/* Delivery Top Row: Code, Status Badge, Time */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-900 text-white shadow-2xs">
                        {delivery.deliveryId}
                      </span>
                      {delivery.packageDescription && (
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">
                          {delivery.packageDescription}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Sequential Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isOnTheWay
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : isCollected
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : isAccepted
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : isAssigned
                            ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isDelivered
                              ? 'bg-emerald-500'
                              : isOnTheWay
                              ? 'bg-purple-500'
                              : isCollected
                              ? 'bg-indigo-500'
                              : isAccepted
                              ? 'bg-sky-500'
                              : isAssigned
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {delivery.status}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(delivery.updatedAt || delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* 4 Essential Fields Display: Address, Receiver, Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4">
                    {/* Destination Address */}
                    <div className="md:col-span-6 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500" /> Destination Address
                      </span>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        {delivery.deliveryAddress}
                      </p>
                    </div>

                    {/* Receiver Name & Contact */}
                    <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <User className="w-3 h-3 text-indigo-500" /> Receiver Name
                        </span>
                        <div className="text-xs font-bold text-slate-900 bg-slate-50 p-3 rounded-2xl border border-slate-100 truncate">
                          {delivery.receiverName}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Phone className="w-3 h-3 text-indigo-500" /> Receiver Contact
                        </span>
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {delivery.receiverContact}
                          </span>
                          <a
                            href={`tel:${delivery.receiverContact.replace(/[^0-9+]/g, '')}`}
                            className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                            title="Call Receiver"
                          >
                            <PhoneCall className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sequential Action Controls & Audit Trail Toggle */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedDeliveryId(isExpanded ? null : delivery.id)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Status History ({delivery.statusHistory?.length || 1} logs)</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Sequential Status Progression Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Stage 1: Assigned -> Accept or Reject */}
                      {isAssigned && (
                        <>
                          <button
                            type="button"
                            disabled={isBusyThis}
                            onClick={() => setRejectModalDelivery(delivery)}
                            className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Decline</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusyThis}
                            onClick={() => handleAccept(delivery.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept Assignment</span>
                          </button>
                        </>
                      )}

                      {/* Stage 2: Accepted -> Collect Package */}
                      {isAccepted && (
                        <button
                          type="button"
                          disabled={isBusyThis}
                          onClick={() => handleAdvanceStatus(delivery, 'Collected')}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Mark as Collected (Package Picked Up)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Stage 3: Collected -> Start Trip (On the Way) */}
                      {isCollected && (
                        <button
                          type="button"
                          disabled={isBusyThis}
                          onClick={() => handleAdvanceStatus(delivery, 'On the Way')}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Start Delivery • On the Way</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Stage 4: On the Way -> Delivered */}
                      {isOnTheWay && (
                        <button
                          type="button"
                          disabled={isBusyThis}
                          onClick={() => handleAdvanceStatus(delivery, 'Delivered')}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Delivered & Hand Over</span>
                        </button>
                      )}

                      {/* Completed Badge */}
                      {isDelivered && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Delivered at {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done'}</span>
                        </span>
                      )}

                      {/* Declined Badge */}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Declined ({delivery.rejectionReason || 'Unavailable'})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expandable Audit History Timeline */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl space-y-3 animate-in fade-in">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Complete Delivery Status History
                      </span>
                      <div className="space-y-2">
                        {delivery.statusHistory?.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{step.status}</span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {new Date(step.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {step.notes && <p className="text-[11px] text-slate-500">{step.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Confirmation Dialog */}
      {rejectModalDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Decline Delivery Assignment</h3>
                <p className="text-xs text-slate-500">Assignment: {rejectModalDelivery.deliveryId}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Declining (Optional):
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Currently on emergency medicine run, vehicle flat tire..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalDelivery(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

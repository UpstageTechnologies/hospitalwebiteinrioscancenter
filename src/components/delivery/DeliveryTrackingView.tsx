import React, { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import type { DeliveryStatus, HospitalDelivery } from '../../types/delivery';
import { DeliveryAssignmentModal } from './DeliveryAssignmentModal';
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
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  History,
  PhoneCall,
  ShieldCheck,
  Calendar,
  Navigation,
  RefreshCw
} from 'lucide-react';

export const DeliveryTrackingView: React.FC = () => {
  const { deliveries, employees } = useHospital();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeliveryStatus>('all');
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  // Delivery Person Staff Stats
  const deliveryStaff = useMemo(() => {
    return employees.filter(
      (e) =>
        e.status === 'active' &&
        (e.primaryRole === 'delivery_person' || e.additionalRoles?.includes('delivery_person'))
    );
  }, [employees]);

  const availableStaffCount = deliveryStaff.filter(
    (s) => (s.availabilityStatus || 'available') === 'available'
  ).length;

  // Real-time Sorted Deliveries
  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  }, [deliveries]);

  // Statistics
  const totalDeliveries = sortedDeliveries.length;
  const inTransitCount = sortedDeliveries.filter(
    (d) => d.status === 'Accepted' || d.status === 'Collected' || d.status === 'On the Way'
  ).length;
  const assignedPendingCount = sortedDeliveries.filter((d) => d.status === 'Assigned').length;
  const deliveredCount = sortedDeliveries.filter((d) => d.status === 'Delivered').length;

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    return sortedDeliveries.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchCode = d.deliveryId?.toLowerCase().includes(q);
        const matchPerson = d.deliveryPersonName?.toLowerCase().includes(q);
        const matchReceiver = d.receiverName?.toLowerCase().includes(q);
        const matchPhone = d.receiverContact?.toLowerCase().includes(q);
        const matchAddress = d.deliveryAddress?.toLowerCase().includes(q);
        const matchPkg = d.packageDescription?.toLowerCase().includes(q);
        if (!matchCode && !matchPerson && !matchReceiver && !matchPhone && !matchAddress && !matchPkg) {
          return false;
        }
      }
      return true;
    });
  }, [sortedDeliveries, statusFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in select-none">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold shadow-xs">
            <Truck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Live Hospital Delivery Tracking
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Real-time Active" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time delivery status, dispatch history & partner tracking
            </p>
          </div>
        </div>

        {/* Assign New Delivery Button */}
        <button
          type="button"
          onClick={() => setIsAssignModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Assign New Delivery</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: In Transit */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">In Transit</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-900 mt-2">
            {inTransitCount}
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1">
            Collected or On the Way
          </span>
        </div>

        {/* Card 2: Awaiting Accept */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Accept</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-2">
            {assignedPendingCount}
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1">
            Dispatched to driver
          </span>
        </div>

        {/* Card 3: Delivered */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Delivered</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
            {deliveredCount}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1">
            Fulfilled successfully
          </span>
        </div>

        {/* Card 4: Available Delivery Staff */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Available Partners</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {availableStaffCount} / {deliveryStaff.length}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1">
            Ready for next assignment
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search delivery ID, receiver, phone, driver, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Statuses ({totalDeliveries})</option>
              <option value="Assigned">Assigned</option>
              <option value="Accepted">Accepted</option>
              <option value="Collected">Collected</option>
              <option value="On the Way">On the Way</option>
              <option value="Delivered">Delivered</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-3">Delivery ID & Package</th>
                <th className="py-3 px-4">Delivery Person</th>
                <th className="py-3 px-4">Receiver & Contact</th>
                <th className="py-3 px-4">Destination Address</th>
                <th className="py-3 px-3">Current Status</th>
                <th className="py-3 px-3">Last Update</th>
                <th className="py-3 px-3 text-right">Action / History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Truck className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No deliveries found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "Assign New Delivery" to dispatch a new medicine or supply order.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const isAssigned = delivery.status === 'Assigned';
                  const isAccepted = delivery.status === 'Accepted';
                  const isCollected = delivery.status === 'Collected';
                  const isOnTheWay = delivery.status === 'On the Way';
                  const isDelivered = delivery.status === 'Delivered';
                  const isRejected = delivery.status === 'Rejected';
                  const isExpanded = expandedDeliveryId === delivery.id;

                  return (
                    <React.Fragment key={delivery.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Delivery ID & Package */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-black text-slate-900 block">
                              {delivery.deliveryId}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 line-clamp-1 max-w-[200px]" title={delivery.packageDescription}>
                              {delivery.packageDescription || 'Hospital Medical Delivery'}
                            </span>
                          </div>
                        </td>

                        {/* 2. Delivery Person */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {delivery.deliveryPersonName?.charAt(0) || 'D'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">
                                {delivery.deliveryPersonName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {delivery.deliveryPersonCode || 'DP-STAFF'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Receiver & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">
                              {delivery.receiverName}
                            </span>
                            <a
                              href={`tel:${delivery.receiverContact?.replace(/[^0-9+]/g, '')}`}
                              className="text-[11px] font-mono text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                            >
                              <PhoneCall className="w-2.5 h-2.5" />
                              <span>{delivery.receiverContact}</span>
                            </a>
                          </div>
                        </td>

                        {/* 4. Destination Address */}
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="flex items-start gap-1.5 text-xs text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed font-medium" title={delivery.deliveryAddress}>
                              {delivery.deliveryAddress}
                            </span>
                          </div>
                        </td>

                        {/* 5. Current Status */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
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
                        </td>

                        {/* 6. Last Status Update Date & Time */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5 text-slate-600 font-mono text-[11px]">
                            <span>
                              {new Date(delivery.updatedAt || delivery.createdAt).toLocaleDateString()}
                            </span>
                            <span className="block text-slate-400">
                              {new Date(delivery.updatedAt || delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        {/* 7. Action / History Toggle */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedDeliveryId(isExpanded ? null : delivery.id)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <History className="w-3.5 h-3.5 text-slate-400" />
                            <span>History</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Complete Status History Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 bg-slate-50/80 border-b border-slate-200/80">
                            <div className="p-4 sm:p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                                  <History className="w-4 h-4 text-indigo-600" />
                                  <span>Complete Status Audit Trail for {delivery.deliveryId}</span>
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Assigned At: {new Date(delivery.assignedAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                                {delivery.statusHistory?.map((step, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-xs text-indigo-900">
                                        {step.status}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400">
                                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-600 truncate">
                                      By: {step.updatedByName || step.updatedBy}
                                    </p>
                                    {step.notes && (
                                      <p className="text-[10px] text-slate-400 leading-tight">
                                        {step.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-Field Delivery Assignment Modal */}
      <DeliveryAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
      />
    </div>
  );
};

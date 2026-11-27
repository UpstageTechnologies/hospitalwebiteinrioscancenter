import React, { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import {
  X,
  Truck,
  MapPin,
  User,
  Phone,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';

interface DeliveryAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPackageDescription?: string;
}

export const DeliveryAssignmentModal: React.FC<DeliveryAssignmentModalProps> = ({
  isOpen,
  onClose,
  defaultPackageDescription
}) => {
  const { employees, assignDelivery } = useHospital();

  // Find all active and approved Delivery Person employees
  const deliveryPersons = useMemo(() => {
    return employees.filter(
      (e) =>
        e.status === 'active' &&
        (e.primaryRole === 'delivery_person' || e.additionalRoles?.includes('delivery_person'))
    );
  }, [employees]);

  // Exactly 4 Input Fields State
  const [selectedPersonId, setSelectedPersonId] = useState<string>(() => deliveryPersons[0]?.id || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverContact, setReceiverContact] = useState('');
  const [packageDescription, setPackageDescription] = useState(defaultPackageDescription || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected delivery person object & availability
  const selectedDeliveryPerson = useMemo(() => {
    return deliveryPersons.find((d) => d.id === selectedPersonId) || deliveryPersons[0] || null;
  }, [deliveryPersons, selectedPersonId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPersonId) {
      setErrorMsg('Please select an active Delivery Person.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMsg('Delivery Address is required.');
      return;
    }
    if (!receiverName.trim()) {
      setErrorMsg('Receiver Name is required.');
      return;
    }
    if (!receiverContact.trim()) {
      setErrorMsg('Receiver Contact Number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignDelivery({
        deliveryPersonId: selectedPersonId,
        deliveryAddress: deliveryAddress.trim(),
        receiverName: receiverName.trim(),
        receiverContact: receiverContact.trim(),
        packageDescription: packageDescription.trim() || undefined
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to dispatch delivery.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availability = selectedDeliveryPerson?.availabilityStatus || 'available';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Assign Hospital Delivery
              </h2>
              <p className="text-xs text-slate-500">
                Dispatch urgent medicine drops & medical supply transit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 4 Required Input Fields Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FIELD 1: Delivery Person & Live Availability */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Delivery Person *</span>
              </label>
              {selectedDeliveryPerson && (
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    availability === 'available'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : availability === 'busy'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      availability === 'available'
                        ? 'bg-emerald-500'
                        : availability === 'busy'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="capitalize">{availability}</span>
                </span>
              )}
            </div>

            {deliveryPersons.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                No active Delivery Person registered. Add an employee with role <strong>Delivery Person</strong> in Employee Management first.
              </div>
            ) : (
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                required
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-colors"
              >
                {deliveryPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.employeeCode}) • {p.availabilityStatus || 'available'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* FIELD 2: Delivery Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Delivery Address *</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Full destination address with flat/door number, street & city..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-colors resize-none placeholder-slate-400"
            />
          </div>

          {/* FIELD 3 & 4: Receiver Name & Receiver Contact Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Receiver Name *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sumantha Banerjee"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-colors placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                <span>4. Receiver Contact *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98112 34567"
                value={receiverContact}
                onChange={(e) => setReceiverContact(e.target.value)}
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-colors placeholder-slate-400 font-mono"
              />
            </div>
          </div>

          {/* Optional Package Context */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Package className="w-3 h-3 text-slate-400" />
              <span>Package Description (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Prescription #RX-101 Insulin Kit, Ward Supplies..."
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || deliveryPersons.length === 0}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Assign Delivery</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

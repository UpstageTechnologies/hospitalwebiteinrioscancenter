export type PaymentMethod = 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer';
export type InvoiceType = 'OPD' | 'IPD' | 'Pharmacy' | 'Laboratory' | 'Radiology' | 'Package' | 'Consolidated';

export interface BillItem {
  id: string;
  description: string;
  category: 'Consultation' | 'Bed Charges' | 'Lab Test' | 'Radiology' | 'Pharmacy' | 'Procedure' | 'Nursing';
  quantity: number;
  unitPrice: number;
  total: number;
  department?: 'doctor' | 'pharmacy' | 'laboratory' | 'ward';
  referenceId?: string;
}

export interface Invoice {
  id: string;
  hospitalId: string;
  invoiceNumber: string; // e.g. INV-2026-0512
  invoiceType: InvoiceType;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientPhone: string;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'refunded';
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  insuranceClaim?: {
    tpaName: string;
    policyNumber: string;
    claimAmount: number;
    claimStatus: 'submitted' | 'approved' | 'settled' | 'rejected';
  };
  createdAt: string;
  createdByStaffName: string;
  receiptNumber?: string;
  status?: 'active' | 'settled';
}

export interface HospitalExpense {
  id: string;
  hospitalId: string;
  expenseNumber: string;
  category: 'Salaries' | 'Medical Supplies' | 'Utilities' | 'Equipment Maintenance' | 'Pharmacy Restock' | 'Administrative';
  description: string;
  amount: number;
  paidTo: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  recordedByStaffName: string;
  voucherNumber: string;
}

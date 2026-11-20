export interface Medicine {
  id: string;
  hospitalId: string;
  code: string;
  name: string;
  genericName: string;
  category: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'IV Fluid' | 'Inhaler';
  manufacturer: string;
  unit: string;
  minStockAlertLevel: number;
  currentStock: number;
  batches: MedicineBatch[];
}

export interface MedicineBatch {
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  purchasePricePerUnit: number;
  sellingPricePerUnit: number;
  mrp: number;
}

export interface PharmacyDispense {
  id: string;
  hospitalId: string;
  dispenseNumber: string; // e.g. PHARM-2026-031
  prescriptionId?: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  prescribedDoctorName: string;
  dispensedByPharmacistName: string;
  dispensedAt: string;
  items: {
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentStatus: 'paid' | 'pending' | 'billed_to_ip';
}

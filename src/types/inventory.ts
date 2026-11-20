export interface GeneralInventoryItem {
  id: string;
  hospitalId: string;
  itemCode: string; // e.g. ST-PPE-01
  itemName: string;
  category: 'Surgical Disposables' | 'PPE & Hygiene' | 'Linens & Bedding' | 'Office & Admin' | 'Diagnostic Consumables' | 'Housekeeping Chemicals';
  unitOfMeasure: 'Box' | 'Piece' | 'Pack' | 'Litre' | 'Roll';
  currentStock: number;
  reorderLevel: number;
  unitCost: number;
  supplierName: string;
  lastRestockedDate: string;
  locationInStore: string;
}

export interface PurchaseOrder {
  id: string;
  hospitalId: string;
  poNumber: string; // e.g. PO-2026-088
  supplierName: string;
  supplierContact: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalAmount: number;
  status: 'draft' | 'ordered' | 'received_partial' | 'received_full' | 'cancelled';
  notes?: string;
}

export type DeliveryStatus = 'Assigned' | 'Accepted' | 'Collected' | 'On the Way' | 'Delivered' | 'Rejected';

export interface DeliveryStatusHistoryItem {
  status: DeliveryStatus;
  timestamp: string; // Server/client-generated ISO timestamp
  updatedBy: string; // Employee ID or actor identifier
  updatedByName?: string; // Display name
  notes?: string;
}

export interface HospitalDelivery {
  id: string; // e.g. "del-1732690000000"
  hospitalId: string;
  deliveryId: string; // Human-friendly code e.g. "DEL-2026-001"

  // Exactly the 4 input fields for assignment
  deliveryPersonId: string; // Assigned Delivery Person Employee ID
  deliveryPersonName: string; // Assigned Delivery Person Name
  deliveryPersonCode?: string; // e.g. "EMP-905"
  deliveryAddress: string; // Destination Address
  receiverName: string; // Receiver Name
  receiverContact: string; // Receiver Mobile/Contact Number

  // Contextual package / order description
  packageDescription?: string;

  // Status and Timestamps
  status: DeliveryStatus;
  assignedAt: string;
  acceptedAt?: string;
  collectedAt?: string;
  onTheWayAt?: string;
  deliveredAt?: string;
  rejectionReason?: string;

  // Complete Audit History of Status Transitions
  statusHistory: DeliveryStatusHistoryItem[];

  // Server timestamps
  createdAt: string;
  updatedAt: string;
}

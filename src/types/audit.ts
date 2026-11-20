import type { RoleId } from './roles';

export interface HospitalNotification {
  id: string;
  hospitalId: string;
  targetRole?: RoleId | 'all';
  targetUserId?: string;
  title: string;
  message: string;
  category: 'role_request' | 'clinical' | 'emergency' | 'billing' | 'pharmacy' | 'system' | 'lab';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  relatedRecordId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  hospitalId: string;
  actorId: string;
  actorName: string;
  actorRole: RoleId;
  action: string; // e.g. "ROLE_APPROVED", "PATIENT_CREATED", "PRESCRIPTION_ADDED", "PAYMENT_RECORDED"
  module: string;
  details: string;
  targetEntityId?: string;
  targetEntityType?: string;
  ipAddress?: string;
  timestamp: string;
}

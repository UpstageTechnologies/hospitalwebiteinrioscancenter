import type { RoleId } from './roles';

export interface RoleRequest {
  id: string;
  hospitalId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  currentPrimaryRole: RoleId;
  requestedRole: RoleId;
  requestType?: 'add' | 'remove';
  reason: string;
  requestedBy: {
    id: string;
    name: string;
    role: RoleId;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: {
    id: string;
    name: string;
  };
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

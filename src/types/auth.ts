import type { RoleId } from './roles';

export interface UserProfileDoc {
  uid: string;
  name: string;
  email: string;
  hospitalId: string;
  role: RoleId;
  status: 'active' | 'pending_approval' | 'rejected' | 'suspended';
  employeeId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HospitalDocument {
  hospitalId: string;
  hospitalName: string;
  ownerUid: string;
  code: string;
  address?: string;
  city: string;
  phone: string;
  email: string;
  createdAt: string;
  status: 'active' | 'suspended';
}

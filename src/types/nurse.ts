import type { RoleId } from './roles';

export type NurseTaskType =
  | 'Injection Administration'
  | 'Patient Assistance'
  | 'Check Patient Vitals'
  | 'Dressing Assistance'
  | 'Patient Transfer Assistance'
  | 'Doctor Assistance'
  | 'Ward Assistance'
  | 'Laboratory Assistance'
  | 'Other';

export type NurseTaskPriority = 'normal' | 'urgent';

export type NurseTaskStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type NurseAvailabilityStatus = 'available' | 'busy' | 'offline';

export interface NurseTask {
  id: string;
  hospitalId: string;
  taskId: string;
  nurseUid?: string;
  nurseStaffId: string; // Employee ID of assigned nurse
  nurseName: string;
  requestedByUid?: string;
  requestedByStaffId: string;
  requestedByName: string;
  requestedByRole: string;
  patientId?: string;
  patientName?: string;
  patientUhid?: string;
  taskType: NurseTaskType | string;
  description: string;
  priority: NurseTaskPriority;
  status: NurseTaskStatus;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  completionNotes?: string;
  rejectionReason?: string;
  clinicalOrderDetails?: {
    prescriptionId?: string;
    medicineName?: string;
    dosage?: string;
    route?: string;
    doctorInstructions?: string;
  };
}

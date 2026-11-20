export interface AmbulanceTrip {
  id: string;
  hospitalId: string;
  tripNumber: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  patientName: string;
  contactPhone: string;
  pickupLocation: string;
  destinationLocation: string;
  tripType: 'Emergency 108' | 'Transfer In' | 'Transfer Out' | 'Discharge Drop';
  status: 'assigned' | 'en_route_pickup' | 'patient_onboard' | 'reached_hospital' | 'completed' | 'cancelled';
  dispatchedAt: string;
  completedAt?: string;
  emergencyNotes?: string;
}

export interface HousekeepingTask {
  id: string;
  hospitalId: string;
  taskTitle: string;
  areaType: 'Ward' | 'ICU' | 'OT' | 'OPD' | 'Corridor / Restroom';
  locationName: string; // e.g. Ward 3 - Bed GW-04
  assignedStaffId: string;
  assignedStaffName: string;
  taskType: 'Terminal Cleaning (Disinfection)' | 'Routine Mopping' | 'Linen Change' | 'Spill Management' | 'Waste Clearance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'verified_by_supervisor';
  scheduledTime: string;
  completedAt?: string;
  notes?: string;
}

export interface SecurityEntry {
  id: string;
  hospitalId: string;
  passNumber: string; // e.g. VIS-2026-0091
  visitorName: string;
  visitorPhone: string;
  patientUhid?: string;
  patientName?: string;
  wardOrDepartment: string;
  badgeIssued: string;
  entryTime: string;
  exitTime?: string;
  status: 'inside' | 'checked_out';
  securityOfficerName: string;
  purpose: 'Patient Attendant' | 'Vendor Delivery' | 'Official Visitor';
}

export interface MaintenanceRequest {
  id: string;
  hospitalId: string;
  ticketNumber: string; // e.g. MNT-2026-042
  equipmentOrArea: string; // e.g. ICU Ventilator #2, AC Unit 4th Floor
  category: 'Biomedical Equipment' | 'Electrical' | 'Plumbing' | 'HVAC / Oxygen Line' | 'Civil / Furniture';
  reportedByDepartment: string;
  reportedByStaff: string;
  issueDescription: string;
  priority: 'low' | 'medium' | 'critical';
  assignedTechnicianName?: string;
  status: 'open' | 'in_repair' | 'parts_awaited' | 'resolved' | 'closed';
  reportedAt: string;
  resolvedAt?: string;
  resolutionRemarks?: string;
}

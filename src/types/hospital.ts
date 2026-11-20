export interface Hospital {
  id: string;
  name: string;
  tagline: string;
  code: string; // e.g. UPH-01
  address: string;
  city: string;
  phone: string;
  email: string;
  logoUrl?: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  activeModules: string[];
  settings: {
    currency: string;
    taxRate: number;
    opdConsultationValidityDays: number;
    emergencyContact: string;
    operatingHours: string;
  };
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  category: 'clinical' | 'diagnostic' | 'support' | 'administrative';
  headDoctorId?: string;
  headDoctorName?: string;
  isActive: boolean;
  totalBeds?: number;
  location?: string;
  operatingHours: string;
  description: string;
}

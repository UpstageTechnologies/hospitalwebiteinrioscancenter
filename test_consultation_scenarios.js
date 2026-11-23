import assert from 'node:assert';

console.log("==========================================================================");
console.log("TESTING CLINICAL CONSULTATION & ADMISSION PAYLOAD SCENARIOS");
console.log("Working Directory: ~/Desktop/UpstageHospitalwebsite");
console.log("==========================================================================\n");

// Simulated Firestore batch set validator ensuring NO unsupported undefined values
function validateFirestoreData(path, obj) {
  if (obj === undefined) {
    throw new Error(`FirebaseError: Function WriteBatch.set() called with invalid data. Unsupported field value: undefined at ${path}`);
  }
  if (obj === null || typeof obj !== 'object') {
    return;
  }
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = `${path}.${key}`;
    if (value === undefined) {
      throw new Error(`FirebaseError: Function WriteBatch.set() called with invalid data. Unsupported field value: undefined at ${currentPath}`);
    }
    if (typeof value === 'object' && value !== null) {
      validateFirestoreData(currentPath, value);
    }
  }
}

// Simulated Store
const mockDb = {
  consultations: {},
  admissionRequests: {},
  appointments: {},
  prescriptions: {},
  labOrders: {},
  bills: {}
};

function completeClinicalConsultationWorkflow(hospitalId, data) {
  const consultationId = `cons-${data.appointmentId}`;

  // Idempotency check
  if (mockDb.consultations[consultationId]) {
    return { consultationId, isDuplicate: true };
  }

  // 1. Build consultationRecord conditionally - NO UNDEFINED VALUES
  const consultationRecord = {
    id: consultationId,
    hospitalId,
    appointmentId: data.appointmentId,
    patientId: data.patientId,
    patientUhid: data.patientUhid,
    patientName: data.patientName,
    patientAge: data.patientAge ?? 35,
    patientGender: data.patientGender || 'Male',
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    departmentId: data.departmentId || 'dept-gen-med',
    consultedAt: new Date().toISOString(),
    symptoms: data.symptoms || [],
    clinicalFindings: data.clinicalObservations || '',
    provisionalDiagnosis: data.diagnosis || 'Under Evaluation',
    prescriptions: (data.prescriptions || []).map(p => {
      const item = {
        medicineId: p.medicineId || p.posMedicineId || 'med-01',
        medicineName: p.medicineName || 'Medicine',
        dosage: p.dosage || '1 Tab Oral',
        quantity: p.quantity ?? 1,
        unitPrice: p.unitPrice ?? 0,
        totalPrice: (p.unitPrice ?? 0) * (p.quantity ?? 1),
        instructions: p.instructions || 'After meals',
        isDispensed: false
      };
      if (p.posMedicineId) item.posMedicineId = p.posMedicineId;
      if (p.genericName) item.genericName = p.genericName;
      if (p.frequency) item.frequency = p.frequency;
      if (p.durationDays) item.durationDays = p.durationDays;
      return item;
    }),
    labOrdersList: (data.labTests || []).map(t => ({
      testId: t.testId || `lab-${Date.now()}`,
      testName: t.testName || 'Diagnostic Test',
      category: t.category || 'General',
      sampleType: t.sampleType || 'Whole Blood',
      price: t.price ?? 0
    })),
    treatmentPlan: data.notes || '',
    clinicalNotes: data.notes || '',
    consultationFee: data.consultationFee ?? 500,
    status: 'completed'
  };

  if (data.procedureFee !== undefined && data.procedureFee !== null && data.procedureFee > 0) {
    consultationRecord.procedureFee = data.procedureFee;
  }
  if (data.procedureDescription && data.procedureDescription.trim()) {
    consultationRecord.procedureDescription = data.procedureDescription.trim();
  }

  // Only attach admissionRequest if doctor explicitly recommended admission
  if (data.admissionRecommendation) {
    consultationRecord.admissionRequest = {
      isVip: Boolean(data.admissionRecommendation.isVip),
      reason: data.admissionRecommendation.reason || data.diagnosis || 'Inpatient Evaluation',
      notes: data.admissionRecommendation.notes || '',
      status: 'pending'
    };
  }

  // Validate consultation document for Firestore compliance
  validateFirestoreData(`hospitals/${hospitalId}/consultations/${consultationId}`, consultationRecord);
  mockDb.consultations[consultationId] = consultationRecord;

  // 2. Admission Request subcollection (if recommended)
  if (data.admissionRecommendation) {
    const admReqId = `adm-req-${data.appointmentId}`;
    const admissionReq = {
      id: admReqId,
      hospitalId,
      consultationId,
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      patientName: data.patientName,
      patientUhid: data.patientUhid,
      patientAge: data.patientAge ?? 35,
      patientGender: data.patientGender || 'Male',
      doctorName: data.doctorName || 'Consultant Doctor',
      isVip: Boolean(data.admissionRecommendation.isVip),
      priority: data.admissionRecommendation.isVip ? 'VIP' : 'Normal',
      notes: data.admissionRecommendation.notes || '',
      reason: data.admissionRecommendation.reason || data.diagnosis || 'Clinical evaluation',
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    validateFirestoreData(`hospitals/${hospitalId}/admissionRequests/${admReqId}`, admissionReq);
    mockDb.admissionRequests[admReqId] = admissionReq;
  }

  return { consultationId, isDuplicate: false };
}

// ----------------------------------------------------------------------------
// TEST 1: Consultation without admission
// ----------------------------------------------------------------------------
console.log("TEST 1: Consultation without admission");
const res1 = completeClinicalConsultationWorkflow("hosp-001", {
  appointmentId: "apt-001",
  patientId: "pat-001",
  patientName: "Sunita Roy",
  patientUhid: "UPH-P2026-001",
  doctorId: "doc-01",
  doctorName: "Dr. Vikram Malhotra",
  diagnosis: "Mild Migraine",
  consultationFee: 500,
  prescriptions: [],
  labTests: []
  // admissionRecommendation is omitted completely
});
assert.strictEqual(res1.isDuplicate, false);
const doc1 = mockDb.consultations[res1.consultationId];
assert.strictEqual(doc1.admissionRequest, undefined);
assert.ok(!("admissionRequest" in doc1), "admissionRequest must be completely omitted from document");
assert.strictEqual(mockDb.admissionRequests["adm-req-apt-001"], undefined);
console.log("  [PASSED] Saved successfully with admissionRequest completely omitted. No admission request created.\n");

// ----------------------------------------------------------------------------
// TEST 2: Consultation with VIP admission
// ----------------------------------------------------------------------------
console.log("TEST 2: Consultation with VIP admission");
const res2 = completeClinicalConsultationWorkflow("hosp-001", {
  appointmentId: "apt-002",
  patientId: "pat-002",
  patientName: "Rajesh Khanna",
  patientUhid: "UPH-P2026-002",
  doctorId: "doc-01",
  doctorName: "Dr. Vikram Malhotra",
  diagnosis: "Acute Coronary Syndrome",
  consultationFee: 600,
  prescriptions: [],
  labTests: [],
  admissionRecommendation: {
    isVip: true,
    notes: "Direct ICU telemetry required",
    reason: "ACS / NSTEMI"
  }
});
const doc2 = mockDb.consultations[res2.consultationId];
assert.ok(doc2.admissionRequest, "admissionRequest must exist");
assert.strictEqual(doc2.admissionRequest.isVip, true);
assert.strictEqual(doc2.admissionRequest.status, "pending");
const req2 = mockDb.admissionRequests["adm-req-apt-002"];
assert.ok(req2, "Admission request document must be created for Ward");
assert.strictEqual(req2.isVip, true);
assert.strictEqual(req2.priority, "VIP");
console.log("  [PASSED] Saved with valid VIP admissionRequest and forwarded to Ward.\n");

// ----------------------------------------------------------------------------
// TEST 3: Consultation with Non-VIP admission
// ----------------------------------------------------------------------------
console.log("TEST 3: Consultation with Non-VIP admission");
const res3 = completeClinicalConsultationWorkflow("hosp-001", {
  appointmentId: "apt-003",
  patientId: "pat-003",
  patientName: "Meenakshi Sundaram",
  patientUhid: "UPH-P2026-003",
  doctorId: "doc-01",
  doctorName: "Dr. Vikram Malhotra",
  diagnosis: "Dengue Fever with Thrombocytopenia",
  consultationFee: 500,
  prescriptions: [],
  labTests: [],
  admissionRecommendation: {
    isVip: false,
    notes: "General ward observation and IV hydration",
    reason: "Dengue Platelet Monitoring"
  }
});
const doc3 = mockDb.consultations[res3.consultationId];
assert.ok(doc3.admissionRequest, "admissionRequest must exist");
assert.strictEqual(doc3.admissionRequest.isVip, false);
const req3 = mockDb.admissionRequests["adm-req-apt-003"];
assert.ok(req3, "Admission request document must be created for Ward");
assert.strictEqual(req3.isVip, false);
assert.strictEqual(req3.priority, "Normal");
console.log("  [PASSED] Saved with valid Non-VIP admissionRequest and forwarded to Ward.\n");

// ----------------------------------------------------------------------------
// TEST 4: Consultation with medicines but no admission
// ----------------------------------------------------------------------------
console.log("TEST 4: Consultation with medicines but no admission");
const res4 = completeClinicalConsultationWorkflow("hosp-001", {
  appointmentId: "apt-004",
  patientId: "pat-004",
  patientName: "Deepak Verma",
  patientUhid: "UPH-P2026-004",
  doctorId: "doc-01",
  doctorName: "Dr. Vikram Malhotra",
  diagnosis: "Upper Respiratory Tract Infection",
  consultationFee: 500,
  prescriptions: [
    { posMedicineId: "pos-med-001", medicineName: "Paracetamol 650mg", dosage: "1 Tab Oral TDS", quantity: 10, unitPrice: 35 },
    { posMedicineId: "pos-med-002", medicineName: "Augmentin 625 Duo", dosage: "1 Tab Oral BD", quantity: 6, unitPrice: 220 }
  ],
  labTests: []
});
const doc4 = mockDb.consultations[res4.consultationId];
assert.strictEqual(doc4.prescriptions.length, 2);
assert.ok(!("admissionRequest" in doc4));
assert.strictEqual(mockDb.admissionRequests["adm-req-apt-004"], undefined);
console.log("  [PASSED] Medicines prescribed properly without creating admission request.\n");

// ----------------------------------------------------------------------------
// TEST 5: Consultation with lab tests but no admission
// ----------------------------------------------------------------------------
console.log("TEST 5: Consultation with lab tests but no admission");
const res5 = completeClinicalConsultationWorkflow("hosp-001", {
  appointmentId: "apt-005",
  patientId: "pat-005",
  patientName: "Anita Sharma",
  patientUhid: "UPH-P2026-005",
  doctorId: "doc-01",
  doctorName: "Dr. Vikram Malhotra",
  diagnosis: "Routine Annual Health Check",
  consultationFee: 500,
  prescriptions: [],
  labTests: [
    { testId: "pos-lab-001", testName: "Complete Blood Count (CBC)", category: "Haematology", sampleType: "Whole Blood", price: 350 },
    { testId: "pos-lab-004", testName: "Lipid Profile Panel", category: "Biochemistry", sampleType: "Serum", price: 600 }
  ]
});
const doc5 = mockDb.consultations[res5.consultationId];
assert.strictEqual(doc5.labOrdersList.length, 2);
assert.ok(!("admissionRequest" in doc5));
assert.strictEqual(mockDb.admissionRequests["adm-req-apt-005"], undefined);
console.log("  [PASSED] Diagnostic lab tests ordered properly without creating admission request.\n");

// ----------------------------------------------------------------------------
// TEST 6: Consultation with medicines, lab tests, and admission together
// ----------------------------------------------------------------------------
console.log("TEST 6: Consultation with medicines, lab tests and admission together");
const res6 = completeClinicalConsultationWorkflow("hosp-001", {
  appointmentId: "apt-006",
  patientId: "pat-006",
  patientName: "Kavita Sundaram",
  patientUhid: "UPH-P2026-006",
  doctorId: "doc-01",
  doctorName: "Dr. Vikram Malhotra",
  diagnosis: "Pneumonia with Hypoxemia",
  consultationFee: 600,
  procedureFee: 250,
  procedureDescription: "Nebulization + Pulse Oximetry",
  prescriptions: [
    { posMedicineId: "pos-med-005", medicineName: "Ceftriaxone 1g Injection", dosage: "1 Vial IV BD", quantity: 2, unitPrice: 95 }
  ],
  labTests: [
    { testId: "pos-lab-001", testName: "CBC", category: "Haematology", sampleType: "Whole Blood", price: 350 }
  ],
  admissionRecommendation: {
    isVip: true,
    notes: "Requires continuous oxygen therapy",
    reason: "Bilateral Lobar Pneumonia"
  }
});
const doc6 = mockDb.consultations[res6.consultationId];
assert.strictEqual(doc6.prescriptions.length, 1);
assert.strictEqual(doc6.labOrdersList.length, 1);
assert.ok(doc6.admissionRequest);
assert.strictEqual(doc6.admissionRequest.isVip, true);
assert.strictEqual(doc6.procedureFee, 250);
assert.strictEqual(doc6.procedureDescription, "Nebulization + Pulse Oximetry");
console.log("  [PASSED] Full combo payload saved cleanly without any undefined values.\n");

// ----------------------------------------------------------------------------
// TEST 7: Duplicate submission idempotency
// ----------------------------------------------------------------------------
console.log("TEST 7: Verify no duplicate consultations or admission requests on repeated submissions");
const repeatRes = completeClinicalConsultationWorkflow("hosp-001", {
  appointmentId: "apt-006", // Same appointment
  patientId: "pat-006",
  patientName: "Kavita Sundaram",
  patientUhid: "UPH-P2026-006",
  doctorId: "doc-01",
  doctorName: "Dr. Vikram Malhotra",
  diagnosis: "Pneumonia with Hypoxemia",
  consultationFee: 600,
  prescriptions: [],
  labTests: []
});
assert.strictEqual(repeatRes.isDuplicate, true);
console.log("  [PASSED] Repeated click was idempotent: prevented duplicate consultation and admission request.\n");

// ----------------------------------------------------------------------------
// TEST 8: Verify dashboard collections integrity
// ----------------------------------------------------------------------------
console.log("TEST 8: Verify all saved records appear correctly in respective store collections");
assert.strictEqual(Object.keys(mockDb.consultations).length, 6);
assert.strictEqual(Object.keys(mockDb.admissionRequests).length, 3); // apt-002 (VIP), apt-003 (Non-VIP), apt-006 (VIP)
console.log(`  [PASSED] Store contains ${Object.keys(mockDb.consultations).length} consultations and ${Object.keys(mockDb.admissionRequests).length} forwarded admission requests.\n`);

console.log("==========================================================================");
console.log("ALL 8 SCENARIOS PASSED WITH ZERO FIRESTORE UNDEFINED ERRORS!");
console.log("==========================================================================");

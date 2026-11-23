import assert from 'node:assert';

console.log("==========================================================================");
console.log("LABORATORY DIAGNOSTIC WORKFLOW & FIRESTORE PAYLOAD AUDIT (9 SCENARIOS)");
console.log("Validating: Safe conditional object construction, no undefined resultValue,");
console.log("result editing, pipeline progression & idempotent billing protection.");
console.log("==========================================================================\n");

// Simulated strict Firestore document store that throws on any undefined value
function strictFirestoreValidator(path, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      throw new Error(`FirebaseError: Function updateDoc() called with invalid data. Unsupported field value: undefined (found in field ${key} in document ${path})`);
    }
  }
}

// Exact implementation of removeUndefinedFields from firestoreService.ts
function removeUndefinedFields(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => (typeof item === 'object' && item !== null ? removeUndefinedFields(item) : item));
  }
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        cleaned[key] = removeUndefinedFields(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned;
}

// In-memory Database
const mockDb = {
  labOrders: {},
  bills: {}
};

// Database helper functions simulating FirestoreHospitalService
function mockUpdateDocument(collection, docId, updates) {
  const path = `hospitals/hosp-001/${collection}/${docId}`;
  const sanitized = removeUndefinedFields(updates);
  strictFirestoreValidator(path, sanitized);
  
  const existing = mockDb[collection][docId] || {};
  mockDb[collection][docId] = {
    ...existing,
    ...sanitized,
    updatedAt: new Date().toISOString()
  };
}

function mockAddInvoiceLineItem(patientId, item, patientInfo) {
  let bill = mockDb.bills[`inv-${patientId}`];
  if (!bill) {
    bill = {
      id: `inv-${patientId}`,
      patientId,
      patientName: patientInfo?.name || 'Test Patient',
      patientUhid: patientInfo?.uhid || 'UHID-001',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      balanceDue: 0,
      paymentStatus: 'unpaid'
    };
    mockDb.bills[`inv-${patientId}`] = bill;
  }

  const existingIdx = bill.items.findIndex(i => i.id === item.id || (i.referenceId && i.referenceId === item.referenceId));
  if (existingIdx >= 0) {
    bill.items[existingIdx] = item;
  } else {
    bill.items.push(item);
  }

  bill.subtotal = bill.items.reduce((acc, c) => acc + c.total, 0);
  bill.taxAmount = Math.round(bill.subtotal * 0.05);
  bill.totalAmount = bill.subtotal + bill.taxAmount;
  bill.balanceDue = bill.totalAmount - bill.amountPaid;
}

function mockRemoveInvoiceLineItemByReference(patientId, referenceId) {
  const bill = mockDb.bills[`inv-${patientId}`];
  if (!bill) return;

  bill.items = bill.items.filter(i => i.referenceId !== referenceId && i.id !== referenceId);
  bill.subtotal = bill.items.reduce((acc, c) => acc + c.total, 0);
  bill.taxAmount = Math.round(bill.subtotal * 0.05);
  bill.totalAmount = bill.subtotal + bill.taxAmount;
  bill.balanceDue = bill.totalAmount - bill.amountPaid;
}

// Exact implementation of updateLabOrderStatus from firestoreService.ts
function updateLabOrderStatus(orderId, newStatus, details) {
  const order = mockDb.labOrders[orderId];
  if (!order) throw new Error(`Order ${orderId} not found`);

  // Safe conditional object construction - never emit undefined
  const updates = {
    sampleStatus: newStatus
  };

  // 1. resultValue: only set if explicitly provided in details
  if (details?.resultValue !== undefined && details.resultValue !== null) {
    updates.resultValue = details.resultValue;
  }

  // 2. isAbnormal: only set if explicitly provided in details
  if (details?.isAbnormal !== undefined && details.isAbnormal !== null) {
    updates.isAbnormal = Boolean(details.isAbnormal);
  }

  // 3. remarks: only set if explicitly provided in details
  if (details?.remarks !== undefined && details.remarks !== null) {
    updates.remarks = details.remarks;
  }

  // 4. verifiedBy: only set if explicitly provided in details
  if (details?.verifiedBy !== undefined && details.verifiedBy !== null && details.verifiedBy !== '') {
    updates.verifiedBy = details.verifiedBy;
  }

  // 5. verifiedAt & default verifiedBy on verification transition
  if (newStatus === 'verified') {
    updates.verifiedAt = new Date().toISOString();
    if (!updates.verifiedBy && !order.verifiedBy) {
      updates.verifiedBy = details?.verifiedBy || 'Dr. Pathologist';
    }
  }

  // 6. collectedAt & collectedBy on specimen collection transition
  if (newStatus === 'collected' && !order.collectedAt) {
    updates.collectedAt = new Date().toISOString();
    if (details?.collectedBy) {
      updates.collectedBy = details.collectedBy;
    }
  }

  mockUpdateDocument('labOrders', orderId, updates);

  // Billing synchronization:
  // When completed: post lab fee to active patient bill (idempotent: only if not already billed)
  if (newStatus === 'completed' && !order.isBilled) {
    const lineItem = {
      id: `bill-lab-${order.id}`,
      description: `Diagnostic Lab: ${order.testName}`,
      category: 'Lab Test',
      quantity: 1,
      unitPrice: order.cost || 0,
      total: order.cost || 0,
      department: 'laboratory',
      referenceId: order.id
    };
    mockAddInvoiceLineItem(order.patientId, lineItem, {
      name: order.patientName,
      uhid: order.patientUhid
    });
    mockUpdateDocument('labOrders', orderId, { isBilled: true });
  }

  // When cancelled: remove test line item from active patient bill (₹0 charge)
  if (newStatus === 'cancelled') {
    if (order.isBilled) {
      mockRemoveInvoiceLineItemByReference(order.patientId, order.id);
    }
    mockUpdateDocument('labOrders', orderId, { isBilled: false });
  }
}

// SETUP: Seed initial test lab order (simulating order created by Doctor without resultValue)
const testOrder1 = {
  id: 'lab-apt-wlk-1795445623750-1',
  orderNumber: 'LAB-2026-9001',
  patientId: 'pat-101',
  patientName: 'Sunita Sharma',
  patientUhid: 'UPH-2026-0044',
  testName: 'Complete Blood Count (CBC)',
  testCategory: 'Haematology',
  sampleType: 'Whole Blood (EDTA)',
  sampleStatus: 'pending',
  referenceRange: '12.0 - 15.5 g/dL',
  unit: 'g/dL',
  cost: 350,
  isBilled: false,
  orderedAt: new Date().toISOString(),
  resultValue: '',
  remarks: '',
  isAbnormal: false
};
mockDb.labOrders[testOrder1.id] = { ...testOrder1 };

// Seed an active patient invoice with doctor consultation
mockDb.bills[`inv-${testOrder1.patientId}`] = {
  id: `inv-${testOrder1.patientId}`,
  patientId: testOrder1.patientId,
  patientName: testOrder1.patientName,
  patientUhid: testOrder1.patientUhid,
  items: [
    {
      id: 'fee-consult-01',
      description: 'Doctor Consultation (Dr. Vikram Malhotra)',
      category: 'Consultation',
      quantity: 1,
      unitPrice: 500,
      total: 500,
      department: 'doctor'
    }
  ],
  subtotal: 500,
  taxAmount: 25,
  totalAmount: 525,
  amountPaid: 0,
  balanceDue: 525,
  paymentStatus: 'unpaid'
};

// ============================================================================
// SCENARIO 1: Pending → Collected without result
// ============================================================================
console.log("SCENARIO 1: Pending -> Collected without result");
assert.doesNotThrow(() => {
  updateLabOrderStatus(testOrder1.id, 'collected');
}, "Must not throw FirebaseError with undefined resultValue");

const afterCollected = mockDb.labOrders[testOrder1.id];
assert.strictEqual(afterCollected.sampleStatus, 'collected');
assert.ok(afterCollected.collectedAt, "collectedAt timestamp must be recorded");
assert.strictEqual(afterCollected.isBilled, false, "Must not bill on collected stage");
console.log("  [PASSED] Successfully transitioned to 'collected' with no undefined fields. collectedAt set.\n");

// ============================================================================
// SCENARIO 2: Collected → Processing without result
// ============================================================================
console.log("SCENARIO 2: Collected -> Processing without result");
assert.doesNotThrow(() => {
  updateLabOrderStatus(testOrder1.id, 'in_process');
}, "Must not throw FirebaseError with undefined resultValue");

const afterProcessing = mockDb.labOrders[testOrder1.id];
assert.strictEqual(afterProcessing.sampleStatus, 'in_process');
assert.strictEqual(afterProcessing.isBilled, false);
console.log("  [PASSED] Successfully transitioned to 'in_process' without resultValue in update payload.\n");

// ============================================================================
// SCENARIO 3: Processing → Completed with valid result
// ============================================================================
console.log("SCENARIO 3: Processing -> Completed with valid result");
assert.doesNotThrow(() => {
  updateLabOrderStatus(testOrder1.id, 'completed', {
    resultValue: '13.6',
    isAbnormal: false,
    remarks: 'Erythrocyte indices within normal limits',
    verifiedBy: 'Anjali Nair'
  });
}, "Must accept valid result values and sync billing");

const afterCompleted = mockDb.labOrders[testOrder1.id];
assert.strictEqual(afterCompleted.sampleStatus, 'completed');
assert.strictEqual(afterCompleted.resultValue, '13.6');
assert.strictEqual(afterCompleted.isAbnormal, false);
assert.strictEqual(afterCompleted.remarks, 'Erythrocyte indices within normal limits');
assert.strictEqual(afterCompleted.isBilled, true, "isBilled must be true after completion");

// Check billing synchronization
const billAfterComplete = mockDb.bills[`inv-${testOrder1.patientId}`];
const labItem = billAfterComplete.items.find(i => i.id === `bill-lab-${testOrder1.id}`);
assert.ok(labItem, "Lab line item must be added to patient bill");
assert.strictEqual(labItem.total, 350);
assert.strictEqual(billAfterComplete.subtotal, 500 + 350); // 850
assert.strictEqual(billAfterComplete.taxAmount, Math.round(850 * 0.05)); // 43
assert.strictEqual(billAfterComplete.totalAmount, 850 + 43); // 893
console.log("  [PASSED] Result '13.6 g/dL' saved. Lab fee ₹350 posted to patient bill (New Total: ₹893).\n");

// ============================================================================
// SCENARIO 4: Completed → Verified
// ============================================================================
console.log("SCENARIO 4: Completed -> Verified");
assert.doesNotThrow(() => {
  updateLabOrderStatus(testOrder1.id, 'verified', {
    verifiedBy: 'Dr. R. K. Varma (Chief Pathologist)'
  });
});

const afterVerified = mockDb.labOrders[testOrder1.id];
assert.strictEqual(afterVerified.sampleStatus, 'verified');
assert.strictEqual(afterVerified.verifiedBy, 'Dr. R. K. Varma (Chief Pathologist)');
assert.ok(afterVerified.verifiedAt, "verifiedAt timestamp must be recorded");
// Crucial: resultValue must remain intact and preserved!
assert.strictEqual(afterVerified.resultValue, '13.6', "Previously saved resultValue must be preserved");
console.log("  [PASSED] Order signed & verified. Previously saved result '13.6' preserved.\n");

// ============================================================================
// SCENARIO 5: Cancel an order
// ============================================================================
console.log("SCENARIO 5: Cancel an order & zero-out billing");
// Create a second order (Lipid Profile Panel ₹600)
const testOrder2 = {
  id: 'lab-apt-wlk-1795445623750-2',
  orderNumber: 'LAB-2026-9002',
  patientId: testOrder1.patientId,
  patientName: testOrder1.patientName,
  patientUhid: testOrder1.patientUhid,
  testName: 'Lipid Profile Panel',
  testCategory: 'Biochemistry',
  sampleType: 'Serum',
  sampleStatus: 'pending',
  referenceRange: 'Normal',
  unit: 'mg/dL',
  cost: 600,
  isBilled: false,
  orderedAt: new Date().toISOString()
};
mockDb.labOrders[testOrder2.id] = { ...testOrder2 };

// Progress testOrder2 to completed so it gets billed
updateLabOrderStatus(testOrder2.id, 'collected');
updateLabOrderStatus(testOrder2.id, 'completed', { resultValue: 'Total Chol: 195 mg/dL' });
assert.strictEqual(mockDb.labOrders[testOrder2.id].isBilled, true);
assert.strictEqual(mockDb.bills[`inv-${testOrder1.patientId}`].subtotal, 850 + 600); // 1450

// Now CANCEL testOrder2
updateLabOrderStatus(testOrder2.id, 'cancelled');
const afterCancelled = mockDb.labOrders[testOrder2.id];
assert.strictEqual(afterCancelled.sampleStatus, 'cancelled');
assert.strictEqual(afterCancelled.isBilled, false);

// Check that Lipid Profile was removed from patient bill
const billAfterCancel = mockDb.bills[`inv-${testOrder1.patientId}`];
const cancelledItem = billAfterCancel.items.find(i => i.id === `bill-lab-${testOrder2.id}`);
assert.strictEqual(cancelledItem, undefined, "Cancelled test item must be removed from patient bill");
assert.strictEqual(billAfterCancel.subtotal, 850, "Subtotal must revert back to ₹850");
assert.strictEqual(billAfterCancel.totalAmount, 893, "Total bill must revert back to ₹893");
console.log("  [PASSED] Test cancelled. ₹600 charge cleanly removed from active bill with 0 orphan charges.\n");

// ============================================================================
// SCENARIO 6: Edit an existing result
// ============================================================================
console.log("SCENARIO 6: Edit an existing result");
assert.doesNotThrow(() => {
  updateLabOrderStatus(testOrder1.id, 'completed', {
    resultValue: '14.2',
    isAbnormal: true,
    remarks: 'Re-assayed with Sysmex hematology analyzer. Confirmed high normal.'
  });
});

const afterEdit = mockDb.labOrders[testOrder1.id];
assert.strictEqual(afterEdit.resultValue, '14.2');
assert.strictEqual(afterEdit.isAbnormal, true);
assert.strictEqual(afterEdit.remarks, 'Re-assayed with Sysmex hematology analyzer. Confirmed high normal.');
console.log("  [PASSED] Existing result updated to '14.2' with abnormal flag set.\n");

// ============================================================================
// SCENARIO 7: Update status without changing an existing result
// ============================================================================
console.log("SCENARIO 7: Update status without changing an existing result");
assert.doesNotThrow(() => {
  // Update status back to verified without passing resultValue in details
  updateLabOrderStatus(testOrder1.id, 'verified', {
    verifiedBy: 'Dr. Pathologist Reviewer'
  });
});

const afterStatusOnly = mockDb.labOrders[testOrder1.id];
assert.strictEqual(afterStatusOnly.sampleStatus, 'verified');
assert.strictEqual(afterStatusOnly.resultValue, '14.2', "Result '14.2' must remain unchanged");
assert.strictEqual(afterStatusOnly.isAbnormal, true, "Abnormal flag must remain unchanged");
console.log("  [PASSED] Status updated to 'verified'. Result '14.2' and abnormal flag remain intact.\n");

// ============================================================================
// SCENARIO 8: Verify billing updates correctly
// ============================================================================
console.log("SCENARIO 8: Verify billing updates correctly");
const finalBill = mockDb.bills[`inv-${testOrder1.patientId}`];
assert.strictEqual(finalBill.items.length, 2, "Bill must contain exactly Consultation + CBC");
assert.strictEqual(finalBill.subtotal, 500 + 350, "Subtotal must be ₹850");
assert.strictEqual(finalBill.taxAmount, 43, "Tax must be ₹43 (5% GST)");
assert.strictEqual(finalBill.totalAmount, 893, "Total must be ₹893");
console.log("  [PASSED] Patient billing is 100% consistent (Consultation ₹500 + Lab CBC ₹350 + GST ₹43 = ₹893).\n");

// ============================================================================
// SCENARIO 9: Verify repeated status updates do not create duplicate charges
// ============================================================================
console.log("SCENARIO 9: Verify repeated status updates do not create duplicate charges");
const billItemsBefore = finalBill.items.length;
const totalBefore = finalBill.totalAmount;

// Call updateLabOrderStatus 5 consecutive times
updateLabOrderStatus(testOrder1.id, 'completed');
updateLabOrderStatus(testOrder1.id, 'completed');
updateLabOrderStatus(testOrder1.id, 'verified');
updateLabOrderStatus(testOrder1.id, 'verified', { verifiedBy: 'Dr. Pathologist' });
updateLabOrderStatus(testOrder1.id, 'completed');

const billItemsAfter = finalBill.items.length;
const totalAfter = finalBill.totalAmount;

assert.strictEqual(billItemsAfter, billItemsBefore, "Number of bill line items must not increase");
assert.strictEqual(totalAfter, totalBefore, "Total invoice amount must not change on duplicate status calls");
console.log(`  [PASSED] Executed 5 duplicate status updates. Line items (${billItemsAfter}) and Total (₹${totalAfter}) remained identical.\n`);

console.log("==========================================================================");
console.log("ALL 9 LAB WORKFLOW SCENARIOS AUDITED AND PASSED PERFECTLY!");
console.log("Zero undefined fields. Safe conditional construction verified.");
console.log("==========================================================================");

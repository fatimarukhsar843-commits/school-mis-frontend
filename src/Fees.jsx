const STRUCTURE_URL = "http://localhost:5000/api/fee-structure"
const RECORDS_URL = "http://localhost:5000/api/fee-records"

export async function getFeeStructure() {
  const res = await fetch(STRUCTURE_URL)
  const rows = await res.json()
  const map = {}
  rows.forEach((r) => { map[r.className] = r.amount })
  return map
}

// Saves the whole fee structure object in one request
export async function saveFeeStructure(structure) {
  const res = await fetch(`${STRUCTURE_URL}/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structure }),
  })
  return res.json()
}

// Returns "paid", "pending", or "unpaid" for a student in a given month
export async function getFeeStatus(studentId, month) {
  const res = await fetch(`${RECORDS_URL}?month=${month}`)
  const records = await res.json()
  const record = records.find((r) => r.studentId === studentId)
  return record ? record.status : "unpaid"
}

export async function submitPaymentSlip(studentId, month, slipImageUrl, transactionId) {
  const res = await fetch(`${RECORDS_URL}/submit-slip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, month, slipImageUrl, transactionId }),
  })
  return res.json()
}

export async function getPendingSlips() {
  const res = await fetch(`${RECORDS_URL}?status=pending`)
  return res.json()
}

export async function markFeePaid(studentId, month) {
  const res = await fetch(`${RECORDS_URL}/mark-paid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, month }),
  })
  return res.json()
}

export async function markFeeUnpaid(studentId, month) {
  const res = await fetch(`${RECORDS_URL}/mark-unpaid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, month }),
  })
  return res.json()
}

export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function getTodayDayOfMonth() {
  return new Date().getDate()
}
export async function getFeeRecordsForMonth(month) {
  const res = await fetch(`${RECORDS_URL}?month=${month}`)
  return res.json()
}
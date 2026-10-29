import { useState, useEffect } from "react"
import { getStudents } from "./Students"
import { getClassList, getBaseClassName } from "./Classes"
import {
  getFeeStructure,
  getFeeRecordsForMonth,
  markFeePaid,
  markFeeUnpaid,
  getCurrentMonth,
  getTodayDayOfMonth,
  getPendingSlips,
} from "./Fees"

const DUE_DAY = 5

function FeeCollection() {
  const classOptions = ["All", ...getClassList()]
  const [month, setMonth] = useState(getCurrentMonth())
  const [classFilter, setClassFilter] = useState("All")

  const [allStudents, setAllStudents] = useState([])
  const [feeStructure, setFeeStructure] = useState({})
  const [records, setRecords] = useState([])
  const [pendingSlips, setPendingSlips] = useState([])

  const isPastDueDate = getTodayDayOfMonth() > DUE_DAY

  // Load students + fee structure once
  useEffect(() => {
    getStudents().then(setAllStudents)
    getFeeStructure().then(setFeeStructure)
  }, [])

  // Load this month's records whenever the month changes
  async function refreshRecords() {
    const data = await getFeeRecordsForMonth(month)
    setRecords(data)
  }

  async function refreshPendingSlips() {
    const slips = await getPendingSlips()
    setPendingSlips(slips)
  }

  useEffect(() => {
    refreshRecords()
  }, [month])

  useEffect(() => {
    refreshPendingSlips()
  }, [])

  function getStatus(studentId) {
    const record = records.find((r) => r.studentId === studentId)
    return record ? record.status : "unpaid"
  }

  const visibleStudents =
    classFilter === "All"
      ? allStudents
      : allStudents.filter((s) => s.className === classFilter)

  async function handleTogglePaid(studentId, currentStatus) {
    if (currentStatus === "paid") {
      await markFeeUnpaid(studentId, month)
    } else {
      await markFeePaid(studentId, month)
    }
    refreshRecords()
  }

  function buildReminderMessage(student) {
    const amount = feeStructure[getBaseClassName(student.className)]
    return `Dear ${student.guardian}, this is a reminder that the school fee of Rs. ${amount} for ${student.name} (Class ${student.className}) for ${month} is still unpaid. Kindly submit the fee at your earliest convenience.`
  }

  function buildSmsLink(student) {
    const message = encodeURIComponent(buildReminderMessage(student))
    return `sms:${student.phone}?body=${message}`
  }

  const paidCount = visibleStudents.filter((s) => getStatus(s._id) === "paid").length

  const pendingSlipsWithStudent = pendingSlips
    .map((record) => ({
      ...record,
      student: allStudents.find((s) => s._id === record.studentId),
    }))
    .filter((r) => r.student)

  async function handleApproveSlip(studentId, slipMonth) {
    await markFeePaid(studentId, slipMonth)
    refreshRecords()
    refreshPendingSlips()
  }

  async function handleRejectSlip(studentId, slipMonth) {
    if (confirm("Reject this payment proof? The fee will go back to Unpaid.")) {
      await markFeeUnpaid(studentId, slipMonth)
      refreshRecords()
      refreshPendingSlips()
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Fee Collection</h1>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {classOptions.map((c) => (
            <option key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">
          {paidCount} / {visibleStudents.length} paid
        </span>
      </div>

      {pendingSlipsWithStudent.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Payment Proofs Awaiting Verification ({pendingSlipsWithStudent.length})
          </h2>
          <div className="bg-white rounded-lg shadow divide-y">
            {pendingSlipsWithStudent.map((record) => (
              <div key={record._id} className="flex items-center justify-between px-4 py-3 gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={record.slipImageUrl}
                    alt="Payment slip"
                    className="w-16 h-16 object-cover rounded border cursor-pointer"
                    onClick={() => window.open(record.slipImageUrl, "_blank")}
                  />
                  <div>
                    <p className="font-medium">{record.student.name}</p>
                    <p className="text-sm text-gray-500">
                      Class {record.student.className} &middot; {record.month}
                      {record.transactionId && <> &middot; TID: {record.transactionId}</>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveSlip(record.studentId, record.month)}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectSlip(record.studentId, record.month)}
                    className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPastDueDate && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-3 mb-4">
          Today is past the {DUE_DAY}th — unpaid students below can be sent a reminder.
        </div>
      )}

      <div className="bg-white rounded-lg shadow divide-y">
        {visibleStudents.map((s) => {
          const status = getStatus(s._id)
          const isPaid = status === "paid"
          const isPending = status === "pending"
          const amount = feeStructure[getBaseClassName(s.className)]

          return (
            <div key={s._id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-gray-500">
                  Class {s.className} &middot; Rs. {amount} &middot; Guardian: {s.guardian}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isPending && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    Pending Review
                  </span>
                )}
                <button
                  onClick={() => handleTogglePaid(s._id, status)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    isPaid ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
                  }`}
                >
                  {isPaid ? "Paid" : "Mark Paid"}
                </button>

                {!isPaid && !isPending && isPastDueDate && (
                  <a
                    href={buildSmsLink(s)}
                    className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 inline-block"
                  >
                    Send Reminder
                  </a>
                )}
              </div>
            </div>
          )
        })}
        {visibleStudents.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400">No students found.</p>
        )}
      </div>
    </div>
  )
}

export default FeeCollection
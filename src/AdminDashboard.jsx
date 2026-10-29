import { useState, useEffect } from "react"
import { getStudents } from "./Students"
import { getTeachers } from "./Teachers"
import { getTodayDate, getDailySummaryByClass } from "./Attendance"
import { getFeeStructure, getFeeRecordsForMonth, getCurrentMonth, getPendingSlips } from "./Fees"
import { getGradeNames, getBaseClassName } from "./Classes"

function StatCard({ label, value, sublabel, color = "cyan" }) {
  const colorMap = {
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-700 ",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  }
  return (
    <div className={`border rounded-lg p-4 ${colorMap[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sublabel && <p className="text-xs opacity-70 mt-1">{sublabel}</p>}
    </div>
  )
}

function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    async function load() {
      const today = getTodayDate()
      const month = getCurrentMonth()

      const [allStudents, teachers, feeStructure, feeRecords, pendingSlips] = await Promise.all([
        getStudents(),
        getTeachers(),
        getFeeStructure(),
        getFeeRecordsForMonth(month),
        getPendingSlips(),
      ])
      const summary = await getDailySummaryByClass(today, allStudents)

      // Today's attendance
      const totalPresent = summary.reduce((sum, c) => sum + c.present, 0)
      const totalAbsent = summary.reduce((sum, c) => sum + c.absent, 0)
      const totalMarked = totalPresent + totalAbsent
      const attendancePercent =
        totalMarked > 0 ? ((totalPresent / totalMarked) * 100).toFixed(1) : null

      // Fees this month (status looked up from the one list of records)
      let paidAmount = 0
      let unpaidAmount = 0
      let unpaidCount = 0
      let paidCount = 0
      allStudents.forEach((s) => {
        const record = feeRecords.find((r) => r.studentId === s._id)
        const status = record ? record.status : "unpaid"
        const amount = feeStructure[getBaseClassName(s.className)] || 0
        if (status === "paid") {
          paidAmount += amount
          paidCount++
        } else if (status === "unpaid") {
          unpaidAmount += amount
          unpaidCount++
        }
      })

      // Strength per grade (all sections of a grade added together)
      const classCounts = getGradeNames().map((g) => ({
        className: g,
        count: allStudents.filter((s) => getBaseClassName(s.className) === g).length,
      }))

      setData({
        month,
        totalStudents: allStudents.length,
        totalTeachers: teachers.length,
        totalPresent,
        totalAbsent,
        attendancePercent,
        paidAmount,
        unpaidAmount,
        unpaidCount,
        paidCount,
        pendingSlipsCount: pendingSlips.length,
        classCounts,
      })
    }
    load()
  }, [])

  if (!data) {
    return <p className="text-gray-400">Loading...</p>
  }

  const {
    month, totalStudents, totalTeachers, totalPresent, totalAbsent, attendancePercent,
    paidAmount, unpaidAmount, unpaidCount, paidCount, pendingSlipsCount, classCounts,
  } = data

  const maxCount = Math.max(...classCounts.map((c) => c.count), 1)

  // Fee status donut (paid vs unpaid, by count)
  const totalForFeeChart = paidCount + unpaidCount
  const paidPercent = totalForFeeChart > 0 ? (paidCount / totalForFeeChart) * 100 : 0
  const donutStyle = {
    background: `conic-gradient(#16a34a 0% ${paidPercent}%, #dc2626 ${paidPercent}% 100%)`,
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#30497D] mb-4"> Admin Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Students" value={totalStudents} color="cyan" />
        <StatCard label="Total Teachers" value={totalTeachers} color="blue" />
        <StatCard
          label="Today's Attendance"
          value={attendancePercent !== null ? `${attendancePercent}%` : "—"}
          sublabel={attendancePercent !== null ? `${totalPresent} present, ${totalAbsent} absent` : "Not marked yet"}
          color="green"
        />
        <StatCard
          label="Fees Collected"
          value={`Rs. ${paidAmount.toLocaleString()}`}
          sublabel={month}
          color="green"
        />
        <StatCard
          label="Unpaid Students"
          value={unpaidCount}
          sublabel={`Rs. ${unpaidAmount.toLocaleString()} pending`}
          color="red"
        />
        <StatCard
          label="Slips Awaiting Review"
          value={pendingSlipsCount}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Fee status donut chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Fee Collection Status ({month})</h2>
          {totalForFeeChart === 0 ? (
            <p className="text-gray-400 text-sm">No fee records yet for this month.</p>
          ) : (
            <div className="flex items-center gap-6">
              <div
                className="w-32 h-32 rounded-full flex-shrink-0"
                style={donutStyle}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />
                  <span className="text-sm">Paid: {paidCount} ({paidPercent.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
                  <span className="text-sm">Unpaid: {unpaidCount} ({(100 - paidPercent).toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Class-wise strength bar chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Class-wise Student Strength</h2>
          <div className="flex items-end gap-2 h-40">
            {classCounts.map((c) => (
              <div key={c.className} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-xs text-gray-500 mb-1">{c.count}</span>
                <div
                  className="w-full bg-cyan-500 rounded-t"
                  style={{ height: `${(c.count / maxCount) * 100}%`, minHeight: c.count > 0 ? "4px" : "0" }}
                />
                <span className="text-[10px] text-gray-400 mt-1 rotate-0 whitespace-nowrap">
                  {c.className}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
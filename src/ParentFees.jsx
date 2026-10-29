import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getStudentsByParentEmail } from "./Students"
import { getBaseClassName } from "./Classes"
import { getFeeStructure, getFeeStatus, getCurrentMonth, submitPaymentSlip } from "./Fees"

function ParentFees() {
  const { user } = useAuth()
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [month, setMonth] = useState(getCurrentMonth())
  const [transactionId, setTransactionId] = useState("")
  const [slipPreview, setSlipPreview] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const [feeStructure, setFeeStructure] = useState({})
  const [status, setStatus] = useState("unpaid")

  // Load this parent's children once
  useEffect(() => {
    async function loadChildren() {
      const data = await getStudentsByParentEmail(user?.email)
      setChildren(data)
      if (data.length > 0) setSelectedChildId(data[0]._id)
    }
    loadChildren()
    getFeeStructure().then(setFeeStructure)
  }, [user])

  const selectedChild = children.find((c) => c._id === selectedChildId)
  const amount = selectedChild ? feeStructure[getBaseClassName(selectedChild.className)] : 0

  // Load the status whenever the selected child or month changes
  useEffect(() => {
    async function loadStatus() {
      if (selectedChild) {
        const s = await getFeeStatus(selectedChild._id, month)
        setStatus(s)
      }
    }
    loadStatus()
  }, [selectedChildId, month, selectedChild])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSlipPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmitSlip(e) {
    e.preventDefault()
    if (!slipPreview) {
      alert("Please attach a screenshot of your payment receipt.")
      return
    }
    await submitPaymentSlip(selectedChild._id, month, slipPreview, transactionId)
    setSubmitted(true)
    const s = await getFeeStatus(selectedChild._id, month)
    setStatus(s)
  }

  if (children.length === 0) {
    return <p className="text-gray-500">No student records linked to this account.</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Fees</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        {children.length > 1 && (
          <select
            value={selectedChildId}
            onChange={(e) => { setSelectedChildId(e.target.value); setSubmitted(false) }}
            className="border rounded px-3 py-2"
          >
            {children.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}
        <input
          type="month"
          value={month}
          onChange={(e) => { setMonth(e.target.value); setSubmitted(false) }}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-md">
        <p className="text-sm text-gray-500">Fee for {selectedChild?.name} &middot; {month}</p>
        <p className="text-2xl font-semibold mb-2">Rs. {amount?.toLocaleString()}</p>
        <span
          className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${
            status === "paid" ? "bg-green-100 text-green-700" :
            status === "pending" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}
        >
          {status === "paid" ? "Paid" : status === "pending" ? "Pending Verification" : "Unpaid"}
        </span>
      </div>

      {status !== "paid" && (
        <div className="bg-white rounded-lg shadow p-4 max-w-md">
          <h2 className="text-lg font-semibold mb-2">
            Paid via EasyPaisa / Bank? Submit your receipt
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Upload a screenshot of your payment. The school admin will verify it and mark your fee as paid.
          </p>

          {status === "pending" ? (
            <p className="text-yellow-700 text-sm">
              Your payment proof has been submitted and is awaiting verification.
            </p>
          ) : (
            <form onSubmit={handleSubmitSlip} className="space-y-3">
              <input type="file" accept="image/*" onChange={handleFileChange} required className="w-full text-sm" />
              {slipPreview && (
                <img src={slipPreview} alt="Payment slip preview" className="max-h-40 rounded border" />
              )}
              <input
                type="text"
                placeholder="Transaction ID (optional)"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <button type="submit" className="w-full py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">
                Submit Payment Proof
              </button>
              {submitted && <p className="text-green-600 text-sm text-center">Submitted!</p>}
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default ParentFees
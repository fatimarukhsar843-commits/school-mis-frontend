import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getStudentsByParentEmail } from "./Students"

function ParentDashboard() {
  const { user } = useAuth()
  const [children, setChildren] = useState([])

  useEffect(() => {
    if (user?.email) {
      getStudentsByParentEmail(user.email).then(setChildren)
    }
  }, [user])

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#30497D]  mb-4">Welcome, {user?.name}!</h1>

      {children.length === 0 && (
        <p className="text-gray-500">
          No student records are linked to this account yet. Please contact
          the school office if this seems wrong.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {children.map((child) => (
          <div key={child._id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            {child.photoUrl ? (
              <img
                src={child.photoUrl}
                alt={child.name}
                className="w-20 h-20 rounded-full object-cover border flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-cyan-100 text-cyan-700 text-2xl font-semibold flex items-center justify-center flex-shrink-0">
                {child.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{child.name}</h2>
              <p className="text-sm text-gray-500">Father: {child.guardian || "—"}</p>
              <p className="text-sm text-gray-500">
                Class {child.className} &middot; Roll No {child.rollNo}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400 mt-6">
        Use the sidebar to check attendance history or fee status for your child.
      </p>
    </div>
  )
}

export default ParentDashboard
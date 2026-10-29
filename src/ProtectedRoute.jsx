import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

// Wrap any route with this to require login, and optionally a specific role.
// Usage: <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()

  if (!user) {
    // Not logged in at all
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    // Logged in, but wrong role for this page
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
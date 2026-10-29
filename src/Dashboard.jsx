import { useAuth } from "./AuthContext"

// One shared placeholder dashboard for now — later you can make
// separate AdminDashboard, TeacherDashboard, ParentDashboard files
// once each needs different content (Section 8: Reports/Dashboard).
function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#30497D] mb-2">Welcome, {user?.name}!</h1>
      <p className="text-gray-600">
        You're logged in as <span className="font-medium">{user?.role}</span>.
        This is your dashboard — real content comes later.
      </p>
    </div>
  )
}

export default Dashboard
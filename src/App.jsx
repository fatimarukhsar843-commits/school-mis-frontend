import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import LoginFrom from "./LoginFrom"
import Layout from "./Layout"
import ProtectedRoute from "./ProtectedRoute"
import StudentList from "./StudentList"
import TeacherList from "./TeacherList"
import AttendanceMarking from "./AttendanceMarking"
import AttendanceReport from "./AttendanceReport"
import FeeStructure from "./FeeStructure"
import FeeCollection from "./FeeCollection"
import TimetableManage from "./TimetableManage"
import Substitution from "./Substitution"
import ParentDashboard from "./ParentDashboard"
import ParentAttendance from "./ParentAttendance"
import ParentFees from "./ParentFees"
import ExamsManage from "./ExamsManage"
import ClassTeacherExams from "./ClassTeacherExams"
import ClassTeacherSubjects from "./ClassTeacherSubjects"
import ClassTeacherResults from "./ClassTeacherResults"
import TeacherClasses from "./TeacherClasses"
import TeacherMarksEntry from "./TeacherMarksEntry"
import AdminDashboard from "./AdminDashboard"
import TeacherDashboard from "./TeacherDashboard"
import BrandingSettings from "./BrandingSettings"
import AdminResultsOverview from "./AdminResultsOverview"
import ClassesManage from "./ClassesManage"
import ClassTeachers from "./ClassTeachers"
import Profile from "./Profile"
import { loadGrades } from "./Classes"
import AdminAccounts from "./AdminAccounts"
import ParentLogins from "./ParentLogins"
function App() {
  // Load the class list from MongoDB once, before any page is shown
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadGrades().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return <p className="p-6 text-gray-400">Loading...</p>
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginFrom />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentList />} />
        <Route path="teachers" element={<TeacherList />} />
        <Route path="class-teachers" element={<ClassTeachers />} />
        <Route path="attendance-report" element={<AttendanceReport />} />
        <Route path="fee-structure" element={<FeeStructure />} />
        <Route path="fees" element={<FeeCollection />} />
        <Route path="timetable" element={<TimetableManage />} />
        <Route path="substitution" element={<Substitution />} />
        <Route path="results" element={<AdminResultsOverview />} />
        <Route path="exams" element={<ExamsManage />} />
        <Route path="branding" element={<BrandingSettings />} />
        <Route path="classes-sections" element={<ClassesManage />} />
        <Route path="profile" element={<Profile />} />
                <Route path="admin-accounts" element={<AdminAccounts />} />
        <Route path="parent-logins" element={<ParentLogins />} />
      </Route>

      {/* Teacher routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRole="teacher">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="classes" element={<TeacherClasses />} />
        <Route path="attendance" element={<AttendanceMarking />} />
        <Route path="exams" element={<ClassTeacherExams />} />
        <Route path="subjects" element={<ClassTeacherSubjects />} />
        <Route path="marks-entry" element={<TeacherMarksEntry />} />
        <Route path="class-results" element={<ClassTeacherResults />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Parent routes */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRole="parent">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ParentDashboard />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="fees" element={<ParentFees />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
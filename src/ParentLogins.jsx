import { useState, useEffect } from "react"
import { getStudents } from "./Students"
import { getUsers, setLogin } from "./Accounts"

function ParentLogins() {
  const [students, setStudents] = useState([])
  const [loginEmails, setLoginEmails] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setStudents(await getStudents())
    const users = await getUsers("parent")
    setLoginEmails(users.map((u) => u.email.toLowerCase()))
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  // One row per parent email, listing all of that parent's children
  const parents = []
  students.forEach((s) => {
    const email = (s.parentEmail || "").trim().toLowerCase()
    if (!email) return
    let p = parents.find((x) => x.email === email)
    if (!p) {
      p = { email, guardian: s.guardian || "Parent", children: [] }
      parents.push(p)
    }
    p.children.push(`${s.name} (${s.className})`)
  })

  const noEmailCount = students.filter((s) => !(s.parentEmail || "").trim()).length

  async function handleSetLogin(parent) {
    const hasAccount = loginEmails.includes(parent.email)
    const password = prompt(
      hasAccount
        ? `New password for ${parent.email} (at least 6 characters):`
        : `Create a password for ${parent.email} (at least 6 characters):`
    )
    if (!password) return
    try {
      await setLogin({ name: parent.guardian, email: parent.email, role: "parent", password })
      alert(hasAccount ? "Password changed." : "Login created.")
      refresh()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Parent Logins</h1>
      <p className="text-gray-500 mb-4">
        Every parent email found on a student record is listed here. Create a login for a
        parent, or reset their password. Parents can also sign up themselves on the login
        page, using the email the school already has.
      </p>

      {noEmailCount > 0 && (
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 max-w-3xl">
          {noEmailCount} student(s) have no parent email yet, so their parents can't have a login.
          Add the email on the student's record.
        </p>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden max-w-3xl">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Parent Email</th>
              <th className="px-4 py-3">Children</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {parents.map((p) => {
              const hasAccount = loginEmails.includes(p.email)
              return (
                <tr key={p.email} className="border-t">
                  <td className="px-4 py-3">
                    <p>{p.email}</p>
                    <p className="text-xs text-gray-400">{p.guardian}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{p.children.join(", ")}</td>
                  <td className="px-4 py-3">
                    {hasAccount ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">No login yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSetLogin(p)}
                      className="text-cyan-600 hover:underline text-sm whitespace-nowrap"
                    >
                      {hasAccount ? "Reset password" : "Create login"}
                    </button>
                  </td>
                </tr>
              )
            })}
            {parents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No parent emails found on any student record yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ParentLogins
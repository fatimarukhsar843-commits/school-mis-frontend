// Central place for "which classes/sections exist" — now stored in MongoDB.
// The list is loaded once when the app starts (loadGrades) and kept in memory,
// so getClassList / getGradeNames / getBaseClassName stay simple and instant.

const API = "http://localhost:5000/api/grades"

let grades = []

// Call this once when the app starts, and after every change.
export async function loadGrades() {
  try {
    const res = await fetch(API)
    grades = await res.json()
  } catch (err) {
    console.error("Could not load classes:", err)
  }
}

export function getGrades() {
  return grades
}

export async function addGrade(name) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const data = await res.json()
    alert(data.message || "Could not add class.")
  }
  await loadGrades()
}

export async function removeGrade(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" })
  await loadGrades()
}

export async function addSection(gradeId, sectionName) {
  await fetch(`${API}/${gradeId}/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: sectionName }),
  })
  await loadGrades()
}

export async function removeSection(gradeId, sectionName) {
  await fetch(`${API}/${gradeId}/sections/${encodeURIComponent(sectionName)}`, {
    method: "DELETE",
  })
  await loadGrades()
}

// Every selectable class as a flat list of strings, e.g.
// ["Play Group", "Nursery", "KG-green", "1-A", "1-B", "2-A", ...]
export function getClassList() {
  const list = []
  grades.forEach((g) => {
    if (g.sections.length === 0) {
      list.push(g.name)
    } else {
      g.sections.forEach((s) => list.push(`${g.name}-${s}`))
    }
  })
  return list
}

// "5-A" -> "5"   |   "Play Group" -> "Play Group" (no section, unchanged)
// Used by Subjects and Fees, which are the same across every section of a class.
export function getBaseClassName(combined) {
  const grade = grades.find((g) => g.sections.some((s) => `${g.name}-${s}` === combined))
  return grade ? grade.name : combined
}

// Just the grade names (no sections), e.g. ["Play Group", ..., "1", "2", ...]
export function getGradeNames() {
  return grades.map((g) => g.name)
}
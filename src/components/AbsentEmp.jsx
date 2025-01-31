import { useState, useEffect } from "react"
import { ref, onValue } from "firebase/database"
import { db } from "../lib/firebase"
import { UserX, Search, Calendar, Download, Filter } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import ExcelJS from "exceljs"

function AbsentEmp() {
  const [absentEmployees, setAbsentEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const employeesRef = ref(db, "employees")
    const attendanceRef = ref(db, "attendance")

    const fetchData = () => {
      setIsLoading(true)
      onValue(employeesRef, (employeesSnapshot) => {
        onValue(attendanceRef, (attendanceSnapshot) => {
          const employees = employeesSnapshot.val() || {}
          const attendance = attendanceSnapshot.val() || {}

          const presentEmployees = new Set(
            Object.values(attendance)
              .filter((entry) => entry.timestamp.includes(selectedDate))
              .map((entry) => entry.employeeId),
          )

          const absent = Object.entries(employees)
            .filter(([id]) => !presentEmployees.has(id))
            .map(([id, data]) => ({
              id,
              ...data,
            }))

          setAbsentEmployees(absent)

          const uniqueDepartments = [...new Set(Object.values(employees).map((emp) => emp.department))]
          setDepartments(uniqueDepartments)
          setIsLoading(false)
        })
      })
    }

    fetchData()

    return () => {
      const empRef = ref(db, "employees")
      const attRef = ref(db, "attendance")
      onValue(empRef, () => {})
      onValue(attRef, () => {})
    }
  }, [selectedDate])

  const filteredEmployees = absentEmployees.filter((employee) => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.cin && employee.cin.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDepartment = !selectedDepartment || employee.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const exportToExcel = async () => {
    setIsExporting(true)

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Absents")

      worksheet.columns = [
        { header: "NOM COMPLET", key: "fullName", width: 40 },
        { header: "CIN", key: "cin", width: 20 },
        { header: "DEPARTEMENT", key: "department", width: 25 },
      ]

      const titleRow = worksheet.addRow(["Liste des Employés Absents"])
      titleRow.font = { bold: true, size: 16 }
      worksheet.mergeCells("A1:C1")

      worksheet.addRow([]) // Empty row

      const dateRow = worksheet.addRow([`Date: ${format(new Date(selectedDate), "dd MMMM yyyy", { locale: fr })}`])
      dateRow.font = { bold: true, size: 12, color: { argb: "FF666666" } }
      worksheet.mergeCells("A3:C3")

      worksheet.addRow([]) // Empty row

      const headerRow = worksheet.getRow(5)
      headerRow.values = ["NOM COMPLET", "CIN", "DEPARTEMENT"]
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
      headerRow.eachCell((cell) => {
        cell.alignment = { horizontal: "left" }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF9900" },
        }
      })

      filteredEmployees.forEach((employee, index) => {
        const row = worksheet.addRow({
          fullName: employee.fullName,
          cin: employee.cin || "N/A",
          department: employee.department,
        })

        row.height = 25
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "left" }
          if (index % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF5F5F5" },
            }
          }
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Absents_${format(new Date(selectedDate), "yyyyMMdd")}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-pink-600 animate-pulse">
            Employés Absents 😴
          </h1>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-lg">
            <UserX className="w-5 h-5 text-red-500" />
            <span className="text-gray-700 font-medium">Total: {filteredEmployees.length} 📊</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom ou CIN... 🔍"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Tous les départements 🏢</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>{isExporting ? "Exportation..." : "Exporter en Excel 📊"}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
                  <th className="px-6 py-4 text-left">Nom de l'Employé</th>
                  <th className="px-6 py-4 text-left">CIN</th>
                  <th className="px-6 py-4 text-left">Département</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={`hover:bg-red-50 transition-colors duration-150 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {employee.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span>{employee.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">{employee.cin || "N/A"}</td>
                    <td className="px-6 py-4">{employee.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="p-8 text-center">
              <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-bounce" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun employé absent 🎉</h3>
              <p className="text-gray-500">Tous les employés sont présents aujourd'hui ✨</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AbsentEmp ;
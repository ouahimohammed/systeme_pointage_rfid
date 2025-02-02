import { useState, useEffect, useMemo } from "react"
import { ref, onValue } from "firebase/database"
import { db } from "../lib/firebase"
import { Bar, Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from "chart.js"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import jsPDF from "jspdf"
import "jspdf-autotable"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { format, subDays, eachDayOfInterval } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Search,
  Calendar,
  BarChartIcon as ChartBar,
  FileText,
  User,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Printer,
  FileSpreadsheet,
} from "lucide-react"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

export default function Reports() {
  const [employees, setEmployees] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const employeesRef = ref(db, "employees")
    const attendanceRef = ref(db, "attendance")

    onValue(employeesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const employeesList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }))
        setEmployees(employeesList)
      }
    })

    onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const records = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...value,
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setAttendanceRecords(records)
      }
      setIsLoading(false)
    })
  }, [])

  const getRealTimeStats = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    return employees.reduce((stats, emp) => {
      const todayRecords = attendanceRecords
        .filter(record => record.employeeId === emp.id && record.timestamp.startsWith(today))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      if (todayRecords.length > 0) {
        const lastRecord = todayRecords[0]
        if (lastRecord.action === "check-in") {
          stats.present++
        } else if (lastRecord.action === "check-out") {
          stats.absent++
        }
      } else {
        stats.absent++
      }
      return stats
    }, { present: 0, absent: 0 })
  }, [employees, attendanceRecords])

  const calculateWorkHours = (records) => {
    let totalHours = 0
    const recordsByDate = {}

    records.forEach((record) => {
      const date = record.timestamp.split("T")[0]
      if (!recordsByDate[date]) {
        recordsByDate[date] = []
      }
      recordsByDate[date].push(record)
    })

    Object.values(recordsByDate).forEach((dailyRecords) => {
      dailyRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

      let checkInTime = null
      dailyRecords.forEach((record) => {
        if (record.action === "check-in" && !checkInTime) {
          checkInTime = new Date(record.timestamp)
        } else if (record.action === "check-out" && checkInTime) {
          const checkOutTime = new Date(record.timestamp)
          const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
          totalHours += hours
          checkInTime = null
        }
      })
    })

    return totalHours
  }

  const getEmployeeStats = (employeeId) => {
    const employeeRecords = attendanceRecords.filter((record) => record.employeeId === employeeId)
    const filteredRecords = employeeRecords.filter((record) => {
      const recordDate = new Date(record.timestamp)
      const startDateTime = startDate ? startDate.setHours(0, 0, 0, 0) : null
      const endDateTime = endDate ? endDate.setHours(23, 59, 59, 999) : null

      if (startDateTime && endDateTime) {
        return recordDate >= new Date(startDateTime) && recordDate <= new Date(endDateTime)
      } else if (startDateTime) {
        return recordDate >= new Date(startDateTime)
      } else if (endDateTime) {
        return recordDate <= new Date(endDateTime)
      }
      return true
    })

    const uniqueDates = [...new Set(filteredRecords.map((record) => record.timestamp.split("T")[0]))]
    const totalWorkHours = calculateWorkHours(filteredRecords)
    const daysWorked = uniqueDates.length

    return {
      daysWorked,
      totalWorkHours: totalWorkHours.toFixed(2),
      records: filteredRecords,
    }
  }

  const getAllEmployeeRecords = () => {
    const allRecords = []
    const employeesToProcess = selectedEmployee ? [selectedEmployee] : filteredEmployees

    employeesToProcess.forEach((employee) => {
      const { records } = getEmployeeStats(employee.id)
      records.forEach((record) => {
        allRecords.push({
          employeeName: employee.fullName,
          action: record.action,
          date: record.timestamp.split("T")[0],
          time: new Date(record.timestamp).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
          timestamp: record.timestamp,
        })
      })
    })

    // Filter records based on activeTab
    const filteredRecords = allRecords.filter(record => {
      if (activeTab === "present") {
        return record.action === "check-in"
      } else if (activeTab === "absent") {
        return record.action === "check-out"
      }
      return true
    })

    return filteredRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const generateExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Rapport de Présence")

    // Styling
    worksheet.getColumn(1).width = 20
    worksheet.getColumn(2).width = 30
    worksheet.getColumn(3).width = 15
    worksheet.getColumn(4).width = 15

    // Header
    worksheet.addRow(["Rapport de Présence"])
    worksheet.addRow([`Généré le: ${format(new Date(), "PPP", { locale: fr })}`])
    if (selectedEmployee) {
      worksheet.addRow([`Employé: ${selectedEmployee.fullName}`])
    }
    if (startDate || endDate) {
      worksheet.addRow([
        `Période: ${startDate ? format(startDate, "PPP", { locale: fr }) : "Début"} - ${
          endDate ? format(endDate, "PPP", { locale: fr }) : "Fin"
        }`
      ])
    }
    worksheet.addRow([])

    // Stats Summary
    worksheet.addRow(["Statistiques"])
    if (selectedEmployee) {
      const stats = getEmployeeStats(selectedEmployee.id)
      worksheet.addRow(["Jours Travaillés", stats.daysWorked])
      worksheet.addRow(["Heures Totales", `${stats.totalWorkHours}h`])
      worksheet.addRow([
        "Moyenne Quotidienne",
        `${stats.daysWorked ? (Number(stats.totalWorkHours) / stats.daysWorked).toFixed(2) : "0"}h`
      ])
    } else {
      worksheet.addRow(["Total Employés", employees.length])
      worksheet.addRow(["Présents", getRealTimeStats.present])
      worksheet.addRow(["Absents", getRealTimeStats.absent])
    }
    worksheet.addRow([])

    // Detailed Records
    worksheet.addRow(["Historique Détaillé"])
    worksheet.addRow(["Employé", "Date", "Heure", "Action"])

    const records = getAllEmployeeRecords()
    records.forEach(record => {
      worksheet.addRow([
        record.employeeName,
        format(new Date(record.date), "PPP", { locale: fr }),
        record.time,
        record.action === "check-in" ? "Entrée" : "Sortie"
      ])
    })

    // Styling
    worksheet.getRow(1).font = { bold: true, size: 16 }
    worksheet.getRow(5).font = { bold: true }
    worksheet.getRow(9).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(
      new Blob([buffer]), 
      `rapport-presence${selectedEmployee ? `-${selectedEmployee.fullName}` : ""}-${format(new Date(), "yyyy-MM-dd")}.xlsx`
    )
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(44, 62, 80)
    doc.text("Rapport de Présence", 20, 20)

    // Employee Info if selected
    let yPosition = 30
    if (selectedEmployee) {
      doc.setFontSize(14)
      doc.setTextColor(52, 73, 94)
      doc.text(`Employé: ${selectedEmployee.fullName}`, 20, yPosition)
      yPosition += 10
    }

    // Period
    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    doc.text(
      `Période: ${startDate ? format(startDate, "PPP", { locale: fr }) : "Début"} - ${
        endDate ? format(endDate, "PPP", { locale: fr }) : "Fin"
      }`,
      20, yPosition
    )
    yPosition += 15

    // Stats Summary
    doc.setFontSize(14)
    doc.setTextColor(41, 128, 185)
    doc.text("Statistiques", 20, yPosition)
    yPosition += 10

    const stats = selectedEmployee ? [
      ["Métrique", "Valeur"],
      ["Jours Travaillés", getEmployeeStats(selectedEmployee.id).daysWorked.toString()],
      ["Heures Totales", `${getEmployeeStats(selectedEmployee.id).totalWorkHours}h`],
      ["Moyenne Quotidienne", `${
        getEmployeeStats(selectedEmployee.id).daysWorked 
          ? (Number(getEmployeeStats(selectedEmployee.id).totalWorkHours) / 
             getEmployeeStats(selectedEmployee.id).daysWorked).toFixed(2) 
          : "0"
      }h`]
    ] : [
      ["Métrique", "Valeur"],
      ["Total Employés", employees.length.toString()],
      ["Présents", getRealTimeStats.present.toString()],
      ["Absents", getRealTimeStats.absent.toString()]
    ]

    doc.autoTable({
      startY: yPosition,
      head: [stats[0]],
      body: stats.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 12 }
    })

    // Detailed Records
    yPosition = doc.autoTable.previous.finalY + 15
    doc.setFontSize(14)
    doc.setTextColor(41, 128, 185)
    doc.text("Historique Détaillé", 20, yPosition)

    const records = getAllEmployeeRecords()
    const tableData = records.map(record => [
      record.employeeName,
      format(new Date(record.date), "PPP", { locale: fr }),
      record.time,
      record.action === "check-in" ? "Entrée" : "Sortie"
    ])

    doc.autoTable({
      startY: yPosition + 5,
      head: [["Employé", "Date", "Heure", "Action"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 }
      }
    })

    doc.save(
      `rapport-presence${selectedEmployee ? `-${selectedEmployee.fullName}` : ""}-${format(new Date(), "yyyy-MM-dd")}.pdf`
    )
  }

  const getTrendData = () => {
    const days = 7
    const endDate = new Date()
    const startDate = subDays(endDate, days - 1)
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

    const presenceData = dateRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd")
      const dayRecords = attendanceRecords.filter(record => 
        record.timestamp.startsWith(dateStr) && 
        (!selectedEmployee || record.employeeId === selectedEmployee.id)
      )
      
      const presentCount = new Set(
        dayRecords
          .filter(record => record.action === "check-in")
          .map(record => record.employeeId)
      ).size

      return {
        date: format(date, "dd/MM"),
        present: presentCount,
        total: selectedEmployee ? 1 : employees.length,
        percentage: selectedEmployee 
          ? (presentCount > 0 ? 100 : 0)
          : (employees.length ? (presentCount / employees.length) * 100 : 0)
      }
    })

    return presenceData
  }

  const trendChartData = {
    labels: getTrendData().map(data => data.date),
    datasets: [
      {
        label: "Taux de présence (%)",
        data: getTrendData().map(data => data.percentage),
        borderColor: "rgba(99, 102, 241, 1)",
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        fill: true,
        tension: 0.4,
      }
    ]
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesName = employee.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesName
  })

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query) {
      const filteredSuggestions = employees.filter((employee) =>
        employee.fullName.toLowerCase().includes(query.toLowerCase()),
      )
      setSuggestions(filteredSuggestions)
    } else {
      setSuggestions([])
    }
  }

  const selectEmployee = (employee) => {
    setSearchQuery(employee.fullName)
    setSelectedEmployee(employee)
    setSuggestions([])
    setCurrentPage(1)
  }

  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 800)
  }

  const barChartData = {
    labels: ["Présent", "Absent"],
    datasets: [
      {
        label: "Statistiques de présence",
        data: [getRealTimeStats.present, getRealTimeStats.absent],
        backgroundColor: ["rgba(34, 197, 94, 0.6)", "rgba(239, 68, 68, 0.6)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 1,
      },
    ],
  }

  const currentItems = getAllEmployeeRecords().slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-indigo-500">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Rapports de Présence
                </h1>
                <p className="text-gray-500">Gérez et analysez la présence des employés</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Rafraîchir les données"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={generateExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-md"
              >
                <FileSpreadsheet className="h-5 w-5" />
                Excel
              </button>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-md"
              >
                <Printer className="h-5 w-5" />
                PDF
              </button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Employés</p>
                  <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Présents</p>
                  <p className="text-2xl font-bold text-green-900">{getRealTimeStats.present}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Absents</p>
                  <p className="text-2xl font-bold text-red-900">{getRealTimeStats.absent}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Taux de Présence</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {employees.length
                      ? Math.round(
                          (getRealTimeStats.present / employees.length) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="🔍 Rechercher un employé..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((employee) => (
                    <li
                      key={employee.id}
                      onClick={() => selectEmployee(employee)}
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span>{employee.fullName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="📅 Date de début"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="📅 Date de fin"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStartDate(null)
                  setEndDate(null)
                  setSearchQuery("")
                  setSelectedEmployee(null)
                  setActiveTab("all")
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-1 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Selected Employee Stats */}
        {selectedEmployee && (
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedEmployee.fullName}</h2>
                <p className="text-sm text-gray-500">{selectedEmployee.department}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const stats = getEmployeeStats(selectedEmployee.id)
                return (
                  <>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <h3 className="text-sm font-medium text-green-800">Jours Travaillés</h3>
                      <p className="text-2xl font-bold text-green-900">{stats.daysWorked} jours</p>
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>Période sélectionnée</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <h3 className="text-sm font-medium text-blue-800">Heures Travaillées</h3>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalWorkHours}h</p>
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Total</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <h3 className="text-sm font-medium text-purple-800">Moyenne Quotidienne</h3>
                      <p className="text-2xl font-bold text-purple-900">
                        {stats.daysWorked
                          ? (Number.parseFloat(stats.totalWorkHours) / stats.daysWorked).toFixed(2)
                          : "0"}
                        h
                      </p>
                      <div className="mt-2 flex items-center text-sm text-purple-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>Par jour</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: {
                      font: {
                        family: "'Inter', sans-serif",
                        size: 12,
                        weight: "500",
                      },
                      usePointStyle: true,
                      padding: 20,
                    },
                  },
                  title: {
                    display: true,
                    text: "📊 Répartition des présences",
                    font: {
                      family: "'Inter', sans-serif",
                      size: 16,
                      weight: "bold",
                    },
                    padding: {
                      top: 10,
                      bottom: 20,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      display: true,
                      color: "rgba(0, 0, 0, 0.05)",
                    },
                    ticks: {
                      font: {
                        family: " 'Inter', sans-serif",
                      },
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      font: {
                        family: "'Inter', sans-serif",

                      },
                    },
                  },
                },
              }}
              className="h-[300px]"
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ChartBar className="h-5 w-5 text-indigo-600" />
              Tendances de Présence (7 derniers jours)
            </h3>
            
          </div>
        </div>

        {/* Action History Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-6 w-6 text-indigo-600" />
                Historique des Actions
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab("all")
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "all" 
                      ? "bg-indigo-100 text-indigo-700 font-medium" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => {
                    setActiveTab("present")
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "present" 
                      ? "bg-green-100 text-green-700 font-medium" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  Présents
                </button>
                <button
                  onClick={() => {
                    setActiveTab("absent")
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "absent" 
                      ? "bg-red-100 text-red-700 font-medium" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  Absents
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heure
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${
                          record.action === "check-in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.action === "check-in" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Entrée
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Sortie
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                          <div className="text-sm text-gray-500">{/* Add department or role here if available */}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(record.date), "EEEE d MMMM yyyy", { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                {Math.min(currentPage * itemsPerPage, getAllEmployeeRecords().length)} sur{" "}
                {getAllEmployeeRecords().length} entrées
              </div>
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(getAllEmployeeRecords().length / itemsPerPage) }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white hover:bg-gray-100 text-gray-700 border"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
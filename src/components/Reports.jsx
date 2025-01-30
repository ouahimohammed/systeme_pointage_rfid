import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Search, Calendar, Download, BarChart as ChartBar, FileText, User, Clock } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Reports() {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const attendanceRef = ref(db, 'attendance');

    onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeesList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setEmployees(employeesList);
      }
    });

    onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const records = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...value,
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAttendanceRecords(records);
      }
    });
  }, []);

  const calculateWorkHours = (records) => {
    let totalHours = 0;
    const recordsByDate = {};

    // Group records by date
    records.forEach(record => {
      const date = record.timestamp.split('T')[0];
      if (!recordsByDate[date]) {
        recordsByDate[date] = [];
      }
      recordsByDate[date].push(record);
    });

    // Calculate hours for each date
    Object.values(recordsByDate).forEach(dailyRecords => {
      // Sort records by timestamp
      dailyRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      let checkInTime = null;
      dailyRecords.forEach(record => {
        if (record.action === 'check-in' && !checkInTime) {
          checkInTime = new Date(record.timestamp);
        } else if (record.action === 'check-out' && checkInTime) {
          const checkOutTime = new Date(record.timestamp);
          const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
          totalHours += hours;
          checkInTime = null;
        }
      });
    });

    return totalHours;
  };

  const getEmployeeStats = (employeeId) => {
    const employeeRecords = attendanceRecords.filter(record => record.employeeId === employeeId);
    const filteredRecords = employeeRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      const startDateTime = startDate ? startDate.setHours(0, 0, 0, 0) : null;
      const endDateTime = endDate ? endDate.setHours(23, 59, 59, 999) : null;

      if (startDateTime && endDateTime) {
        return recordDate >= new Date(startDateTime) && recordDate <= new Date(endDateTime);
      } else if (startDateTime) {
        return recordDate >= new Date(startDateTime);
      } else if (endDateTime) {
        return recordDate <= new Date(endDateTime);
      }
      return true;
    });

    const uniqueDates = [...new Set(filteredRecords.map(record => record.timestamp.split('T')[0]))];
    const totalWorkHours = calculateWorkHours(filteredRecords);
    const daysWorked = uniqueDates.length;

    return {
      daysWorked,
      totalWorkHours: totalWorkHours.toFixed(2),
      records: filteredRecords
    };
  };

  const getAllEmployeeRecords = () => {
    const allRecords = [];
    
    filteredEmployees.forEach(employee => {
      const { records } = getEmployeeStats(employee.id);
      records.forEach(record => {
        allRecords.push({
          employeeName: employee.fullName,
          action: record.action,
          date: record.timestamp.split('T')[0],
          time: new Date(record.timestamp).toLocaleTimeString(),
          timestamp: record.timestamp
        });
      });
    });

    return allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesName = employee.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesName;
  });

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query) {
      const filteredSuggestions = employees.filter((employee) =>
        employee.fullName.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const selectEmployee = (employee) => {
    setSearchQuery(employee.fullName);
    setSelectedEmployee(employee);
    setSuggestions([]);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Rapport Détaillé de Présence', 14, 20);
    
    // Period
    doc.setFontSize(12);
    doc.text(
      `Période: ${startDate ? startDate.toLocaleDateString() : 'Début'} - ${
        endDate ? endDate.toLocaleDateString() : 'Fin'
      }`,
      14,
      30
    );

    let yPosition = 40;

    // Employee Statistics
    filteredEmployees.forEach(employee => {
      const stats = getEmployeeStats(employee.id);
      
      doc.setFontSize(14);
      doc.text(`Employé: ${employee.fullName}`, 14, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text(`Nombre de jours travaillés: ${stats.daysWorked}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Nombre d'heures travaillées: ${stats.totalWorkHours}h`, 20, yPosition);
      yPosition += 15;

      // Detailed records table for this employee
      const employeeRecords = stats.records.map(record => [
        new Date(record.timestamp).toLocaleDateString(),
        new Date(record.timestamp).toLocaleTimeString(),
        record.action === 'check-in' ? 'Entrée' : 'Sortie'
      ]);

      if (employeeRecords.length > 0) {
        doc.autoTable({
          startY: yPosition,
          head: [['Date', 'Heure', 'Action']],
          body: employeeRecords,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 20 }
        });
        
        yPosition = doc.autoTable.previous.finalY + 15;
      } else {
        doc.text('Aucun enregistrement pour cette période', 20, yPosition);
        yPosition += 15;
      }

      // Add page if needed
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Summary section
    // doc.addPage();
    // doc.setFontSize(16);
    // doc.text('Résumé Global', 14, 20);
    
    // const totalStats = filteredEmployees.reduce((acc, employee) => {
    //   const stats = getEmployeeStats(employee.id);
    //   return {
    //     totalDays: acc.totalDays + stats.daysWorked,
    //     totalHours: acc.totalHours + parseFloat(stats.totalWorkHours)
    //   };
    // }, { totalDays: 0, totalHours: 0 });

    // doc.autoTable({
    //   startY: 30,
    //   head: [['Métrique', 'Valeur']],
    //   body: [
    //     ['Nombre total de jours travaillés', totalStats.totalDays],
    //     ['Nombre total d\'heures travaillées', totalStats.totalHours.toFixed(2)],
    //   ],
    //   styles: { fontSize: 10 },
    //   headStyles: { fillColor: [41, 128, 185] }
    // });

    doc.save('rapport-presenceAbsence.pdf');
  };

  const currentItems = getAllEmployeeRecords().slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const barChartData = {
    labels: ['Présent', 'En cours', 'Absent'],
    datasets: [
      {
        label: 'Statistiques de présence',
        data: [
          filteredEmployees.filter(emp => {
            const stats = getEmployeeStats(emp.id);
            return stats.records.length > 0;
          }).length,
          0,
          filteredEmployees.filter(emp => {
            const stats = getEmployeeStats(emp.id);
            return stats.records.length === 0;
          }).length
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(234, 179, 8, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-indigo-600" />
            Rapports de Présence
          </h1>
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Télécharger PDF
          </button>
        </header>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                  {suggestions.map((employee) => (
                    <li
                      key={employee.id}
                      onClick={() => selectEmployee(employee)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      {employee.fullName}
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
                placeholderText="Date de début"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                placeholderText="Date de fin"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Employee Statistics Cards */}
        {selectedEmployee && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Clock className="h-6 w-6 text-indigo-600" />
              Statistiques de {selectedEmployee.fullName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const stats = getEmployeeStats(selectedEmployee.id);
                return (
                  <>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-green-800">Jours Travaillés</h3>
                      <p className="text-2xl font-bold text-green-900">{stats.daysWorked}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-800">Heures Travaillées</h3>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalWorkHours}h</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-yellow-800">Moyenne Quotidienne</h3>
                      <p className="text-2xl font-bold text-yellow-900">
                        {stats.daysWorked ? (parseFloat(stats.totalWorkHours) / stats.daysWorked).toFixed(2) : '0'}h
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Statistiques et Graphique */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Statistiques</h2>
          </div>
          <div className="h-[300px]">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Répartition des présences',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Tableau des actions */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Historique des Actions</h2>
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
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.action === 'check-in'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.action === 'check-in' ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-center">
              {Array.from(
                { length: Math.ceil(getAllEmployeeRecords().length / itemsPerPage) },
                (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`px-3 py-1 mx-1 rounded ${
                      currentPage === i + 1
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
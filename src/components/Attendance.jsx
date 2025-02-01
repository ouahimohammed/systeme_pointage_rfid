import React, { useState, useEffect } from "react";
import { ref, push, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { 
  UserX, 
  Search, 
  Calendar, 
  Download, 
  Filter, 
  Clock, 
  Activity, 
  UserPlus, 
  UserMinus,
  AlertCircle
} from 'lucide-react';

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [status, setStatus] = useState("Déconnecté");
  const [latestScans, setLatestScans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedAction, setSelectedAction] = useState("check-in");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [employeeCIN, setEmployeeCIN] = useState("");
  const [duplicateNames, setDuplicateNames] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const employeesRef = ref(db, "employees");
    const attendanceRef = ref(db, "attendance");

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
        const records = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setAttendanceRecords(records);
      }
    });
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.100.114:81");

    ws.onopen = () => {
      setStatus("Connecté au WebSocket");
    };

    ws.onmessage = (message) => {
      const uid = message.data;
      const employee = employees.find((emp) => emp.cardUID === uid);

      if (employee) {
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        
        const todayRecords = attendanceRecords
          .filter(
            (record) => 
              record.employeeId === employee.id && 
              record.timestamp.includes(today)
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        let action;
        if (todayRecords.length === 0) {
          action = "check-in";
        } else {
          action = todayRecords[0].action === "check-in" ? "check-out" : "check-in";
        }

        handleAttendanceAction(employee.id, action);
        setStatus(`L'employé ${employee.fullName} a ${action === "check-in" ? "pointé" : "dépointe"} avec succès !`);

        setLatestScans((prevScans) => [
          {
            id: now.getTime(),
            employeeName: employee.fullName,
            action: action,
            timestamp: now.toLocaleString(),
          },
          ...prevScans.slice(0, 4),
        ]);
      } else {
        setStatus("Aucun employé trouvé avec cet UID de carte.");
      }
    };

    ws.onclose = () => {
      setStatus("Déconnecté");
    };

    ws.onerror = (error) => {
      console.error("Erreur WebSocket:", error);
      setStatus("Erreur de connexion");
    };

    return () => {
      ws.close();
    };
  }, [employees, attendanceRecords]);

  const handleAttendanceAction = async (employeeId, action) => {
    try {
      const attendanceRef = ref(db, "attendance");
      await push(attendanceRef, {
        employeeId,
        action,
        timestamp: new Date().toISOString(),
      });
      console.log(`Présence enregistrée : ${action} pour l'employé ${employeeId}`);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la présence:", error);
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      alert("Veuillez sélectionner un employé");
      return;
    }

    try {
      const attendanceRef = ref(db, "attendance");
      await push(attendanceRef, {
        employeeId: selectedEmployee,
        action: selectedAction,
        timestamp: new Date().toISOString(),
        isManual: true
      });

      setStatus(`Présence manuelle enregistrée pour ${
        employees.find(emp => emp.id === selectedEmployee)?.fullName
      }`);

      const employee = employees.find(emp => emp.id === selectedEmployee);
      setLatestScans(prevScans => [{
        id: Date.now(),
        employeeName: employee?.fullName,
        action: selectedAction,
        timestamp: new Date().toLocaleString(),
        isManual: true
      }, ...prevScans.slice(0, 4)]);

      setShowManualEntry(false);
      setSelectedEmployee("");
      setSelectedAction("check-in");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement manuel:", error);
      setStatus("Erreur lors de l'enregistrement manuel");
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId);
    
    const selectedEmp = employees.find(emp => emp.id === employeeId);
    if (selectedEmp) {
      const sameNames = employees.filter(emp => 
        emp.fullName === selectedEmp.fullName
      );
      
      if (sameNames.length > 1) {
        setDuplicateNames(sameNames);
        setSelectedDepartment("");
        setEmployeeCIN("");
      } else {
        setDuplicateNames([]);
        setSelectedDepartment(selectedEmp.department);
        setEmployeeCIN(selectedEmp.cin);
      }
    }
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    const employee = duplicateNames.find(emp => emp.department === department);
    if (employee) {
      setEmployeeCIN(employee.cin);
      setSelectedEmployee(employee.id);
    }
  };

  const filteredRecords = attendanceRecords
    .filter((record) => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      const matchesSearch = employee?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = dateFilter ? record.timestamp.includes(dateFilter) : true;
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with System Status and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Title */}
        {/* System Title */}
        <div className="md:col-span-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <span ></span> Système de Pointage
          </h1>
        </div>



          {/* Digital Clock */}
          <div className=" pb-3 rounded-xl  flex items-center justify-center space-x-3">
            <Clock className="w-6 h-6 text-indigo-600" /><h3>
            <span className="text-2xl font-mono text-indigo-600">
              {currentTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </span></h3>
          </div>

          {/* System Status and Manual Entry */}
          <div className="flex items-center space-x-4">
            {/* System Status */}
            <div className="bg-white p-4 rounded-xl shadow-lg flex-1 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-sm">Système</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === "Connecté au WebSocket"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {status === "Connecté au WebSocket" ? "✅ En ligne" : "❌ Hors ligne"}
              </div>
            </div>

            {/* Manual Entry Button */}
            <button
              onClick={() => setShowManualEntry(true)}
              className="bg-white p-4 rounded-xl shadow-lg text-indigo-600 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              🔍 Filtres de Recherche
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un employé..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Latest Scans */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            📱 Derniers Pointages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestScans.map((scan) => (
              <div
                key={scan.id}
                className="bg-white rounded-xl shadow-lg p-4 transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    scan.action === "check-in"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {scan.action === "check-in" ? <UserPlus className="w-6 h-6" /> : <UserMinus className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{scan.employeeName}</p>
                    <p className="text-sm text-gray-500">{scan.timestamp}</p>
                    {scan.isManual && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                        Manuel
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {latestScans.length === 0 && (
              <div className="col-span-3 bg-white rounded-xl shadow-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun pointage récent</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <th className="px-6 py-4 text-left">Employé</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Heure</th>
                  <th className="px-6 py-4 text-left">Action</th>
                  <th className="px-6 py-4 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => {
                  const employee = employees.find(emp => emp.id === record.employeeId);
                  const recordDate = new Date(record.timestamp);
                  return (
                    <tr
                      key={record.id}
                      className={`${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      } hover:bg-indigo-50 transition-colors duration-150`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {employee?.fullName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-gray-800">
                            {employee?.fullName || 'Inconnu'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {recordDate.toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {recordDate.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          record.action === "check-in"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {record.action === "check-in" ? (
                            <>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Entrée
                            </>
                          ) : (
                            <>
                              <UserMinus className="w-4 h-4 mr-1" />
                              Sortie
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record.isManual && (
                          <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                            Manuel
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun enregistrement trouvé
              </h3>
              <p className="text-gray-500">
                Ajustez vos filtres pour voir plus de résultats
              </p>
            </div>
          )}
        </div>

        {/* Manual Entry Modal */}
        {showManualEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  📝 Entrée Manuelle
                </h2>
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <form onSubmit={handleManualEntry} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employé
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner un employé</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {duplicateNames.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Département
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentSelect(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Sélectionner le département</option>
                      {duplicateNames.map((emp) => (
                        <option key={emp.id} value={emp.department}>
                          {emp.department}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {employeeCIN && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CIN
                    </label>
                    <input
                      type="text"
                      value={employeeCIN}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="check-in">Entrée</option>
                    <option value="check-out">Sortie</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowManualEntry(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
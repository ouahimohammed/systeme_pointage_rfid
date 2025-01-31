import React, { useState, useEffect } from "react";
import { ref, push, onValue } from "firebase/database";
import { db } from "../lib/firebase";

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [status, setStatus] = useState("Déconnecté");
  const [latestScans, setLatestScans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date(), 1000);

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
    const ws = new WebSocket("ws://192.168.1.43:81");

    ws.onopen = () => {
      setStatus("Connecté au WebSocket");
    };

    ws.onmessage = (message) => {
      const uid = message.data;
      const employee = employees.find((emp) => emp.cardUID === uid);

      if (employee) {
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        
        // Récupérer tous les enregistrements d'aujourd'hui pour cet employé
        const todayRecords = attendanceRecords
          .filter(
            (record) => 
              record.employeeId === employee.id && 
              record.timestamp.includes(today)
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Déterminer l'action en fonction du dernier scan
        let action;
        if (todayRecords.length === 0) {
          action = "check-in";
        } else {
          // Si le dernier scan était une entrée, on fait une sortie et vice versa
          action = todayRecords[0].action === "check-in" ? "check-out" : "check-in";
        }

        // Enregistrer l'action
        handleAttendanceAction(employee.id, action);
        setStatus(`L'employé ${employee.fullName} a ${action === "check-in" ? "pointé" : "dépointe"} avec succès !`);

        // Mettre à jour les derniers scans
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

  const getEmployeeStatus = (employeeId) => {
    const today = new Date().toISOString().split("T")[0];
    const todayRecords = attendanceRecords
      .filter(
        (record) => 
          record.employeeId === employeeId && 
          record.timestamp.includes(today)
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (todayRecords.length > 0) {
      return todayRecords[0].action;
    }
    return "Absent";
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
        {/* En-tête avec animation et horloge */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2 animate-fade-in">
            🏢 Système de Présence
          </h1>
          <div className="text-2xl font-digital text-indigo-600 animate-pulse"> <h3>
          {currentTime.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: false 
            })}</h3>  
          </div>
        </div>

        {/* Status Card avec animation hover */}
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-102 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold text-gray-700">
              📡 État du Système
            </span>
            <div className={`px-4 py-2 rounded-full ${
              status === "Connecté au WebSocket"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}>
              {status === "Connecté au WebSocket" ? "✅" : "❌"} {status}
            </div>
          </div>
        </div>

        {/* Filtres et Recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            🔍 Filtres de Recherche
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher par nom
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom de l'employé..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Derniers Scans avec effet de carte */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            📱 Derniers Scans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestScans.map((scan) => (
              <div key={scan.id} 
                   className="bg-white rounded-xl shadow-lg p-6 transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    scan.action === "check-in" ? "bg-emerald-100" : "bg-rose-100"
                  }`}>
                    {scan.action === "check-in" ? "👋" : "👋"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{scan.employeeName}</p>
                    <p className="text-sm text-gray-500">{scan.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tableau Principal */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left">👤 Nom</th>
                <th className="px-6 py-4 text-left">📅 Date</th>
                <th className="px-6 py-4 text-left">⏰ Heure</th>
                <th className="px-6 py-4 text-left">🔄 Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => {
                const employee = employees.find(emp => emp.id === record.employeeId);
                const recordDate = new Date(record.timestamp);
                return (
                  <tr key={record.id} className={`
                    ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    hover:bg-indigo-50 transition-colors duration-150
                  `}>
                    <td className="px-6 py-4">{employee?.fullName || 'Inconnu'}</td>
                    <td className="px-6 py-4">
                      {recordDate.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {recordDate.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        record.action === "check-in"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {record.action === "check-in" ? "✅ Entrée" : "🚪 Sortie"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

       
      </div>
    </div>
  );
}
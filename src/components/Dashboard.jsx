import { useState, useEffect, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { useNavigate } from 'react-router-dom';

// Add useNavigate to your imports at the top
// Then update the card section:

import { db } from "../lib/firebase";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, UserCheck, UserX, TrendingUp, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [departmentData, setDepartmentData] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [presenceCount, setPresenceCount] = useState(0);
  const [absenceCount, setAbsenceCount] = useState(0);
  const [presenceByDepartment, setPresenceByDepartment] = useState({});
  const [employees, setEmployees] = useState({});
  const navigate = useNavigate();
  useEffect(() => {
    const employeesRef = ref(db, "employees");

    onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEmployees(data);
        const employeesList = Object.values(data);
        setEmployeeCount(employeesList.length);

        const departments = {};
        employeesList.forEach((emp) => {
          if (emp.department) {
            departments[emp.department] = (departments[emp.department] || 0) + 1;
          }
        });
        setDepartmentData(departments);

        const sortedEmployees = employeesList
          .filter((emp) => emp.dateAdded)
          .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        setRecentActivities(sortedEmployees.slice(0, 5));
      } else {
        setEmployees({});
        setEmployeeCount(0);
        setDepartmentData({});
        setRecentActivities([]);
      }
    });
  }, []);

  useEffect(() => {
    const attendanceRef = ref(db, "attendance");

    if (Object.keys(employees).length > 0) {
      onValue(attendanceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const today = new Date().toISOString().split("T")[0];

          const presentEmployees = new Set();
          Object.values(data).forEach((entry) => {
            if (entry.timestamp.includes(today)) {
              presentEmployees.add(entry.employeeId);
            }
          });

          const presentCount = presentEmployees.size;
          setPresenceCount(presentCount);
          setAbsenceCount(Object.keys(employees).length - presentCount);

          const departmentPresence = {};
          presentEmployees.forEach((employeeId) => {
            const employee = employees[employeeId];
            if (employee && employee.department) {
              departmentPresence[employee.department] =
                (departmentPresence[employee.department] || 0) + 1;
            }
          });
          setPresenceByDepartment(departmentPresence);
        } else {
          setPresenceCount(0);
          setAbsenceCount(Object.keys(employees).length);
          setPresenceByDepartment({});
        }
      });
    }
  }, [employees]);

  const chartData = useMemo(
    () => ({
      labels: Object.keys(departmentData),
      datasets: [
        {
          label: "Employés par département",
          data: Object.values(departmentData),
          backgroundColor: [
            'rgba(99, 102, 241, 0.6)',
            'rgba(168, 85, 247, 0.6)',
            'rgba(236, 72, 153, 0.6)',
            'rgba(239, 68, 68, 0.6)',
          ],
          borderColor: [
            'rgba(99, 102, 241, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    }),
    [departmentData]
  );

  const presenceChartData = useMemo(
    () => ({
      labels: Object.keys(presenceByDepartment),
      datasets: [
        {
          label: "Présence par département",
          data: Object.values(presenceByDepartment),
          backgroundColor: [
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(139, 92, 246, 0.6)',
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(139, 92, 246, 1)',
          ],
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    }),
    [presenceByDepartment]
  );

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          padding: 20
        }
      },
      title: {
        display: true,
        font: {
          family: "'Inter', sans-serif",
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Tableau de bord
          </h1>
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <Activity className="w-4 h-4" />
            <span>Mise à jour en temps réel</span>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">Total des employés</h2>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  {employeeCount}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Total actuel</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">Employés présents</h2>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">
                  {presenceCount}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Aujourd'hui</span>
            </div>
          </div>

          <div 
            className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer" 
            onClick={() => navigate('/absent')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/absent')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">
                  Employés absents 🏃‍♂️
                </h2>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
                  {absenceCount}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full animate-pulse">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Aujourd'hui</span>
            </div>
</div>


        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <Bar
              data={chartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: "Répartition des employés par département"
                  }
                }
              }}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <Bar
              data={presenceChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: "Présence par département aujourd'hui"
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Activités récentes
          </h2>
          <div className="space-y-6">
            {recentActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 transition-colors duration-300"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {activity.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activity.fullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Ajouté au département {activity.department}
                  </p>
                  <p className="text-xs text-gray-400">
                    Il y a {formatDistanceToNow(new Date(activity.dateAdded), { locale: fr })}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Nouveau
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

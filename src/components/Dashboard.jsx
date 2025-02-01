import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
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
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Bell,
  Calendar,
  Coffee,
  Award
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AbsentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Liste des Absents</h1>
        {/* Add your absent employees list here */}
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [employeeCount, setEmployeeCount] = useState(0);
  const [departmentData, setDepartmentData] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [presenceCount, setPresenceCount] = useState(0);
  const [absenceCount, setAbsenceCount] = useState(0);
  const [presenceByDepartment, setPresenceByDepartment] = useState({});
  const [employees, setEmployees] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  // Firebase data fetching for employees
  useEffect(() => {
    const employeesRef = ref(db, "employees");

    const unsubscribe = onValue(employeesRef, (snapshot) => {
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
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firebase data fetching for attendance
  useEffect(() => {
    if (Object.keys(employees).length > 0) {
      const attendanceRef = ref(db, "attendance");

      const unsubscribe = onValue(attendanceRef, (snapshot) => {
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

      return () => unsubscribe();
    }
  }, [employees]);
  // Nouvel effet pour simuler les notifications
  useEffect(() => {
    // Simuler des notifications en temps réel
    const newNotifications = [
      { id: 1, message: "Ahmed vient d'arriver", time: new Date(), type: "presence" },
      { id: 2, message: "Sara est en retard", time: new Date(Date.now() - 3600000), type: "alert" },
      { id: 3, message: "Réunion dans 30 minutes", time: new Date(Date.now() + 1800000), type: "event" }
    ];
    setNotifications(newNotifications);

    // Simuler des événements du calendrier
    const newEvents = [
      { id: 1, title: "Réunion d'équipe", date: new Date(), type: "meeting" },
      { id: 2, title: "Formation RH", date: new Date(Date.now() + 86400000), type: "training" },
      { id: 3, title: "Entretiens", date: new Date(Date.now() + 172800000), type: "interview" }
    ];
    setEvents(newEvents);
  }, []);

  const chartData = useMemo(
    () => ({
      labels: Object.keys(departmentData),
      datasets: [
        {
          label: "Employés par département",
          data: Object.values(departmentData),
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgba(99, 102, 241, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
          borderRadius: 12,
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
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(139, 92, 246, 1)',
          ],
          borderWidth: 2,
          borderRadius: 12,
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
            size: 12,
            weight: '500'
          },
          padding: 20,
          usePointStyle: true,
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
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif"
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif"
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Dashboard RH 📊
              </h1>
              <p className="text-gray-500">Bienvenue sur votre tableau de bord</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Bell className="w-6 h-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <p className="text-sm text-gray-800">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(notif.time, { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Calendar className="w-6 h-6 text-gray-600" />
                {events.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {events.length}
                  </span>
                )}
              </button>
              
              {showCalendar && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Événements à venir</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <p className="text-sm font-medium text-gray-800">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(event.date, { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-t-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">Total Employés 👥</h2>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  {employeeCount}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full animate-pulse">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12% ce mois</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-t-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">Présents ✅</h2>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">
                  {presenceCount}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Coffee className="w-4 h-4 mr-1" />
              <span>En service</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/absent')}
            className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-t-4 border-red-500 cursor-pointer hover:shadow-xl"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/absent')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">Absents 🏃‍♂️</h2>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
                  {absenceCount}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full animate-pulse">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Activity className="w-4 h-4 mr-1" />
              <span>Voir les détails →</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <Bar
              data={chartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: "📊 Répartition par département"
                  }
                }
              }}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <Bar
              data={presenceChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: "📈 Présence aujourd'hui"
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Activités récentes 🔔
            </h2>
            <button
              onClick={() => navigate('/activities')}
              className="px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition-opacity duration-200"
            >
              Voir tout →
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-102"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {activity.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activity.fullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    ✨ Ajouté au département {activity.department}
                  </p>
                  <p className="text-xs text-gray-400">
                    ⏰ Il y a {formatDistanceToNow(new Date(activity.dateAdded), { locale: fr })}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                    Nouveau 🌟
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
export default Dashboard;
 
import { useState, useEffect } from 'react';
import { ref, push, onValue, remove, update, query, equalTo, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { Eye, Edit2, Trash2, Search, Download, Filter, UserPlus, Badge, Briefcase, Users } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    cin: '',
    gender: '',
    department: '',
    cardUID: '',
  });
  const [status, setStatus] = useState('Déconnecté');
  const [isScanning, setIsScanning] = useState(false);

  const departments = ['IT', 'Finance', 'Marketing', 'RH'];

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeesList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setEmployees(employeesList);
      } else {
        setEmployees([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://192.168.1.43:81');

    ws.onopen = () => {
      setStatus('Connecté au WebSocket');
    };

    ws.onmessage = (message) => {
      if (isScanning) {
        const uid = message.data;
        if (isUidUnique(uid)) {
          setNewEmployee((prev) => ({ ...prev, cardUID: uid }));
          setStatus(`Carte scannée: ${uid}`);
          setIsScanning(false);
        } else {
          setStatus('Cette carte est déjà associée à un autre employé.');
        }
      }
    };

    ws.onclose = () => {
      setStatus('Déconnecté');
    };

    ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      setStatus('Erreur de connexion');
    };

    return () => {
      ws.close();
    };
  }, [employees, isScanning]);

  const isUidUnique = (uid) => {
    return !employees.some((employee) => employee.cardUID === uid);
  };

  const isCinUnique = (cin) => {
    return !employees.some((employee) => employee.cin === cin);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    if (!newEmployee.cardUID) {
      alert('Veuillez scanner la carte RFID de l\'employé avant de soumettre.');
      return;
    }

    if (!isUidUnique(newEmployee.cardUID)) {
      alert('Cette carte est déjà associée à un autre employé.');
      return;
    }

    if (!isCinUnique(newEmployee.cin)) {
      alert('Ce numéro CIN est déjà utilisé par un autre employé.');
      return;
    }

    try {
      const employeesRef = ref(db, 'employees');
      await push(employeesRef, {
        ...newEmployee,
        dateAdded: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
      setNewEmployee({
        fullName: '',
        cin: '',
        gender: '',
        department: '',
        cardUID: '',
      });
      setStatus('Employé ajouté avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'employé:', error);
      setStatus('Erreur lors de l\'ajout de l\'employé à Firebase.');
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    
    if (selectedEmployee.cin !== selectedEmployee._previousCin && !isCinUnique(selectedEmployee.cin)) {
      alert('Ce numéro CIN est déjà utilisé par un autre employé.');
      return;
    }

    try {
      const employeeRef = ref(db, `employees/${selectedEmployee.id}`);
      await update(employeeRef, selectedEmployee);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'employé:', error);
    }
  };

  const handleDeleteEmployee = (id) => {
    const employee = employees.find((emp) => emp.id === id);
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const deleteEmployeeAttendance = async (employeeId) => {
    const attendanceRef = ref(db, 'attendance');
    try {
      const snapshot = await get(attendanceRef);
      if (snapshot.exists()) {
        const attendanceData = snapshot.val();
        Object.keys(attendanceData).forEach((key) => {
          if (attendanceData[key].employeeId === employeeId) {
            remove(ref(db, `attendance/${key}`));
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des entrées de présence:', error);
    }
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployeeAttendance(employeeToDelete.id);
        const employeeRef = ref(db, `employees/${employeeToDelete.id}`);
        await remove(employeeRef);
        setIsDeleteModalOpen(false);
        setEmployeeToDelete(null);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'employé:', error);
      }
    }
  };

  const openEditModal = (employee) => {
    setSelectedEmployee({ ...employee, _previousCin: employee.cin });
    setIsEditModalOpen(true);
  };

  const openDetailModal = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.cin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || employee.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const stats = {
    total: employees.length,
    byDepartment: departments.reduce((acc, dept) => {
      acc[dept] = employees.filter(e => e.department === dept).length;
      return acc;
    }, {})
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header avec statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employés</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          {Object.entries(stats.byDepartment).map(([dept, count]) => (
            <div key={dept} className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{dept}</p>
                  <p className="text-2xl font-bold text-indigo-600">{count}</p>
                </div>
                <Briefcase className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Barre d'actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou CIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les départements</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>Ajouter un Employé</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table des employés */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <th className="px-6 py-4 text-left">Nom Complet</th>
                  <th className="px-6 py-4 text-left">CIN</th>
                  <th className="px-6 py-4 text-left">Genre</th>
                  <th className="px-6 py-4 text-left">Département</th>
                  <th className="px-6 py-4 text-left">UID Carte</th>
                  <th className="px-6 py-4 text-left">Date d'ajout</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={`hover:bg-blue-50 transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                          {employee.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{employee.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{employee.cin}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        employee.gender === 'Homme'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {employee.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {employee.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{employee.cardUID}</span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(employee.dateAdded).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => openDetailModal(employee)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(employee)}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun employé trouvé
              </h3>
              <p className="text-gray-500">
                Ajoutez des employés ou modifiez vos critères de recherche
              </p>
            </div>
          )}
        </div>

        {/* Modal d'ajout d'employé */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Ajouter un employé</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddEmployee} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom Complet</label>
                  <input
                    type="text"
                    value={newEmployee.fullName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CIN</label>
                  <input
                    type="text"
                    value={newEmployee.cin}
                    onChange={(e) => setNewEmployee({ ...newEmployee, cin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    pattern="[A-Z][A-Z0-9]?\d{5,6}"
                    title="Format CIN invalide"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <select
                    value={newEmployee.gender}
                    onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                  <select
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UID de la carte</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newEmployee.cardUID}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Scannez la carte RFID..."
                    />
                    <button
                      type="button"
                      onClick={() => setIsScanning(true)}
                      className={`w-full px-4 py-2 ${
                        isScanning
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2`}
                    >
                      <Badge className={`w-5 h-5 ${isScanning ? 'animate-pulse' : ''}`} />
                      <span>{isScanning ? 'Scanning...' : 'Scanner la carte'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'Connecté au WebSocket' ? 'bg-green-500' :
                    status === 'Déconnecté' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-600">{status}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de modification */}
        {isEditModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Modifier l'employé</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEditEmployee} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom Complet</label>
                  <input
                    type="text"
                    value={selectedEmployee.fullName}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CIN</label>
                  <input
                    type="text"
                    value={selectedEmployee.cin}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, cin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    pattern="[A-Z][A-Z0-9]?\d{5,6}"
                    title="Format CIN invalide"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <select
                    value={selectedEmployee.gender}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                  <select
                    value={selectedEmployee.department}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UID de la carte</label>
                  <input
                    type="text"
                    value={selectedEmployee.cardUID}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Sauvegarder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de détails */}
        {isDetailModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Détails de l'employé</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {selectedEmployee.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Nom Complet</label>
                    <p className="text-lg font-medium">{selectedEmployee.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">CIN</label>
                    <p className="text-lg font-medium font-mono">{selectedEmployee.cin}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Genre</label>
                    <p className="text-lg font-medium">{selectedEmployee.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Département</label>
                    <p className="text-lg font-medium">{selectedEmployee.department}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">UID de la carte</label>
                    <p className="text-lg font-mono">{selectedEmployee.cardUID}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Date d'ajout</label>
                    <p className="text-lg font-medium">
                      {new Date(selectedEmployee.dateAdded).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {isDeleteModalOpen && employeeToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Confirmer la suppression</h2>
              <p className="text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir supprimer l'employé <span className="font-semibold">{employeeToDelete.fullName}</span> ? Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
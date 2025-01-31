import { useState, useEffect } from 'react';
import { ref, push, onValue, remove, update, query, equalTo, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { Eye, Edit2, Trash2 } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
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
    const ws = new WebSocket('ws://192.168.10.105:81');

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

    try {
      const employeesRef = ref(db, 'employees');
      await push(employeesRef, {
        ...newEmployee,
        dateAdded: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
      setNewEmployee({
        fullName: '',
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
    try {
      const employeeRef = ref(db, `employees/${selectedEmployee.id}`);
      await update(employeeRef, selectedEmployee);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'employé:', error);
    }
  };

  // Gérer la suppression d'un employé 
  const handleDeleteEmployee = (id) => { 
    const employee = employees.find((emp) => emp.id === id); 
    setEmployeeToDelete(employee); 
    setIsDeleteModalOpen(true); 
  }; 
 
  // Supprimer les entrées de présence associées à un employé 
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
        // Supprimer les entrées de présence associées 
        await deleteEmployeeAttendance(employeeToDelete.id); 
 
        // Supprimer l'employé 
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
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const openDetailModal = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Gestion des employés
          </h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
          >
            <span>Ajouter un Employé</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom Complet</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Genre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Département</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">UID de la carte</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date d'ajout</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-blue-50 transition-colors duration-150 ease-in-out"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {employee.fullName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          employee.gender === 'Homme'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {employee.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {employee.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{employee.cardUID}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employee.dateAdded).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-gray-500 text-lg mb-2">Aucun employé trouvé</p>
                        <p className="text-gray-400">Ajoutez des employés pour les voir apparaître ici</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de confirmation de suppression */}
        {isDeleteModalOpen && employeeToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirmer la suppression</h2>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer l'employé <span className="font-semibold">{employeeToDelete.fullName}</span> ? Cette action est irréversible.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'ajout d'employé */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Ajouter un employé</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <select
                    value={newEmployee.gender}
                    onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
                      <svg className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{isScanning ? 'Scanning...' : 'Scanner la carte'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
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

        {/* Modal de modification d'employé */}
        {isEditModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Modifier l'employé</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <select
                    value={selectedEmployee.gender}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Sauvegarder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de détails d'employé */}
        {isDetailModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Détails de l'employé</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedEmployee.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nom Complet</p>
                    <p className="text-lg text-gray-900">{selectedEmployee.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Genre</p>
                    <p className="text-lg text-gray-900">{selectedEmployee.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Département</p>
                    <p className="text-lg text-gray-900">{selectedEmployee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">UID de la carte</p>
                    <p className="text-lg font-mono text-gray-900">{selectedEmployee.cardUID}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Date d'ajout</p>
                    <p className="text-lg text-gray-900">
                      {new Date(selectedEmployee.dateAdded).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiIcon, CreditCardIcon, CheckCircleIcon, XCircleIcon, ActivityIcon, History, Zap, UserCheck, AlertCircle } from "lucide-react";
import { ref, onValue, get } from "firebase/database";
import { db } from "../lib/firebase";

export default function WebSocketUIDScanner() {
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState("Déconnecté");
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [associatedEmployee, setAssociatedEmployee] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'error', null
  const [employees, setEmployees] = useState({});

  // Écouter les changements dans la collection employees
  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      if (snapshot.exists()) {
        setEmployees(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  const checkEmployeeByCard = async (cardUid) => {
    try {
      console.log("Checking card UID:", cardUid);
      console.log("Available employees:", employees);
      
      // Chercher l'employé avec l'UID correspondant
      const employee = Object.values(employees).find(emp => {
        console.log("Comparing:", emp.cardUid, cardUid);
        return emp.cardUid && emp.cardUid.toString().trim() === cardUid.toString().trim()
      });
      
      console.log("Found employee:", employee);
      
      if (employee) {
        setAssociatedEmployee(employee);
        setScanStatus('success');
        
        // Mettre à jour l'historique avec les informations de l'employé
        setScanHistory(prev => [{
          uid: cardUid,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          employee: employee
        }, ...prev.slice(0, 4)]);
      } else {
        setAssociatedEmployee(null);
        setScanStatus('error');
        
        // Ajouter à l'historique sans informations d'employé
        setScanHistory(prev => [{
          uid: cardUid,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          employee: null
        }, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'employé:", error);
      setScanStatus('error');
    }
  };

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.100.114:81");

    ws.onopen = () => {
      setStatus("Connecté");
      setIsScanning(true);
    };

    ws.onmessage = async (message) => {
      const newUid = message.data;
      setUid(newUid);
      setIsScanning(false);
      
      // Vérifier si la carte est associée à un employé
      await checkEmployeeByCard(newUid);
      
      setTimeout(() => {
        setIsScanning(true);
        setScanStatus(null);
        setAssociatedEmployee(null);
      }, 3000);
    };

    ws.onclose = () => {
      setStatus("Déconnecté");
      setIsScanning(false);
    };

    ws.onerror = (error) => {
      console.error("Erreur WebSocket:", error);
      setStatus("Erreur");
      setIsScanning(false);
    };

    return () => ws.close();
  }, [employees]); // Ajouter employees comme dépendance

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50"
    >
      <div className="container mx-auto p-8">
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Scanner RFID ✨
            </h1>
            <p className="text-lg text-slate-600">
              Système de surveillance en temps réel 🚀
            </p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-white shadow-lg"
          >
            <WifiIcon 
              className={`${status === "Connecté" ? "text-emerald-500" : "text-red-500"}`}
              size={20} 
            />
            <span className={`${status === "Connecté" ? "text-emerald-500" : "text-red-500"} font-medium`}>
              {status} {status === "Connecté" ? "🟢" : "🔴"}
            </span>
          </motion.div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div 
            variants={itemVariants}
            className="p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3 text-slate-900">
              <Zap className="text-yellow-500" size={24} />
              État du Scanner 📡
            </h2>
            <div className="flex flex-col items-center">
              <motion.div
                className="relative mb-8"
                animate={{
                  scale: isScanning ? [1, 1.1, 1] : 1,
                  rotate: isScanning ? [0, 360] : 0
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
              >
                {isScanning && status === "Connecté" && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-500/20"
                    animate={{
                      scale: [1, 2],
                      opacity: [0.5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeOut",
                    }}
                  />
                )}
                <div className="relative z-10 h-56 w-56 rounded-full flex items-center justify-center bg-slate-100 border-4 border-slate-200">
                  {status === "Connecté" ? (
                    isScanning ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <CreditCardIcon className="h-28 w-28 text-blue-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {scanStatus === 'success' ? (
                          <UserCheck className="h-28 w-28 text-emerald-500" />
                        ) : scanStatus === 'error' ? (
                          <AlertCircle className="h-28 w-28 text-red-500" />
                        ) : (
                          <CheckCircleIcon className="h-28 w-28 text-emerald-500" />
                        )}
                      </motion.div>
                    )
                  ) : (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <XCircleIcon className="h-28 w-28 text-red-500" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3 text-slate-900">
              <CreditCardIcon className="text-blue-500" size={24} />
              Carte Détectée 💳
            </h2>
            <AnimatePresence mode="wait">
              {uid ? (
                <motion.div
                  key="uid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-xl p-8 ${
                    scanStatus === 'success' 
                      ? "bg-emerald-50 border border-emerald-100" 
                      : scanStatus === 'error'
                      ? "bg-red-50 border border-red-100"
                      : "bg-blue-50 border border-blue-100"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      className={`h-4 w-4 rounded-full ${
                        scanStatus === 'success' 
                          ? "bg-emerald-500"
                          : scanStatus === 'error'
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <p className={`font-medium ${
                      scanStatus === 'success'
                        ? "text-emerald-500"
                        : scanStatus === 'error'
                        ? "text-red-500"
                        : "text-blue-500"
                    }`}>
                      {scanStatus === 'success'
                        ? "Carte associée ✅"
                        : scanStatus === 'error'
                        ? "Carte non associée ❌"
                        : "Carte détectée 🎯"}
                    </p>
                  </div>
                  <motion.p 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className={`text-4xl font-bold font-mono mb-4 ${
                      scanStatus === 'success'
                        ? "text-emerald-500"
                        : scanStatus === 'error'
                        ? "text-red-500"
                        : "text-blue-500"
                    }`}
                  >
                    {uid}
                  </motion.p>
                  {associatedEmployee && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-100 p-4 rounded-lg"
                    >
                      <h3 className="text-lg font-semibold text-emerald-700 mb-2">
                        Employé Identifié 👤
                      </h3>
                      <p className="text-emerald-600">
                        Nom: {associatedEmployee.fullName}
                      </p>
                      <p className="text-emerald-600">
                        Département: {associatedEmployee.department}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="no-uid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-xl p-8 bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      className="h-4 w-4 rounded-full bg-slate-500"
                    />
                    <p className="text-slate-600">
                      En attente d'une carte... 🔄
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-slate-600">
                <History size={20} />
                Activité Récente 📝
              </h3>
              <div className="space-y-3">
                {scanHistory.length > 0 ? (
                  scanHistory.map((scan, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                          className="h-3 w-3 rounded-full bg-blue-500"
                        />
                        <div>
                          <span className="font-mono text-slate-700">
                            {scan.uid}
                          </span>
                          {scan.employee && (
                            <p className="text-sm text-emerald-600">
                              👤 {scan.employee.fullName}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-500">
                        🕒 {scan.timestamp}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-6 rounded-lg bg-slate-50 text-slate-600"
                  >
                    Aucun scan enregistré 📭
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
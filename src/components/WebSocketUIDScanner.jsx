import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiIcon, CreditCardIcon, CheckCircleIcon, XCircleIcon, ActivityIcon, SunIcon, MoonIcon, History, Zap } from "lucide-react";

export default function WebSocketUIDScanner() {
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState("Déconnecté");
  const [isScanning, setIsScanning] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.1.43:81");

    ws.onopen = () => {
      setStatus("Connecté");
      setIsScanning(true);
    };

    ws.onmessage = (message) => {
      const newUid = message.data;
      setUid(newUid);
      setIsScanning(false);
      
      setScanHistory(prev => {
        const newHistory = [
          {
            uid: newUid,
            timestamp: new Date().toLocaleTimeString('fr-FR'),
          },
          ...prev,
        ].slice(0, 5);
        return newHistory;
      });
      
      setTimeout(() => setIsScanning(true), 2000);
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
  }, []);

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
      className={`  transition-colors duration-500 ${
        isDark 
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" 
          : "bg-gradient-to-br from-blue-50 via-white to-blue-50 text-slate-900"
      }`}
    >
      <div className="container mx-auto p-8">
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h1 className={`text-5xl font-bold mb-2 ${
              isDark 
                ? "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            }`}>
              Scanner RFID ✨
            </h1>
            <p className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Système de surveillance en temps réel 🚀
            </p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDark(!isDark)}
              className={`p-4 rounded-full transition-all duration-300 ${
                isDark 
                  ? "bg-slate-700/50 hover:bg-slate-600/50" 
                  : "bg-white shadow-lg hover:shadow-xl"
              }`}
            >
              {isDark ? (
                <SunIcon className="text-yellow-400" size={24} />
              ) : (
                <MoonIcon className="text-slate-600" size={24} />
              )}
            </motion.button>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${
                isDark 
                  ? "bg-slate-800/50 backdrop-blur-sm" 
                  : "bg-white shadow-lg"
              }`}
            >
              <WifiIcon 
                className={`${status === "Connecté" ? "text-emerald-500" : "text-red-500"} transition-colors duration-300`}
                size={20} 
              />
              <span className={`${status === "Connecté" ? "text-emerald-500" : "text-red-500"} font-medium transition-colors duration-300`}>
                {status} {status === "Connecté" ? "🟢" : "🔴"}
              </span>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div 
            variants={itemVariants}
            className={`p-8 rounded-2xl transition-all duration-300 ${
              isDark 
                ? "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60" 
                : "bg-white shadow-lg hover:shadow-xl"
            }`}
          >
            <h2 className={`text-2xl font-semibold mb-8 flex items-center gap-3 ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
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
                <div className={`relative z-10 h-56 w-56 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDark 
                    ? "bg-slate-700/50 border-4 border-slate-600/50" 
                    : "bg-slate-100 border-4 border-slate-200"
                }`}>
                  {status === "Connecté" ? (
                    isScanning ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <CreditCardIcon className="h-28 w-28 text-blue-500 transition-colors duration-300" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <CheckCircleIcon className="h-28 w-28 text-emerald-500 transition-colors duration-300" />
                      </motion.div>
                    )
                  ) : (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <XCircleIcon className="h-28 w-28 text-red-500 transition-colors duration-300" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className={`p-8 rounded-2xl transition-all duration-300 ${
              isDark 
                ? "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60" 
                : "bg-white shadow-lg hover:shadow-xl"
            }`}
          >
            <h2 className={`text-2xl font-semibold mb-8 flex items-center gap-3 ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
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
                  className={`rounded-xl p-8 transition-all duration-300 ${
                    isDark 
                      ? "bg-emerald-500/10 border border-emerald-500/20" 
                      : "bg-emerald-50 border border-emerald-100"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      className="h-4 w-4 rounded-full bg-emerald-500"
                    />
                    <p className="text-emerald-500 font-medium">Carte détectée ✅</p>
                  </div>
                  <motion.p 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-4xl font-bold text-emerald-500 font-mono"
                  >
                    {uid}
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  key="no-uid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-xl p-8 transition-all duration-300 ${
                    isDark 
                      ? "bg-slate-700/30 border border-slate-600/50" 
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      className={`h-4 w-4 rounded-full ${
                        isDark ? "bg-slate-400" : "bg-slate-500"
                      }`}
                    />
                    <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                      En attente d'une carte... 🔄
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8">
              <h3 className={`text-lg font-medium mb-4 flex items-center gap-2 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}>
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
                      className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                        isDark 
                          ? "bg-slate-700/30 hover:bg-slate-700/50" 
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                          className="h-3 w-3 rounded-full bg-blue-500"
                        />
                        <span className={`font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          {scan.uid}
                        </span>
                      </div>
                      <span className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                        🕒 {scan.timestamp}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-center p-6 rounded-lg ${
                      isDark ? "text-slate-500 bg-slate-800/30" : "text-slate-600 bg-slate-50"
                    }`}
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
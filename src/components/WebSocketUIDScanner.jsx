import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiIcon, CreditCardIcon, CheckCircleIcon, XCircleIcon, ActivityIcon, SunIcon, MoonIcon, History } from "lucide-react";

export default function WebSocketUIDScanner() {
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState("Déconnecté");
  const [isScanning, setIsScanning] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.100.114:81");

    ws.onopen = () => {
      setStatus("Connecté");
      setIsScanning(true);
    };

    ws.onmessage = (message) => {
      const newUid = message.data;
      setUid(newUid);
      setIsScanning(false);
      
      // Add to scan history with timestamp
      setScanHistory(prev => {
        const newHistory = [
          {
            uid: newUid,
            timestamp: new Date().toLocaleTimeString('fr-FR'),
          },
          ...prev,
        ].slice(0, 5); // Keep only last 5 scans
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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" 
        : "bg-gradient-to-br from-blue-50 via-white to-slate-50 text-slate-900"
    }`}>
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className={`text-4xl font-bold ${
              isDark 
                ? "bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
                : "bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"
            }`}>
              Scanner RFID
            </h1>
            <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Système de surveillance en temps réel ✨
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-3 rounded-full transition-all duration-300 ${
                isDark 
                  ? "bg-slate-700/50 hover:bg-slate-600/50 hover:scale-110" 
                  : "bg-white shadow-lg hover:shadow-xl hover:scale-110"
              }`}
            >
              {isDark ? (
                <SunIcon className="text-yellow-400" size={20} />
              ) : (
                <MoonIcon className="text-slate-600" size={20} />
              )}
            </button>
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300 ${
              isDark 
                ? "bg-slate-800/50 backdrop-blur-sm" 
                : "bg-white shadow-lg"
            }`}>
              <WifiIcon 
                className={`${status === "Connecté" ? "text-emerald-500" : "text-red-500"} transition-colors duration-300`}
                size={20} 
              />
              <span className={`${status === "Connecté" ? "text-emerald-500" : "text-red-500"} font-medium transition-colors duration-300`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className={`p-8 rounded-2xl transition-all duration-300 ${
            isDark 
              ? "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60" 
              : "bg-white shadow-lg hover:shadow-xl"
          }`}>
            <h2 className={`text-xl font-semibold mb-8 flex items-center gap-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              <ActivityIcon className="text-blue-500" size={20} />
              État du Scanner
            </h2>
            <div className="flex flex-col items-center">
              <motion.div
                className="relative mb-8"
                animate={{
                  scale: isScanning ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                {isScanning && status === "Connecté" && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-500/20"
                    animate={{
                      scale: [1, 1.5],
                      opacity: [0.5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeOut",
                    }}
                  />
                )}
                <div className={`relative z-10 h-48 w-48 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDark 
                    ? "bg-slate-700/50 border border-slate-600/50" 
                    : "bg-slate-100 border border-slate-200"
                }`}>
                  {status === "Connecté" ? (
                    isScanning ? (
                      <CreditCardIcon className="h-24 w-24 text-blue-500 transition-colors duration-300" />
                    ) : (
                      <CheckCircleIcon className="h-24 w-24 text-emerald-500 transition-colors duration-300" />
                    )
                  ) : (
                    <XCircleIcon className="h-24 w-24 text-red-500 transition-colors duration-300" />
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          <div className={`p-8 rounded-2xl transition-all duration-300 ${
            isDark 
              ? "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60" 
              : "bg-white shadow-lg hover:shadow-xl"
          }`}>
            <h2 className={`text-xl font-semibold mb-8 flex items-center gap-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              <CreditCardIcon className="text-blue-500" size={20} />
              Carte Détectée
            </h2>
            <AnimatePresence mode="wait">
              {uid ? (
                <motion.div
                  key="uid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-xl p-6 transition-all duration-300 ${
                    isDark 
                      ? "bg-emerald-500/10 border border-emerald-500/20" 
                      : "bg-emerald-50 border border-emerald-100"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-emerald-500 font-medium">Carte détectée</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-500 font-mono">{uid}</p>
                </motion.div>
              ) : (
                <motion.div
                  key="no-uid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-xl p-6 transition-all duration-300 ${
                    isDark 
                      ? "bg-slate-700/30 border border-slate-600/50" 
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full animate-pulse ${
                      isDark ? "bg-slate-400" : "bg-slate-500"
                    }`} />
                    <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                      En attente d'une carte...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Activity Log */}
            <div className="mt-8">
              <h3 className={`text-sm font-medium mb-4 flex items-center gap-2 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}>
                <History size={16} />
                Activité Récente
              </h3>
              <div className="space-y-3">
                {scanHistory.length > 0 ? (
                  scanHistory.map((scan, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                        isDark 
                          ? "bg-slate-700/30 hover:bg-slate-700/50" 
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full bg-blue-500`} />
                        <span className={`font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          {scan.uid}
                        </span>
                      </div>
                      <span className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                        {scan.timestamp}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className={`text-center p-4 rounded-lg ${
                    isDark ? "text-slate-500 bg-slate-800/30" : "text-slate-600 bg-slate-50"
                  }`}>
                    Aucun scan enregistré
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
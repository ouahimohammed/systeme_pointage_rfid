"use client"

import { Link, useLocation } from 'react-router-dom'
import { Home, Users, Calendar, FileText, Settings, User, LogOut } from 'lucide-react'
import { auth } from '../lib/firebase'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar() {
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Gestion des employés', path: '/employees' },
    { icon: Calendar, label: 'Présences / Absences', path: '/attendance' },
    { icon: FileText, label: 'Rapports', path: '/reports' },
    { icon: Settings, label: 'Carte Scanner', path: '/WebSocketUIDScanner' },
    { icon: User, label: 'Profil', path: '/profile' },
  ]

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 shadow-2xl flex flex-col">
      {/* Logo Area */}
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent text-center">
          ComplexeC
        </h1>
        <div className="mt-2 h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className="no-underline block"
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`
                    relative flex items-center px-4 py-3 mb-2 rounded-xl
                    transition-all duration-300 group cursor-pointer
                    ${isActive 
                      ? 'text-white bg-gradient-to-r from-blue-500/80 to-indigo-500/80 shadow-lg shadow-blue-900/20' 
                      : 'text-blue-100 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="relative z-10 flex items-center gap-3">
                    <Icon 
                      size={20} 
                      className={`
                        transition-all duration-300
                        ${isActive ? 'text-white' : 'text-blue-300'}
                        group-hover:scale-110
                      `}
                    />
                    <span className={`
                      font-medium tracking-wide
                      ${isActive ? 'text-white' : 'text-blue-100'}
                    `}>
                      {item.label}
                    </span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 backdrop-blur-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </AnimatePresence>
      </nav>

      {/* Bottom Section with Logout */}
      <div className="mt-auto border-t border-blue-700/50">
        <div className="p-4">
          <motion.button
            onClick={handleLogout}
            whileHover={{ x: 4 }}
            className={`
              w-full px-4 py-3 rounded-xl
              flex items-center gap-3
              text-red-200 hover:bg-red-500/20
              transition-all duration-300 group
              no-underline
            `}
          >
            <LogOut 
              size={20} 
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
            />
            <span className="font-medium tracking-wide">
              Déconnexion
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
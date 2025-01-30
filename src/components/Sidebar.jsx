"use client"

import { Link, useLocation } from 'react-router-dom'
import { Home, Users, Calendar, FileText, Settings, User, LogOut } from 'react-feather'
import { auth } from '../lib/firebase'

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
    <div className="bg-gradient-to-b from-blue-600 to-blue-700 w-64 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo area with improved contrast */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white/90">ComplexeC</h1>
      </div>
      
      {/* Navigation with improved hover states and active indicators */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center px-3 py-2 my-1 rounded-lg no-underline
                transition-colors duration-200
                ${isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-blue-100 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <Icon 
                size={20} 
                className={`mr-3 ${isActive ? 'text-white' : 'text-blue-100'}`}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      
      {/* Logout button with improved hover state */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="
            flex items-center w-full px-3 py-2 rounded-lg
            text-blue-100 hover:text-white
            hover:bg-white/5 transition-colors duration-200
          "
        >
          <LogOut size={20} className="mr-3" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  )
}

// ARCHEION ONE - Main Layout
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard, Target, FileText, CheckSquare, Shield, Settings,
  LogOut, Menu, X, ChevronDown, Building2, Download, Eye, Users,
  BookOpen, AlertTriangle, Archive
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { path: '/missions', label: 'Misiones', icon: Target },
  { path: '/documents', label: 'Documentos', icon: FileText },
  { path: '/tasks', label: 'Tareas', icon: CheckSquare },
  { path: '/evidence', label: 'Evidencias', icon: Eye },
  { path: '/decisions', label: 'Decisiones', icon: BookOpen },
  { path: '/approvals', label: 'Aprobaciones', icon: Shield },
  { path: '/exports', label: 'Resultados', icon: Download },
  { path: '/audit', label: 'Auditoría', icon: AlertTriangle },
  { path: '/admin', label: 'Administración', icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const { user, organization, organizations, logout, switchOrganization, getRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-5 py-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Archive className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-wide">ARCHEION ONE</h1>
                <p className="text-[10px] text-slate-400">Ecosistema de IA y Gestión</p>
              </div>
            </div>
          </div>

          {/* Organization selector */}
          <div className="px-3 py-3 border-b border-slate-700">
            <div className="relative">
              <button
                onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-left"
              >
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs truncate flex-1">{organization?.name || 'Sin organización'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {orgMenuOpen && organizations.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50">
                  {organizations.map(org => (
                    <button
                      key={org.id}
                      onClick={() => { switchOrganization(org.id); setOrgMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 transition-colors ${org.id === organization?.id ? 'text-amber-400' : 'text-slate-300'}`}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-3 border-t border-slate-700">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400">{getRole()}</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded hover:bg-slate-700 transition-colors" title="Cerrar sesión">
                <LogOut className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-800">
              {navItems.find(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'))?.label || 'ARCHEION ONE'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">{organization?.name}</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400" title="Sistema operativo" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

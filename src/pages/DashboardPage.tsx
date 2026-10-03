// ARCHEION ONE - Dashboard
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';
import type { Mission, Task, Document as Doc } from '../lib/types';
import { MISSION_STATUS_LABELS, TASK_STATUS_LABELS } from '../lib/types';
import { Target, FileText, CheckSquare, Plus, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    setLoading(true);
    const allMissions = await store.getMissions(organization.id);
    const allTasks: Task[] = [];
    for (const mission of allMissions) {
      const missionTasks = await store.getTasks(mission.id);
      allTasks.push(...missionTasks);
    }
    const allDocs = await store.getDocumentsByOrganization(organization.id);
    const m = allMissions;
    const t = allTasks;
    const d = allDocs;
    setMissions(m);
    setTasks(t);
    setDocuments(d);
    setLoading(false);
  };

  const activeMissions = missions.filter(m => ['preparation', 'execution', 'review'].includes(m.status));
  const pendingTasks = tasks.filter(t => ['pending', 'ready', 'in_progress'].includes(t.status));
  const recentMissions = missions.slice(0, 5);

  const stats = [
    { label: 'Misiones activas', value: activeMissions.length, icon: Target, color: 'text-blue-600 bg-blue-50' },
    { label: 'Tareas pendientes', value: pendingTasks.length, icon: CheckSquare, color: 'text-amber-600 bg-amber-50' },
    { label: 'Documentos', value: documents.length, icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total misiones', value: missions.length, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold">Bienvenido, {user?.name}</h1>
        <p className="text-sm text-slate-300 mt-1">
          Organizacion: {organization?.name} · Panel de control de ARCHEION ONE
        </p>
        <div className="flex gap-3 mt-4">
          <Link
            to="/missions?action=create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva misión
          </Link>
          <Link
            to="/missions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-lg transition-colors"
          >
            Ver misiones
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-3">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent missions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Misiones recientes</h2>
          <Link to="/missions" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Ver todas →</Link>
        </div>
        {recentMissions.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No hay misiones todavía</p>
            <Link to="/missions?action=create" className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-2 inline-block">
              Crear primera misión →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentMissions.map(mission => (
              <Link
                key={mission.id}
                to={`/missions/${mission.id}`}
                className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${
                  mission.status === 'execution' ? 'bg-blue-500' :
                  mission.status === 'review' ? 'bg-amber-500' :
                  mission.status === 'completed' ? 'bg-emerald-500' :
                  mission.status === 'blocked' ? 'bg-red-500' :
                  'bg-slate-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{mission.title}</p>
                  <p className="text-xs text-slate-500">{mission.code} · {MISSION_STATUS_LABELS[mission.status]}</p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(mission.updatedAt).toLocaleDateString('es-ES')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pending tasks */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Tareas en curso</h2>
          <Link to="/tasks" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Ver todas →</Link>
        </div>
        {pendingTasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No hay tareas pendientes</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingTasks.slice(0, 5).map(task => (
              <div key={task.id} className="px-5 py-3 flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{task.title}</p>
                  <p className="text-xs text-slate-500">{TASK_STATUS_LABELS[task.status]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Estado del sistema
          </h3>
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Persistencia</span>
              <span className="text-emerald-600 font-medium">IndexedDB activo</span>
            </div>
            <div className="flex justify-between">
              <span>Sesión</span>
              <span className="text-emerald-600 font-medium">Autenticado</span>
            </div>
            <div className="flex justify-between">
              <span>Motor de IA</span>
              <span className="text-amber-600 font-medium">Pendiente de configuración</span>
            </div>
            <div className="flex justify-between">
              <span>Almacenamiento</span>
              <span className="text-emerald-600 font-medium">Local operativo</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800">Módulos disponibles</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {['ARCHEION', 'SAE', 'BGOS', 'FIRECYCLE EXTREM', 'RECIPRA', 'RECIPRA-MEDIA', 'Prisma Sonoro', 'ELHOMB', 'ATIENDE'].map(mod => (
              <span key={mod} className="px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md">
                {mod}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Los módulos especializados se activarán progresivamente sobre el núcleo compartido.
          </p>
        </div>
      </div>
    </div>
  );
}

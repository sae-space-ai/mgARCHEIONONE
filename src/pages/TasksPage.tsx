// ARCHEION ONE - Tasks Page (Organization-level)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';
import type { Task, Mission } from '../lib/types';
import { TASK_STATUS_LABELS } from '../lib/types';
import { CheckSquare, Loader2, Filter } from 'lucide-react';

export default function TasksPage() {
  const { organization } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    setLoading(true);
    const miss = await store.getMissions(organization.id);
    setMissions(miss);
    const allTasks: Task[] = [];
    for (const m of miss) {
      const t = await store.getTasks(m.id);
      allTasks.push(...t);
    }
    setTasks(allTasks);
    setLoading(false);
  };

  const getMissionTitle = (missionId: string) => missions.find(m => m.id === missionId)?.title || '—';
  const getMissionCode = (missionId: string) => missions.find(m => m.id === missionId)?.code || '—';

  const filtered = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Tareas</h1>
          <p className="text-xs text-slate-500">Plan de tareas de todas las misiones</p>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none appearance-none bg-white"
          >
            <option value="all">Todos</option>
            {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay tareas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                task.status === 'completed' ? 'bg-emerald-500' :
                task.status === 'failed' ? 'bg-red-500' :
                task.status === 'in_progress' ? 'bg-blue-500' :
                task.status === 'blocked' ? 'bg-amber-500' :
                'bg-slate-300'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{task.title}</p>
                <p className="text-xs text-slate-500">
                  <Link to={`/missions/${task.missionId}`} className="text-amber-600 hover:underline">{getMissionCode(task.missionId)}</Link>
                  {' · '}{getMissionTitle(task.missionId)}
                </p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                task.status === 'failed' ? 'bg-red-100 text-red-700' :
                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

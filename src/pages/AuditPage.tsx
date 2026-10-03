// ARCHEION ONE - Audit Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';
import type { AuditEvent, User } from '../lib/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function AuditPage() {
  const { organization } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    setLoading(true);
    const evts = await store.getAuditEvents(organization.id, 200);
    setEvents(evts);
    // Get unique users
    const userIds = [...new Set(evts.map(e => e.userId))];
    const usrs: User[] = [];
    for (const uid of userIds) {
      const u = await (await import('../lib/store')).db.users.get(uid);
      if (u) usrs.push(u);
    }
    setUsers(usrs);
    setLoading(false);
  };

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || userId.substring(0, 8);

  const ACTION_LABELS: Record<string, string> = {
    'user.login': 'Inicio de sesión',
    'user.register': 'Registro de usuario',
    'mission.create': 'Misión creada',
    'mission.status_change': 'Estado de misión cambiado',
    'document.upload': 'Documento cargado',
    'document.download': 'Documento descargado',
    'task.create': 'Tarea creada',
    'task.status_change': 'Estado de tarea cambiado',
    'artifact.generate': 'Artefacto generado',
    'export.zip': 'Expediente ZIP exportado',
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Auditoría</h1>
        <p className="text-xs text-slate-500">Registro de operaciones y trazabilidad</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay eventos registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Acción</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Entidad</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.slice(0, 100).map(event => (
                  <tr key={event.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{getUserName(event.userId)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-800">
                        {ACTION_LABELS[event.action] || event.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                      {event.entityType}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell max-w-[200px] truncate">
                      {JSON.stringify(event.details).substring(0, 60)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {events.length > 100 && (
            <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500">
              Mostrando 100 de {events.length} eventos
            </div>
          )}
        </div>
      )}
    </div>
  );
}

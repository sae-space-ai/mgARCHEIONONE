// ARCHEION ONE - Approvals Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';
import type { Approval, Mission } from '../lib/types';
import { Shield, Loader2, Check, X as XIcon } from 'lucide-react';

export default function ApprovalsPage() {
  const { organization, user } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    setLoading(true);
    const miss = await store.getMissions(organization.id);
    setMissions(miss);
    const all: Approval[] = [];
    for (const m of miss) { all.push(...await store.getApprovals(m.id)); }
    setApprovals(all.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    setLoading(false);
  };

  const handleResolve = async (id: string, approved: boolean) => {
    if (!user) return;
    await store.resolveApproval(id, user.id, approved);
    loadData();
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-slate-100 text-slate-500',
    invalidated: 'bg-slate-200 text-slate-600',
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    expired: 'Caducada',
    invalidated: 'Invalidada',
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Aprobaciones</h1>
        <p className="text-xs text-slate-500">Centro de aprobaciones y supervisión humana</p>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay aprobaciones pendientes</p>
          <p className="text-xs text-slate-400 mt-1">Las operaciones sensibles requieren aprobación humana</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${STATUS_COLORS[a.status]}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                    <span className="text-[10px] text-slate-400">{a.operationType}</span>
                  </div>
                  <p className="text-sm text-slate-800">{a.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Solicitada: {new Date(a.requestedAt).toLocaleString('es-ES')}
                    {a.resolvedAt && ` · Resuelta: ${new Date(a.resolvedAt).toLocaleString('es-ES')}`}
                  </p>
                </div>
                {a.status === 'pending' && (
                  <div className="flex gap-1">
                    <button onClick={() => handleResolve(a.id, true)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Aprobar">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleResolve(a.id, false)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Rechazar">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ARCHEION ONE - Evidence Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';
import type { Claim, Mission } from '../lib/types';
import { Eye, Loader2, Plus, X } from 'lucide-react';

export default function EvidencePage() {
  const { organization, user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<Claim['type']>('documented_fact');
  const [newMissionId, setNewMissionId] = useState('');

  useEffect(() => { loadData(); }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    setLoading(true);
    const miss = await store.getMissions(organization.id);
    setMissions(miss);
    const allClaims: Claim[] = [];
    for (const m of miss) {
      const c = await store.getClaims(m.id);
      allClaims.push(...c);
    }
    setClaims(allClaims);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !newMissionId || !newContent.trim()) return;
    await store.createClaim({
      missionId: newMissionId,
      organizationId: organization.id,
      type: newType,
      content: newContent,
      confidence: 0.8,
    });
    setShowAdd(false);
    setNewContent('');
    loadData();
  };

  const TYPE_LABELS: Record<Claim['type'], string> = {
    documented_fact: 'Hecho documentado',
    declaration: 'Declaración',
    inference: 'Inferencia',
    opinion: 'Opinión',
    hypothesis: 'Hipótesis',
    unverified: 'No verificado',
  };

  const TYPE_COLORS: Record<Claim['type'], string> = {
    documented_fact: 'bg-emerald-100 text-emerald-700',
    declaration: 'bg-blue-100 text-blue-700',
    inference: 'bg-purple-100 text-purple-700',
    opinion: 'bg-amber-100 text-amber-700',
    hypothesis: 'bg-orange-100 text-orange-700',
    unverified: 'bg-slate-100 text-slate-600',
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Evidencias</h1>
          <p className="text-xs text-slate-500">Afirmaciones y su vinculación con fuentes documentales</p>
        </div>
        {missions.length > 0 && (
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-slate-900 text-xs font-medium rounded-lg hover:bg-amber-600">
            <Plus className="w-3 h-3" /> Nueva afirmación
          </button>
        )}
      </div>

      {claims.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Eye className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay afirmaciones registradas</p>
          <p className="text-xs text-slate-400 mt-1">Las afirmaciones se vinculan con documentos y fuentes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map(claim => (
            <div key={claim.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${TYPE_COLORS[claim.type]}`}>
                      {TYPE_LABELS[claim.type]}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Confianza: {Math.round(claim.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{claim.content}</p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {new Date(claim.createdAt).toLocaleString('es-ES')}
                    {claim.reviewedBy && ' · Revisada'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Nueva afirmación</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <select value={newMissionId} onChange={e => setNewMissionId(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                <option value="">Seleccionar misión...</option>
                {missions.map(m => <option key={m.id} value={m.id}>{m.code} - {m.title}</option>)}
              </select>
              <select value={newType} onChange={e => setNewType(e.target.value as Claim['type'])} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} required rows={3} placeholder="Contenido de la afirmación..." className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none outline-none focus:ring-2 focus:ring-amber-500" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-slate-200 text-sm rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-amber-500 text-slate-900 text-sm font-medium rounded-lg">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

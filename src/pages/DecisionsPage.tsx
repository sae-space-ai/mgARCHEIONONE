// ARCHEION ONE - Decisions Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';
import type { Decision, Mission } from '../lib/types';
import { BookOpen, Loader2, Plus, X } from 'lucide-react';

export default function DecisionsPage() {
  const { organization, user } = useAuth();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ missionId: '', title: '', problem: '', alternatives: '', selected: '', rationale: '' });

  useEffect(() => { loadData(); }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    setLoading(true);
    const miss = await store.getMissions(organization.id);
    setMissions(miss);
    const all: Decision[] = [];
    for (const m of miss) { all.push(...await store.getDecisions(m.id)); }
    setDecisions(all);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.missionId) return;
    await store.createDecision({
      missionId: form.missionId,
      title: form.title,
      problem: form.problem,
      alternatives: form.alternatives.split('\n').filter(a => a.trim()),
      assumptions: [],
      selectedAlternative: form.selected,
      rationale: form.rationale,
      decidedBy: user.id,
    });
    setShowAdd(false);
    setForm({ missionId: '', title: '', problem: '', alternatives: '', selected: '', rationale: '' });
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Decisiones</h1>
          <p className="text-xs text-slate-500">Registro de decisiones con alternativas y justificación</p>
        </div>
        {missions.length > 0 && (
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-slate-900 text-xs font-medium rounded-lg">
            <Plus className="w-3 h-3" /> Nueva decisión
          </button>
        )}
      </div>

      {decisions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay decisiones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800">{d.title}</h3>
              <p className="text-xs text-slate-500 mt-1">Problema: {d.problem}</p>
              <p className="text-xs text-slate-600 mt-2">Alternativa seleccionada: <span className="font-medium">{d.selectedAlternative}</span></p>
              <p className="text-xs text-slate-500 mt-1">Justificación: {d.rationale}</p>
              <p className="text-[10px] text-slate-400 mt-2">{new Date(d.decidedAt).toLocaleString('es-ES')}</p>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Nueva decisión</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <select value={form.missionId} onChange={e => setForm({...form, missionId: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                <option value="">Seleccionar misión...</option>
                {missions.map(m => <option key={m.id} value={m.id}>{m.code} - {m.title}</option>)}
              </select>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Título" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
              <textarea value={form.problem} onChange={e => setForm({...form, problem: e.target.value})} required placeholder="Problema a resolver" rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none outline-none focus:ring-2 focus:ring-amber-500" />
              <textarea value={form.alternatives} onChange={e => setForm({...form, alternatives: e.target.value})} placeholder="Alternativas (una por línea)" rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none outline-none focus:ring-2 focus:ring-amber-500" />
              <input value={form.selected} onChange={e => setForm({...form, selected: e.target.value})} required placeholder="Alternativa seleccionada" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
              <textarea value={form.rationale} onChange={e => setForm({...form, rationale: e.target.value})} required placeholder="Justificación" rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none outline-none focus:ring-2 focus:ring-amber-500" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-slate-200 text-sm rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-amber-500 text-slate-900 text-sm font-medium rounded-lg">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

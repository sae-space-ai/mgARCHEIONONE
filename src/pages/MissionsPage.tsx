// ARCHEION ONE - Missions Page
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';
import type { Mission, MissionStatus } from '../lib/types';
import { MISSION_STATUS_LABELS, hasPermission } from '../lib/types';
import { Plus, Search, Filter, Target, X, Loader2 } from 'lucide-react';

const STATUS_COLORS: Record<MissionStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  preparation: 'bg-blue-100 text-blue-700',
  execution: 'bg-amber-100 text-amber-700',
  review: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
  archived: 'bg-slate-200 text-slate-600',
};

export default function MissionsPage() {
  const { organization, user, getRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(searchParams.get('action') === 'create');

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('general');
  const [newNeed, setNewNeed] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newScope, setNewScope] = useState('');
  const [newExclusions, setNewExclusions] = useState('');
  const [newCriteria, setNewCriteria] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadMissions();
  }, [organization]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowCreate(true);
    }
  }, [searchParams]);

  const loadMissions = async () => {
    if (!organization) return;
    setLoading(true);
    const data = await store.getMissions(organization.id);
    setMissions(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !user) return;
    setCreating(true);

    const mission = await store.createMission({
      organizationId: organization.id,
      ownerId: user.id,
      title: newTitle,
      type: newType,
      originalNeed: newNeed,
      structuredObjective: newObjective,
      scope: newScope,
      exclusions: newExclusions,
      acceptanceCriteria: newCriteria.split('\n').filter(c => c.trim()),
    });

    await store.addAuditEvent({
      organizationId: organization.id,
      userId: user.id,
      action: 'mission.create',
      entityType: 'mission',
      entityId: mission.id,
      details: { code: mission.code, title: mission.title },
    });

    setCreating(false);
    setShowCreate(false);
    setNewTitle('');
    setNewNeed('');
    setNewObjective('');
    setSearchParams({});
    loadMissions();
  };

  const filteredMissions = missions.filter(m => {
    const matchesSearch = !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canCreate = hasPermission(getRole(), 'mission', 'create');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Misiones</h1>
          <p className="text-xs text-slate-500">Gestión de misiones y expedientes</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva misión
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código o título..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none appearance-none bg-white"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(MISSION_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mission list */}
      {filteredMissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">No se encontraron misiones</p>
          <p className="text-xs text-slate-400 mt-1">
            {search || statusFilter !== 'all' ? 'Prueba con otros filtros' : 'Crea tu primera misión para comenzar'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMissions.map(mission => (
            <Link
              key={mission.id}
              to={`/missions/${mission.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-amber-50 transition-colors">
                  <Target className="w-5 h-5 text-slate-500 group-hover:text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-800">{mission.title}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${STATUS_COLORS[mission.status]}`}>
                      {MISSION_STATUS_LABELS[mission.status]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-mono text-slate-400">{mission.code}</span>
                    {' · '}
                    {mission.type}
                    {' · '}
                    Creada: {new Date(mission.createdAt).toLocaleDateString('es-ES')}
                  </p>
                  {mission.originalNeed && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{mission.originalNeed}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-base font-bold text-slate-800">Nueva misión</h2>
              <button onClick={() => { setShowCreate(false); setSearchParams({}); }} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Ej: Auditoría documental del expediente X"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="general">General</option>
                  <option value="audit">Auditoría</option>
                  <option value="research">Investigación</option>
                  <option value="legal">Legal</option>
                  <option value="commercial">Comercial</option>
                  <option value="territorial">Territorial</option>
                  <option value="media">Media</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Necesidad original</label>
                <textarea
                  value={newNeed}
                  onChange={e => setNewNeed(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  placeholder="¿Qué necesita resolver?"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Objetivo estructurado</label>
                <textarea
                  value={newObjective}
                  onChange={e => setNewObjective(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  placeholder="Resultado esperado"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Alcance</label>
                  <textarea
                    value={newScope}
                    onChange={e => setNewScope(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    placeholder="Qué incluye"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Exclusiones</label>
                  <textarea
                    value={newExclusions}
                    onChange={e => setNewExclusions(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    placeholder="Qué no incluye"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Criterios de aceptación (uno por línea)</label>
                <textarea
                  value={newCriteria}
                  onChange={e => setNewCriteria(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  placeholder="Criterio 1&#10;Criterio 2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setSearchParams({}); }}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Crear misión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

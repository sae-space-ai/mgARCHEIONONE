// ARCHEION ONE - Admin Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { store, db } from '../lib/store';
import type { Membership } from '../lib/types';
import { ROLE_LABELS, hasPermission } from '../lib/types';
import { Settings, Users, Building2, Loader2, Plus, X, Shield } from 'lucide-react';

export default function AdminPage() {
  const { organization, user, getRole, organizations, createOrganization, refreshOrganizations } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'org' | 'users' | 'system'>('org');
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => { loadData(); }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    setLoading(true);
    const members = await store.getMemberships(organization.id);
    setMemberships(members);
    setLoading(false);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    await createOrganization(newOrgName);
    setNewOrgName('');
    setShowNewOrg(false);
    refreshOrganizations();
  };

  const getUsers = async () => {
    const userIds = [...new Set(memberships.map(m => m.userId))];
    const users = [];
    for (const uid of userIds) {
      const u = await db.users.get(uid);
      if (u) users.push(u);
    }
    return users;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  const isAdmin = getRole() === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Administración</h1>
        <p className="text-xs text-slate-500">Gestión de organización, usuarios y configuración</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          {[
            { key: 'org', label: 'Organización', icon: Building2 },
            { key: 'users', label: 'Usuarios', icon: Users },
            { key: 'system', label: 'Sistema', icon: Settings },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'org' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Organización actual</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre</span>
                <span className="font-medium">{organization?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slug</span>
                <span className="font-mono text-xs">{organization?.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Creada</span>
                <span>{organization ? new Date(organization.createdAt).toLocaleDateString('es-ES') : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Miembros</span>
                <span className="font-medium">{memberships.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Mis organizaciones</h3>
              <button onClick={() => setShowNewOrg(true)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-100">
                <Plus className="w-3 h-3" /> Nueva
              </button>
            </div>
            <div className="space-y-2">
              {organizations.map(org => (
                <div key={org.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700 flex-1">{org.name}</span>
                  {org.id === organization?.id && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Activa</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Miembros de la organización</h3>
          {memberships.length === 0 ? (
            <p className="text-sm text-slate-500">No hay miembros</p>
          ) : (
            <div className="space-y-2">
              {memberships.map(m => (
                <MembershipRow key={m.id} membership={m} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Estado del sistema</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Versión</span>
                <span className="font-mono text-xs">1.0.0-alpha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Persistencia</span>
                <span className="text-emerald-600 font-medium">IndexedDB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Autenticación</span>
                <span className="text-emerald-600 font-medium">Local con hash SHA-256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Motor de IA</span>
                <span className="text-amber-600 font-medium">Pendiente de configuración</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Almacenamiento</span>
                <span className="text-emerald-600 font-medium">IndexedDB Blobs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exportaciones</span>
                <span className="text-emerald-600 font-medium">PDF, ZIP, CSV, JSON</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Matriz de permisos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-4 font-medium text-slate-600">Rol</th>
                    <th className="text-center py-2 px-2 font-medium text-slate-600">Crear</th>
                    <th className="text-center py-2 px-2 font-medium text-slate-600">Leer</th>
                    <th className="text-center py-2 px-2 font-medium text-slate-600">Editar</th>
                    <th className="text-center py-2 px-2 font-medium text-slate-600">Exportar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(['admin', 'mission_owner', 'specialist', 'reviewer', 'collaborator', 'reader'] as const).map(role => (
                    <tr key={role}>
                      <td className="py-2 pr-4 font-medium text-slate-700">{ROLE_LABELS[role]}</td>
                      <td className="py-2 px-2 text-center">{hasPermission(role, 'mission', 'create') ? '✓' : '—'}</td>
                      <td className="py-2 px-2 text-center">{hasPermission(role, 'mission', 'read') ? '✓' : '—'}</td>
                      <td className="py-2 px-2 text-center">{hasPermission(role, 'mission', 'update') ? '✓' : '—'}</td>
                      <td className="py-2 px-2 text-center">{hasPermission(role, 'mission', 'export') ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Variables de entorno necesarias</h3>
            <div className="space-y-1 text-xs font-mono text-slate-600 bg-slate-50 rounded-lg p-3">
              <p>DATABASE_URL=postgresql://...</p>
              <p>SUPABASE_URL=https://....supabase.co</p>
              <p>SUPABASE_ANON_KEY=...</p>
              <p>AI_PROVIDER=qwen</p>
              <p>AI_ENDPOINT=https://...</p>
              <p>AI_API_KEY=***</p>
              <p>STORAGE_PROVIDER=local|s3</p>
              <p>MAX_FILE_SIZE=52428800</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Los valores reales se configuran en el entorno de despliegue, nunca en el repositorio.</p>
          </div>
        </div>
      )}

      {showNewOrg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Nueva organización</h2>
              <button onClick={() => setShowNewOrg(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateOrg} className="space-y-3">
              <input
                value={newOrgName}
                onChange={e => setNewOrgName(e.target.value)}
                required
                placeholder="Nombre de la organización"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNewOrg(false)} className="flex-1 py-2 border border-slate-200 text-sm rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-amber-500 text-slate-900 text-sm font-medium rounded-lg">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MembershipRow({ membership }: { membership: Membership }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    (async () => {
      const u = await db.users.get(membership.userId);
      if (u) setUserName(u.name);
    })();
  }, [membership.userId]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
        {userName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700">{userName || 'Usuario'}</p>
        <p className="text-[10px] text-slate-400">{membership.userId.substring(0, 8)}...</p>
      </div>
      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
        {ROLE_LABELS[membership.role]}
      </span>
    </div>
  );
}

// ARCHEION ONE - Documents Page (Organization-level)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';
import type { Document as Doc, Mission } from '../lib/types';
import { FileText, Download, Search, Loader2 } from 'lucide-react';

export default function DocumentsPage() {
  const { organization } = useAuth();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    setLoading(true);
    const [docs, miss] = await Promise.all([
      store.getDocumentsByOrganization(organization.id),
      store.getMissions(organization.id),
    ]);
    setDocuments(docs);
    setMissions(miss);
    setLoading(false);
  };

  const handleDownload = async (doc: Doc) => {
    const blob = await store.getBlob(doc.blobKey);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getMissionName = (missionId: string) => {
    return missions.find(m => m.id === missionId)?.title || 'Sin misión';
  };

  const filtered = documents.filter(d =>
    !search || d.originalName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Documentos</h1>
        <p className="text-xs text-slate-500">Gestión documental de la organización</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar documentos..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay documentos</p>
          <p className="text-xs text-slate-400 mt-1">Carga documentos desde una misión</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Misión</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Tipo</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Tamaño</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Fecha</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800 truncate max-w-[200px]">{doc.originalName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">v{doc.version}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{getMissionName(doc.missionId)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{doc.mimeType}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{(doc.size / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{new Date(doc.createdAt).toLocaleDateString('es-ES')}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDownload(doc)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

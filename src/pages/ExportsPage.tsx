// ARCHEION ONE - Exports/Results Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';
import type { Artifact, Mission } from '../lib/types';
import { downloadArtifact } from '../lib/exports';
import { Download, Loader2, FileText, Archive } from 'lucide-react';

export default function ExportsPage() {
  const { organization } = useAuth();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    setLoading(true);
    const miss = await store.getMissions(organization.id);
    setMissions(miss);
    const all: Artifact[] = [];
    for (const m of miss) { all.push(...await store.getArtifacts(m.id)); }
    setArtifacts(all.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()));
    setLoading(false);
  };

  const handleDownload = async (artifact: Artifact) => {
    setDownloading(artifact.id);
    await downloadArtifact(artifact);
    setDownloading(null);
  };

  const getMissionTitle = (id: string) => missions.find(m => m.id === id)?.title || '—';
  const getMissionCode = (id: string) => missions.find(m => m.id === id)?.code || '—';

  const TYPE_ICONS: Record<string, typeof FileText> = {
    pdf: FileText,
    zip: Archive,
    json: FileText,
    csv: FileText,
    xlsx: FileText,
    docx: FileText,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Centro de resultados</h1>
        <p className="text-xs text-slate-500">Archivos generados y entregables descargables</p>
      </div>

      {artifacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Download className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay resultados generados</p>
          <p className="text-xs text-slate-400 mt-1">Genera informes PDF o expedientes ZIP desde una misión</p>
        </div>
      ) : (
        <div className="space-y-3">
          {artifacts.map(artifact => {
            const Icon = TYPE_ICONS[artifact.type] || FileText;
            return (
              <div key={artifact.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{artifact.name}</p>
                  <p className="text-xs text-slate-500">
                    {getMissionCode(artifact.missionId)} · {getMissionTitle(artifact.missionId)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {(artifact.size / 1024).toFixed(1)} KB · {new Date(artifact.generatedAt).toLocaleString('es-ES')}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(artifact)}
                  disabled={downloading === artifact.id}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-50"
                  title="Descargar"
                >
                  {downloading === artifact.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

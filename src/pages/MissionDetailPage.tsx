// ARCHEION ONE - Mission Detail Page
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { store, computeSHA256, generateId } from '../lib/store';
import type { Mission, Task, Document as Doc, MissionStatus, TaskStatus } from '../lib/types';
import { MISSION_STATUS_LABELS, TASK_STATUS_LABELS, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, hasPermission } from '../lib/types';
import { exportMissionPDF, exportMissionZIP } from '../lib/exports';
import {
  ArrowLeft, FileText, CheckSquare, Upload, Download, Edit3, Trash2,
  Plus, Clock, AlertCircle, Target, Shield, Loader2, Eye, X
} from 'lucide-react';

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization, user, getRole } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'tasks' | 'history'>('overview');
  const [uploading, setUploading] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [id, organization]);

  const loadData = async () => {
    if (!id || !organization) return;
    setLoading(true);
    const m = await store.getMission(id, organization.id);
    if (!m) { navigate('/missions'); return; }
    setMission(m);
    setEditTitle(m.title);
    setEditObjective(m.structuredObjective);
    const t = await store.getTasks(id);
    setTasks(t);
    const d = await store.getDocuments(id);
    setDocuments(d);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !mission || !organization || !user) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      // Validate
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        alert(`Formato no permitido: ${ext}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`Archivo demasiado grande: ${file.name} (máx. 50MB)`);
        continue;
      }

      // Compute hash
      const sha256 = await computeSHA256(file);
      const blobKey = `doc-${generateId()}`;

      // Store blob
      await store.storeBlob(blobKey, file);

      // Create document record
      const doc = await store.createDocument({
        missionId: mission.id,
        organizationId: organization.id,
        name: file.name,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        sha256,
        uploadedBy: user.id,
        source: 'manual_upload',
        blobKey,
      });

      await store.addAuditEvent({
        organizationId: organization.id,
        userId: user.id,
        action: 'document.upload',
        entityType: 'document',
        entityId: doc.id,
        details: { name: file.name, size: file.size, sha256, missionId: mission.id },
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadData();
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

      if (organization && user) {
        await store.addAuditEvent({
          organizationId: organization.id,
          userId: user.id,
          action: 'document.download',
          entityType: 'document',
          entityId: doc.id,
          details: { name: doc.originalName },
        });
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mission || !newTaskTitle.trim()) return;

    const task = await store.createTask({
      missionId: mission.id,
      title: newTaskTitle,
      description: newTaskDesc,
    });

    if (organization && user) {
      await store.addAuditEvent({
        organizationId: organization.id,
        userId: user.id,
        action: 'task.create',
        entityType: 'task',
        entityId: task.id,
        details: { title: task.title, missionId: mission.id },
      });
    }

    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowNewTask(false);
    loadData();
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!user || !organization) return;
    await store.updateTask(taskId, { status: newStatus }, user.id, `Cambio a ${TASK_STATUS_LABELS[newStatus]}`);
    
    await store.addAuditEvent({
      organizationId: organization.id,
      userId: user.id,
      action: 'task.status_change',
      entityType: 'task',
      entityId: taskId,
      details: { newStatus },
    });

    loadData();
  };

  const handleStatusChange = async (newStatus: MissionStatus) => {
    if (!mission || !organization || !user) return;
    
    // Validate transitions
    if (newStatus === 'completed') {
      const incompleteTasks = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
      if (incompleteTasks.length > 0) {
        alert(`No se puede completar: hay ${incompleteTasks.length} tarea(s) sin resolver`);
        return;
      }
    }

    const updates: Partial<Mission> = { status: newStatus };
    if (newStatus === 'completed') updates.completedAt = new Date().toISOString();
    
    await store.updateMission(mission.id, organization.id, updates);
    await store.addAuditEvent({
      organizationId: organization.id,
      userId: user.id,
      action: 'mission.status_change',
      entityType: 'mission',
      entityId: mission.id,
      details: { newStatus },
    });
    loadData();
  };

  const handleSaveEdit = async () => {
    if (!mission || !organization) return;
    await store.updateMission(mission.id, organization.id, {
      title: editTitle,
      structuredObjective: editObjective,
    });
    setEditing(false);
    loadData();
  };

  const handleGeneratePDF = async () => {
    if (!mission || !user || !organization) return;
    setGenerating(true);
    try {
      const claims = await store.getClaims(mission.id);
      const findings = await store.getFindings(mission.id);
      const result = await exportMissionPDF(mission, tasks, documents, claims, findings);
      
      const blobKey = `artifact-${generateId()}`;
      await store.storeBlob(blobKey, result.blob);
      await store.createArtifact({
        missionId: mission.id,
        type: 'pdf',
        name: `informe-${mission.code}.pdf`,
        description: 'Informe de misión generado automáticamente',
        generatedBy: user.id,
        blobKey,
        size: result.size,
        sha256: result.sha256,
      });

      // Download
      const url = URL.createObjectURL(result.blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `informe-${mission.code}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      await store.addAuditEvent({
        organizationId: organization.id,
        userId: user.id,
        action: 'artifact.generate',
        entityType: 'artifact',
        entityId: mission.id,
        details: { type: 'pdf', missionCode: mission.code },
      });
    } catch (err) {
      alert('Error generando PDF: ' + (err as Error).message);
    }
    setGenerating(false);
  };

  const handleGenerateZIP = async () => {
    if (!mission || !user || !organization) return;
    setGenerating(true);
    try {
      const claims = await store.getClaims(mission.id);
      const findings = await store.getFindings(mission.id);
      const decisions = await store.getDecisions(mission.id);
      await exportMissionZIP(mission, tasks, documents, claims, findings, decisions);

      await store.addAuditEvent({
        organizationId: organization.id,
        userId: user.id,
        action: 'export.zip',
        entityType: 'mission',
        entityId: mission.id,
        details: { missionCode: mission.code },
      });
    } catch (err) {
      alert('Error generando ZIP: ' + (err as Error).message);
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Misión no encontrada</p>
        <Link to="/missions" className="text-amber-600 text-sm mt-2 inline-block">← Volver a misiones</Link>
      </div>
    );
  }

  const canEdit = hasPermission(getRole(), 'mission', 'update');
  const canUpload = hasPermission(getRole(), 'document', 'create');
  const canExport = hasPermission(getRole(), 'mission', 'export');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/missions')} className="p-2 rounded-lg hover:bg-slate-100 mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="text-lg font-bold text-slate-800 border border-amber-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <h1 className="text-lg font-bold text-slate-800">{mission.title}</h1>
            )}
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-700`}>
              {MISSION_STATUS_LABELS[mission.status]}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-mono">{mission.code}</span>
            {' · '}
            {mission.type}
            {' · '}
            Creada: {new Date(mission.createdAt).toLocaleString('es-ES')}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          {editing && (
            <>
              <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-amber-500 text-slate-900 text-xs font-medium rounded-lg">Guardar</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg">Cancelar</button>
            </>
          )}
        </div>
      </div>

      {/* Status actions */}
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <>
            {mission.status === 'draft' && (
              <button onClick={() => handleStatusChange('preparation')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100">
                Iniciar preparación
              </button>
            )}
            {mission.status === 'preparation' && (
              <button onClick={() => handleStatusChange('execution')} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-100">
                Iniciar ejecución
              </button>
            )}
            {mission.status === 'execution' && (
              <>
                <button onClick={() => handleStatusChange('review')} className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-100">
                  Enviar a revisión
                </button>
                <button onClick={() => handleStatusChange('blocked')} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100">
                  Bloquear
                </button>
              </>
            )}
            {mission.status === 'review' && (
              <button onClick={() => handleStatusChange('completed')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100">
                Completar misión
              </button>
            )}
            {mission.status === 'blocked' && (
              <button onClick={() => handleStatusChange('execution')} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100">
                Desbloquear
              </button>
            )}
            {['completed', 'archived'].includes(mission.status) && (
              <button onClick={() => handleStatusChange('draft')} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100">
                Reabrir
              </button>
            )}
            {mission.status !== 'cancelled' && mission.status !== 'archived' && (
              <button onClick={() => handleStatusChange('cancelled')} className="px-3 py-1.5 bg-slate-50 text-slate-500 text-xs font-medium rounded-lg hover:bg-slate-100">
                Cancelar
              </button>
            )}
          </>
        )}
        {canExport && (
          <>
            <button
              onClick={handleGeneratePDF}
              disabled={generating}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
              Exportar PDF
            </button>
            <button
              onClick={handleGenerateZIP}
              disabled={generating}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Expediente ZIP
            </button>
          </>
        )}
      </div>

      {/* Mission info */}
      {(mission.originalNeed || mission.structuredObjective || mission.scope) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Información de la misión</h3>
          <div className="space-y-3 text-sm">
            {mission.originalNeed && (
              <div>
                <span className="text-xs font-medium text-slate-500">Necesidad original:</span>
                <p className="text-slate-700 mt-0.5">{mission.originalNeed}</p>
              </div>
            )}
            {mission.structuredObjective && (
              <div>
                <span className="text-xs font-medium text-slate-500">Objetivo:</span>
                {editing ? (
                  <textarea
                    value={editObjective}
                    onChange={e => setEditObjective(e.target.value)}
                    className="w-full mt-1 px-2 py-1 border border-amber-300 rounded text-sm outline-none resize-none"
                    rows={2}
                  />
                ) : (
                  <p className="text-slate-700 mt-0.5">{mission.structuredObjective}</p>
                )}
              </div>
            )}
            {mission.scope && (
              <div>
                <span className="text-xs font-medium text-slate-500">Alcance:</span>
                <p className="text-slate-700 mt-0.5">{mission.scope}</p>
              </div>
            )}
            {mission.exclusions && (
              <div>
                <span className="text-xs font-medium text-slate-500">Exclusiones:</span>
                <p className="text-slate-700 mt-0.5">{mission.exclusions}</p>
              </div>
            )}
            {mission.acceptanceCriteria.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-500">Criterios de aceptación:</span>
                <ul className="mt-1 space-y-1">
                  {mission.acceptanceCriteria.map((c, i) => (
                    <li key={i} className="text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          {[
            { key: 'overview', label: 'Resumen', icon: Target },
            { key: 'documents', label: `Documentos (${documents.length})`, icon: FileText },
            { key: 'tasks', label: `Tareas (${tasks.length})`, icon: CheckSquare },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {canUpload && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Subiendo...' : 'Cargar documentos'}
                </label>
                <span className="text-xs text-slate-400">
                  PDF, DOCX, TXT, CSV, XLSX, imágenes · Máx. 50MB
                </span>
              </div>
            </div>
          )}

          {documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No hay documentos</p>
              <p className="text-xs text-slate-400 mt-1">Carga archivos para comenzar el análisis</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.originalName}</p>
                    <p className="text-xs text-slate-500">
                      v{doc.version} · {(doc.size / 1024).toFixed(1)} KB · {doc.mimeType}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      SHA-256: {doc.sha256}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Plan de tareas</h3>
            {canEdit && (
              <button
                onClick={() => setShowNewTask(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-100"
              >
                <Plus className="w-3 h-3" />
                Nueva tarea
              </button>
            )}
          </div>

          {showNewTask && (
            <form onSubmit={handleCreateTask} className="bg-white rounded-xl border border-amber-200 p-4 space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Título de la tarea"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
              <textarea
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-1.5 bg-amber-500 text-slate-900 text-xs font-medium rounded-lg">Crear</button>
                <button type="button" onClick={() => setShowNewTask(false)} className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg">Cancelar</button>
              </div>
            </form>
          )}

          {tasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No hay tareas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                      task.status === 'completed' ? 'bg-emerald-500' :
                      task.status === 'failed' ? 'bg-red-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      task.status === 'blocked' ? 'bg-amber-500' :
                      'bg-slate-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          task.status === 'failed' ? 'bg-red-100 text-red-700' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {TASK_STATUS_LABELS[task.status]}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(task.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {task.status === 'pending' && canEdit && (
                        <button onClick={() => handleTaskStatusChange(task.id, 'in_progress')} className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="Iniciar">
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {task.status === 'in_progress' && canEdit && (
                        <>
                          <button onClick={() => handleTaskStatusChange(task.id, 'pending_review')} className="p-1.5 rounded hover:bg-purple-50 text-purple-500" title="Enviar a revisión">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleTaskStatusChange(task.id, 'failed')} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Marcar fallida">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {task.status === 'pending_review' && canEdit && (
                        <button onClick={() => handleTaskStatusChange(task.id, 'completed')} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-500" title="Aprobar">
                          <CheckSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Documentos</span>
                <span className="font-medium">{documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tareas</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Completadas</span>
                <span className="font-medium text-emerald-600">{tasks.filter(t => t.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pendientes</span>
                <span className="font-medium text-amber-600">{tasks.filter(t => ['pending', 'in_progress'].includes(t.status)).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bloqueadas</span>
                <span className="font-medium text-red-600">{tasks.filter(t => t.status === 'blocked').length}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Progreso</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Tareas completadas</span>
                  <span className="font-medium">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="pt-2">
                <p className="text-xs text-slate-500">
                  {mission.status === 'completed' ? '✓ Misión completada' :
                   mission.status === 'blocked' ? '⚠ Misión bloqueada' :
                   mission.status === 'execution' ? '→ Misión en ejecución' :
                   '○ Misión en preparación'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

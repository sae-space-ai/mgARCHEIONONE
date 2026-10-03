// ARCHEION ONE - Export Engine
// Generates real downloadable files: PDF, CSV, JSON, ZIP
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Mission, Task, Document as Doc, Artifact, Claim, Evidence, Finding, Decision } from './types';
import { store, computeSHA256, generateId } from './store';

export async function exportMissionPDF(mission: Mission, tasks: Task[], documents: Doc[], claims: Claim[], findings: Finding[]): Promise<{ blob: Blob; sha256: string; size: number }> {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ARCHEION ONE', margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Informe de Misión - ${mission.code}`, margin, y);
  y += 15;

  // Mission info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información de la Misión', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const info = [
    ['Código:', mission.code],
    ['Título:', mission.title],
    ['Estado:', mission.status],
    ['Tipo:', mission.type],
    ['Creada:', new Date(mission.createdAt).toLocaleString('es-ES')],
    ['Actualizada:', new Date(mission.updatedAt).toLocaleString('es-ES')],
  ];

  for (const [label, value] of info) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 35, y);
    y += 6;
  }

  y += 5;

  // Need & Objective
  if (mission.originalNeed) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Necesidad Original', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(mission.originalNeed, 170);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 5;
  }

  if (mission.structuredObjective) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Objetivo Estructurado', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(mission.structuredObjective, 170);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 5;
  }

  // Tasks
  if (tasks.length > 0) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tareas', margin, y);
    y += 8;
    doc.setFontSize(10);

    for (const task of tasks) {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${task.title}`, margin, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
      doc.text(`  Estado: ${task.status} | Creada: ${new Date(task.createdAt).toLocaleDateString('es-ES')}`, margin + 5, y);
      y += 6;
    }
    y += 5;
  }

  // Documents
  if (documents.length > 0) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Documentos', margin, y);
    y += 8;
    doc.setFontSize(10);

    for (const d of documents) {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(`• ${d.originalName} (v${d.version}) - ${(d.size / 1024).toFixed(1)} KB`, margin, y);
      y += 5;
      doc.setFontSize(8);
      doc.text(`  SHA-256: ${d.sha256.substring(0, 40)}...`, margin + 5, y);
      doc.setFontSize(10);
      y += 6;
    }
    y += 5;
  }

  // Claims
  if (claims.length > 0) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Afirmaciones y Evidencias', margin, y);
    y += 8;
    doc.setFontSize(10);

    for (const claim of claims) {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.text(`[${claim.type}]`, margin, y);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(claim.content, 150);
      doc.text(lines, margin + 30, y);
      y += lines.length * 5 + 3;
    }
    y += 5;
  }

  // Findings
  if (findings.length > 0) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Hallazgos', margin, y);
    y += 8;
    doc.setFontSize(10);

    for (const finding of findings) {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${finding.title} [${finding.severity}]`, margin, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
      const lines = doc.splitTextToSize(finding.description, 160);
      doc.text(lines, margin + 5, y);
      y += lines.length * 5 + 3;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`ARCHEION ONE - Generado: ${new Date().toLocaleString('es-ES')} - Página ${i}/${pageCount}`, margin, 290);
  }

  const blob = doc.output('blob');
  const sha256 = await computeSHA256(blob);
  return { blob, sha256, size: blob.size };
}

export function exportCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = String(row[h] ?? '');
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

export function exportJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, filename);
}

export async function exportMissionZIP(
  mission: Mission,
  tasks: Task[],
  documents: Doc[],
  claims: Claim[],
  findings: Finding[],
  decisions: Decision[]
): Promise<void> {
  const zip = new JSZip();

  // Manifest
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    mission: {
      id: mission.id,
      code: mission.code,
      title: mission.title,
      status: mission.status,
      createdAt: mission.createdAt,
      updatedAt: mission.updatedAt,
    },
    documentCount: documents.length,
    taskCount: tasks.length,
    claimCount: claims.length,
    findingCount: findings.length,
    decisionCount: decisions.length,
    documents: documents.map(d => ({
      id: d.id,
      name: d.originalName,
      version: d.version,
      sha256: d.sha256,
      size: d.size,
      mimeType: d.mimeType,
    })),
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      createdAt: t.createdAt,
    })),
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('index.txt', generateIndex(mission, tasks, documents, claims, findings));

  // Mission data
  zip.file('mission.json', JSON.stringify(mission, null, 2));
  zip.file('tasks.json', JSON.stringify(tasks, null, 2));
  zip.file('claims.json', JSON.stringify(claims, null, 2));
  zip.file('findings.json', JSON.stringify(findings, null, 2));
  zip.file('decisions.json', JSON.stringify(decisions, null, 2));

  // Add document blobs
  for (const doc of documents) {
    const blob = await store.getBlob(doc.blobKey);
    if (blob) {
      zip.file(`documents/${doc.originalName}`, blob);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `expediente-${mission.code}.zip`);
}

function generateIndex(mission: Mission, tasks: Task[], documents: Doc[], claims: Claim[], findings: Finding[]): string {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════════════');
  lines.push('              ARCHEION ONE - EXPEDIENTE');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Código: ${mission.code}`);
  lines.push(`Título: ${mission.title}`);
  lines.push(`Estado: ${mission.status}`);
  lines.push(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────');
  lines.push('DOCUMENTOS');
  lines.push('───────────────────────────────────────────────────');
  documents.forEach((d, i) => {
    lines.push(`  ${i + 1}. ${d.originalName} (v${d.version})`);
    lines.push(`     Tamaño: ${(d.size / 1024).toFixed(1)} KB`);
    lines.push(`     SHA-256: ${d.sha256}`);
  });
  lines.push('');
  lines.push('───────────────────────────────────────────────────');
  lines.push('TAREAS');
  lines.push('───────────────────────────────────────────────────');
  tasks.forEach((t, i) => {
    lines.push(`  ${i + 1}. ${t.title} [${t.status}]`);
  });
  lines.push('');
  lines.push('───────────────────────────────────────────────────');
  lines.push('AFIRMACIONES');
  lines.push('───────────────────────────────────────────────────');
  claims.forEach((c, i) => {
    lines.push(`  ${i + 1}. [${c.type}] ${c.content.substring(0, 100)}`);
  });
  lines.push('');
  lines.push('───────────────────────────────────────────────────');
  lines.push('HALLAZGOS');
  lines.push('───────────────────────────────────────────────────');
  findings.forEach((f, i) => {
    lines.push(`  ${i + 1}. ${f.title} [${f.severity}]`);
    lines.push(`     ${f.description.substring(0, 150)}`);
  });
  lines.push('');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('Fin del índice del expediente');
  lines.push('═══════════════════════════════════════════════════');
  return lines.join('\n');
}

export async function saveArtifact(
  missionId: string,
  type: Artifact['type'],
  name: string,
  description: string,
  blob: Blob,
  generatedBy: string,
  sha256: string
): Promise<Artifact> {
  const blobKey = `artifact-${generateId()}`;
  await store.storeBlob(blobKey, blob);
  return store.createArtifact({
    missionId,
    type,
    name,
    description,
    generatedBy,
    blobKey,
    size: blob.size,
    sha256,
  });
}

export async function downloadArtifact(artifact: Artifact): Promise<void> {
  const blob = await store.getBlob(artifact.blobKey);
  if (blob) {
    saveAs(blob, artifact.name);
  }
}

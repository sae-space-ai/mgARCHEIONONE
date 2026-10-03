// ARCHEION ONE - Core Types
// Sistema de tipos para el ecosistema documental y de misiones

export type Role = 'admin' | 'mission_owner' | 'specialist' | 'reviewer' | 'collaborator' | 'reader';

export type MissionStatus = 'draft' | 'preparation' | 'execution' | 'review' | 'completed' | 'blocked' | 'cancelled' | 'archived';

export type TaskStatus = 'pending' | 'blocked' | 'ready' | 'in_progress' | 'pending_review' | 'completed' | 'failed' | 'cancelled';

export type DocumentStatus = 'uploaded' | 'processing' | 'extracted' | 'error' | 'archived';

export type ClaimType = 'documented_fact' | 'declaration' | 'inference' | 'opinion' | 'hypothesis' | 'unverified';

export type EvidenceRelation = 'supports' | 'contradicts' | 'contextual';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'invalidated';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  createdAt: string;
}

export interface Mission {
  id: string;
  code: string;
  title: string;
  type: string;
  organizationId: string;
  ownerId: string;
  originalNeed: string;
  structuredObjective: string;
  scope: string;
  exclusions: string;
  acceptanceCriteria: string[];
  status: MissionStatus;
  budget?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  reopenReason?: string;
}

export interface MissionParticipant {
  id: string;
  missionId: string;
  userId: string;
  role: Role;
  addedAt: string;
}

export interface Task {
  id: string;
  missionId: string;
  title: string;
  description: string;
  assigneeId?: string;
  dependencies: string[];
  status: TaskStatus;
  acceptanceCriteria: string[];
  expectedResult: string;
  allowedTools: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  idempotencyKey: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  changedBy: string;
  reason: string;
  changedAt: string;
}

export interface Document {
  id: string;
  missionId: string;
  organizationId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  status: DocumentStatus;
  version: number;
  previousVersionId?: string;
  uploadedBy: string;
  source: string;
  originalDate?: string;
  createdAt: string;
  updatedAt: string;
  blobKey: string;
}

export interface DocumentExtraction {
  id: string;
  documentId: string;
  text: string;
  language?: string;
  pageCount?: number;
  extractedAt: string;
  extractorVersion: string;
  positions?: ExtractionPosition[];
}

export interface ExtractionPosition {
  page?: number;
  paragraph?: number;
  line?: number;
  cell?: string;
  text: string;
}

export interface Claim {
  id: string;
  missionId: string;
  organizationId: string;
  type: ClaimType;
  content: string;
  sourceDocumentId?: string;
  sourcePosition?: ExtractionPosition;
  confidence: number;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface Evidence {
  id: string;
  claimId: string;
  documentId: string;
  relation: EvidenceRelation;
  position?: ExtractionPosition;
  notes?: string;
  createdAt: string;
}

export interface Finding {
  id: string;
  missionId: string;
  title: string;
  description: string;
  relatedClaimIds: string[];
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

export interface Decision {
  id: string;
  missionId: string;
  title: string;
  problem: string;
  alternatives: string[];
  assumptions: string[];
  selectedAlternative: string;
  rationale: string;
  decidedBy: string;
  decidedAt: string;
}

export interface Approval {
  id: string;
  missionId: string;
  operationType: string;
  description: string;
  requestedBy: string;
  approvedBy?: string;
  status: ApprovalStatus;
  requestedAt: string;
  resolvedAt?: string;
  expiresAt?: string;
  invalidatedAt?: string;
  invalidationReason?: string;
}

export interface Artifact {
  id: string;
  missionId: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'json' | 'zip';
  name: string;
  description: string;
  generatedBy: string;
  generatedAt: string;
  blobKey: string;
  size: number;
  sha256: string;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
}

export interface Session {
  userId: string;
  organizationId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface Permission {
  role: Role;
  resource: string;
  actions: string[];
}

export const PERMISSION_MATRIX: Permission[] = [
  { role: 'admin', resource: '*', actions: ['*'] },
  { role: 'mission_owner', resource: 'mission', actions: ['create', 'read', 'update', 'delete', 'execute', 'export'] },
  { role: 'mission_owner', resource: 'document', actions: ['create', 'read', 'update', 'delete', 'export'] },
  { role: 'mission_owner', resource: 'task', actions: ['create', 'read', 'update', 'delete', 'execute'] },
  { role: 'specialist', resource: 'mission', actions: ['read'] },
  { role: 'specialist', resource: 'document', actions: ['create', 'read', 'export'] },
  { role: 'specialist', resource: 'task', actions: ['read', 'update', 'execute'] },
  { role: 'reviewer', resource: 'mission', actions: ['read'] },
  { role: 'reviewer', resource: 'document', actions: ['read'] },
  { role: 'reviewer', resource: 'task', actions: ['read', 'update'] },
  { role: 'reviewer', resource: 'claim', actions: ['read', 'update'] },
  { role: 'collaborator', resource: 'mission', actions: ['read'] },
  { role: 'collaborator', resource: 'document', actions: ['read'] },
  { role: 'collaborator', resource: 'task', actions: ['read'] },
  { role: 'reader', resource: 'mission', actions: ['read'] },
  { role: 'reader', resource: 'document', actions: ['read'] },
  { role: 'reader', resource: 'task', actions: ['read'] },
];

export function hasPermission(role: Role, resource: string, action: string): boolean {
  return PERMISSION_MATRIX.some(p => {
    if (p.role !== role) return false;
    const resourceMatch = p.resource === '*' || p.resource === resource;
    const actionMatch = p.actions.includes('*') || p.actions.includes(action);
    return resourceMatch && actionMatch;
  });
}

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  draft: 'Borrador',
  preparation: 'Preparación',
  execution: 'En ejecución',
  review: 'En revisión',
  completed: 'Completada',
  blocked: 'Bloqueada',
  cancelled: 'Cancelada',
  archived: 'Archivada',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  blocked: 'Bloqueada',
  ready: 'Preparada',
  in_progress: 'En ejecución',
  pending_review: 'Pendiente de revisión',
  completed: 'Completada',
  failed: 'Fallida',
  cancelled: 'Cancelada',
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  mission_owner: 'Responsable de misión',
  specialist: 'Especialista',
  reviewer: 'Revisor',
  collaborator: 'Colaborador',
  reader: 'Lector',
};

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv', '.xlsx', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

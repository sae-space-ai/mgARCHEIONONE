// ARCHEION ONE - Data Store with IndexedDB persistence
import Dexie, { type Table } from 'dexie';
import type {
  Organization, User, Membership, Mission, Task, TaskHistory,
  Document, DocumentExtraction, Claim, Evidence, Finding,
  Decision, Approval, Artifact, AuditEvent, Session
} from './types';

class ArcheionDB extends Dexie {
  organizations!: Table<Organization, string>;
  users!: Table<User, string>;
  memberships!: Table<Membership, string>;
  missions!: Table<Mission, string>;
  tasks!: Table<Task, string>;
  taskHistory!: Table<TaskHistory, string>;
  documents!: Table<Document, string>;
  documentExtractions!: Table<DocumentExtraction, string>;
  claims!: Table<Claim, string>;
  evidences!: Table<Evidence, string>;
  findings!: Table<Finding, string>;
  decisions!: Table<Decision, string>;
  approvals!: Table<Approval, string>;
  artifacts!: Table<Artifact, string>;
  auditEvents!: Table<AuditEvent, string>;
  sessions!: Table<Session, string>;
  blobs!: Table<{ key: string; data: Blob; createdAt: string }, string>;

  constructor() {
    super('archeion_one');
    this.version(1).stores({
      organizations: 'id, slug, ownerId',
      users: 'id, email',
      memberships: 'id, userId, organizationId, [userId+organizationId]',
      missions: 'id, code, organizationId, ownerId, status, [organizationId+status]',
      tasks: 'id, missionId, status, assigneeId, idempotencyKey',
      taskHistory: 'id, taskId, changedAt',
      documents: 'id, missionId, organizationId, sha256, blobKey',
      documentExtractions: 'id, documentId',
      claims: 'id, missionId, organizationId, type',
      evidences: 'id, claimId, documentId',
      findings: 'id, missionId',
      decisions: 'id, missionId',
      approvals: 'id, missionId, status',
      artifacts: 'id, missionId, type',
      auditEvents: 'id, organizationId, userId, entityType, entityId, timestamp',
      sessions: 'token, userId',
      blobs: 'key',
    });
  }
}

export const db = new ArcheionDB();

// Utility functions
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'archeion_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeSHA256(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'MSN-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

// Store operations
export const store = {
  // Organizations
  async createOrganization(name: string, ownerId: string): Promise<Organization> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const org: Organization = {
      id: generateId(),
      name,
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId,
    };
    await db.organizations.add(org);
    return org;
  },

  async getOrganizations(userId: string): Promise<Organization[]> {
    const memberships = await db.memberships.where('userId').equals(userId).toArray();
    const orgIds = memberships.map(m => m.organizationId);
    return db.organizations.where('id').anyOf(orgIds).toArray();
  },

  // Users
  async createUser(email: string, name: string, password: string): Promise<User> {
    const existing = await db.users.where('email').equals(email).first();
    if (existing) throw new Error('El email ya está registrado');
    
    const passwordHash = await hashPassword(password);
    const user: User = {
      id: generateId(),
      email,
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.users.add(user);
    return user;
  },

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await db.users.where('email').equals(email).first();
    if (!user) return null;
    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) return null;
    return user;
  },

  // Sessions
  async createSession(userId: string, organizationId: string): Promise<Session> {
    const session: Session = {
      userId,
      organizationId,
      token: generateId(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    await db.sessions.add(session);
    return session;
  },

  async getSession(token: string): Promise<Session | null> {
    const session = await db.sessions.where('token').equals(token).first();
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      await db.sessions.delete(token);
      return null;
    }
    return session;
  },

  async deleteSession(token: string): Promise<void> {
    await db.sessions.delete(token);
  },

  // Memberships
  async addMembership(userId: string, organizationId: string, role: string): Promise<Membership> {
    const membership: Membership = {
      id: generateId(),
      userId,
      organizationId,
      role: role as any,
      createdAt: new Date().toISOString(),
    };
    await db.memberships.add(membership);
    return membership;
  },

  async getMembership(userId: string, organizationId: string): Promise<Membership | null> {
    const m = await db.memberships.where('[userId+organizationId]').equals([userId, organizationId]).first();
    return m ?? null;
  },

  async getMemberships(organizationId: string): Promise<Membership[]> {
    return db.memberships.where('organizationId').equals(organizationId).toArray();
  },

  // Missions
  async createMission(data: Partial<Mission> & { organizationId: string; ownerId: string }): Promise<Mission> {
    const mission: Mission = {
      id: generateId(),
      code: generateCode(),
      title: data.title || 'Nueva misión',
      type: data.type || 'general',
      organizationId: data.organizationId,
      ownerId: data.ownerId,
      originalNeed: data.originalNeed || '',
      structuredObjective: data.structuredObjective || '',
      scope: data.scope || '',
      exclusions: data.exclusions || '',
      acceptanceCriteria: data.acceptanceCriteria || [],
      status: 'draft',
      budget: data.budget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.missions.add(mission);
    return mission;
  },

  async getMission(id: string, organizationId: string): Promise<Mission | null> {
    const mission = await db.missions.get(id);
    if (!mission || mission.organizationId !== organizationId) return null;
    return mission;
  },

  async getMissions(organizationId: string, status?: string): Promise<Mission[]> {
    let query = db.missions.where('organizationId').equals(organizationId);
    const missions = await query.toArray();
    if (status) return missions.filter(m => m.status === status);
    return missions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async updateMission(id: string, organizationId: string, updates: Partial<Mission>): Promise<Mission | null> {
    const mission = await this.getMission(id, organizationId);
    if (!mission) return null;
    const updated = { ...mission, ...updates, updatedAt: new Date().toISOString() };
    await db.missions.put(updated);
    return updated;
  },

  async deleteMission(id: string, organizationId: string): Promise<boolean> {
    const mission = await this.getMission(id, organizationId);
    if (!mission) return false;
    if (mission.status !== 'draft' && mission.status !== 'cancelled') return false;
    await db.missions.delete(id);
    return true;
  },

  // Tasks
  async createTask(data: Partial<Task> & { missionId: string }): Promise<Task> {
    const task: Task = {
      id: generateId(),
      missionId: data.missionId,
      title: data.title || 'Nueva tarea',
      description: data.description || '',
      assigneeId: data.assigneeId,
      dependencies: data.dependencies || [],
      status: 'pending',
      acceptanceCriteria: data.acceptanceCriteria || [],
      expectedResult: data.expectedResult || '',
      allowedTools: data.allowedTools || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      idempotencyKey: generateId(),
    };
    await db.tasks.add(task);
    return task;
  },

  async getTasks(missionId: string): Promise<Task[]> {
    return db.tasks.where('missionId').equals(missionId).toArray();
  },

  async updateTask(id: string, updates: Partial<Task>, userId: string, reason?: string): Promise<Task | null> {
    const task = await db.tasks.get(id);
    if (!task) return null;
    const previousStatus = task.status;
    const updated = { ...task, ...updates, updatedAt: new Date().toISOString() };
    
    if (updates.status && updates.status !== previousStatus) {
      if (updates.status === 'completed') updated.completedAt = new Date().toISOString();
      if (updates.status === 'failed') updated.failedAt = new Date().toISOString();
      
      const history: TaskHistory = {
        id: generateId(),
        taskId: id,
        previousStatus,
        newStatus: updates.status,
        changedBy: userId,
        reason: reason || 'Cambio de estado',
        changedAt: new Date().toISOString(),
      };
      await db.taskHistory.add(history);
    }
    
    await db.tasks.put(updated);
    return updated;
  },

  async getTaskHistory(taskId: string): Promise<TaskHistory[]> {
    return db.taskHistory.where('taskId').equals(taskId).sortBy('changedAt');
  },

  // Documents
  async createDocument(data: {
    missionId: string;
    organizationId: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    sha256: string;
    uploadedBy: string;
    source: string;
    blobKey: string;
    version?: number;
    previousVersionId?: string;
  }): Promise<Document> {
    const doc: Document = {
      id: generateId(),
      ...data,
      version: data.version || 1,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.documents.add(doc);
    return doc;
  },

  async getDocuments(missionId: string): Promise<Document[]> {
    return db.documents.where('missionId').equals(missionId).toArray();
  },

  async getDocument(id: string, organizationId: string): Promise<Document | null> {
    const doc = await db.documents.get(id);
    if (!doc || doc.organizationId !== organizationId) return null;
    return doc;
  },

  async getDocumentsByOrganization(organizationId: string): Promise<Document[]> {
    return db.documents.where('organizationId').equals(organizationId).toArray();
  },

  // Blobs
  async storeBlob(key: string, data: Blob): Promise<void> {
    await db.blobs.put({ key, data, createdAt: new Date().toISOString() });
  },

  async getBlob(key: string): Promise<Blob | null> {
    const record = await db.blobs.get(key);
    return record?.data || null;
  },

  // Audit
  async addAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent> {
    const auditEvent: AuditEvent = {
      ...event,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    await db.auditEvents.add(auditEvent);
    return auditEvent;
  },

  async getAuditEvents(organizationId: string, limit = 100): Promise<AuditEvent[]> {
    const events = await db.auditEvents.where('organizationId').equals(organizationId).toArray();
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  },

  // Artifacts
  async createArtifact(data: Omit<Artifact, 'id' | 'generatedAt'>): Promise<Artifact> {
    const artifact: Artifact = {
      ...data,
      id: generateId(),
      generatedAt: new Date().toISOString(),
    };
    await db.artifacts.add(artifact);
    return artifact;
  },

  async getArtifacts(missionId: string): Promise<Artifact[]> {
    return db.artifacts.where('missionId').equals(missionId).toArray();
  },

  // Claims & Evidence
  async createClaim(data: Omit<Claim, 'id' | 'createdAt'>): Promise<Claim> {
    const claim: Claim = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await db.claims.add(claim);
    return claim;
  },

  async getClaims(missionId: string): Promise<Claim[]> {
    return db.claims.where('missionId').equals(missionId).toArray();
  },

  async createEvidence(data: Omit<Evidence, 'id' | 'createdAt'>): Promise<Evidence> {
    const evidence: Evidence = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await db.evidences.add(evidence);
    return evidence;
  },

  async getEvidences(claimId: string): Promise<Evidence[]> {
    return db.evidences.where('claimId').equals(claimId).toArray();
  },

  // Decisions
  async createDecision(data: Omit<Decision, 'id' | 'decidedAt'>): Promise<Decision> {
    const decision: Decision = { ...data, id: generateId(), decidedAt: new Date().toISOString() };
    await db.decisions.add(decision);
    return decision;
  },

  async getDecisions(missionId: string): Promise<Decision[]> {
    return db.decisions.where('missionId').equals(missionId).toArray();
  },

  // Approvals
  async createApproval(data: Omit<Approval, 'id' | 'requestedAt' | 'status'>): Promise<Approval> {
    const approval: Approval = { ...data, id: generateId(), status: 'pending', requestedAt: new Date().toISOString() };
    await db.approvals.add(approval);
    return approval;
  },

  async getApprovals(missionId: string): Promise<Approval[]> {
    return db.approvals.where('missionId').equals(missionId).toArray();
  },

  async resolveApproval(id: string, approvedBy: string, approved: boolean): Promise<Approval | null> {
    const approval = await db.approvals.get(id);
    if (!approval) return null;
    const updated = {
      ...approval,
      status: approved ? 'approved' as const : 'rejected' as const,
      approvedBy,
      resolvedAt: new Date().toISOString(),
    };
    await db.approvals.put(updated);
    return updated;
  },

  // Findings
  async createFinding(data: Omit<Finding, 'id' | 'createdAt'>): Promise<Finding> {
    const finding: Finding = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await db.findings.add(finding);
    return finding;
  },

  async getFindings(missionId: string): Promise<Finding[]> {
    return db.findings.where('missionId').equals(missionId).toArray();
  },
};

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { logEvent } from './event.service.js';
import type { Project } from '@kanban/types';

export async function listProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(toProject);
}

export async function createProject(name: string): Promise<Project> {
  const project = await prisma.project.create({ data: { name } });
  await logEvent(project.id, 'project.created');
  return toProject(project);
}

export async function updateProject(id: string, name: string): Promise<Project> {
  await assertProjectExists(id);
  const project = await prisma.project.update({ where: { id }, data: { name } });
  await logEvent(id, 'project.updated');
  return toProject(project);
}

export async function deleteProject(id: string): Promise<void> {
  await assertProjectExists(id);
  await prisma.project.delete({ where: { id } });
  // Cascade deletes tasks/events; log is orphaned due to cascade so we log first
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function assertProjectExists(id: string): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!project) throw new HttpError(404, 'Project not found');
}

function toProject(row: { id: string; name: string; createdAt: Date }): Project {
  return { id: row.id, name: row.name, createdAt: row.createdAt.toISOString() };
}

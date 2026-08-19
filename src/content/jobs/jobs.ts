import type { JobDefinition } from '../../types/content'

export const jobDefinitions: JobDefinition[] = [
  { id: 'worker', name: '노동자', description: '생산 시설을 운영합니다.', combatContribution: 0, tags: ['production'] },
  { id: 'guard', name: '경비병', description: '던전의 방어를 담당합니다.', combatContribution: 5, tags: ['defense'] },
  { id: 'unassigned', name: '무직', description: '아직 역할을 배정받지 않았습니다.', combatContribution: 0, tags: [] },
]

export const jobDefinitionById = Object.fromEntries(
  jobDefinitions.map((job) => [job.id, job]),
) as Record<string, JobDefinition>

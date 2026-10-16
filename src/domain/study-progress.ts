/**
 * Study progress rules (RV-12, D-107). Pure: the dashboard service passes in the materials the
 * student may see right now and their own progress rows.
 *
 * - "Studied" means the student pressed "Mark as studied" on the material. Opening a page is not
 *   studying; no time is measured.
 * - Progress = studied ÷ available, where "available" is the published materials of the student's
 *   level and below in enabled categories. Archived or hidden materials never count, so the
 *   figure can go down when an editor hides something. Rounded down: 100 % only when all are done.
 * - Continue = the most recently opened material not yet marked as studied.
 * - Recommendations = up to `limit` not-yet-studied materials: the student's own level first, then
 *   the levels below it, each in category order and then the editor's display order.
 */
export type ProgressMaterial = {
  id: number
  categoryKey: string
  categoryOrder: number
  levelOrder: number
  order: number
}

export type ProgressRow = { materialId: number; lastOpenedAt: string; studiedAt: string | null }

export type Tally = { available: number; studied: number; percent: number }

export type StudySummary = {
  total: Tally
  byCategory: Record<string, Tally>
  continueId: number | null
  recommendedIds: number[]
  lastStudiedAt: string | null
}

export const percentOf = (studied: number, available: number): number =>
  available > 0 ? Math.floor((studied / available) * 100) : 0

const tally = (available: number, studied: number): Tally => ({
  available,
  studied,
  percent: percentOf(studied, available),
})

export function studySummary(
  materials: ProgressMaterial[],
  progress: ProgressRow[],
  studentLevelOrder: number,
  limit = 3,
): StudySummary {
  const visible = new Map(materials.map((m) => [m.id, m]))
  const rows = progress.filter((p) => visible.has(p.materialId))
  const studied = new Set(rows.filter((p) => p.studiedAt).map((p) => p.materialId))

  const byCategory: Record<string, Tally> = {}
  for (const m of materials) {
    const t = byCategory[m.categoryKey] ?? tally(0, 0)
    byCategory[m.categoryKey] = tally(t.available + 1, t.studied + (studied.has(m.id) ? 1 : 0))
  }

  const opened = rows
    .filter((p) => !p.studiedAt)
    .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt) || a.materialId - b.materialId)
  const continueId = opened[0]?.materialId ?? null

  const recommendedIds = materials
    .filter((m) => !studied.has(m.id) && m.id !== continueId)
    .sort(
      (a, b) =>
        Math.abs(studentLevelOrder - a.levelOrder) - Math.abs(studentLevelOrder - b.levelOrder) ||
        a.categoryOrder - b.categoryOrder ||
        a.order - b.order ||
        a.id - b.id,
    )
    .slice(0, limit)
    .map((m) => m.id)

  const lastStudiedAt =
    rows
      .map((p) => p.studiedAt)
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1) ?? null

  return {
    total: tally(materials.length, studied.size),
    byCategory,
    continueId,
    recommendedIds,
    lastStudiedAt,
  }
}

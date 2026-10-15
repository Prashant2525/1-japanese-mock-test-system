/**
 * Study library eligibility (SM-R02, SM-R03, D-008, D-015). Pure: plain data in and out.
 * A student sees materials of JLPT levels that are switched on for study and are not above their
 * own level ("current and lower"). Levels not switched on (N2/N1 at launch) never appear, even for
 * a student whose level is higher (e.g. after a Super Admin override).
 */
export type StudyLevel = { id: number; examCode: string; order: number; enabledForStudy: boolean }

export function studyLevelIds(
  studentLevel: { examCode: string; order: number } | null,
  levels: StudyLevel[],
): number[] {
  if (!studentLevel || studentLevel.examCode !== 'JLPT') return []
  return levels
    .filter((l) => l.examCode === 'JLPT' && l.enabledForStudy && l.order <= studentLevel.order)
    .sort((a, b) => a.order - b.order)
    .map((l) => l.id)
}

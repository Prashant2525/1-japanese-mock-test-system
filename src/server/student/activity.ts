import { sql } from '@payloadcms/db-postgres'

import {
  firstGoalMet,
  lastSevenDays,
  milestones,
  nepalDate,
  streaks,
  type Milestone,
  type Streaks,
} from '@/domain/study-days'

import { payloadClient } from '../auth/session'

/**
 * The signed-in student's study activity (D-110): study actions are first-time "Mark as studied"
 * and finished level-check stages / tests, grouped by Nepal day. Only the student's own rows are
 * read; nothing comes from the browser.
 */
export type Activity = {
  today: string
  goal: number
  todayMaterials: number
  streak: Streaks
  week: { date: string; count: number }[]
  /** Study actions per Nepal day (for the calendar). */
  actionsPerDay: Record<string, number>
  milestones: Milestone[]
}

type Row = Record<string, unknown>
const iso = (v: unknown) => new Date(v as string | Date).toISOString()

export async function activityFor(studentId: number, now: Date = new Date()): Promise<Activity> {
  const payload = await payloadClient()
  const db = payload.db.drizzle
  const [studied, results, session, student] = await Promise.all([
    db.execute(sql`
      SELECT first_studied_at FROM study_progress
      WHERE student_id = ${studentId} AND first_studied_at IS NOT NULL`),
    db.execute(sql`SELECT created_at FROM results WHERE student_id = ${studentId}`),
    db.execute(sql`
      SELECT completed_at FROM level_check_sessions
      WHERE student_id = ${studentId} AND status = 'completed' AND completed_at IS NOT NULL
      ORDER BY completed_at DESC LIMIT 1`),
    payload.findByID({
      collection: 'students',
      id: studentId,
      depth: 0,
      overrideAccess: true,
      select: { dailyGoal: true },
    }),
  ])
  const today = nepalDate(now)
  const firstStudiedDays = (studied.rows as Row[]).map((r) => nepalDate(iso(r.first_studied_at)))
  const resultDays = (results.rows as Row[]).map((r) => nepalDate(iso(r.created_at)))
  const perDay = new Map<string, number>()
  for (const d of [...firstStudiedDays, ...resultDays]) perDay.set(d, (perDay.get(d) ?? 0) + 1)
  const studyDays = [...perDay.keys()]
  const goal = Math.min(5, Math.max(1, Number(student.dailyGoal) || 1))
  const completed = (session.rows as Row[])[0]?.completed_at
  return {
    today,
    goal,
    todayMaterials: firstStudiedDays.filter((d) => d === today).length,
    streak: streaks(studyDays, today),
    week: lastSevenDays(perDay, today),
    actionsPerDay: Object.fromEntries(perDay),
    milestones: milestones({
      firstStudiedDays,
      studyDays,
      levelCheckCompletedOn: completed ? nepalDate(iso(completed)) : null,
      goalMetOn: firstGoalMet(firstStudiedDays, goal),
    }),
  }
}

/** Sets the student's own daily goal (1–5 materials). */
export async function setDailyGoal(studentId: number, dailyGoal: number): Promise<number> {
  const payload = await payloadClient()
  await payload.update({
    collection: 'students',
    id: studentId,
    data: { dailyGoal },
    overrideAccess: true,
  })
  return dailyGoal
}

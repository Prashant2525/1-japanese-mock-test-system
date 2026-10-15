import type { CollectionConfig, Field } from 'payload'

import { hasPermission, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'
import type { Permission } from '@/server/auth/permissions'

/**
 * Records written only by server services (Phase 11): published level-check versions, level-check
 * sessions, attempts, results and level assignments. Read-only in the admin panel; nobody can
 * create, edit or delete them through the CMS (history never changes, TSR-05).
 */
const readOnly = (permission: Permission): CollectionConfig['access'] => ({
  read: hasPermission(permission),
  create: never,
  update: never,
  delete: never,
})

const student: Field = {
  name: 'student',
  type: 'relationship',
  relationTo: 'students',
  required: true,
  index: true,
  label: { en: 'Student', ja: '受講者' },
}

export const LevelCheckVersions: CollectionConfig = {
  slug: 'level-check-versions',
  labels: {
    singular: { en: 'Published level check', ja: '公開済みレベルチェック' },
    plural: { en: 'Published level checks', ja: '公開済みレベルチェック' },
  },
  admin: {
    group: ADMIN_GROUPS.levelCheck,
    useAsTitle: 'versionNo',
    defaultColumns: ['versionNo', 'publishedAt', 'publishedBy', 'checksum'],
    description: {
      en: 'Frozen copies created each time the level check settings are published. Sessions keep the version they started with.',
      ja: 'レベルチェック設定を公開するたびに作成される固定コピーです。各セッションは開始時のバージョンを使い続けます。',
    },
  },
  defaultSort: '-versionNo',
  access: readOnly('determination.manage'),
  fields: [
    {
      name: 'versionNo',
      type: 'number',
      required: true,
      unique: true,
      label: { en: 'Version', ja: 'バージョン' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      label: { en: 'Published', ja: '公開日時' },
    },
    {
      name: 'publishedBy',
      type: 'relationship',
      relationTo: 'admins',
      label: { en: 'Published by', ja: '公開者' },
    },
    {
      name: 'snapshot',
      type: 'json',
      required: true,
      label: { en: 'Snapshot', ja: 'スナップショット' },
    },
    {
      name: 'checksum',
      type: 'text',
      required: true,
      label: { en: 'Checksum', ja: 'チェックサム' },
    },
  ],
}

export const LevelCheckSessions: CollectionConfig = {
  slug: 'level-check-sessions',
  labels: {
    singular: { en: 'Level check session', ja: 'レベルチェックのセッション' },
    plural: { en: 'Level check sessions', ja: 'レベルチェックのセッション' },
  },
  admin: {
    group: ADMIN_GROUPS.levelCheck,
    defaultColumns: ['student', 'status', 'currentStageIndex', 'assignedLevel', 'updatedAt'],
  },
  defaultSort: '-updatedAt',
  access: readOnly('students.read'),
  fields: [
    student,
    {
      name: 'configVersion',
      type: 'relationship',
      relationTo: 'level-check-versions',
      required: true,
      label: { en: 'Level check version', ja: 'レベルチェックのバージョン' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      index: true,
      options: [
        { value: 'in_progress', label: { en: 'In progress', ja: '実施中' } },
        { value: 'completed', label: { en: 'Completed', ja: '完了' } },
        { value: 'reset', label: { en: 'Reset', ja: 'リセット' } },
      ],
      label: { en: 'Status', ja: '状態' },
    },
    {
      name: 'currentStageIndex',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: { en: 'Current stage (0 = first)', ja: '現在の段階（0＝最初）' },
    },
    { name: 'stageOutcomes', type: 'json', label: { en: 'Stage results', ja: '段階ごとの結果' } },
    {
      name: 'assignedLevel',
      type: 'relationship',
      relationTo: 'levels',
      label: { en: 'Assigned level', ja: '判定レベル' },
    },
    { name: 'completedAt', type: 'date', label: { en: 'Completed', ja: '完了日時' } },
    { name: 'resetAt', type: 'date', label: { en: 'Reset on', ja: 'リセット日時' } },
    {
      name: 'resetBy',
      type: 'relationship',
      relationTo: 'admins',
      label: { en: 'Reset by', ja: 'リセットした管理者' },
    },
    { name: 'resetReason', type: 'textarea', label: { en: 'Reset reason', ja: 'リセット理由' } },
  ],
}

export const Attempts: CollectionConfig = {
  slug: 'attempts',
  labels: {
    singular: { en: 'Attempt', ja: '受験記録' },
    plural: { en: 'Attempts', ja: '受験記録' },
  },
  admin: {
    group: ADMIN_GROUPS.levelCheck,
    defaultColumns: ['student', 'kind', 'stageIndex', 'status', 'startedAt', 'submitReason'],
  },
  defaultSort: '-startedAt',
  access: readOnly('results.read'),
  fields: [
    student,
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { value: 'determination', label: { en: 'Level check', ja: 'レベルチェック' } },
        { value: 'mock', label: { en: 'Mock test', ja: '模擬試験' } },
      ],
      label: { en: 'Kind', ja: '種類' },
    },
    {
      name: 'determinationSession',
      type: 'relationship',
      relationTo: 'level-check-sessions',
      index: true,
      label: { en: 'Level check session', ja: 'レベルチェックのセッション' },
    },
    {
      name: 'stageIndex',
      type: 'number',
      label: { en: 'Stage (0 = first)', ja: '段階（0＝最初）' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { value: 'in_progress', label: { en: 'In progress', ja: '実施中' } },
        { value: 'submitted', label: { en: 'Submitted', ja: '提出済み' } },
      ],
      label: { en: 'Status', ja: '状態' },
    },
    { name: 'startedAt', type: 'date', required: true, label: { en: 'Started', ja: '開始日時' } },
    {
      name: 'deadlineAt',
      type: 'date',
      required: true,
      index: true,
      label: { en: 'Deadline', ja: '締切' },
    },
    { name: 'submittedAt', type: 'date', label: { en: 'Submitted', ja: '提出日時' } },
    {
      name: 'submitReason',
      type: 'select',
      options: [
        { value: 'manual', label: { en: 'Submitted by the student', ja: '受講者が提出' } },
        { value: 'timeout', label: { en: 'Time ran out', ja: '時間切れ' } },
      ],
      label: { en: 'How it ended', ja: '終了の理由' },
    },
    {
      name: 'sessionId',
      type: 'text',
      label: { en: 'Browser session', ja: 'ブラウザセッション' },
      admin: { readOnly: true },
    },
    { name: 'answers', type: 'json', label: { en: 'Answers', ja: '解答' } },
    {
      name: 'lastSeq',
      type: 'number',
      defaultValue: 0,
      label: { en: 'Last save number', ja: '最終保存番号' },
    },
  ],
}

export const Results: CollectionConfig = {
  slug: 'results',
  labels: {
    singular: { en: 'Result', ja: '結果' },
    plural: { en: 'Results', ja: '結果' },
  },
  admin: {
    group: ADMIN_GROUPS.levelCheck,
    defaultColumns: ['student', 'kind', 'levelCode', 'percent', 'passed', 'createdAt'],
  },
  defaultSort: '-createdAt',
  access: readOnly('results.read'),
  fields: [
    {
      name: 'attempt',
      type: 'relationship',
      relationTo: 'attempts',
      required: true,
      unique: true,
      label: { en: 'Attempt', ja: '受験記録' },
    },
    student,
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { value: 'determination', label: { en: 'Level check', ja: 'レベルチェック' } },
        { value: 'mock', label: { en: 'Mock test', ja: '模擬試験' } },
      ],
      label: { en: 'Kind', ja: '種類' },
    },
    { name: 'examCode', type: 'text', label: { en: 'Exam', ja: '試験' } },
    { name: 'levelCode', type: 'text', label: { en: 'Level', ja: 'レベル' } },
    {
      name: 'titleSnapshot',
      type: 'json',
      label: { en: 'Title (EN/JA)', ja: 'タイトル（EN/JA）' },
    },
    {
      name: 'totalQuestions',
      type: 'number',
      required: true,
      label: { en: 'Questions', ja: '問題数' },
    },
    { name: 'correct', type: 'number', required: true, label: { en: 'Correct', ja: '正解' } },
    { name: 'incorrect', type: 'number', required: true, label: { en: 'Incorrect', ja: '不正解' } },
    {
      name: 'unanswered',
      type: 'number',
      required: true,
      label: { en: 'Unanswered', ja: '未解答' },
    },
    {
      name: 'totalMarks',
      type: 'number',
      required: true,
      label: { en: 'Total marks', ja: '満点' },
    },
    {
      name: 'earnedMarks',
      type: 'number',
      required: true,
      label: { en: 'Marks earned', ja: '得点' },
    },
    {
      name: 'percent',
      type: 'number',
      required: true,
      label: { en: 'Score (%)', ja: '得点率（%）' },
    },
    { name: 'passed', type: 'checkbox', required: true, label: { en: 'Passed', ja: '合格' } },
    { name: 'thresholdPercent', type: 'number', label: { en: 'Pass mark (%)', ja: '合格点（%）' } },
    {
      name: 'scoringVersion',
      type: 'text',
      label: { en: 'Scoring version', ja: '採点バージョン' },
    },
  ],
}

export const ResultItems: CollectionConfig = {
  slug: 'result-items',
  labels: {
    singular: { en: 'Result item', ja: '結果明細' },
    plural: { en: 'Result items', ja: '結果明細' },
  },
  admin: { hidden: true },
  access: readOnly('results.read'),
  fields: [
    { name: 'result', type: 'relationship', relationTo: 'results', required: true, index: true },
    { name: 'order', type: 'number', required: true },
    { name: 'questionKey', type: 'text', required: true },
    { name: 'selectedOptionKey', type: 'text' },
    { name: 'correctOptionKey', type: 'text', required: true },
    { name: 'isCorrect', type: 'checkbox', required: true },
    { name: 'marks', type: 'number', required: true },
    { name: 'earned', type: 'number', required: true },
    { name: 'flagged', type: 'checkbox' },
  ],
}

export const LevelAssignments: CollectionConfig = {
  slug: 'level-assignments',
  labels: {
    singular: { en: 'Level assignment', ja: 'レベル判定履歴' },
    plural: { en: 'Level assignments', ja: 'レベル判定履歴' },
  },
  admin: {
    group: ADMIN_GROUPS.levelCheck,
    defaultColumns: ['student', 'level', 'source', 'actor', 'createdAt'],
    description: {
      en: 'Append-only history of every level given to a student: by the level check, by a Super Admin override, or cleared by a reset (D-013).',
      ja: '受講者に付与されたすべてのレベルの追記専用の履歴です（レベルチェック、スーパー管理者による変更、リセット、D-013）。',
    },
  },
  defaultSort: '-createdAt',
  access: readOnly('students.read'),
  fields: [
    student,
    {
      name: 'level',
      type: 'relationship',
      relationTo: 'levels',
      label: { en: 'Level', ja: 'レベル' },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { value: 'determination', label: { en: 'Level check', ja: 'レベルチェック' } },
        { value: 'override', label: { en: 'Override', ja: '変更' } },
        { value: 'reset', label: { en: 'Reset', ja: 'リセット' } },
      ],
      label: { en: 'Source', ja: '経緯' },
    },
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'level-check-sessions',
      label: { en: 'Session', ja: 'セッション' },
    },
    { name: 'reason', type: 'textarea', label: { en: 'Reason', ja: '理由' } },
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'admins',
      label: { en: 'By admin', ja: '担当管理者' },
    },
  ],
}

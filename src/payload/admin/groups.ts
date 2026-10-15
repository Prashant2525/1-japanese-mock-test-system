/**
 * Admin navigation groups (Phase 9). Every collection and global uses one of these, so the menu
 * stays in a fixed, predictable order: People → Exam catalogue → Question bank → Level check → Study library → Content → Operations → Settings.
 * Payload hides any entry the signed-in admin has no read access to (role-aware navigation).
 */
export const ADMIN_GROUPS = {
  people: { en: 'People', ja: '利用者' },
  catalogue: { en: 'Exam catalogue', ja: '試験カタログ' },
  questions: { en: 'Question bank', ja: '問題バンク' },
  levelCheck: { en: 'Level check', ja: 'レベルチェック' },
  study: { en: 'Study library', ja: '学習教材' },
  content: { en: 'Content', ja: 'コンテンツ' },
  operations: { en: 'Operations', ja: '運用' },
  settings: { en: 'Settings', ja: '設定' },
} as const

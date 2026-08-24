// עותק תצוגה של אותם תנאים שכבר אוכפים RLS policies בשרת
// (B-brain/04-clients/genesis/_process/migrations/002_helper_functions.sql + 004_rls_policies.sql).
// זה UX בלבד: קובע מה מוצג בממשק. אם קריאה תעקוף את הבדיקה כאן, RLS עדיין חוסם אותה בשרת.
// אף פעם לא להוסיף כאן תנאי שלא קיים ב-RLS המקביל - זה ייצור פער בין מה שמוצג למה שבאמת קורה.

export function isManagement(profile) {
  return profile?.permission_level === 'הנהלה'
}

export function isProjectManager(profile) {
  return profile?.permission_level === 'מנהל_פרויקט'
}

export function isManagementOrPM(profile) {
  return isManagement(profile) || isProjectManager(profile)
}

// מראה את has_financial_access() ב-002
export function hasFinancialAccess(profile) {
  return isManagementOrPM(profile) || (profile?.roles ?? []).includes('קמפיינר')
}

// מראה את clients_insert / tasks_insert ב-004
export function canCreateClients(profile) {
  return isManagementOrPM(profile)
}

export function canCreateTasks(profile) {
  return isManagementOrPM(profile)
}

// מראה את clients_update ב-004 (עדכון לקוח בכלל, לא כולל השדה project_manager_id)
export function canManageClients(profile) {
  return isManagementOrPM(profile)
}

// מראה את guard_client_role_change ב-002: רק הנהלה משנה מנהל פרויקט על לקוח
export function canEditProjectManager(profile) {
  return isManagement(profile)
}

// מראה את tags_write ב-004: רק הנהלה יוצרת/עורכת תגית חדשה
export function canCreateTags(profile) {
  return isManagement(profile)
}

// מראה את can_view_task ב-002, שמשמש גם ל-tasks_select וגם ל-tasks_update (USING+WITH CHECK) ב-004:
// הנהלה/מנהל_פרויקט רואים ועורכים הכל, מי שהמשימה משויכת אליו עורך רק אותה.
// אותו תנאי בדיוק שולט גם על שינוי שדות וגם על כפתורי התקדמות סטטוס.
export function canEditTask(profile, task, userId) {
  return isManagementOrPM(profile) || task?.assigned_to === userId
}

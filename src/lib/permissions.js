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

// מראה את הבדיקה בתוך Edge Function create-user עצמה (לא RLS): רק הנהלה
// יכולה ליצור משתמש. ה-Edge Function אוכפת את זה בעצמה בצד שרת ללא תלות
// בבדיקה הזו, זה רק UX (מסתיר את מסך המשתמשים ממי שממילא לא יכול לפעול בו).
export function canCreateUsers(profile) {
  return isManagement(profile)
}

// מראה את package_definitions_write/package_task_templates_write/departments_write
// ב-011: עריכת קטלוג חבילות היא הנהלה בלבד ("עריכת חבילות" מפורש כסעיף
// הנהלה-בלבד ב-project-brief.md סעיף 3). שיוך חבילה קיימת ללקוח (client_packages)
// פתוח יותר, הנהלה+מנהל_פרויקט, ראו canManageClients.
export function canManagePackages(profile) {
  return isManagement(profile)
}

// מראה את guard_soft_delete ב-018: מחיקה רכה (deleted_at) נעולה להנהלה
// בלבד, אותו scope שהיה ל-DELETE הפיזי שבוטל, גם אם ה-UPDATE הכללי פתוח
// יותר (הנהלה+מנהל_פרויקט).
export function canDeleteRecords(profile) {
  return isManagement(profile)
}

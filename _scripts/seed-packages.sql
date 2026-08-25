-- קטלוג חבילות פאזה 2, מה-PDF-ים העדכניים (25.08.2026) + brief לממומן העצמאי.
-- להריץ פעם אחת ב-SQL Editor, פרויקט tzmoozqxfyfnhcilljdw, אחרי מיגרציה 011.
--
-- רץ כ-postgres (SQL Editor/CLI), לא כמשתמש מחובר: RLS לא חל על הבעלים אלא אם
-- הופעל force row level security (לא הופעל ב-011), אז create_package_version
-- עובד גם בלי auth.uid() אמיתי. created_by ייצא null על כל השורות, זה בסדר
-- לזריעה חד-פעמית.
--
-- כל חבילה: create_package_version יוצר גרסה 1, ואז INSERT ל-package_task_templates.
-- זו טיוטה ראשונה שמתרגמת את הפיצ'רים מה-PDF לשורות משימה, לא פירוט טכני שהלקוח
-- אישר ברמת המשימה עצמה. לצפות/לערוך אחרי ההרצה דרך הגדרות → חבילות.

do $$
declare
  dep_social uuid;
  dep_paid uuid;
  dep_organic uuid;
  dep_video uuid;
  pkg_id uuid;
begin
  select id into dep_social from departments where name = 'סושיאל';
  select id into dep_paid from departments where name = 'שיווק ממומן';
  select id into dep_organic from departments where name = 'שיווק אורגני';
  select id into dep_video from departments where name = 'עריכת וידאו';

  -- ===== סושיאל 360 - מתחיל (₪2,500) =====
  pkg_id := create_package_version(null, 'סושיאל 360 - מתחיל', dep_social, false);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'קריאייטיב ותוכן', 'יצירת פוסטים', 4, 'חודשית', 1),
    (pkg_id, 'קריאייטיב ותוכן', 'העלאה ותזמון', 4, 'חודשית', 2),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול תגובות', 2, 'שבועית', 3),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול קמפיין חשיפה', 1, 'חודשית', 4);

  -- ===== סושיאל 360 - בצמיחה (₪3,500) =====
  pkg_id := create_package_version(null, 'סושיאל 360 - בצמיחה', dep_social, false);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'קריאייטיב ותוכן', 'יצירת פוסטים', 6, 'חודשית', 1),
    (pkg_id, 'קריאייטיב ותוכן', 'העלאה ותזמון', 6, 'חודשית', 2),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול תגובות', 3, 'שבועית', 3),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול קמפיין חשיפה', 1, 'חודשית', 4);

  -- ===== סושיאל 360 - פרימיום (₪4,000) =====
  pkg_id := create_package_version(null, 'סושיאל 360 - פרימיום', dep_social, false);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'קריאייטיב ותוכן', 'יצירת פוסטים', 8, 'חודשית', 1),
    (pkg_id, 'קריאייטיב ותוכן', 'העלאה ותזמון', 8, 'חודשית', 2),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול תגובות', 1, 'יומית', 3),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול קמפיין חשיפה', 1, 'חודשית', 4);

  -- ===== אורגני 300 (₪3,000) =====
  pkg_id := create_package_version(null, 'אורגני 360 - 300', dep_organic, false);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'אפיון והקמה', 'תשתית קידום אורגני מדויקת', 1, 'חד_פעמית', 1),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמר SEO', 1, 'חודשית', 2),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמר GEO', 1, 'חודשית', 3),
    (pkg_id, 'קריאייטיב ותוכן', 'בניית קישורים איכותיים', 2, 'חודשית', 4),
    (pkg_id, 'ניהול ואופטימיזציה', 'מחקר ומעקב מילות מפתח', 25, 'חודשית', 5),
    (pkg_id, 'ניהול ואופטימיזציה', 'אופטימיזציית עמודי אתר', 1, 'חודשית', 6),
    (pkg_id, 'דוחות ובקרה', 'דוח חודשי', 1, 'חודשית', 7);

  -- ===== אורגני 330 (₪4,000) =====
  pkg_id := create_package_version(null, 'אורגני 360 - 330', dep_organic, false);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'אפיון והקמה', 'תשתית קידום אורגני מדויקת', 1, 'חד_פעמית', 1),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמר SEO', 1, 'חודשית', 2),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמר GEO', 1, 'חודשית', 3),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמר AEO', 1, 'חודשית', 4),
    (pkg_id, 'קריאייטיב ותוכן', 'בניית קישורים איכותיים', 3, 'חודשית', 5),
    (pkg_id, 'ניהול ואופטימיזציה', 'מחקר ומעקב מילות מפתח', 50, 'חודשית', 6),
    (pkg_id, 'ניהול ואופטימיזציה', 'אופטימיזציית עמודי אתר', 1, 'חודשית', 7),
    (pkg_id, 'ניהול ואופטימיזציה', 'סיכומי FAQ', 1, 'חודשית', 8),
    (pkg_id, 'דוחות ובקרה', 'דוח חודשי', 1, 'חודשית', 9);

  -- ===== אורגני 360 (₪5,000) =====
  pkg_id := create_package_version(null, 'אורגני 360 - 360', dep_organic, false);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'אפיון והקמה', 'תשתית קידום אורגני מדויקת', 1, 'חד_פעמית', 1),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמר SEO', 1, 'חודשית', 2),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמר GEO', 2, 'חודשית', 3),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמר AEO', 2, 'חודשית', 4),
    (pkg_id, 'קריאייטיב ותוכן', 'בניית קישורים איכותיים', 5, 'חודשית', 5),
    (pkg_id, 'ניהול ואופטימיזציה', 'מחקר ומעקב מילות מפתח', 100, 'חודשית', 6),
    (pkg_id, 'ניהול ואופטימיזציה', 'אופטימיזציית עמודי אתר', 1, 'חודשית', 7),
    (pkg_id, 'ניהול ואופטימיזציה', 'סיכומי FAQ', 1, 'חודשית', 8),
    (pkg_id, 'ניהול ואופטימיזציה', 'העלאת פוסטים ל-Google My Business', 1, 'חודשית', 9),
    (pkg_id, 'דוחות ובקרה', 'דוח חודשי', 1, 'חודשית', 10);

  -- ===== 360 לעסקים - Essential (₪7,000, בנדל) =====
  pkg_id := create_package_version(null, '360 לעסקים - Essential', null, true);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'אפיון והקמה', 'אסטרטגיית קול המותג', 1, 'חד_פעמית', 1),
    (pkg_id, 'קריאייטיב ותוכן', 'פוסטים חודשיים (סושיאל)', 4, 'חודשית', 2),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול תגובות', 2, 'שבועית', 3),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמרי SEO+GEO', 2, 'חודשית', 4),
    (pkg_id, 'קריאייטיב ותוכן', 'בניית קישורים איכותיים', 2, 'חודשית', 5),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול קמפיין ממומן (תקציב עד 10,000 ₪)', 1, 'חודשית', 6),
    (pkg_id, 'עבודה מול הלקוח', 'ליווי מנהל תיק אישי', 1, 'חודשית', 7),
    (pkg_id, 'דוחות ובקרה', 'דוח חודשי', 1, 'חודשית', 8);

  -- ===== 360 לעסקים - Growth (₪9,000, בנדל) =====
  pkg_id := create_package_version(null, '360 לעסקים - Growth', null, true);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'אפיון והקמה', 'אסטרטגיית קול המותג', 1, 'חד_פעמית', 1),
    (pkg_id, 'אפיון והקמה', 'קריאייטיב AI לפרסום', 1, 'חד_פעמית', 2),
    (pkg_id, 'קריאייטיב ותוכן', 'פוסטים חודשיים (סושיאל)', 6, 'חודשית', 3),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול תגובות', 3, 'שבועית', 4),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמרי SEO+GEO', 3, 'חודשית', 5),
    (pkg_id, 'קריאייטיב ותוכן', 'בניית קישורים איכותיים', 3, 'חודשית', 6),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול קמפיין ממומן (תקציב עד 15,000 ₪)', 1, 'חודשית', 7),
    (pkg_id, 'עבודה מול הלקוח', 'ליווי מנהל תיק אישי', 1, 'חודשית', 8),
    (pkg_id, 'דוחות ובקרה', 'דוח חודשי', 1, 'חודשית', 9);

  -- ===== 360 לעסקים - Signature (₪10,000, בנדל) =====
  pkg_id := create_package_version(null, '360 לעסקים - Signature', null, true);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'אפיון והקמה', 'אסטרטגיית קול המותג', 1, 'חד_פעמית', 1),
    (pkg_id, 'אפיון והקמה', 'קריאייטיב AI לפרסום', 1, 'חד_פעמית', 2),
    (pkg_id, 'אפיון והקמה', 'יום צילום (5 סרטונים)', 1, 'חד_פעמית', 3),
    (pkg_id, 'אפיון והקמה', 'בניית דף נחיתה', 1, 'חד_פעמית', 4),
    (pkg_id, 'קריאייטיב ותוכן', 'פוסטים חודשיים (סושיאל)', 8, 'חודשית', 5),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול תגובות', 1, 'יומית', 6),
    (pkg_id, 'קריאייטיב ותוכן', 'מאמרי SEO+GEO', 5, 'חודשית', 7),
    (pkg_id, 'קריאייטיב ותוכן', 'בניית קישורים איכותיים', 5, 'חודשית', 8),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול קמפיין ממומן (תקציב עד 20,000 ₪)', 1, 'חודשית', 9),
    (pkg_id, 'עבודה מול הלקוח', 'ליווי מנהל תיק אישי', 1, 'חודשית', 10),
    (pkg_id, 'דוחות ובקרה', 'דוח חודשי', 1, 'חודשית', 11);

  -- ===== ביצועים (ממומן) עצמאי (₪3,500) =====
  -- מה-brief בלבד (project-brief.md סעיף 2), אין PDF ייעודי. רמה אחת, כל הפלטפורמות.
  pkg_id := create_package_version(null, 'ביצועים - ממומן עצמאי', dep_paid, false);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'אפיון והקמה', 'הקמת קמפיינים בכל הפלטפורמות', 1, 'חד_פעמית', 1),
    (pkg_id, 'ניהול ואופטימיזציה', 'ניהול ואופטימיזציית קמפיינים', 1, 'חודשית', 2),
    (pkg_id, 'דוחות ובקרה', 'דוח חודשי ביצועים', 1, 'חודשית', 3);

  -- ===== תוספת: הפקת תוכן בווידאו (₪2,900 ללקוחות סושיאל) =====
  pkg_id := create_package_version(null, 'תוספת - הפקת תוכן בווידאו', dep_video, false);
  insert into package_task_templates (package_definition_id, work_stage, task_name, quantity, frequency, sort_order) values
    (pkg_id, 'קריאייטיב ותוכן', 'הפקת סרטון מוכן לפרסום', 5, 'חודשית', 1);
end $$;

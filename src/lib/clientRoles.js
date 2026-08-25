// חמשת תפקידי הצוות שאפשר לשייך ללקוח (project_manager_id/campaigner_id/social_id/
// seo_id/studio_id, ראו 001_init_schema.sql). מקור יחיד: ClientForm, ClientDetail
// ורשימת הלקוחות כולם מייבאים מכאן, לא מגדירים כל אחד עותק משלו.
export const CLIENT_ROLE_FIELDS = [
  { field: 'project_manager_id', label: 'מנהל פרויקט' },
  { field: 'campaigner_id', label: 'קמפיינר' },
  { field: 'social_id', label: 'Social' },
  { field: 'seo_id', label: 'SEO' },
  { field: 'studio_id', label: 'סטודיו' },
]

export const CLIENT_ROLE_FIELD_NAMES = CLIENT_ROLE_FIELDS.map((r) => r.field)

// שדות ללשונית "היסטוריה" (016): תוויות לכל שדה clients שיכול להופיע בלוג
// השינויים הגנרי, כולל שדות שאינם תפקידים. מקור יחיד, לא לשכפל.
export const CLIENT_FIELD_LABELS = {
  name: 'שם הלקוח',
  ...Object.fromEntries(CLIENT_ROLE_FIELDS.map((r) => [r.field, r.label])),
  retainer_amount: 'סכום ריטיינר',
  media_amount: 'סכום מדיה',
  website: 'אתר',
  contact_email: 'אימייל ליצירת קשר',
  contact_phone: 'טלפון',
  drive_folder_url: 'תיקיית עבודה',
}

export const CLIENT_FINANCIAL_FIELDS = ['retainer_amount', 'media_amount']

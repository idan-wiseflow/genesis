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

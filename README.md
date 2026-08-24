# ג'נסיס · לוח משימות

מערכת ניהול משימות ולקוחות ללקוח ג'נסיס. פאזה 1: שלד, ישויות בסיס, הרשאות, CRUD ידני.

## הרצה מקומית

```
npm install
npm run dev
```

דורש `.env.local` עם `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` (ראה `.env.example`).

## דיפלוי

push ל-`main` מריץ `.github/workflows/deploy.yml`: בילד + rsync ל-Contabo
(`/www/wwwroot/files.wiseflow.co.il/genesis/`).

## תיעוד מלא

- ארכיטקטורה והחלטות טכניות: `B-brain/04-clients/genesis/tech-decisions.md` בריפו wiseflow-system
- מיגרציות ה-DB: `B-brain/04-clients/genesis/_process/migrations/`
- Edge Function ליצירת משתמשים: `B-brain/04-clients/genesis/_process/edge-functions/create-user/`


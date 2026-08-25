// צ'קבוקס + טקסט, שורה אחת. קיים כדי שאף אחד לא יכתוב שוב <label><input
// type="checkbox"/>...</label> ידנית - זה מה שירש בטעות סטיילינג של שדה טקסט
// (.entity-form input/label) ושבר את היישור (עידן, 25.08.2026: "תמצא פתרון
// שמראש יבנה את זה תקין"). כל צ'קבוקס באפליקציה עובר דרך הרכיב הזה.
export default function Checkbox({ checked, onChange, children, disabled }) {
  return (
    <label className="checkbox-label">
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span>{children}</span>
    </label>
  )
}

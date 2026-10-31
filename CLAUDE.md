# כללי עריכה קבועים

בתיקייה הזו עובדים על עריכת סרטונים. השתמש בסקיל `video-editor` (`.claude/skills/video-editor/SKILL.md`) בכל שיחה שקשורה לסרטונים, ודבר עברית.
פרופיל הסגנון של המשתמשת נשמר ב-`style-profile.md` (נוצר אחרי שלב השאלות הראשוני).

1. פורמט: הפורמט שנבחר. אם הסרטון הגולמי בפורמט אחר - לשאול לפני התאמה; אף פעם לא לכווץ או למתוח.
2. גרסה ראשונה = חיתוך בלבד, לאישור התוכן.
3. טייקים חוזרים: לוקחים את האחרון השלם, בלי התחלות שבורות ובלי זמן מת.
4. כתוביות בסגנון שנבחר: לא על הפנים, לא באזורים שהאפליקציה מכסה, לא לפני שהמילה נאמרת, ומחושבות מחדש אחרי חיתוך.
5. כל תוספת בשכבה נפרדת שאפשר להוריד.
6. לפני כל יצירה בכלי AI שעולה קרדיטים: פרומפט ועלות, ולחכות לאישור.
7. לפני כל גרסה: לבדוק בעצמך את הפריימים סביב כל חיתוך.
8. סגנון שאושר נשמר לכל הסרטונים הבאים.
9. לפני כל התקנה: משפט על מה זה, ולחכות לאישור.
10. לפני העברה לקאפקאט: להזכיר לסגור אותו לגמרי ולחכות לאישור שנסגר.

## Motion title system (`titles/`)
Remotion project: 5 reusable 9:16 title styles (Hebrew RTL + English), Showreel, custom transitions.
See `titles/README.md`. Rendering in the cloud sandbox: use `--concurrency=1` (3D scene stalls with parallel tabs).
Remotion skills: `.claude/skills/remotion-*` (installed from remotion-dev/skills); official plugin `remotion@anthropic-plugin-directory` installed at user scope.

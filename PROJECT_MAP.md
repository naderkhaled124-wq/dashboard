# PROJECT_MAP.md

## الملفات
```
.github/workflows/deploy.yml   — CI/CD: ينسخ dashboard.html لـ gh-pages
.gitignore                      — تجاهل المجلدات غير الضرورية
public/dashboard.html           — الداشبورد الرئيسي (SPA كامل)
```

## البنية (dashboard.html)
- **HTML:** 5 خطوات (step1-step5) + شريط الثيمات + شريط الداشبوردات
- **CSS:** ~215 سطر، 5 ثيمات (dark/light/blue/green/purple)، RTL
- **JS:** 91KB، 83 دالة، Plotly + SheetJS + pdf.js + Mammoth

## Flow الخطوات
1. **Step 1 (Upload):** رفع ملف → handleFile → readExcel/readCSV/readJSON/readSQL/readWord/readPDF
2. **Step 2 (Clean):** renderStep2 → عرض إحصائيات الجودة → applyCleanAndNext
3. **Step 3 (Config):** renderColPicker + renderSalesConfigPanel → اختيار الأعمدة والإعدادات → goStep(4)
4. **Step 4 (Results):** runAnalysis → renderResultTabs → renderCurrentTab (5 tabs: فروع/موظفين/ملخص/تنفيذي/رسوم بيانية)
5. **Step 5 (Compare):** renderCompareTab → مقارنة داشبوردتين

## الدوال الرئيسية
| الدالة | الوظيفة |
|--------|---------|
| handleFile | نقطة الدخول لرفع الملف |
| goStep(n) | التنقل بين الخطوات |
| runAnalysis | تشغيل التحليل الكامل |
| calculateSalesScores | حساب درجات المبيعات |
| persistDashboardState | حفظ الحالة في localStorage |
| restoreDashboardState | استعادة الحالة من localStorage |
| setTheme | تبديل الثيم |
| renderResultTabs | عرض تبويبات النتائج |

## التبعيات الخارجية
- Plotly 3.7.0 (CDN)
- Cairo Font (Google Fonts)
- SheetJS (مدمج في dashboard.html)
- pdf.js (مدمج في dashboard.html)
- Mammoth.js (مدمج في dashboard.html)

## النشر
- GitHub Actions ينسخ `public/dashboard.html` → `index.html` على `gh-pages` branch
- URL: https://naderkhaled124-wq.github.io/dashboard/

## Deprecated
- `build-viewer.js` — تم حذفه
- `viewer-template.html` — تم حذفه
- `saveForGitHub()` — تم حذفها
- `_PRELOADED_DATA` — تم حذفها
- `VIEW_MODE / IS_EDIT_MODE / applyViewMode` — تم حذفها
- Server files (controllers, routes, server.js) — تم حذفها

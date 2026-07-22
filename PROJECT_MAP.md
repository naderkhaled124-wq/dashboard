# PROJECT_MAP.md — لوحة التحليل

> آخر تحديث: 2026-07-21

## [TECH_STACK]
| الطبقة | التقنية | الإصدار | ملاحظات |
|---|---|---|---|
| Charts | Plotly.js | 3.7.0 | CDN: plot.ly |
| Excel Parser | SheetJS | 0.20.3 | CDN: cdn.sheetjs.com |
| Word Parser | Mammoth.js | 1.12.0 | CDN: jsdelivr |
| PDF Parser | pdf.js | 4.9.155 | CDN: jsdelivr (ES module) |
| Frontend | Vanilla HTML5/CSS3/ES6+ | - | Self-contained SPA (~1760 lines) |
| UI Language | Arabic (RTL) | - | Cairo font |
| Themes | 5 themes | - | Dark, Light, Blue, Green, Purple |
| Hosting | GitHub Pages | - | Static site, auto-deploy via GitHub Actions |

### مكتبات الـ CDN
- Plotly: `https://cdn.plot.ly/plotly-3.7.0.min.js`
- SheetJS: `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js`
- Mammoth: `https://cdn.jsdelivr.net/npm/mammoth@1.12.0/mammoth.browser.min.js`
- pdf.js: `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.min.mjs`
- Fonts: `https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap`

## [SYSTEM_FLOW]
```
[المستخدم] ─── فتح الرابط (GitHub Pages) ───► [index.html]
    │
    ├── [5-Step Wizard Flow]
    │   ├── الخطوة 1: رفع ملف ──► [FileReader API] ──► [SheetJS/Mammoth/pdf.js]
    │   │       ├── Excel (.xlsx, .xls) → SheetJS
    │   │       ├── CSV → SheetJS
    │   │       ├── JSON → native JSON.parse
    │   │       ├── SQL → custom parser
    │   │       ├── Word (.docx) → Mammoth
    │   │       └── PDF → pdf.js
    │   │
    │   ├── الخطوة 2: تنظيف البيانات ──► [dedup, outliers, empty rows, drop columns]
    │   │       └── Multi-sheet merge support
    │   │
    │   ├── الخطوة 3: إعداد التحليل ──► [column picker + sales config]
    │   │       └── Auto-detect sales columns, weights, targets
    │   │
    │   ├── الخطوة 4: النتائج ──► [Plotly charts + sales scoring + executive summary]
    │   │       ├── ترتيب الفروع (branch ranking)
    │   │       ├── ترتيب الموظفين (employee ranking)
    │   │       ├── ملخص البيانات (data summary)
    │   │       ├── الملخص التنفيذي (executive summary)
    │   │       └── رسوم بيانية (auto-analysis charts)
    │   │
    │   └── الخطوة 5: مقارنة الداشبوردات ──► [schema similarity + KPI delta]
    │
    └── [Multi-Dashboard Tabs] ──► [compare two datasets side-by-side]
```

## [ARCHITECTURE]
```
dashboard/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions → GitHub Pages
├── public/
│   └── index.html                  # Self-contained SPA (~1760 lines)
│                                   # All HTML + CSS + JS embedded
│                                   # Cairo font, RTL Arabic
│                                   # 5 themes: dark/light/blue/green/purple
│                                   # 5-step wizard: upload→clean→config→results→compare
│                                   # Plotly.js charts, SheetJS parsing
│                                   # Sales scoring system
│                                   # Multi-dashboard tabs + comparison
│                                   # localStorage persistence (restores last session)
├── server.js                       # Express (LOCAL development only)
├── package.json                    # Dependencies (LOCAL only)
├── start-dashboard.bat             # Local launcher (LOCAL only)
├── تعليمات_التشغيل.txt             # Local instructions
├── تعليمات_النشر.txt               # Deployment/update instructions
├── .gitignore                      # Excludes node_modules, data, uploads
├── PROJECT_MAP.md                  # This file
└── (Backend files — unused)
    ├── database/db.js
    ├── routes/api.js
    ├── controllers/upload.js, data.js
    ├── middleware/validate.js
    └── utils/parser.js, logger.js
```

## [FEATURES]
| الميزة | الحالة | ملاحظات |
|---|---|---|
| 5 ثيمات (داكن/فاتح/أزرق/أخضر/بنفسجي) | ✅ | Cairo font, theme dots in header |
| Step Wizard (5 خطوات) | ✅ | Upload → Clean → Config → Results → Compare |
| رفع ملفات متعددة | ✅ | Excel, CSV, JSON, SQL, Word, PDF |
| تنظيف البيانات | ✅ | Dedup, outliers (IQR), empty rows, drop columns |
| دمج الشيتات المتعددة | ✅ | Multi-sheet Excel support |
| تحليل المبيعات والتقدير | ✅ | Weighted scoring, branch/employee ranking |
| رسوم بيانية تلقائية | ✅ | Plotly: histogram, scatter, bar, pie, heatmap, boxplot, timeseries |
| الملخص التنفيذي | ✅ | Auto-generated recommendations |
| مقارنة الداشبوردات | ✅ | Schema similarity, KPI delta comparison |
| Multi-Dashboard Tabs | ✅ | Open multiple dashboards, switch between them |
| ترتيب الفروع والموظفين | ✅ | Gold/Silver/Bronze badges, editable names |
| فلترة وترتيب النتائج | ✅ | Branch filter, sort by score/sales/target |
| حفظ الحالة (localStorage) | ✅ | يُعيد فتح آخر نتائج عند التجديد |
| نشر عبر GitHub Pages | ✅ | رابط ثابت دائم، تحديث بـ git push |
| حفظ بأسماء مخصصة | ✅ | prompt لاسم التحليل، تحميل بالاسم المدخل |
| وضع المشاركة (Shared View) | ✅ | إخفاء أزرار التعديل، عرض العنوان في الهيدر |

## [DEPRECATED]
| الميزة | الحالة | السبب |
|---|---|---|
| تصدير HTML مستقل (exportDashboard) | ❌ Deprecated | استُبدل بمشاركة الرابط الثابت |
| buildStandaloneHTML | ❌ Deprecated | جزء من نظام التصدير القديم |
| downloadFile | ❌ Deprecated | جزء من نظام التصدير القديم |
| PWA Install (beforeinstallprompt) | ❌ Removed | استُبدل بـ GitHub Pages — لا حاجة للتثبيت |
| Service Worker | ❌ Removed | غير مطلوب مع GitHub Pages |
| manifest.json | ❌ Removed | غير مطلوب مع GitHub Pages |

## [DEPLOYMENT]
```
النشر عبر GitHub Pages:
  1. git add public/index.html
  2. git commit -m "تحديث الداشبورد"
  3. git push
  → GitHub Actions يُلقّم public/ ويُنشره تلقائياً
  → الرابط يتحدث خلال 1-3 دقائق
```

## [TESTING_LOG]
| الاختبار | النتيجة |
|---|---|
| Server serves index.html (local) | PASS → Status 200 |
| Server MIME type for .mjs | PASS |
| HTML: NO manifest link | PASS |
| HTML: NO theme-color meta | PASS |
| HTML: NO apple mobile web app tags | PASS |
| HTML: NO install button | PASS |
| HTML: NO service worker registration | PASS |
| HTML: NO beforeinstallprompt | PASS |
| HTML: NO installPWA function | PASS |
| HTML: NO appinstalled listener | PASS |
| HTML: NO export button | PASS |
| HTML: NO export functions | PASS |
| HTML: NO file:/// references | PASS |
| HTML: NO localhost references | PASS |
| Regression: All core functions intact | PASS |

## [ORPHANS]
<!-- Backend API routes, controllers, database, and middleware are no longer used
     by the frontend but remain in the project for potential future server-side features.
     Files: database/db.js, routes/api.js, controllers/upload.js, controllers/data.js,
     middleware/validate.js, utils/parser.js -->

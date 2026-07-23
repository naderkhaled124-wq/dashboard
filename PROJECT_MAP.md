# PROJECT_MAP.md — لوحة التحليل

> آخر تحديث: 2026-07-23

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
[المستخدم (محلي)] ─── فتح dashboard.html ───► [محرر كامل]
    │   ├── رفع ملف → تنظيف → إعداد → تحليل → نتائج
    │   ├── حفظ على الرابط → creates _PRELOADED_DATA
    │   └── git push → GitHub Actions يُنشئ Viewer
    │
    └── [5-Step Wizard Flow] (محرر فقط)
        ├── الخطوة 1: رفع ملف ──► [FileReader API] ──► [SheetJS/Mammoth/pdf.js]
        ├── الخطوة 2: تنظيف البيانات ──► [dedup, outliers, empty rows, drop columns]
        ├── الخطوة 3: إعداد التحليل ──► [column picker + sales config]
        ├── الخطوة 4: النتائج ──► [Plotly charts + sales scoring + executive summary]
        └── الخطوة 5: مقارنة الداشبوردات ──► [schema similarity + KPI delta]

[المدير (在线)] ─── فتح الرابط (GitHub Pages) ───► [index.html] (Viewer للقراءة فقط)
    │   ├── عرض النتائج المحفوظة
    │   ├── فلترة وترتيب النتائج
    │   ├── تبديل الثيمات
    │   └── لا يوجد رفع/تعديل/تحليل
```

## [ARCHITECTURE]
```
dashboard/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions → generates viewer → GitHub Pages
├── public/
│   ├── index.html                  # Redirect → dashboard.html (fixes GitHub Pages 404)
│   ├── dashboard.html              # EDITOR — Self-contained SPA (~1760 lines)
│   │                               # All HTML + CSS + JS embedded
│   │                               # Upload, clean, config, analyze, save
│   │                               # No VIEW_MODE — always full editor
│   │                               # localStorage persistence
│   └── viewer-template.html        # VIEWER TEMPLATE — read-only viewer (~59 KB)
│                                   # Same CSS, only display/render functions
│                                   # No upload/clean/config/analyze functions
│                                   # {{DATA_PLACEHOLDER}} for build injection
├── public-viewer/
│   └── index.html                  # GENERATED — viewer with preloaded data (~1.8 MB)
├── build-viewer.js                 # Node.js build script (generates viewer)
│                                   # node build-viewer.js --template (creates template)
│                                   # node build-viewer.js --from-html <file> (generates)
│                                   # node build-viewer.js <state.json> (from JSON)
├── server.js                       # Express (LOCAL development only)
├── start-dashboard.bat             # Local launcher (LOCAL only)
├── .gitignore
├── PROJECT_MAP.md
└── (Backend files — unused)
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
| معمارية منفصلة (محرر + عارض) | ✅ | dashboard.html = مرجر كامل، viewer = عرض فقط |
| ترجمة الواجهة بالكامل للعربية | ✅ | أسماء الشيتات، Outliers→قيم شاذة، Pearson→بيرسون، score→النتيجة، صيغ الملفات |

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
المعمارية الجديدة (محرر + عارض منفصل):
  dashboard.html = محرر كامل (محلي فقط)
  viewer-template.html = قالب العارض
  public-viewer/index.html = العارض المُنشأ (يُنشر على GitHub Pages)

النشر عبر GitHub Pages:
  1. حفظ البيانات في dashboard.html (saveForGitHub)
  2. إنشاء العارض: node build-viewer.js --from-html public/dashboard.html
  3. git add public/dashboard.html public-viewer/
  4. git commit -m "تحديث"
  5. git push
  → GitHub Actions يُنشئ العارض من dashboard.html
  → الرابط يتحدث خلال 1-3 دقائق

  أو يدوياً:
  node build-viewer.js --from-html public/dashboard.html
  → public-viewer/index.html جاهز للنشر

ملاحظات:
  - index.html (الجذر) = العارض للقراءة فقط
  - dashboard.html = المحرر الكامل
  - لا يوجد VIEW_MODE — كل ملف وظيفته واضحة
  - شجرة subtree split تُعطل ترميز UTF-8 — يجب استخدام Node.js للتعديل
```

## [TESTING_LOG]
| الاختبار | النتيجة |
|---|---|
| Server serves dashboard.html (local) | PASS → Status 200 |
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
| GitHub Pages 404 root URL | PASS → viewer loads correctly |
| UTF-8 encoding on gh-pages | PASS → correct Arabic rendering |
| dashboard.html: NO IS_EDIT_MODE | PASS (0 references) |
| dashboard.html: NO applyViewMode | PASS (0 references) |
| dashboard.html: NO Object.freeze | PASS (0 references) |
| viewer-template.html: NO upload functions | PASS |
| viewer-template.html: has render functions | PASS |
| build-viewer.js generates correct output | PASS (1.84 MB) |
| Regression: All editor functions intact (49/49) | PASS |
| Regression: All viewer render functions | PASS |

## [ORPHANS]
<!-- Backend API routes, controllers, database, and middleware are no longer used
     by the frontend but remain in the project for potential future server-side features.
     Files: database/db.js, routes/api.js, controllers/upload.js, controllers/data.js,
     middleware/validate.js, utils/parser.js -->

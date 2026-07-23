#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'public', 'dashboard.html');
const BACKUP = path.join(__dirname, 'public', 'dashboard.html.bak');

console.log('Reading dashboard.html...');
let src = fs.readFileSync(SRC, 'utf8');
const originalLen = src.length;
console.log('Original size: ' + (originalLen / 1024 / 1024).toFixed(2) + ' MB');
console.log('Line endings: ' + (src.indexOf('\r\n') >= 0 ? 'CRLF' : 'LF'));

fs.writeFileSync(BACKUP, src, 'utf8');
console.log('Backup created: dashboard.html.bak');

let changes = 0;

function repl(pattern, replacement, label) {
  if (typeof pattern === 'string') {
    if (src.indexOf(pattern) === -1) {
      console.warn('SKIP: ' + label + ' (not found)');
      return;
    }
    src = src.replace(pattern, replacement);
  } else {
    if (!pattern.test(src)) {
      console.warn('SKIP: ' + label + ' (regex not matched)');
      return;
    }
    src = src.replace(pattern, replacement);
  }
  changes++;
  console.log('OK: ' + label);
}

// Use \r?\n for line endings throughout
const NL = /\r?\n/;

// 1. Remove VIEW_MODE and IS_EDIT_MODE declarations (2 lines)
repl(
  /var VIEW_MODE=\(function\(\)\{var il=location\.hostname==='localhost'\|\|location\.hostname==='127\.0\.0\.1'\|\|location\.hostname==='::1'\|\|location\.protocol==='file:';return il\?'edit':'view'\}\)\(\);\r?\nvar IS_EDIT_MODE=VIEW_MODE==='edit';/,
  '// VIEW_MODE removed — editor-only mode',
  'Remove VIEW_MODE + IS_EDIT_MODE declarations'
);

// 2. Remove applyViewMode function entirely (from "function applyViewMode" to closing brace)
repl(
  /\r?\nfunction applyViewMode\(\)\{[\s\S]*?\}\r?\n/,
  '\n',
  'Remove applyViewMode function'
);

// 3. Remove applyViewMode() call
repl(
  /  applyViewMode\(\);\r?\n/,
  '',
  'Remove applyViewMode() call'
);

// 4. Remove IS_EDIT_MODE guard in saveDashState
repl(
  /if\(!IS_EDIT_MODE\)return;\r?\n  if\(currentDashIdx<0/,
  'if(currentDashIdx<0',
  'Remove IS_EDIT_MODE guard in saveDashState'
);

// 5. Remove IS_EDIT_MODE guard in switchDashboard
repl(
  /if\(!IS_EDIT_MODE&&idx!==currentDashIdx&&DASHBOARDS\.length<=1\)return;\r?\n  if\(idx===currentDashIdx\)return;/,
  'if(idx===currentDashIdx)return;',
  'Remove IS_EDIT_MODE guard in switchDashboard'
);

// 6. Remove IS_EDIT_MODE guard in startNewDashboard
repl(
  /function startNewDashboard\(\)\{\r?\n  if\(!IS_EDIT_MODE\)return;/,
  'function startNewDashboard(){',
  'Remove IS_EDIT_MODE guard in startNewDashboard'
);

// 7. Remove IS_EDIT_MODE guard in removeDashboard
repl(
  /function removeDashboard\(idx\)\{\r?\n  if\(!IS_EDIT_MODE\)return;/,
  'function removeDashboard(idx){',
  'Remove IS_EDIT_MODE guard in removeDashboard'
);

// 8. In renderDashTabs: simplify close-dash condition
repl(
  'if(IS_EDIT_MODE&&DASHBOARDS.length>1)',
  'if(DASHBOARDS.length>1)',
  'Simplify close-dash in renderDashTabs'
);

// 9. In renderDashTabs: remove IS_EDIT_MODE check for add button
repl(
  /if\(IS_EDIT_MODE\)html\+='<div class="dash-tab-add"/,
  "html+='<div class=\"dash-tab-add\"",
  'Always show add button in renderDashTabs'
);

// 10. Remove IS_EDIT_MODE guard in persistDashboardState
repl(
  /function persistDashboardState\(\)\{\r?\n  if\(!IS_EDIT_MODE\)return;/,
  'function persistDashboardState(){',
  'Remove IS_EDIT_MODE guard in persistDashboardState'
);

// 11. Remove IS_EDIT_MODE check in restoreDashboardState
repl(
  /if\(IS_EDIT_MODE\)return false;\r?\n    var preload/,
  'var preload',
  'Remove IS_EDIT_MODE guard in restoreDashboardState'
);

// 12. Remove IS_EDIT_MODE in setTimeout: change "else if(IS_EDIT_MODE){\r\n    goStep(1);\r\n  }" to nothing
repl(
  /\}else if\(IS_EDIT_MODE\)\{\r?\n    goStep\(1\);\r?\n  \}/,
  '}',
  'Remove IS_EDIT_MODE fallback in init setTimeout'
);

// 13. In goStep: remove IS_EDIT_MODE guard
repl(
  /if\(!IS_EDIT_MODE&&n!==4&&n!==5\)return;\r?\n/,
  '',
  'Remove IS_EDIT_MODE guard in goStep'
);

// 14. In drag handler: remove IS_EDIT_MODE check
repl(
  'if(IS_EDIT_MODE&&e.dataTransfer.files[0])',
  'if(e.dataTransfer.files[0])',
  'Remove IS_EDIT_MODE in drag handler'
);

// 15. In handleFile: remove IS_EDIT_MODE guard
repl(
  /function handleFile\(e\)\{if\(!IS_EDIT_MODE\)return;/,
  'function handleFile(e){',
  'Remove IS_EDIT_MODE guard in handleFile'
);

// 16. In applyCleanAndNext: remove IS_EDIT_MODE guard
repl(
  /function applyCleanAndNext\(\)\{\r?\n  if\(!IS_EDIT_MODE\)return;/,
  'function applyCleanAndNext(){',
  'Remove IS_EDIT_MODE guard in applyCleanAndNext'
);

// 17. In editRankingName: remove IS_EDIT_MODE guard
repl(
  /function editRankingName\(type,idx,el\)\{\r?\n  if\(!IS_EDIT_MODE\)return;/,
  'function editRankingName(type,idx,el){',
  'Remove IS_EDIT_MODE guard in editRankingName'
);

// 18. In renderSalesBranchTab: remove IS_EDIT_MODE guard
repl(
  /branchRankings\.length===0\)\{if\(!IS_EDIT_MODE\)return;/,
  'branchRankings.length===0){',
  'Remove IS_EDIT_MODE guard in renderSalesBranchTab'
);

// 19. In renderSalesEmployeeTab: remove IS_EDIT_MODE guard
repl(
  /employeeRankings\.length===0\)\{if\(!IS_EDIT_MODE\)return;/,
  'employeeRankings.length===0){',
  'Remove IS_EDIT_MODE guard in renderSalesEmployeeTab'
);

// 20. In renderSalesExecutiveTab: remove IS_EDIT_MODE guard
repl(
  /if\(!salesScores\)\{if\(!IS_EDIT_MODE\)return;/,
  'if(!salesScores){',
  'Remove IS_EDIT_MODE guard in renderSalesExecutiveTab'
);

// 21. In renderCurrentTab: remove IS_EDIT_MODE compound guard
repl(
  /if\(!IS_EDIT_MODE&&\(!RESULTS\|\|\(!RESULTS\.salesScores&&!RESULTS\.analyses\)\)\)return;/,
  'if(!RESULTS||(!RESULTS.salesScores&&!RESULTS.analyses))return;',
  'Simplify renderCurrentTab guard'
);

// 22. In renderCompareTab: remove IS_EDIT_MODE guard
repl(
  /if\(DASHBOARDS\.length<2\)\{if\(!IS_EDIT_MODE\)return;/,
  'if(DASHBOARDS.length<2){',
  'Remove IS_EDIT_MODE guard in renderCompareTab'
);

// 23. In renderSummaryTab: remove IS_EDIT_MODE guard
repl(
  /if\(!ot\)\{if\(!IS_EDIT_MODE\)return;/,
  'if(!ot){',
  'Remove IS_EDIT_MODE guard in renderSummaryTab'
);

// 24. In saveForGitHub: remove IS_EDIT_MODE guard
repl(
  /function saveForGitHub\(\)\{\r?\n  if\(!IS_EDIT_MODE\)return;/,
  'function saveForGitHub(){',
  'Remove IS_EDIT_MODE guard in saveForGitHub'
);

// Write the result
fs.writeFileSync(SRC, src, 'utf8');
console.log('\nDone! ' + changes + ' replacements applied.');
console.log('New size: ' + (src.length / 1024 / 1024).toFixed(2) + ' MB');

// Verify
const isEditCount = (src.match(/IS_EDIT_MODE/g) || []).length;
const viewModeCount = (src.match(/VIEW_MODE/g) || []).length;
const applyViewModeCount = (src.match(/applyViewMode/g) || []).length;
const objectFreezeCount = (src.match(/Object\.freeze/g) || []).length;

console.log('\nVerification:');
console.log('  IS_EDIT_MODE: ' + isEditCount);
console.log('  VIEW_MODE: ' + viewModeCount);
console.log('  applyViewMode: ' + applyViewModeCount);
console.log('  Object.freeze: ' + objectFreezeCount);

if (isEditCount === 0 && viewModeCount === 0 && applyViewModeCount === 0 && objectFreezeCount === 0) {
  console.log('\nAll clean!');
} else {
  console.log('\nSome references remain — listing:');
  if (isEditCount > 0) {
    let idx = 0;
    while ((idx = src.indexOf('IS_EDIT_MODE', idx)) !== -1) {
      const lineStart = src.lastIndexOf('\n', idx) + 1;
      const lineEnd = src.indexOf('\n', idx);
      const line = src.substring(lineStart, lineEnd >= 0 ? lineEnd : lineStart + 120);
      console.log('  IS_EDIT_MODE at offset ' + idx + ': ' + line.trim().substring(0, 100));
      idx += 12;
    }
  }
  if (viewModeCount > 0) {
    let idx = 0;
    while ((idx = src.indexOf('VIEW_MODE', idx)) !== -1) {
      const lineStart = src.lastIndexOf('\n', idx) + 1;
      const lineEnd = src.indexOf('\n', idx);
      const line = src.substring(lineStart, lineEnd >= 0 ? lineEnd : lineStart + 120);
      console.log('  VIEW_MODE at offset ' + idx + ': ' + line.trim().substring(0, 100));
      idx += 9;
    }
  }
  if (applyViewModeCount > 0) {
    let idx = 0;
    while ((idx = src.indexOf('applyViewMode', idx)) !== -1) {
      const lineStart = src.lastIndexOf('\n', idx) + 1;
      const lineEnd = src.indexOf('\n', idx);
      const line = src.substring(lineStart, lineEnd >= 0 ? lineEnd : lineStart + 120);
      console.log('  applyViewMode at offset ' + idx + ': ' + line.trim().substring(0, 100));
      idx += 13;
    }
  }
}

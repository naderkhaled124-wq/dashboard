#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const TEMPLATE = path.join(__dirname, 'public', 'viewer-template.html');
const OUT_DIR = path.join(__dirname, 'public-viewer');
const OUT_FILE = path.join(OUT_DIR, 'index.html');

function usage() {
  console.log('Usage:');
  console.log('  node build-viewer.js <state.json>          Generate public-viewer/index.html from JSON state');
  console.log('  node build-viewer.js --from-html <file>    Extract state from a preloaded dashboard HTML file');
  console.log('  node build-viewer.js --template            (Re)generate viewer-template.html from dashboard.html');
  process.exit(1);
}

function buildFromState(stateFile) {
  if (!fs.existsSync(TEMPLATE)) {
    console.error('Error: viewer-template.html not found. Run with --template first.');
    process.exit(1);
  }
  let raw;
  try {
    raw = fs.readFileSync(stateFile, 'utf8');
  } catch (e) {
    console.error('Error reading state file:', e.message);
    process.exit(1);
  }
  let state;
  try {
    state = JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing JSON:', e.message);
    process.exit(1);
  }
  generate(state);
}

function buildFromHtml(htmlFile) {
  if (!fs.existsSync(TEMPLATE)) {
    console.error('Error: viewer-template.html not found. Run with --template first.');
    process.exit(1);
  }
  let html;
  try {
    html = fs.readFileSync(htmlFile, 'utf8');
  } catch (e) {
    console.error('Error reading HTML file:', e.message);
    process.exit(1);
  }
  const match = html.match(/window\._PRELOADED_DATA\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/);
  if (!match) {
    console.error('Error: Could not find _PRELOADED_DATA in the HTML file.');
    process.exit(1);
  }
  let state;
  try {
    state = JSON.parse(match[1]);
  } catch (e) {
    console.error('Error parsing embedded state JSON:', e.message);
    process.exit(1);
  }
  generate(state);
}

function generate(state) {
  let template = fs.readFileSync(TEMPLATE, 'utf8');
  const stateJson = JSON.stringify(state);
  const title = state.dashboardTitle || 'تحليل البيانات';

  let output = template.replace(/\{\{DATA_PLACEHOLDER\}\}/g, stateJson);
  output = output.replace(/\{\{DASHBOARD_TITLE\}\}/g, escapeHtml(title));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, output, 'utf8');
  console.log('Generated: ' + OUT_FILE);
  console.log('Size: ' + (output.length / 1024 / 1024).toFixed(2) + ' MB');
  console.log('Title: ' + title);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createTemplate() {
  const srcFile = path.join(__dirname, 'public', 'dashboard.html');
  if (!fs.existsSync(srcFile)) {
    console.error('Error: public/dashboard.html not found.');
    process.exit(1);
  }
  console.log('Reading dashboard.html...');
  const src = fs.readFileSync(srcFile, 'utf8');

  const cssMatch = src.match(/<style>([\s\S]*?)<\/style>/);
  if (!cssMatch) {
    console.error('Error: Could not extract CSS from dashboard.html');
    process.exit(1);
  }
  const css = cssMatch[1];
  console.log('Extracted CSS: ' + css.length + ' chars');

  const template = buildTemplate(css);
  fs.writeFileSync(TEMPLATE, template, 'utf8');
  console.log('Created: ' + TEMPLATE);
  console.log('Size: ' + (template.length / 1024).toFixed(1) + ' KB');
}

function buildTemplate(css) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{DASHBOARD_TITLE}} — تحليل البيانات</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
<script src="https://cdn.plot.ly/plotly-3.7.0.min.js"></script>
<style>
${css}
</style>
<style>
.upload-zone,.clean-config,#step1,#step2,#step3,.btns,.step-dot-wrap{display:none!important}
.step-dot[data-step="1"],.step-dot[data-step="2"],.step-dot[data-step="3"]{display:none!important}
.step-line{display:none!important}
</style>
</head>
<body>
<div class="header">
  <h1>لوحة التحليل — {{DASHBOARD_TITLE}}</h1>
  <div class="theme-picker">
    <div class="theme-dot" data-theme="dark" onclick="setTheme('dark')"></div>
    <div class="theme-dot" data-theme="light" onclick="setTheme('light')"></div>
    <div class="theme-dot" data-theme="blue" onclick="setTheme('blue')"></div>
    <div class="theme-dot" data-theme="green" onclick="setTheme('green')"></div>
    <div class="theme-dot" data-theme="purple" onclick="setTheme('purple')"></div>
  </div>
</div>
<div id="dashBar" class="dash-bar"></div>
<div id="stepsBar" class="steps-bar"></div>

<div class="step" id="step4">
  <div class="result-nav" id="resultNav"></div>
  <div id="resultArea" class="result-area"></div>
</div>

<div class="step" id="step5">
  <div id="compareContent" class="result-area"></div>
</div>

<script>
var SHEETS=null,COL_MAP={},CONFIG={metrics:{},groupBy:null,manualAnalyses:[],salesConfig:null,visibleCols:null,_sheetEnabled:null,_sheetDropCols:null,_activeSheetTab:null},RESULTS={};
var DASHBOARDS=[],currentDashIdx=-1,activeTab=null,CLEAN_OPTIONS={dropEmptyRows:false,dropDuplicates:false,removeOutliers:false,dropColumns:[],cleanedRows:null};

window._PRELOADED_DATA={{DATA_PLACEHOLDER}};

window.onerror=function(msg,src,line,col,err){
  if(src&&(src.indexOf('cdn.plot.ly')>=0||src.indexOf('fonts.googleapis.com')>=0)){
    console.warn('CDN load error:',msg,src);return true;
  }
  console.error('Error:',msg,src,line,col,err);
};
window.addEventListener('unhandledrejection',function(e){
  console.warn('Unhandled promise rejection:',e.reason);
});

function getThemeChartConf(){
  var t=document.documentElement.getAttribute('data-theme')||'dark';
  var base={paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',margin:{t:30,b:60,l:60,r:30},xaxis:{gridcolor:'rgba(255,255,255,0.05)',zerolinecolor:'rgba(255,255,255,0.1)'},yaxis:{gridcolor:'rgba(255,255,255,0.05)',zerolinecolor:'rgba(255,255,255,0.1)'},colorway:['#e94560','#0f3460','#00b894','#fdcb6e','#6c5ce7','#00cec9','#ff7675','#74b9ff','#a29bfe','#55efc4']};
  if(t==='dark'){base.font={family:'Cairo',color:'#e0e0e0',size:12,direction:'rtl'};return base}
  if(t==='light'){base.font={family:'Cairo',color:'#334155',size:12,direction:'rtl'};base.plot_bgcolor='rgba(0,0,0,0)';base.xaxis={...base.xaxis,gridcolor:'#e2e8f0',zerolinecolor:'#cbd5e1'};base.yaxis={...base.yaxis,gridcolor:'#e2e8f0',zerolinecolor:'#cbd5e1'};base.colorway=['#dc2626','#2563eb','#16a34a','#ca8a04','#7c3aed','#0891b2','#e11d48','#0284c7','#6366f1','#059669'];return base}
  if(t==='blue'){base.font={family:'Cairo',color:'#e3f2fd',size:12,direction:'rtl'};base.xaxis={...base.xaxis,gridcolor:'rgba(66,165,245,0.1)',zerolinecolor:'rgba(66,165,245,0.15)'};base.yaxis={...base.yaxis,gridcolor:'rgba(66,165,245,0.1)',zerolinecolor:'rgba(66,165,245,0.15)'};base.colorway=['#42a5f5','#1565c0','#66bb6a','#ffca28','#7e57c2','#00acc1','#ef5350','#29b6f6','#ab47bc','#26a69a'];return base}
  if(t==='green'){base.font={family:'Cairo',color:'#e8f5e9',size:12,direction:'rtl'};base.xaxis={...base.xaxis,gridcolor:'rgba(76,175,80,0.1)',zerolinecolor:'rgba(76,175,80,0.15)'};base.yaxis={...base.yaxis,gridcolor:'rgba(76,175,80,0.1)',zerolinecolor:'rgba(76,175,80,0.15)'};base.colorway=['#4caf50','#2e7d32','#00e676','#ffca28','#66bb6a','#00bcd4','#8bc34a','#aed581','#ff8a65','#4db6ac'];return base}
  if(t==='purple'){base.font={family:'Cairo',color:'#f3e5f5',size:12,direction:'rtl'};base.xaxis={...base.xaxis,gridcolor:'rgba(186,104,200,0.1)',zerolinecolor:'rgba(186,104,200,0.15)'};base.yaxis={...base.yaxis,gridcolor:'rgba(186,104,200,0.1)',zerolinecolor:'rgba(186,104,200,0.15)'};base.colorway=['#e040fb','#7b1fa2','#69f0ae','#ffd740','#ba68c8','#00bcd4','#ef5350','#7c4dff','#ce93d8','#4dd0e1'];return base}
  return base;
}
function setTheme(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem('dashboard_theme',t);document.querySelectorAll('.theme-dot').forEach(function(d){d.classList.toggle('active',d.getAttribute('data-theme')===t)});if(RESULTS&&RESULTS.analyses&&Object.keys(RESULTS.analyses).length)renderCurrentTab()}
(function(){var t=localStorage.getItem('dashboard_theme');if(t)setTheme(t)})();
function getTheme(){return document.documentElement.getAttribute('data-theme')||'dark'}
function fmt(n){return typeof n==='number'?n.toLocaleString('en-US'):n}

function findCol(cols,kws){for(var i=0;i<kws.length;i++)for(var j=0;j<cols.length;j++)if(cols[j].toLowerCase().indexOf(kws[i].toLowerCase())>=0)return cols[j];return null}
function uniqueValues(rows,col){var m={};rows.forEach(function(r){var v=r[col];if(v!==''&&v!==null&&v!==undefined)m[v]=1});return Object.keys(m)}
function numericValues(rows,col){return rows.map(function(r){return parseFloat(r[col])}).filter(function(v){return!isNaN(v)})}
function colEmptyPercent(rows,col){var total=rows.length;if(!total)return 0;var empty=rows.filter(function(r){return r[col]===''||r[col]===null||r[col]===undefined}).length;return Math.round(empty/total*100)}
function detectType(rows,col){
  var vals=rows.slice(0,200).map(function(r){return r[col]}).filter(function(v){return v!==''&&v!==null&&v!==undefined});
  if(!vals.length)return'text';
  var numCount=vals.filter(function(v){return!isNaN(parseFloat(v))&&isFinite(v)}).length;
  if(numCount>vals.length*0.7)return'number';
  var dateCount=vals.filter(function(v){return isDateString(String(v))}).length;
  if(dateCount>vals.length*0.7)return'date';
  return'text';
}
function isDateString(s){
  if(/^\\d{4}[-\\/]\\d{1,2}[-\\/]\\d{1,2}/.test(s))return true;
  if(/^\\d{1,2}[-\\/]\\d{1,2}[-\\/]\\d{4}/.test(s))return true;
  return false;
}
function calcStats(vals){
  if(!vals.length)return{min:0,max:0,mean:0,median:0,std:0,count:0};
  var sorted=vals.slice().sort(function(a,b){return a-b});
  var sum=vals.reduce(function(s,v){return s+v},0);
  var mean=sum/vals.length;
  var median=vals.length%2===0?(sorted[vals.length/2-1]+sorted[vals.length/2])/2:sorted[Math.floor(vals.length/2)];
  var variance=vals.reduce(function(s,v){return s+(v-mean)*(v-mean)},0)/vals.length;
  return{min:sorted[0],max:sorted[sorted.length-1],mean:Math.round(mean*100)/100,median:Math.round(median*100)/100,std:Math.round(Math.sqrt(variance)*100)/100,count:vals.length};
}

function restoreDashboardState(){
  try{
    var preload=window._PRELOADED_DATA||null;
    if(!preload)return false;
    COL_MAP=preload.colMap||{};
    CONFIG=preload.config||CONFIG;
    RESULTS=preload.results||{};
    CLEAN_OPTIONS=preload.cleanOptions||CLEAN_OPTIONS;
    DASHBOARDS=preload.dashboards||[];
    currentDashIdx=DASHBOARDS.length>0?0:-1;
    return true;
  }catch(e){console.warn('Could not restore dashboard state:',e.message);return false}
}

function renderDashTabs(){
  var bar=document.getElementById('dashBar');
  if(DASHBOARDS.length<=1){bar.style.display='none';return}
  bar.style.display='flex';
  var html='';
  DASHBOARDS.forEach(function(d,i){
    var active=i===currentDashIdx?' active':'';
    html+='<div class="dash-tab-item'+active+'" onclick="switchDashboard('+i+')">داشبورد '+(i+1)+'</div>';
  });
  bar.innerHTML=html;
}
function switchDashboard(idx){
  if(idx===currentDashIdx)return;
  currentDashIdx=idx;
  var d=DASHBOARDS[idx];
  if(d.results){RESULTS=d.results}
  renderDashTabs();
  renderResultTabs();
}

function doScoreCalc(mk,currentVal,label,elId){
  var target=prompt('ادخل المتوسط المطلوب لـ '+label+':');
  if(target===null||target==='')return;
  target=parseFloat(target);if(isNaN(target)||target<=0){alert('ادخل رقم صحيح اكبر من صفر');return}
  var pct=Math.round(currentVal/target*10000)/100;
  var cls=pct>=100?'high':pct>=70?'mid':'low';
  var el=document.getElementById(elId);if(!el)return;
  el.innerHTML='<span class="score-result '+cls+'" style="background:'+(cls==='high'?'rgba(0,184,148,0.15)':cls==='mid'?'rgba(253,203,110,0.15)':'rgba(233,69,96,0.15)')+'">'+pct+'% من الهدف</span>';
}
function calcBranchTargetPct(b,salesScores){
  var totalW=0,totalWeightedPct=0;
  salesScores.metricKeys.forEach(function(mk){
    var w=(salesScores.config.weights[mk]||0)/100;
    var avgVal=b.count>0?(b.scores.reduce(function(s,sc){return s+(sc.rawAverages[mk]||0)},0)/b.count):0;
    var tgt=salesScores.targets[mk]||1;
    var pct=avgVal/tgt*100;
    totalWeightedPct+=pct*w;totalW+=w;
  });
  return totalW>0?Math.round(totalWeightedPct/totalW*100)/100:0;
}
function getBranchSortVal(b,metric,salesScores){
  if(metric==='score')return b.avgScore;
  if(metric==='totalSales')return b.totalSales||0;
  if(metric==='targetPct')return b._targetPct||0;
  if(metric==='count')return b.count||0;
  var avgVal=b.count>0?(b.scores.reduce(function(s,sc){return s+(sc.rawAverages[metric]||0)},0)/b.count):0;
  return avgVal;
}
function renderSalesBranchTab(salesScores){
  var c=document.getElementById('resultArea');
  if(!salesScores||!salesScores.branchRankings||salesScores.branchRankings.length===0){c.innerHTML='<div class="box"><h3>لا توجد بيانات فروع كافية</h3></div>';return}
  var br=salesScores.branchRankings.slice();
  br.forEach(function(b){b._targetPct=calcBranchTargetPct(b,salesScores)});
  var sortKey=window._branchSortMetric||'score';
  var sortDesc=window._branchSortDesc!==false;
  br.sort(function(a,b){var va=getBranchSortVal(a,sortKey,salesScores),vb=getBranchSortVal(b,sortKey,salesScores);return sortDesc?vb-va:va-vb});
  br.forEach(function(b,i){b._dRank=i+1});
  var html='<div class="box"><h3>🏆 ترتيب الفروع</h3>';
  html+='<div class="filter-bar"><label>ترتيب حسب:</label><select id="branchSortSelect" onchange="window._branchSortMetric=this.value;renderSalesBranchTab(RESULTS.salesScores)">';
  html+='<option value="score"'+(sortKey==='score'?' selected':'')+'>النتيجة النهائية</option>';
  html+='<option value="totalSales"'+(sortKey==='totalSales'?' selected':'')+'>اجمالي المبيعات</option>';
  html+='<option value="targetPct"'+(sortKey==='targetPct'?' selected':'')+'>نسبة تحقيق التارجت</option>';
  html+='<option value="count"'+(sortKey==='count'?' selected':'')+'>عدد الموظفين</option>';
  salesScores.metricKeys.forEach(function(mk){html+='<option value="'+mk+'"'+(sortKey===mk?' selected':'')+'>'+salesScores.config.metrics[mk].label+' (متوسط)</option>'});
  html+='</select></div></div>';
  var sortLabel=sortKey==='score'?'النتيجة النهائية':sortKey==='totalSales'?'اجمالي المبيعات':sortKey==='targetPct'?'نسبة تحقيق التارجت':sortKey==='count'?'عدد الموظفين':(salesScores.config.metrics[sortKey]?salesScores.config.metrics[sortKey].label+' (متوسط)':'');
  html+='<div class="box"><h3>🏆 ترتيب الفروع — '+sortLabel+'</h3>';
  html+='<div class="table-scroll"><table><thead><tr><th>#</th><th>الفرع</th>';
  salesScores.metricKeys.forEach(function(mk){html+='<th>'+salesScores.config.metrics[mk].label+'</th>'});
  html+='<th>اجمالي المبيعات</th><th>نسبة التارجت</th><th>النتيجة النهائية</th></tr></thead><tbody>';
  br.forEach(function(b,bi){
    var origIdx=salesScores.branchRankings.indexOf(b);
    var rankCls=b._dRank===1?'gold':b._dRank===2?'silver':b._dRank===3?'bronze':'normal';
    html+='<tr><td><span class="rank-badge '+rankCls+'">'+b._dRank+'</span></td><td><strong>'+b.branch+'</strong></td>';
    salesScores.metricKeys.forEach(function(mk){
      var avgVal=b.count>0?Math.round(b.scores.reduce(function(s,sc){return s+(sc.rawAverages[mk]||0)},0)/b.count*100)/100:0;
      var tgt=salesScores.targets[mk]||1;
      var pct=Math.round(avgVal/tgt*10000)/100;
      var cls=pct>=100?'high':pct>=70?'mid':'low';
      html+='<td>'+fmt(avgVal)+'<span class="score-pct '+cls+'">'+pct+'%</span></td>';
    });
    html+='<td style="font-weight:900">'+fmt(b.totalSales||0)+'</td>';
    var tPct=b._targetPct||0;var tCls=tPct>=100?'high':tPct>=70?'mid':'low';
    html+='<td><span class="score-pct '+tCls+'" style="font-size:14px">'+tPct+'%</span></td>';
    html+='<td style="font-weight:900;color:var(--hl)">'+fmt(b.avgScore)+'</td></tr>';
  });
  html+='</tbody></table></div></div>';
  html+='<div class="box"><h3>📊 مقارنة الفروع — '+sortLabel+'</h3><div id="branchCompareChart" style="height:400px"></div></div>';
  c.innerHTML=html;
  setTimeout(function(){
    var DC=getThemeChartConf();
    var labels=br.map(function(b){return b.branch});
    var vals=br.map(function(b){return getBranchSortVal(b,sortKey,salesScores)});
    try{Plotly.newPlot('branchCompareChart',[{x:labels,y:vals,type:'bar',marker:{color:vals.map(function(_,i){return DC.colorway[i%DC.colorway.length]})},textposition:'outside',text:vals.map(function(v){return typeof v==='number'?v.toFixed(1):v})}],{...DC,yaxis:{...DC.yaxis,title:sortLabel},margin:{t:30,b:80,l:60,r:30}},{responsive:true})}catch(e){}
  },150);
}
function calcEmpTargetPct(e,salesScores){
  var totalW=0,totalWeightedPct=0;
  salesScores.metricKeys.forEach(function(mk){
    var w=(salesScores.config.weights[mk]||0)/100;
    var val=e.rawAverages[mk]||0;
    var tgt=salesScores.targets[mk]||1;
    totalWeightedPct+=(val/tgt*100)*w;totalW+=w;
  });
  return totalW>0?Math.round(totalWeightedPct/totalW*100)/100:0;
}
function getEmpSortVal(e,metric,salesScores){
  if(metric==='score')return e.weightedScore;
  if(metric==='totalSales')return e.rawTotals.amount||0;
  if(metric==='targetPct')return e._targetPct||0;
  return e.rawAverages[metric]||0;
}
function renderSalesEmployeeTab(salesScores){
  var c=document.getElementById('resultArea');
  if(!salesScores||!salesScores.employeeRankings||salesScores.employeeRankings.length===0){c.innerHTML='<div class="box"><h3>لا توجد بيانات موظفين كافية</h3></div>';return}
  var er=salesScores.employeeRankings;
  er.forEach(function(e){e._targetPct=calcEmpTargetPct(e,salesScores)});
  var branches=['الكل'];
  er.forEach(function(e){if(branches.indexOf(e.branch)<0)branches.push(e.branch)});
  var selectedBranch=window._empBranchFilter||'الكل';
  var filtered=selectedBranch==='الكل'?er.slice():er.filter(function(e){return e.branch===selectedBranch}).slice();
  var sortKey=window._empSortMetric||'score';
  filtered.sort(function(a,b){return getEmpSortVal(b,sortKey,salesScores)-getEmpSortVal(a,sortKey,salesScores)});
  filtered.forEach(function(e,i){e._dRank=i+1});
  var html='<div class="box"><div class="filter-bar">';
  html+='<label>فلتر الفرع:</label><select onchange="window._empBranchFilter=this.value;renderSalesEmployeeTab(RESULTS.salesScores)">';
  branches.forEach(function(b){html+='<option value="'+b+'"'+(b===selectedBranch?' selected':'')+'>'+b+'</option>'});
  html+='</select>';
  html+='<label style="margin-right:12px">ترتيب حسب:</label><select onchange="window._empSortMetric=this.value;renderSalesEmployeeTab(RESULTS.salesScores)">';
  html+='<option value="score"'+(sortKey==='score'?' selected':'')+'>النتيجة النهائية</option>';
  html+='<option value="totalSales"'+(sortKey==='totalSales'?' selected':'')+'>اجمالي المبيعات</option>';
  html+='<option value="targetPct"'+(sortKey==='targetPct'?' selected':'')+'>نسبة تحقيق التارجت</option>';
  salesScores.metricKeys.forEach(function(mk){html+='<option value="'+mk+'"'+(sortKey===mk?' selected':'')+'>'+salesScores.config.metrics[mk].label+' (متوسط)</option>'});
  html+='</select>';
  html+='<span style="color:var(--mut);font-size:13px">'+filtered.length+' موظف</span></div></div>';
  var sortLabel=sortKey==='score'?'النتيجة النهائية':sortKey==='totalSales'?'اجمالي المبيعات':sortKey==='targetPct'?'نسبة تحقيق التارجت':(salesScores.config.metrics[sortKey]?salesScores.config.metrics[sortKey].label+' (متوسط)':'');
  html+='<div class="box"><h3>🏆 ترتيب الموظفين — '+sortLabel+'</h3>';
  html+='<div class="table-scroll"><table><thead><tr><th>#</th><th>الموظف</th><th>الفرع</th>';
  salesScores.metricKeys.forEach(function(mk){html+='<th>'+salesScores.config.metrics[mk].label+'</th>'});
  html+='<th>اجمالي المبيعات</th><th>نسبة التارجت</th><th>النتيجة النهائية</th></tr></thead><tbody>';
  filtered.forEach(function(e,i){
    var origIdx=er.indexOf(e);
    var rankCls=(i===0?'gold':i===1?'silver':i===2?'bronze':'normal');
    html+='<tr><td><span class="rank-badge '+rankCls+'">'+(i+1)+'</span></td><td><strong>'+e.employee+'</strong></td><td>'+e.branch+'</td>';
    salesScores.metricKeys.forEach(function(mk){
      var val=e.rawAverages[mk]||0;
      var tgt=salesScores.targets[mk]||1;
      var pct=Math.round(val/tgt*10000)/100;
      var cls=pct>=100?'high':pct>=70?'mid':'low';
      html+='<td>'+fmt(val)+'<span class="score-pct '+cls+'">'+pct+'%</span></td>';
    });
    html+='<td style="font-weight:900">'+fmt(e.rawTotals.amount||0)+'</td>';
    var tPct=e._targetPct||0;var tCls=tPct>=100?'high':tPct>=70?'mid':'low';
    html+='<td><span class="score-pct '+tCls+'" style="font-size:14px">'+tPct+'%</span></td>';
    html+='<td style="font-weight:900;color:var(--hl)">'+fmt(e.weightedScore)+'</td></tr>';
  });
  html+='</tbody></table></div></div>';
  var chartData=filtered.slice(0,10);
  html+='<div class="box"><h3>📊 مقارنة الموظفين — '+sortLabel+' — أعلى '+Math.min(10,filtered.length)+'</h3><div id="empCompareChart" style="height:500px"></div></div>';
  c.innerHTML=html;
  setTimeout(function(){
    var DC=getThemeChartConf();
    var labels=chartData.map(function(e){return e.employee});
    var vals=chartData.map(function(e){return getEmpSortVal(e,sortKey,salesScores)});
    if(vals.length===0)return;
    try{Plotly.newPlot('empCompareChart',[{x:vals,y:labels,type:'bar',orientation:'h',marker:{color:vals.map(function(_,i){return DC.colorway[i%DC.colorway.length]})},textposition:'outside',text:vals.map(function(v){return typeof v==='number'?v.toFixed(1):v})}],{...DC,margin:{t:10,b:40,l:160,r:80},xaxis:{...DC.xaxis,title:sortLabel},yaxis:{...DC.yaxis,autorange:'reversed'}},{responsive:true})}catch(e){}
  },150);
}
function renderSalesExecutiveTab(salesScores){
  var c=document.getElementById('resultArea');
  if(!salesScores){c.innerHTML='<div class="box"><h3>لا توجد نتائج مبيعات</h3></div>';return}
  var er=salesScores.employeeRankings||[];
  var br=salesScores.branchRankings||[];
  var mk=salesScores.metricKeys||[];
  var cfg=salesScores.config||{};
  var html='';
  html+='<div class="box"><h3>📋 الملخص التنفيذي — تقرير التحليل</h3></div>';
  if(br.length>0){
    var topBranch=br[0];
    var bottomBranch=br[br.length-1];
    html+='<div class="exec-card"><h4>🏆 ترتيب الفروع</h4>';
    html+='<p>افضل فرع اداء هو <span class="highlight">'+topBranch.branch+'</span> بمتوسط نتيجة <span class="highlight">'+fmt(topBranch.avgScore)+'</span> من اصل '+br.length+' فرع.</p>';
    if(br.length>1){
      html+='<p>الفرع الاقل اداء هو <span class="bad-text">'+bottomBranch.branch+'</span> بمتوسط نتيجة <span class="bad-text">'+fmt(bottomBranch.avgScore)+'</span>.</p>';
      var gap=Math.round((topBranch.avgScore-bottomBranch.avgScore)*100)/100;
      html+='<p>الفجوة بين الاعلى والاقل: <span class="warn-text">'+fmt(gap)+' نقطة</span>.</p>';
    }
    mk.forEach(function(mk2){
      var avgMetrics={};
      br.forEach(function(b){
        var totalAvg=0;
        b.scores.forEach(function(s){totalAvg+=s.rawAverages[mk2]||0});
        avgMetrics[b.branch]=b.count>0?totalAvg/b.count:0;
      });
      var maxBranch=br.reduce(function(best,b){return avgMetrics[b.branch]>avgMetrics[best.branch]?b:best},br[0]);
      html+='<p>اعلى فرع في <strong>'+(cfg.metrics[mk2]?cfg.metrics[mk2].label:mk2)+'</strong>: <span class="highlight">'+maxBranch.branch+'</span> (متوسط: '+fmt(avgMetrics[maxBranch.branch])+')</p>';
    });
    html+='</div>';
  }
  if(er.length>0){
    var topEmp=er[0];
    var bottomEmp=er[er.length-1];
    html+='<div class="exec-card"><h4>👤 ترتيب الموظفين</h4>';
    html+='<p>افضل موظف اداء هو <span class="highlight">'+topEmp.employee+'</span> من فرع <span class="highlight">'+topEmp.branch+'</span> بنتيجة <span class="highlight">'+fmt(topEmp.weightedScore)+'</span> من اصل '+er.length+' موظف.</p>';
    if(er.length>1){
      html+='<p>الموظف الاقل اداء هو <span class="bad-text">'+bottomEmp.employee+'</span> من فرع <span class="bad-text">'+bottomEmp.branch+'</span> بنتيجة <span class="bad-text">'+fmt(bottomEmp.weightedScore)+'</span>.</p>';
      var empGap=Math.round((topEmp.weightedScore-bottomEmp.weightedScore)*100)/100;
      html+='<p>الفجوة بين الاعلى والاقل: <span class="warn-text">'+fmt(empGap)+' نقطة</span>.</p>';
    }
    mk.forEach(function(mk2){
      var bestEmpForMetric=er.reduce(function(best,e){return(e.rawAverages[mk2]||0)>(best.rawAverages[mk2]||0)?e:best},er[0]);
      html+='<p>اعلى موظف في <strong>'+(cfg.metrics[mk2]?cfg.metrics[mk2].label:mk2)+'</strong>: <span class="highlight">'+bestEmpForMetric.employee+'</span> ('+fmt(bestEmpForMetric.rawAverages[mk2]||0)+')</p>';
    });
    html+='</div>';
  }
  html+='<div class="exec-card"><h4>📌 التوصيات والتقييم</h4>';
  if(br.length>1){
    var avgAllBranch=br.reduce(function(s,b){return s+b.avgScore},0)/br.length;
    html+='<p>متوسط النتائج الكلي للفروع: <strong>'+fmt(Math.round(avgAllBranch*100)/100)+'</strong>.</p>';
    var aboveAvg=br.filter(function(b){return b.avgScore>=avgAllBranch});
    var belowAvg=br.filter(function(b){return b.avgScore<avgAllBranch});
    if(aboveAvg.length>0)html+='<p>فروع فوق المتوسط (<span class="highlight">'+aboveAvg.length+'</span>): '+aboveAvg.map(function(b){return '<strong>'+b.branch+'</strong> ('+fmt(b.avgScore)+')'}).join('، ')+'</p>';
    if(belowAvg.length>0)html+='<p>فروع تحت المتوسط (<span class="warn-text">'+belowAvg.length+'</span>): '+belowAvg.map(function(b){return '<strong>'+b.branch+'</strong> ('+fmt(b.avgScore)+')'}).join('، ')+'</p>';
  }
  if(er.length>=2){
    var scores=er.map(function(e){return e.weightedScore});
    var meanScore=scores.reduce(function(s,v){return s+v},0)/scores.length;
    var variance=scores.reduce(function(s,v){return s+(v-meanScore)*(v-meanScore)},0)/scores.length;
    var stdDev=Math.sqrt(variance);
    html+='<p>متوسط النتائج الكلي للموظفين: <strong>'+fmt(Math.round(meanScore*100)/100)+'</strong>.</p>';
    html+='<p>الانحراف المعياري: <strong>'+fmt(Math.round(stdDev*100)/100)+'</strong> — '+
      (stdDev<10?'<span class="highlight">الاداء متجانس نسبيا</span>':
      stdDev<25?'<span class="warn-text">هناك تفاوت ملحوظ في الاداء</span>':
      '<span class="bad-text">تفاوت كبير في الاداء — ينصح بدراسة اسباب الفجوة</span>')+'</p>';
  }
  html+='</div>';
  html+='<div class="box"><h3>🎯 الاهداف المرجعية</h3><div class="kpi-grid">';
  mk.forEach(function(mk2){
    html+='<div class="kpi"><div class="l">'+(cfg.metrics[mk2]?cfg.metrics[mk2].label:mk2)+'</div><div class="v">'+fmt(salesScores.targets[mk2])+'</div></div>';
  });
  html+='</div><p class="box-sub">الاهداف محددة '+
    (cfg.targetMode==='custom'?'ادخال يدوي':'تلقائيا بناء على اعلى متوسط مسجل')+'</p></div>';
  c.innerHTML=html;
}

function renderResultTabs(){
  var nav=document.getElementById('resultNav');var html='';
  var hasSS=!!RESULTS.salesScores;
  html+='<button class="active" onclick="showResultTab(\\'_salesBranch\\',this)">🏆 ترتيب الفروع</button>';
  html+='<button onclick="showResultTab(\\'_salesEmployee\\',this)">👤 ترتيب الموظفين</button>';
  html+='<button onclick="showResultTab(\\'_summary\\',this)">ملخص البيانات</button>';
  html+='<button onclick="showResultTab(\\'_salesExec\\',this)">📋 الملخص التنفيذي</button>';
  if(DASHBOARDS.length>=2)html+='<button onclick="showResultTab(\\'_compare\\',this)">مقارنة الداشبوردات</button>';
  var hasAna=RESULTS.analyses&&Object.keys(RESULTS.analyses).length>0;
  if(hasAna)html+='<button onclick="showResultTab(\\'_analyses\\',this)">📊 رسوم بيانية</button>';
  nav.innerHTML=html;
  activeTab=hasSS?'_salesBranch':'_summary';
  renderCurrentTab();
}
function goStepDirect(n){
  document.querySelectorAll('.step').forEach(function(s){s.classList.remove('active')});
  document.getElementById('step'+n).classList.add('active');
}
function showResultTab(tab,btn){
  activeTab=tab;
  document.querySelectorAll('.result-nav button').forEach(function(b){b.classList.remove('active')});
  if(btn)btn.classList.add('active');
  renderCurrentTab();
}
function renderCurrentTab(){
  if(!activeTab)return;
  if(!RESULTS||(!RESULTS.salesScores&&!RESULTS.analyses))return;
  if(activeTab==='_summary')renderSummaryTab();
  else if(activeTab==='_compare')renderCompareTab();
  else if(activeTab==='_salesBranch')renderSalesBranchTab(RESULTS.salesScores);
  else if(activeTab==='_salesEmployee')renderSalesEmployeeTab(RESULTS.salesScores);
  else if(activeTab==='_salesExec')renderSalesExecutiveTab(RESULTS.salesScores);
  else if(activeTab==='_analyses')renderAnalysesTab();
  else renderAnalysisTab(activeTab);
}
function renderCompareTab(){
  var c=document.getElementById('resultArea');
  if(DASHBOARDS.length<2){c.innerHTML='<div class="box"><h3>لازم يكون فيه داشبوردتين على الاقل عشان تعمل مقارنة</h3></div>';return}
  c.innerHTML='<div id="compareContent"></div>';
  renderStep5();
}
function renderSummaryTab(){
  var c=document.getElementById('resultArea');
  var ss=RESULTS.salesScores;
  var ot=ss?ss.overallTotals:null;
  if(!ot){c.innerHTML='<div class="box"><h3>لا توجد بيانات مبيعات كافية</h3></div>';return}
  var totalAmount=ot.amount||0;
  var totalPieces=ot.pieces||0;
  var totalCount=ot.rowCount||0;
  var avgInvoice=totalCount>0?Math.round(totalAmount/totalCount*100)/100:0;
  var avgPieces=totalCount>0?Math.round(totalPieces/totalCount*100)/100:0;
  var html='<div class="box"><h3>📋 ملخص البيانات</h3></div>';
  html+='<div class="kpi-grid">';
  html+='<div class="kpi" style="border-color:var(--hl)"><div class="l">اجمالي المبيعات</div><div class="v">'+fmt(totalAmount)+'</div><div id="sc_totalAmount"></div></div>';
  html+='<div class="kpi"><div class="l">اجمالي القطع المباعة</div><div class="v">'+fmt(totalPieces)+'</div><div id="sc_totalPieces"></div></div>';
  html+='<div class="kpi"><div class="l">اجمالي عدد الفواتير</div><div class="v">'+fmt(totalCount)+'</div></div>';
  html+='<div class="kpi"><div class="l">متوسط الفاتورة</div><div class="v">'+fmt(avgInvoice)+'</div><div id="sc_avgInvoice"></div><button class="score-btn" onclick="doScoreCalc(\\'amount\\','+avgInvoice+',\\'متوسط الفاتورة\\',\\'sc_avgInvoice\\')">حساب الscore</button></div>';
  html+='<div class="kpi"><div class="l">متوسط عدد القطع</div><div class="v">'+fmt(avgPieces)+'</div><div id="sc_avgPieces"></div><button class="score-btn" onclick="doScoreCalc(\\'pieces\\','+avgPieces+',\\'متوسط عدد القطع\\',\\'sc_avgPieces\\')">حساب الscore</button></div>';
  html+='</div>';
  c.innerHTML=html;
}
function renderAnalysisTab(key){
  var c=document.getElementById('resultArea');
  var a=RESULTS.analyses[key];
  if(!a){c.innerHTML='<div class="box">تحليل غير موجود</div>';return}
  var html='<div class="box"><h3>'+a.label+'</h3><div id="chart_'+key+'" style="height:450px"></div></div>';
  if(a.stats){
    html+='<div class="box"><h3>احصائيات وصفية</h3><div class="kpi-grid">';
    html+='<div class="kpi"><div class="l">العدد</div><div class="v">'+fmt(a.stats.count)+'</div></div>';
    html+='<div class="kpi"><div class="l">المتوسط</div><div class="v">'+fmt(a.stats.mean)+'</div></div>';
    html+='<div class="kpi"><div class="l">الوسيط</div><div class="v">'+fmt(a.stats.median)+'</div></div>';
    html+='<div class="kpi"><div class="l">الانحراف المعياري</div><div class="v">'+fmt(a.stats.std)+'</div></div>';
    html+='<div class="kpi"><div class="l">الادنى</div><div class="v">'+fmt(a.stats.min)+'</div></div>';
    html+='<div class="kpi"><div class="l">الاعلى</div><div class="v">'+fmt(a.stats.max)+'</div></div>';
    html+='</div></div>';
  }
  if(a.type==='scatter'&&a.chartData){
    var x=a.chartData.x;var y=a.chartData.y;
    var n=Math.min(x.length,y.length);
    var corr=0;
    if(n>2){
      var mx=0,my=0;for(var i=0;i<n;i++){mx+=x[i];my+=y[i]}mx/=n;my/=n;
      var num=0,dx=0,dy=0;for(var i=0;i<n;i++){num+=(x[i]-mx)*(y[i]-my);dx+=(x[i]-mx)*(x[i]-mx);dy+=(y[i]-my)*(y[i]-my)}
      corr=dx&&dy?Math.round(num/Math.sqrt(dx*dy)*1000)/1000:0;
    }
    html+='<div class="box"><h3>معامل الارتباط (بيرسون): <span style="color:'+(Math.abs(corr)>0.7?'var(--ok)':Math.abs(corr)>0.3?'var(--warn)':'var(--hl)')+'">'+corr+'</span></h3>';
    html+='<p class="box-sub">'+(Math.abs(corr)>0.7?'ارتباط قوي':Math.abs(corr)>0.3?'ارتباط متوسط':'ارتباط ضعيف')+'</p></div>';
  }
  if(a.type==='bar'&&a.chartData){
    html+='<div class="box"><h3>الجدول</h3><div class="table-scroll"><table><thead><tr><th>#</th><th>الفئة</th><th>العدد</th></tr></thead><tbody>';
    a.chartData.labels.forEach(function(l,i){html+='<tr><td>'+(i+1)+'</td><td><strong>'+l+'</strong></td><td>'+fmt(a.chartData.values[i])+'</td></tr>'});
    html+='</tbody></table></div></div>';
  }
  c.innerHTML=html;
  setTimeout(function(){
    var DC=getThemeChartConf();
    try{
      if(a.type==='histogram'){
        Plotly.newPlot('chart_'+key,[{x:a.chartData.x,type:'histogram',marker:{color:DC.colorway[0]},nbinsx:30}],{...DC,xaxis:{...DC.xaxis,title:a.col},yaxis:{...DC.yaxis,title:'العدد'}},{responsive:true});
      }else if(a.type==='scatter'){
        Plotly.newPlot('chart_'+key,[{x:a.chartData.x,y:a.chartData.y,type:'scatter',mode:'markers',marker:{color:DC.colorway[0],size:6,opacity:0.6}}],{...DC,xaxis:{...DC.xaxis,title:a.xCol},yaxis:{...DC.yaxis,title:a.yCol}},{responsive:true});
      }else if(a.type==='bar'){
        Plotly.newPlot('chart_'+key,[{y:a.chartData.labels,x:a.chartData.values,type:'bar',orientation:'h',marker:{color:a.chartData.labels.map(function(_,i){return DC.colorway[i%DC.colorway.length]})},textposition:'outside'}],{...DC,margin:{t:10,b:30,l:140,r:80},yaxis:{...DC.yaxis,autorange:'reversed'},xaxis:{...DC.xaxis,title:'العدد'}},{responsive:true});
      }else if(a.type==='timeseries'){
        Plotly.newPlot('chart_'+key,[{x:a.chartData.x,y:a.chartData.y,type:'scatter',mode:'lines+markers',line:{color:DC.colorway[0],width:2},marker:{size:4}}],{...DC,xaxis:{...DC.xaxis,title:'التاريخ'},yaxis:{...DC.yaxis}},{responsive:true});
      }else if(a.type==='boxplot'){
        var traces=a.chartData.labels.map(function(l,i){return{y:a.chartData.traces[i],type:'box',name:l,marker:{color:DC.colorway[i%DC.colorway.length]}}});
        Plotly.newPlot('chart_'+key,traces,{...DC},{responsive:true});
      }else if(a.type==='pie'){
        Plotly.newPlot('chart_'+key,[{labels:a.chartData.labels,values:a.chartData.values,type:'pie',hole:0.4,textinfo:'label+percent',textposition:'outside',marker:{colors:DC.colorway}}],{...DC,showlegend:false},{responsive:true});
      }else if(a.type==='heatmap'){
        Plotly.newPlot('chart_'+key,[{z:a.chartData.z,x:a.chartData.x,y:a.chartData.y,type:'heatmap',colorscale:'YlOrRd'}],{...DC},{responsive:true});
      }
    }catch(e){console.error('Chart render error:',e)}
  },100);
}
function renderAnalysesTab(){
  var c=document.getElementById('resultArea');
  var ana=RESULTS.analyses;
  if(!ana||!Object.keys(ana).length){c.innerHTML='<div class="box">لا توجد تحليلات تلقائية</div>';return}
  var html='';var keys=Object.keys(ana);
  keys.forEach(function(k,i){
    var a=ana[k];
    html+='<div class="box"><h3>'+a.label+'</h3><div id="anaChart_'+i+'" style="height:400px"></div></div>';
  });
  c.innerHTML=html;
  setTimeout(function(){
    var DC=getThemeChartConf();
    keys.forEach(function(k,i){
      var a=ana[k];var divId='anaChart_'+i;
      try{
        if(a.type==='histogram'){
          Plotly.newPlot(divId,[{x:a.chartData.x,type:'histogram',marker:{color:DC.colorway[0]},nbinsx:30}],{...DC,xaxis:{...DC.xaxis,title:a.col},yaxis:{...DC.yaxis,title:'العدد'}},{responsive:true});
        }else if(a.type==='scatter'){
          Plotly.newPlot(divId,[{x:a.chartData.x,y:a.chartData.y,type:'scatter',mode:'markers',marker:{color:DC.colorway[0],size:5,opacity:0.6}}],{...DC,xaxis:{...DC.xaxis,title:a.xCol},yaxis:{...DC.yaxis,title:a.yCol}},{responsive:true});
        }else if(a.type==='bar'){
          Plotly.newPlot(divId,[{y:a.chartData.labels,x:a.chartData.values,type:'bar',orientation:'h',marker:{color:a.chartData.labels.map(function(_,j){return DC.colorway[j%DC.colorway.length]})}}],{...DC,margin:{t:10,b:30,l:140,r:80},yaxis:{...DC.yaxis,autorange:'reversed'}},{responsive:true});
        }else if(a.type==='timeseries'){
          Plotly.newPlot(divId,[{x:a.chartData.x,y:a.chartData.y,type:'scatter',mode:'lines+markers',line:{color:DC.colorway[0],width:2},marker:{size:4}}],{...DC},{responsive:true});
        }else if(a.type==='boxplot'){
          var tr=a.chartData.labels.map(function(l,j){return{y:a.chartData.traces[j],type:'box',name:l,marker:{color:DC.colorway[j%DC.colorway.length]}}});
          Plotly.newPlot(divId,tr,{...DC},{responsive:true});
        }else if(a.type==='pie'){
          Plotly.newPlot(divId,[{labels:a.chartData.labels,values:a.chartData.values,type:'pie',hole:0.4,textinfo:'label+percent',textposition:'outside',marker:{colors:DC.colorway}}],{...DC,showlegend:false},{responsive:true});
        }else if(a.type==='heatmap'){
          Plotly.newPlot(divId,[{z:a.chartData.z,x:a.chartData.x,y:a.chartData.y,type:'heatmap',colorscale:'YlOrRd'}],{...DC},{responsive:true});
        }
      }catch(e){}
    });
  },150);
}
function renderStep5(){
  if(DASHBOARDS.length<2){document.getElementById('compareContent').innerHTML='<div class="box"><h3>لازم يكون فيه داشبوردتين على الاقل عشان تعمل مقارنة</h3></div>';return}
  var d1=DASHBOARDS[0],d2=DASHBOARDS[1];
  var r1=d1.results||{},r2=d2.results||{};
  if(!r1.analyses||!r2.analyses||!Object.keys(r1.analyses).length||!Object.keys(r2.analyses).length){
    document.getElementById('compareContent').innerHTML='<div class="box"><h3>فيه داشبورد محتاجة تحليل الاول</h3></div>';return}
  var rows1=r1.cleanedRows||[];var rows2=r2.cleanedRows||[];
  var cols1=rows1.length?Object.keys(rows1[0]):[];
  var cols2=rows2.length?Object.keys(rows2[0]):[];
  var similarity=calcSchemaSimilarity(cols1,cols2);
  var html='<div class="compare-info">';
  html+='<div>داشبورد 1: <span>'+rows1.length+' صف، '+cols1.length+' عمود</span></div>';
  html+='<div>داشبورد 2: <span>'+rows2.length+' صف، '+cols2.length+' عمود</span></div>';
  html+='<div>تشابه البنية: <span style="color:'+(similarity.score>=70?'var(--ok)':'var(--warn)')+'">'+similarity.score+'%</span></div>';
  html+='</div>';
  if(similarity.score>=70){
    html+='<div class="compare-section"><h4>مقارنة تلقائية — بيانات مشتركة</h4></div>';
    if(similarity.common.length>0){
      html+='<div class="compare-kpi-grid">';
      similarity.common.forEach(function(c){
        if(r1.colStats[c]&&r1.colStats[c].mean!==undefined&&r2.colStats[c]&&r2.colStats[c].mean!==undefined){
          var delta=r2.colStats[c].mean-r1.colStats[c].mean;
          var pct=r1.colStats[c].mean!==0?((delta/Math.abs(r1.colStats[c].mean))*100).toFixed(1):'—';
          var cls=delta>0?'up':delta<0?'down':'flat';
          html+='<div class="compare-kpi"><div class="label">'+c+' (متوسط)</div><div class="vals"><div class="val" style="color:var(--hl)">'+fmt(r1.colStats[c].mean)+'</div><div style="color:var(--mut);font-size:18px">→</div><div class="val" style="color:var(--ok)">'+fmt(r2.colStats[c].mean)+'</div></div><div class="delta '+cls+'">'+(delta>0?'+':'')+fmt(Math.round(delta))+' ('+(delta>0?'+':'')+pct+'%)</div></div>';
        }
      });
      html+='</div>';
    }
    if(similarity.common.length>0){
      html+='<div class="box"><h3>مقارنة الرسوم البيانية المشتركة</h3>';
      similarity.common.forEach(function(c){
        if(r1.colStats[c]&&r1.colStats[c].mean!==undefined){
          html+='<div id="cmp_chart_'+c.replace(/[^a-zA-Z0-9]/g,'_')+'" style="height:350px;margin-bottom:20px"></div>';
        }
      });
      html+='</div>';
    }
  }else{
    html+='<div class="box"><h3>البنية غير متشابهة كفاية للمقارنة التلقائية</h3>';
    html+='<div class="row">';
    html+='<div><h3 style="color:var(--hl)">بنية الملف 1</h3><ul style="list-style:none;padding:0">';
    cols1.forEach(function(c){var t=r1.colStats[c]&&(r1.colStats[c].mean!==undefined)?'رقمي':'نصي';html+='<li style="padding:4px 0;border-bottom:1px solid var(--border)">'+c+' <span class="badge ok">'+t+'</span></li>'});
    html+='</ul></div>';
    html+='<div><h3 style="color:var(--ok)">بنية الملف 2</h3><ul style="list-style:none;padding:0">';
    cols2.forEach(function(c){var t=r2.colStats[c]&&(r2.colStats[c].mean!==undefined)?'رقمي':'نصي';html+='<li style="padding:4px 0;border-bottom:1px solid var(--border)">'+c+' <span class="badge ok">'+t+'</span></li>'});
    html+='</ul></div></div>';
    if(similarity.common.length>0){
      html+='<div class="compare-kpi-grid">';
      similarity.common.forEach(function(c){
        if(r1.colStats[c]&&r1.colStats[c].mean!==undefined&&r2.colStats[c]&&r2.colStats[c].mean!==undefined){
          var delta=r2.colStats[c].mean-r1.colStats[c].mean;
          html+='<div class="compare-kpi"><div class="label">'+c+' (متوسط)</div><div class="vals"><div class="val" style="color:var(--hl)">'+fmt(r1.colStats[c].mean)+'</div><div style="color:var(--mut);font-size:18px">→</div><div class="val" style="color:var(--ok)">'+fmt(r2.colStats[c].mean)+'</div></div><div class="delta">'+(delta>0?'+':'')+fmt(Math.round(delta))+'</div></div>';
        }
      });
      html+='</div>';
    }
    html+='</div>';
  }
  if(similarity.onlyIn1.length>0){
    html+='<div class="box"><h3>بيانات موجودة في الملف 1 فقط ('+similarity.onlyIn1.length+'عمود)</h3>';
    html+='<p class="box-sub">'+similarity.onlyIn1.join('، ')+'</p></div>';
  }
  if(similarity.onlyIn2.length>0){
    html+='<div class="box"><h3>بيانات موجودة في الملف 2 فقط ('+similarity.onlyIn2.length+'عمود)</h3>';
    html+='<p class="box-sub">'+similarity.onlyIn2.join('، ')+'</p></div>';
  }
  document.getElementById('compareContent').innerHTML=html;
  if(similarity.score>=70&&similarity.common.length>0){
    setTimeout(function(){
      var DC=getThemeChartConf();
      similarity.common.forEach(function(c){
        if(r1.colStats[c]&&r1.colStats[c].mean!==undefined){
          var divId='cmp_chart_'+c.replace(/[^a-zA-Z0-9]/g,'_');
          var el=document.getElementById(divId);if(!el)return;
          try{
            Plotly.newPlot(divId,[{y:[r1.colStats[c].mean],x:['داشبورد 1'],type:'bar',name:'داشبورد 1',marker:{color:DC.colorway[0]}},{y:[r2.colStats[c].mean],x:['داشبورد 2'],type:'bar',name:'داشبورد 2',marker:{color:DC.colorway[2]}}],{...DC,barmode:'group',margin:{t:30,b:40,l:60,r:30},yaxis:{...DC.yaxis,title:c},title:{text:'مقارنة '+c,font:{family:'Cairo',size:14,color:DC.font?DC.font.color:'#e0e0e0'}}},{responsive:true});
          }catch(e){}
        }
      });
    },200);
  }
}
function calcSchemaSimilarity(cols1,cols2){
  var norm=function(s){return s.toLowerCase().replace(/[_\\s-]+/g,'').trim()};
  var map1={};cols1.forEach(function(c){map1[norm(c)]=c});
  var map2={};cols2.forEach(function(c){map2[norm(c)]=c});
  var keys1=Object.keys(map1);var keys2=Object.keys(map2);
  var common=[];var onlyIn1=[];var onlyIn2=[];
  keys1.forEach(function(k){if(map2[k])common.push(map1[k]);else onlyIn1.push(map1[k])});
  keys2.forEach(function(k){if(!map1[k])onlyIn2.push(map2[k])});
  var totalUnique=keys1.length+keys2.length-common.length;
  var score=totalUnique>0?Math.round(common.length/totalUnique*2*100):0;
  return{score:score,common:common,onlyIn1:onlyIn1,onlyIn2:onlyIn2};
}

(function(){
  var restored=restoreDashboardState();
  if(restored){
    renderResultTabs();
    goStepDirect(4);
  }
})();
</script>
</body>
</html>`;
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

if (args[0] === '--template') {
  createTemplate();
} else if (args[0] === '--from-html') {
  if (!args[1]) { console.error('Error: need HTML file path'); process.exit(1); }
  buildFromHtml(args[1]);
} else {
  buildFromState(args[0]);
}

import { unsafeCSS } from '@umbraco-cms/backoffice/external/lit';

// One scoped visual system for both legacy shadow-root tables and native Lit reports.
// Radix-inspired Slate / Indigo tokens; no React runtime, remote fonts or global backoffice overrides.
export const contestStylesText = `
:host {
  --cm-page:#f9f9fb; --cm-surface:#fff; --cm-subtle:#fcfcfd; --cm-hover:#f0f0f3;
  --cm-border:#e4e4e9; --cm-border-strong:#cdced6; --cm-text:#1c2024; --cm-muted:#60646c;
  --cm-accent:#3e63dd; --cm-accent-hover:#3358d4; --cm-accent-soft:#eef2ff; --cm-accent-text:#3451b2;
  --cm-positive:#18794e; --cm-positive-soft:#e9f9ee; --cm-danger:#c62a2f; --cm-danger-soft:#fff0f0;
  --cm-radius:8px; --cm-panel-radius:12px;
  --cm-shadow:0 1px 2px #19203305,0 2px 6px #19203304;
  display:block; height:100%; min-width:0; color:var(--cm-text); color-scheme:light;
  font:14px/1.5 var(--uui-font-family,system-ui,-apple-system,'Segoe UI',sans-serif);
  -webkit-font-smoothing:antialiased;
}
*,*::before,*::after{box-sizing:border-box}
umb-body-layout{--umb-body-layout-color-background:var(--cm-page)}
.page{width:100%;max-width:1600px;margin-inline:auto;padding:0 28px 32px;min-width:0}
.page-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:28px 0 24px}
.eyebrow{display:flex;gap:8px;align-items:center;font-size:11px;font-weight:650;letter-spacing:1.2px;text-transform:uppercase;color:var(--cm-accent-text);margin:0 0 8px}
.eyebrow::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--cm-accent);box-shadow:0 0 0 4px var(--cm-accent-soft);margin:0 4px}
h1{font-size:28px;line-height:1.25;letter-spacing:-.8px;font-weight:650;margin:0 0 8px}
.page-description{max-width:780px;color:var(--cm-muted);font-size:14px;margin:0;line-height:1.6}
.page-context{color:var(--cm-muted);font-size:12px;white-space:nowrap;padding-top:4px;display:flex;align-items:center;gap:7px}
.page-context::before{content:'';width:6px;height:6px;border-radius:50%;background:#30a46c}
h2{font-size:16px;letter-spacing:-.25px;line-height:1.5;font-weight:650;margin:0 0 14px}
h3{font-size:14px;font-weight:650;letter-spacing:-.1px}
p{line-height:1.65}.muted,small,.block{color:var(--cm-muted)}
small{font-size:12px}.block{display:block;margin-top:4px;font-weight:400;line-height:1.5}
strong{font-weight:600}a{color:var(--cm-accent-text)}
.box,section,.filter-panel,.report-panel{border:1px solid var(--cm-border);border-radius:var(--cm-panel-radius);background:var(--cm-surface);box-shadow:var(--cm-shadow)}
.box,section,.report-panel{padding:22px;margin-bottom:20px;min-width:0}
.filter-panel{padding:20px 22px 0;margin:0 0 22px}
.panel-heading{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-bottom:18px}
.panel-heading h2{margin:0}.panel-note{font-size:12px;color:var(--cm-muted)}
.toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-bottom:4px}
.filters{display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap;min-width:0}
.filters>input:not([type=checkbox]):not([type=radio]){flex:1 1 240px;width:auto}.filters>select{flex:0 1 210px;width:auto}
.privacy-note{font-size:12px;margin-top:22px}
.toolbar .filters{min-width:0;flex-basis:650px}.toolbar .filters input{flex:1;min-width:200px}.toolbar .filters select{flex:1;min-width:155px;max-width:230px}
.filter-panel .filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:end;gap:16px}
.filter-panel .wide{grid-column:span 2}
label{font-size:13px;font-weight:550;line-height:1.5}
.filter-panel label{display:flex;flex-direction:column;gap:7px;min-width:0}
input,select,textarea,button{font:inherit;line-height:1.4}
input:not([type=checkbox]):not([type=radio]),select,textarea{
  width:100%;min-width:0;border:1px solid var(--cm-border-strong);border-radius:7px;padding:9px 11px;
  background:var(--cm-surface);color:var(--cm-text);box-shadow:0 1px 2px #19203303;min-height:38px;
  transition:border-color .15s,box-shadow .15s,background .15s;
}
input::placeholder,textarea::placeholder{color:#8b8d98;font-weight:400}
input:hover:not(:disabled):not([readonly]),select:hover:not(:disabled),textarea:hover:not(:disabled){border-color:#a5a7b3}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--cm-accent);box-shadow:0 0 0 3px #3e63dd22}
input[readonly],input:disabled,select:disabled,textarea:disabled{background:var(--cm-hover);color:var(--cm-muted)}
textarea{resize:vertical;min-height:78px;line-height:1.6}
input[type=checkbox],input[type=radio]{width:17px;height:17px;min-width:17px;min-height:17px;margin:0;accent-color:var(--cm-accent);vertical-align:middle;cursor:pointer}
input[type=checkbox]:disabled,input[type=radio]:disabled{cursor:not-allowed;opacity:.55}
button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:8px 13px;
  border:1px solid var(--cm-border-strong);border-radius:7px;background:var(--cm-surface);color:var(--cm-text);
  cursor:pointer;font-size:13px;font-weight:550;white-space:nowrap;box-shadow:0 1px 2px #19203305;
  transition:background .15s,border-color .15s,box-shadow .15s,transform .1s;
}
button:hover:not(:disabled){background:var(--cm-hover);border-color:#b9bbc6}
button:active:not(:disabled){transform:translateY(1px)}
button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #3e63dd66;outline-offset:3px}
button:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;transform:none}
button.primary,.filter-panel .actions>button:first-child,.publication-actions button:not(.danger){background:var(--cm-accent);color:white;border-color:var(--cm-accent);box-shadow:0 1px 2px #1f2d5c20}
button.primary:hover:not(:disabled),.filter-panel .actions>button:first-child:hover:not(:disabled),.publication-actions button:not(.danger):hover:not(:disabled){background:var(--cm-accent-hover);border-color:var(--cm-accent-hover)}
button.secondary{background:var(--cm-accent-soft);border-color:transparent;color:var(--cm-accent-text);box-shadow:none}
button.ghost{box-shadow:none;border-color:transparent;background:transparent}
button.danger{color:var(--cm-danger)}button.danger:hover:not(:disabled){background:var(--cm-danger-soft);border-color:#f5c6c7}
button.link{border:0;background:transparent;color:var(--cm-accent-text);padding:2px 0;min-height:28px;box-shadow:none;font-family:ui-monospace,monospace;font-weight:600}
button.link:hover:not(:disabled){background:transparent;text-decoration:underline;text-underline-offset:4px}
.actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:18px 0}
.filter-panel>.actions{border-top:1px solid var(--cm-border);padding:16px 0;margin:18px 0 0}
.summary{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--cm-muted);margin:20px 0 12px;font-variant-numeric:tabular-nums}
.summary::before{content:'';display:inline-block;width:5px;height:5px;border-radius:50%;background:#8b8d98}
.scroll,.table-wrap{overflow:auto;border:1px solid var(--cm-border);border-radius:9px;max-height:66vh;scrollbar-width:thin;scrollbar-color:#cdced6 transparent}
table{width:100%;border-collapse:separate;border-spacing:0;background:var(--cm-surface);font-size:13px}
.table-wrap table{min-width:800px}
th,td{text-align:left;padding:13px 15px;vertical-align:middle;border:0;border-bottom:1px solid var(--cm-border);line-height:1.55}
thead th{position:sticky;top:0;z-index:2;background:var(--cm-subtle);font-size:12px;font-weight:600;color:var(--cm-muted);white-space:nowrap;box-shadow:0 1px var(--cm-border)}
tbody tr:last-child td{border-bottom:0}tbody tr{transition:background .12s}tbody tr:hover{background:var(--cm-subtle)}
td.actions{display:table-cell;white-space:nowrap;text-align:right;margin:0}td.actions button+button{margin-left:6px}
td.actions button{min-height:30px;padding:5px 9px;font-size:12px}
.nowrap{white-space:nowrap}.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;color:var(--cm-muted)}
td:first-child .mono,td.mono{white-space:nowrap}
.question{max-width:440px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.6}
td.question{display:table-cell;min-width:260px;max-width:560px;white-space:pre-wrap;overflow-wrap:anywhere}
dialog td.question{max-width:620px}
.badge{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:550;white-space:nowrap;line-height:1.7}
.badge::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor}
.badge.on,.badge.positive{background:var(--cm-positive-soft);color:var(--cm-positive)}
.badge.off,.badge.neutral{background:var(--cm-hover);color:var(--cm-muted)}
.answer{display:inline-grid;place-items:center;width:28px;height:28px;background:var(--cm-accent-soft);color:var(--cm-accent-text);border:1px solid #d9e2fc;border-radius:7px;font-weight:650;font-size:12px}
.empty,.empty-state{text-align:center;padding:44px 20px;color:var(--cm-muted)}
.pager{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin:18px 0 0;color:var(--cm-muted);font-size:12px;font-variant-numeric:tabular-nums}
.local-pager{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin:16px 0 0;font-size:12px;color:var(--cm-muted);font-variant-numeric:tabular-nums}
.local-pager label,.page-buttons{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.local-pager label{font-size:12px;white-space:nowrap}.local-pager select{width:72px;min-height:32px;padding:5px 8px}.local-pager button{min-height:32px;padding:6px 9px}.page-buttons>span{white-space:nowrap}.entry-content .local-pager{padding:0 16px 16px}.page-range{white-space:nowrap}
.tabs{display:inline-flex;gap:4px;padding:4px;border-radius:9px;background:var(--cm-hover);flex-wrap:wrap}
.tabs button{border-color:transparent;background:transparent;box-shadow:none;color:var(--cm-muted);min-height:32px;padding:7px 12px}
.tabs button.primary{color:var(--cm-text);background:var(--cm-surface);border-color:var(--cm-border);box-shadow:0 1px 3px #1920330a}
.tabs button.primary:hover{color:var(--cm-text);background:var(--cm-surface);border-color:var(--cm-border-strong)}
.notice,.error,.success-notice{padding:12px 15px;border-radius:8px;font-size:13px;margin:0 0 18px;border:1px solid transparent}
.notice.error,p.error{background:var(--cm-danger-soft);color:var(--cm-danger);border-color:#f5d0d1}
.notice.success,.success-notice{background:var(--cm-positive-soft);color:var(--cm-positive);border-color:#c1e8ce}
.loading-notice{display:flex;align-items:center;gap:10px;color:var(--cm-muted);font-size:13px;padding:12px 0}
.loading-notice::before{content:'';width:14px;height:14px;border:2px solid var(--cm-border);border-top-color:var(--cm-accent);border-radius:50%;animation:cm-spin .7s linear infinite}
.metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin:0 0 22px}
.metrics article{position:relative;overflow:hidden;border:1px solid var(--cm-border);border-radius:11px;background:var(--cm-surface);box-shadow:var(--cm-shadow);padding:19px 18px;color:var(--cm-muted);font-size:12px}
.metrics article strong{display:block;color:var(--cm-text);font-size:32px;line-height:1.2;font-weight:650;letter-spacing:-1px;font-variant-numeric:tabular-nums;margin:12px 0 8px}
.metrics article:first-child{border-color:#c6d4f9;background:linear-gradient(130deg,var(--cm-accent-soft),var(--cm-surface))}
.metric-caption{font-size:11px;color:var(--cm-muted)}
.dashboard-panels{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(240px,1fr);gap:20px;align-items:start}
.chart{display:flex;align-items:flex-end;gap:14px;overflow:auto;min-height:215px;padding:10px 0 0;scrollbar-width:thin}
.chart>div{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:11px;font-variant-numeric:tabular-nums;color:var(--cm-muted)}
.chart svg{fill:var(--cm-accent);flex-shrink:0;border-bottom:1px solid var(--cm-border)}.chart rect{rx:4px}
.chart>div:hover svg{fill:var(--cm-accent-hover)}
.check{display:flex!important;align-items:center;flex-direction:row!important;gap:9px;cursor:pointer;font-weight:450}
.publication-draw{border:1px solid var(--cm-border);border-radius:8px;padding:14px;margin:10px 0;background:var(--cm-subtle)}
.publication-draw:has(input:checked){background:var(--cm-accent-soft);border-color:#b7c9f7}
.publication-state{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:20px}
.publication-state h2{margin:0}.publication-explanation{padding:14px 16px;background:var(--cm-subtle);border:1px solid var(--cm-border);border-radius:8px;font-size:13px;color:var(--cm-muted)}
dialog{border:1px solid var(--cm-border);padding:0;width:min(760px,calc(100vw - 48px));max-height:90dvh;border-radius:14px;background:var(--cm-surface);color:var(--cm-text);overflow:auto;box-shadow:0 24px 80px #10182840,0 8px 24px #10182815;scrollbar-width:thin}
dialog.large{width:min(1140px,calc(100vw - 48px))}dialog.entry-dialog{width:min(1460px,calc(100vw - 48px))}
dialog::backdrop{background:#11182780;backdrop-filter:blur(3px)}dialog[open]{animation:cm-dialog-in .16s ease-out}
dialog form>header,.dialog-header{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:18px;padding:22px 26px;background:var(--cm-surface);border-bottom:1px solid var(--cm-border)}
dialog header h2,.dialog-header h2{margin:0;font-size:19px;letter-spacing:-.4px}dialog header p{margin:5px 0 0;color:var(--cm-muted);font-size:13px}
dialog .close{width:30px;min-width:30px;height:30px;min-height:30px;padding:0;font-size:23px;line-height:1;border-color:transparent;box-shadow:none;color:var(--cm-muted)}
dialog form>footer,.dialog-footer{position:sticky;bottom:0;z-index:5;display:flex;justify-content:flex-end;align-items:center;gap:9px;padding:16px 26px;border-top:1px solid var(--cm-border);background:var(--cm-surface);margin:0}
.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;padding:24px 26px}
.form-grid label,.answer-row label{display:block;font-size:13px;font-weight:550;min-width:0}
.form-grid label>input:not([type=checkbox]):not([type=radio]),.form-grid label>textarea,.form-grid label>select,.answer-row label>textarea{display:block;margin-top:7px;font-weight:400}
.form-grid label>span,.answer-row label>span,.tree-heading h3>span{display:inline;color:var(--cm-danger);margin-left:3px;white-space:nowrap}
.form-grid label>small{display:block;font-size:11px;font-weight:400;margin-top:3px}
.wide{grid-column:1/-1}.form-grid .check{padding:10px 12px;background:var(--cm-subtle);border:1px solid var(--cm-border);border-radius:7px}
dialog form>h3{margin:0 26px 12px;padding:0;font-size:14px}
.answers{padding:0 26px}.answer-row{display:grid;grid-template-columns:72px minmax(0,1fr) minmax(0,1fr);gap:16px;padding:16px;border:1px solid var(--cm-border);border-radius:10px;margin-bottom:12px;background:var(--cm-subtle);transition:background .15s,border-color .15s}
.answer-row:has(input[type=radio]:checked){border-color:#a9d9bb;background:#f4fcf7}
.answer-row .correct{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;border-radius:7px;background:var(--cm-hover);padding:12px 4px;cursor:pointer}
.answer-row .correct strong{font-size:20px}.answer-row .correct small{font-size:10px}.answer-row:has(input:checked) .correct{background:var(--cm-positive-soft);color:var(--cm-positive)}
.answer-row .correct input{accent-color:var(--cm-positive)}
.tree-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 26px 14px;padding:0}
.tree-heading h3{margin:0;padding:0}.tree-heading p{font-size:12px;color:var(--cm-muted);margin:4px 0 0}
.contest-tree{margin:0 26px 26px;border:1px solid var(--cm-border);border-radius:10px;overflow:hidden}
.tree-topic+.tree-topic{border-top:1px solid var(--cm-border)}
.tree-topic summary{display:flex;align-items:center;gap:12px;padding:15px 17px;background:var(--cm-subtle);cursor:pointer;list-style:none}
.tree-topic summary::-webkit-details-marker{display:none}.tree-topic summary:hover{background:var(--cm-hover)}
.tree-topic summary label{display:flex;align-items:center;gap:9px;flex:1;cursor:pointer}.tree-caret{font-size:22px;line-height:1;color:var(--cm-muted);transition:transform .15s}.tree-topic[open] .tree-caret{transform:rotate(90deg)}
.tree-count{font-size:11px;color:var(--cm-accent-text);background:var(--cm-accent-soft);padding:3px 8px;border-radius:5px;white-space:nowrap}
.tree-topic em,.tree-question em{color:#ad5700;font-size:11px;font-style:normal}
.tree-questions{padding:0 17px 5px 50px}.tree-question{display:grid;grid-template-columns:auto 84px minmax(0,1fr) auto;align-items:start;gap:12px;padding:12px 0;border-bottom:1px solid var(--cm-border);cursor:pointer;font-weight:400}
.tree-question:last-child{border-bottom:0}.tree-question input{margin-top:2px}.tree-question.inactive,.empty-tree{color:var(--cm-muted)}.empty-tree{font-size:13px}
.entry-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;padding:22px 26px;background:var(--cm-subtle);border-bottom:1px solid var(--cm-border)}
.entry-summary dt{font-size:11px;color:var(--cm-muted);margin-bottom:5px}.entry-summary dd{margin:0;font-size:13px;font-weight:550;overflow-wrap:anywhere}.entry-summary dl{margin:0}
.entry-content{padding:4px 26px 24px}.entry-content details{margin:18px 0 0;border:1px solid var(--cm-border);border-radius:9px;overflow:hidden}
.entry-content summary{display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer;padding:14px 16px;background:var(--cm-subtle);font-size:13px;font-weight:600;list-style:none}
.entry-content summary::before{content:'›';font-size:19px;color:var(--cm-muted)}.entry-content details[open]>summary::before{transform:rotate(90deg)}
.entry-content summary strong{flex:1}.entry-content .scroll{border:0;border-top:1px solid var(--cm-border);border-radius:0;max-height:480px}
.result-correct{color:var(--cm-positive);font-weight:600}.result-incorrect{color:var(--cm-danger)}.result-unanswered{color:var(--cm-muted)}
@keyframes cm-spin{to{transform:rotate(360deg)}}@keyframes cm-dialog-in{from{opacity:0;transform:translateY(6px) scale(.99)}to{opacity:1;transform:none}}
@media(min-width:1600px){.page{padding-inline:36px}.filter-panel .filters{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(max-width:1100px){.metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.filter-panel .filters{grid-template-columns:repeat(3,minmax(0,1fr))}.dashboard-panels{grid-template-columns:1fr}.page-context{display:none}}
@media(max-width:760px){.page{padding:0 16px 24px}.page-heading{padding:22px 0 20px}h1{font-size:24px}.filter-panel .filters{grid-template-columns:repeat(2,minmax(0,1fr))}.filter-panel .wide{grid-column:1/-1}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.box,section,.report-panel{padding:16px}.filter-panel{padding:16px 16px 0}.toolbar{align-items:stretch}.toolbar .filters{flex-basis:100%}.toolbar .filters select{max-width:none}.form-grid{grid-template-columns:1fr;padding:20px;gap:16px}.wide{grid-column:auto}.answers{padding:0 20px}.answer-row{grid-template-columns:52px minmax(0,1fr);gap:12px;padding:12px}.answer-row>label:last-child{grid-column:2}.tree-heading{margin:0 20px 12px;flex-wrap:wrap}.contest-tree{margin:0 20px 20px}.tree-questions{padding-left:20px}.tree-question{grid-template-columns:auto 60px minmax(0,1fr)}.tree-question em{grid-column:3}.entry-summary{grid-template-columns:repeat(2,minmax(0,1fr));padding:20px}.entry-content{padding-inline:16px}dialog,dialog.large,dialog.entry-dialog{width:calc(100vw - 24px);max-height:94dvh}dialog form>header,.dialog-header{padding:18px 20px}dialog form>footer,.dialog-footer{padding:14px 20px}.pager{justify-content:space-between}}
@media(max-width:460px){.filter-panel .filters{grid-template-columns:1fr}.metrics{gap:10px}.metrics article{padding:15px 12px}.metrics article strong{font-size:27px}.entry-summary{grid-template-columns:1fr}.toolbar>button{width:100%}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media(forced-colors:active){button,input,select,textarea,.badge,.answer{border:1px solid ButtonText}button:focus-visible{outline:2px solid Highlight}}
`;

export const contestStyles = unsafeCSS(contestStylesText);

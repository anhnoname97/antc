import { unsafeCSS } from '@umbraco-cms/backoffice/external/lit';

// Giao dien cuoc thi theo ANTC Backoffice Mockup, chi ap dung trong cac view cuoc thi.
// Font dang ky o document de cac shadow root cung su dung, khong doi CSS cua Umbraco.
if (!document.querySelector('link[data-contest-admin-font]')) {
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = '/App_Plugins/ContestManagement/contest-fonts.css?v=1.15.7';
  fonts.dataset.contestAdminFont = '';
  document.head.append(fonts);
}
export const contestStylesText = `
:host {
  --cm-page:#F4F6FB; --cm-surface:#fff; --cm-subtle:#F8F9FC; --cm-hover:#F1F3F8;
  --cm-border:#E3E7F0; --cm-border-strong:#CCD3E0; --cm-text:#1A2033; --cm-muted:#5B6478;
  --cm-accent:#0E7C72; --cm-accent-hover:#0A5E57; --cm-accent-soft:#E3F4F1; --cm-accent-text:#0A5E57;
  --cm-positive:#18794e; --cm-positive-soft:#e9f9ee; --cm-danger:#c62a2f; --cm-danger-soft:#fff0f0;
  --cm-radius:8px; --cm-panel-radius:14px;
  --cm-shadow:0 1px 2px #19203305,0 2px 6px #19203304;
  display:block; height:100%; min-width:0; color:var(--cm-text); color-scheme:light;
  font:14px/1.5 'Be Vietnam Pro',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
}
*,*::before,*::after{box-sizing:border-box}
umb-body-layout{--umb-body-layout-color-background:var(--cm-page)}
.page{width:100%;max-width:none;margin-inline:0;padding:0 28px 32px;min-width:0}
.page-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:28px 0 24px}
.eyebrow{display:flex;gap:8px;align-items:center;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--cm-accent-text);margin:0 0 8px}
.eyebrow::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--cm-accent);box-shadow:0 0 0 4px var(--cm-accent-soft);margin:0 4px}
h1{font-size:28px;line-height:1.25;letter-spacing:-.8px;font-weight:700;margin:0 0 8px}
.page-description{max-width:780px;color:var(--cm-muted);font-size:14px;margin:0;line-height:1.6}
.page-context{color:var(--cm-muted);font-size:12px;white-space:nowrap;padding-top:4px;display:flex;align-items:center;gap:7px}
.page-context::before{content:'';width:6px;height:6px;border-radius:50%;background:#30a46c}
h2{font-size:16px;letter-spacing:-.25px;line-height:1.5;font-weight:700;margin:0 0 14px}
h3{font-size:14px;font-weight:700;letter-spacing:-.1px}
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
.contest-prize-picker{margin:0 26px 24px;padding:16px;border:1px solid var(--cm-border);border-radius:10px;background:var(--cm-subtle)}.contest-prize-picker>summary{cursor:pointer;font-weight:600;color:var(--cm-accent-text)}.contest-prize-picker>summary span{float:right;font-size:12px}.contest-prize-options{display:grid;gap:12px;margin-top:14px;max-height:360px;overflow:auto}.contest-prize-option{display:grid;grid-template-columns:minmax(0,1fr) 100px 200px;gap:8px 18px;padding:12px;background:var(--cm-surface);border:1px solid var(--cm-border);border-radius:8px}.contest-prize-option>small{grid-column:1/-1}.contest-prize-option>label{min-width:0}.contest-prize-option[hidden]{display:none}
.draw-stage{position:relative;text-align:center;padding:36px 20px;background:radial-gradient(ellipse at top,#e9edff,transparent 75%),var(--cm-surface);border-color:#c6d4ff;overflow:hidden}
.draw-stage .eyebrow{justify-content:center}.draw-stage h2{font-size:25px;letter-spacing:-.6px}.draw-reels{display:flex;justify-content:center;gap:clamp(5px,1vw,12px);margin:24px 0}
.draw-reel{width:clamp(32px,6vw,64px);height:72px;overflow:hidden;border-radius:10px;background:var(--cm-text);color:#fff;box-shadow:inset 0 2px 10px #0005,0 4px 10px #3e63dd22}
.draw-reel span{display:block;font-size:40px;font-weight:700;line-height:72px;font-variant-numeric:tabular-nums;animation:cm-reel calc(700ms + var(--reel)*90ms) linear infinite}
.draw-countdown{font-size:21px;font-weight:650;color:var(--cm-accent-text);min-height:32px}
.draw-celebration{position:relative;text-align:center;padding:28px 16px;margin:-2px 0 26px;border-radius:10px;background:linear-gradient(130deg,#eef2ff,#e9f9ee);overflow:hidden;animation:cm-dialog-in .35s ease-out}
.draw-celebration>span{display:block;font-size:32px;color:#b88000}.draw-celebration>strong{position:relative;display:block;font-size:23px;color:var(--cm-accent-text)}.draw-celebration p{position:relative;margin-bottom:0;color:var(--cm-muted)}
.draw-confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none}.draw-confetti i{position:absolute;left:var(--x);top:-16px;width:8px;height:14px;border-radius:2px;background:hsl(var(--h) 70% 55%);animation:cm-confetti 2400ms calc(var(--i)*55ms) ease-out both}
@keyframes cm-reel{to{transform:translateY(-576px)}}@keyframes cm-confetti{from{transform:translateY(-20px) rotate(0);opacity:1}to{transform:translateY(240px) rotate(400deg);opacity:0}}
.metrics.bank-metrics{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
.advanced-search{border:1px solid var(--cm-border);border-radius:var(--cm-radius);background:var(--cm-surface);margin-bottom:18px;min-width:0;flex:1 1 650px}
.advanced-search>summary{cursor:pointer;padding:13px 16px;font-weight:600;user-select:none;color:var(--cm-accent-text)}
.advanced-search>summary:hover{background:var(--cm-accent-soft);border-radius:var(--cm-radius)}
.advanced-search>summary:focus-visible{outline:2px solid var(--cm-accent);outline-offset:2px}
.filter-status{display:inline-block;margin-left:12px;font-size:12px;font-weight:400;color:var(--cm-muted)}
.advanced-search>form.filters{padding:16px;margin:0!important;border-top:1px solid var(--cm-border)}
/* Chi can lai hang tim kiem va nut them, giu nguyen chieu rong/hinh thuc. */
.toolbar:has(>.advanced-search){align-items:flex-start}
.toolbar>.advanced-search{margin-bottom:0}
.toolbar>.advanced-search>summary{min-height:46px;padding:13px 16px;line-height:20px}
.toolbar:has(>.advanced-search)>button{height:48px;min-height:48px}
.advanced-search>.filter-panel{border:0;border-top:1px solid var(--cm-border);border-radius:0;box-shadow:none;margin:0;padding-bottom:16px}
.filters>input:not([type=checkbox]):not([type=radio]){flex:1 1 240px;width:auto}.filters>select{flex:0 1 210px;width:auto}
.privacy-note{font-size:12px;margin-top:22px}
:host([embedded]){height:auto}.embedded-page{padding:0;width:100%;min-width:0}.contest-tabs{margin-bottom:22px}.contest-panel{min-width:0}.contest-panel[hidden]{display:none}
.privacy-preview{margin-top:24px}.privacy-options{border:1px solid var(--cm-border);border-radius:9px;padding:18px;margin:20px 0 0}.privacy-options legend{font-size:13px;font-weight:600}.privacy-options>.check{margin:12px 0}.privacy-confirm{display:block;max-width:600px;margin:18px 0}.privacy-confirm input{display:block;margin-top:8px}.privacy-confirm strong{color:var(--cm-danger)}.privacy-danger{border-color:#efc0c3;background:#fffdfd}
.draw-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:18px 0}.draw-fields label{display:block;min-width:0}.draw-fields input,.draw-fields select{display:block;margin-top:7px}.required{color:var(--cm-danger)}.draw-preview{border-top:1px solid var(--cm-border);margin-top:18px;padding-top:20px}.draw-preview>strong{font-size:22px;color:var(--cm-accent-text)}.draw-preview meter{width:100%;min-width:100px;accent-color:var(--cm-accent)}
#draw-result:fullscreen{background:var(--cm-surface);padding:40px;overflow:auto;border:0;border-radius:0}#draw-result:fullscreen .export-actions{display:none}#draw-result:fullscreen h2{font-size:32px}#draw-result:fullscreen td{font-size:24px;padding:18px}#draw-result:fullscreen .mono{font-size:20px}#draw-result:fullscreen .scroll{max-height:70vh}
@media(max-width:760px){.draw-fields{grid-template-columns:1fr}}
.toolbar .filters{min-width:0;flex-basis:650px}.toolbar .filters input{flex:1;min-width:200px}.toolbar .filters select{flex:1;min-width:155px;max-width:230px}
.filter-panel .filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:end;gap:16px}
.filter-panel .wide{grid-column:span 2}
label{font-size:13px;font-weight:500;line-height:1.5}
.filter-panel label{display:flex;flex-direction:column;gap:7px;min-width:0}
input,select,textarea,button{font:inherit;line-height:1.4}
input:not([type=checkbox]):not([type=radio]),select,textarea{
  width:100%;min-width:0;border:1px solid var(--cm-border-strong);border-radius:7px;padding:9px 11px;
  background:var(--cm-surface);color:var(--cm-text);box-shadow:0 1px 2px #19203303;min-height:38px;
  transition:border-color .15s,box-shadow .15s,background .15s;
}
select{
  appearance:none;padding-right:36px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2314233B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 12px center;background-size:16px;
}
/* Style native pickers without replacing form controls or their change events.
   Browsers without customizable selects retain the existing native picker. */
@supports (appearance:base-select){
  select:not([multiple]):not([size]),select:not([multiple]):not([size])::picker(select){appearance:base-select}
  select:not([multiple]):not([size]){background-image:none;padding-inline-end:12px;gap:8px;align-items:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
  select:not([multiple]):not([size]):disabled{cursor:not-allowed}
  select:not([multiple]):not([size])::picker-icon{content:'';width:7px;height:7px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg);flex-shrink:0;margin-inline-start:auto;color:var(--cm-muted)}
  select:not([multiple]):not([size]):open::picker-icon{transform:translateY(2px) rotate(225deg);color:var(--cm-accent)}
  select:not([multiple]):not([size]):open{border-color:var(--cm-accent);box-shadow:0 0 0 3px #0e7c721a}
  select:not([multiple]):not([size])::picker(select){
    box-sizing:border-box;min-inline-size:anchor-size(self-inline);inline-size:max-content;
    max-inline-size:min(560px,calc(100vw - 24px));max-block-size:min(320px,50dvh);
    margin-block:5px;padding:6px;border:1px solid var(--cm-border);border-radius:12px;
    background:var(--cm-surface);color:var(--cm-text);font:inherit;
    box-shadow:0 12px 32px #14233b24,0 2px 8px #14233b0d;
    overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#c5d4d1 transparent;
  }
  select:not([multiple]):not([size]) option{
    display:flex;align-items:center;gap:12px;min-block-size:36px;padding:8px 12px;
    border:0;border-radius:7px;background:var(--cm-surface);color:var(--cm-text);
    font:inherit;line-height:1.5;white-space:normal;overflow-wrap:anywhere;cursor:pointer;
  }
  select:not([multiple]):not([size]) option+option{margin-block-start:2px}
  select:not([multiple]):not([size]) option:checked{background:var(--cm-accent-soft);color:var(--cm-accent-text);font-weight:600}
  select:not([multiple]):not([size]) option:hover,select:not([multiple]):not([size]) option:focus{background:#eef5f3;outline:none}
  select:not([multiple]):not([size]) option:checked:hover,select:not([multiple]):not([size]) option:checked:focus{background:#c7e9e3}
  select:not([multiple]):not([size]) option::checkmark{order:1;margin-inline-start:auto;flex-shrink:0;color:var(--cm-accent);font-weight:700}
  select:not([multiple]):not([size]) option:disabled{color:var(--cm-muted);opacity:.55;cursor:not-allowed}
}
@media(forced-colors:active){
  select{appearance:auto;background-image:none}
  select:not([multiple]):not([size]),select:not([multiple]):not([size])::picker(select){appearance:auto}
}
input::placeholder,textarea::placeholder{color:var(--cm-muted);font-weight:400}
input:hover:not(:disabled):not([readonly]),select:hover:not(:disabled),textarea:hover:not(:disabled){border-color:#a5a7b3}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--cm-accent);box-shadow:0 0 0 3px #14233b22}
input[readonly],input:disabled,select:disabled,textarea:disabled{background:var(--cm-hover);color:var(--cm-muted)}
textarea{resize:vertical;min-height:78px;line-height:1.6}
input[type=checkbox],input[type=radio]{width:17px;height:17px;min-width:17px;min-height:17px;margin:0;accent-color:var(--cm-accent);vertical-align:middle;cursor:pointer}
input[type=checkbox]:disabled,input[type=radio]:disabled{cursor:not-allowed;opacity:.55}
button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:8px 13px;
  border:1px solid var(--cm-border-strong);border-radius:7px;background:var(--cm-surface);color:var(--cm-text);
  cursor:pointer;font-size:13px;font-weight:500;white-space:nowrap;box-shadow:0 1px 2px #19203305;
  transition:background .15s,border-color .15s,box-shadow .15s,transform .1s;
}
button:hover:not(:disabled){background:var(--cm-hover);border-color:#b9bbc6}
button:active:not(:disabled){transform:translateY(1px)}
button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #14233b80;outline-offset:3px}
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
/* Chua cho phan trang duoi danh sach cau hoi trong workspace. */
:host(antc-contest-questions-table) .table-wrap{max-height:clamp(160px,calc(100dvh - 460px),54dvh)}
table{width:100%;border-collapse:separate;border-spacing:0;background:var(--cm-surface);font-size:13px}
.table-wrap table{min-width:800px}
th,td{text-align:left;padding:13px 15px;vertical-align:middle;border:0;border-bottom:1px solid var(--cm-border);line-height:1.55}
thead th{position:sticky;top:0;z-index:2;background:var(--cm-subtle);font-size:12px;font-weight:600;color:var(--cm-muted);white-space:nowrap;box-shadow:0 1px var(--cm-border)}
tbody tr:last-child td{border-bottom:0}tbody tr{transition:background .12s}tbody tr:nth-child(even){background:var(--cm-subtle)}tbody tr:hover{background:var(--cm-hover)}
td.actions{display:table-cell;white-space:nowrap;text-align:right;margin:0}td.actions button+button{margin-left:6px}
td.actions button{min-height:30px;padding:5px 9px;font-size:12px}
.nowrap{white-space:nowrap}.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;color:var(--cm-muted)}
td:first-child .mono,td.mono{white-space:nowrap}
.question{max-width:440px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.6}
td.question{display:table-cell;min-width:260px;max-width:560px;white-space:pre-wrap;overflow-wrap:anywhere}
dialog td.question{max-width:620px}
.badge{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:500;white-space:nowrap;line-height:1.7}
.badge::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor}
.badge.on,.badge.positive{background:var(--cm-positive-soft);color:var(--cm-positive)}
.badge.off,.badge.neutral{background:var(--cm-hover);color:var(--cm-muted)}
.answer{display:inline-grid;place-items:center;width:28px;height:28px;background:var(--cm-accent-soft);color:var(--cm-accent-text);border:1px solid #d9e2fc;border-radius:7px;font-weight:700;font-size:12px}
.empty,.empty-state{text-align:center;padding:44px 20px;color:var(--cm-muted)}
.pager{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin:18px 0 0;color:var(--cm-muted);font-size:12px;font-variant-numeric:tabular-nums}
.pager{flex-wrap:wrap}.page-size{display:inline-flex;align-items:center;gap:8px;font-size:12px;white-space:nowrap}.page-size select{width:76px;min-height:32px;padding:5px 8px}
.local-pager{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin:16px 0 0;font-size:12px;color:var(--cm-muted);font-variant-numeric:tabular-nums}
.local-pager label,.page-buttons{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.local-pager label{font-size:12px;white-space:nowrap}.local-pager select{width:80px;min-height:32px;padding:5px 32px 5px 8px}.local-pager button{min-height:32px;padding:6px 9px}.page-buttons>span{white-space:nowrap}.entry-content .local-pager{padding:0 16px 16px}.page-range{white-space:nowrap}
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
.metrics article strong{display:block;color:var(--cm-text);font-size:32px;line-height:1.2;font-weight:700;letter-spacing:-1px;font-variant-numeric:tabular-nums;margin:12px 0 8px}
.metrics article:first-child{border-color:var(--cm-border-strong);background:linear-gradient(130deg,var(--cm-accent-soft),var(--cm-surface))}
.metric-caption{font-size:11px;color:var(--cm-muted)}
.dashboard-panels{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(240px,1fr);gap:20px;align-items:start}
.chart{display:flex;align-items:flex-end;gap:14px;overflow:auto;min-height:215px;padding:10px 0 0;scrollbar-width:thin}
.chart>div{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:11px;font-variant-numeric:tabular-nums;color:var(--cm-muted)}
.chart svg{fill:var(--cm-accent);flex-shrink:0;border-bottom:1px solid var(--cm-border)}.chart rect{rx:4px}
.chart>div:hover svg{fill:var(--cm-accent-hover)}
.check{display:flex!important;align-items:center;flex-direction:row!important;gap:9px;cursor:pointer;font-weight:450}
.publication-draw{border:1px solid var(--cm-border);border-radius:8px;padding:14px;margin:10px 0;background:var(--cm-subtle)}
.publication-draw:has(input:checked){background:var(--cm-accent-soft);border-color:var(--cm-accent)}
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
.form-grid label,.answer-row label{display:block;font-size:13px;font-weight:500;min-width:0}
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
.entry-summary dt{font-size:11px;color:var(--cm-muted);margin-bottom:5px}.entry-summary dd{margin:0;font-size:13px;font-weight:500;overflow-wrap:anywhere}.entry-summary dl{margin:0}
.entry-content{padding:4px 26px 24px}.entry-content details{margin:18px 0 0;border:1px solid var(--cm-border);border-radius:9px;overflow:hidden}
.entry-content summary{display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer;padding:14px 16px;background:var(--cm-subtle);font-size:13px;font-weight:600;list-style:none}
.entry-content summary::before{content:'›';font-size:19px;color:var(--cm-muted)}.entry-content details[open]>summary::before{transform:rotate(90deg)}
.entry-content summary strong{flex:1}.entry-content .scroll{border:0;border-top:1px solid var(--cm-border);border-radius:0;max-height:480px}
.result-correct{color:var(--cm-positive);font-weight:600}.result-incorrect{color:var(--cm-danger)}.result-unanswered{color:var(--cm-muted)}
@keyframes cm-spin{to{transform:rotate(360deg)}}@keyframes cm-dialog-in{from{opacity:0;transform:translateY(6px) scale(.99)}to{opacity:1;transform:none}}
@media(min-width:1280px){.toolbar .filters{flex-wrap:nowrap}.toolbar .filters input{min-width:160px}.toolbar .filters select{min-width:130px}.metrics article{min-width:0}.scroll,.table-wrap{overscroll-behavior:contain}}
@media(min-width:1600px){.page{padding-inline:36px}.filter-panel .filters{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(max-width:1100px){.metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.filter-panel .filters{grid-template-columns:repeat(3,minmax(0,1fr))}.dashboard-panels{grid-template-columns:1fr}.page-context{display:none}}
@media(max-width:760px){.page{padding:0 16px 24px}.page-heading{padding:22px 0 20px}h1{font-size:24px}.filter-panel .filters{grid-template-columns:repeat(2,minmax(0,1fr))}.filter-panel .wide{grid-column:1/-1}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.box,section,.report-panel{padding:16px}.filter-panel{padding:16px 16px 0}.toolbar{align-items:stretch}.toolbar .filters{flex-basis:100%}.toolbar .filters select{max-width:none}.form-grid{grid-template-columns:1fr;padding:20px;gap:16px}.wide{grid-column:auto}.answers{padding:0 20px}.answer-row{grid-template-columns:52px minmax(0,1fr);gap:12px;padding:12px}.answer-row>label:last-child{grid-column:2}.tree-heading{margin:0 20px 12px;flex-wrap:wrap}.contest-tree{margin:0 20px 20px}.tree-questions{padding-left:20px}.tree-question{grid-template-columns:auto 60px minmax(0,1fr)}.tree-question em{grid-column:3}.entry-summary{grid-template-columns:repeat(2,minmax(0,1fr));padding:20px}.entry-content{padding-inline:16px}dialog,dialog.large,dialog.entry-dialog{width:calc(100vw - 24px);max-height:94dvh}dialog form>header,.dialog-header{padding:18px 20px}dialog form>footer,.dialog-footer{padding:14px 20px}.pager{justify-content:space-between}}
@media(max-width:460px){.filter-panel .filters{grid-template-columns:1fr}.metrics{gap:10px}.metrics article{padding:15px 12px}.metrics article strong{font-size:27px}.entry-summary{grid-template-columns:1fr}.toolbar>button{width:100%}}
/* ANTC mockup: emerald controls, quiet surfaces and section-based editing. */
:host{--cm-top:#0B3B3A;background:var(--cm-page)}
.page{padding:0 32px 32px;max-width:1800px;margin:auto}
.page-heading{padding:26px 0 24px;align-items:center}.eyebrow{letter-spacing:.08em;color:var(--cm-muted);margin-bottom:6px}.eyebrow::before{display:none}
h1{font-size:28px;letter-spacing:-.7px;line-height:1.4}h2{font-size:17px}
.page-description{font-size:13px}.box,section,.report-panel{box-shadow:none}
input:focus,select:focus,textarea:focus{border-color:var(--cm-accent);box-shadow:0 0 0 3px #0e7c721a}
button:focus-visible,a:focus-visible,summary:focus-visible{outline-color:#0e7c7280}
button{border-radius:9px;min-height:38px}button.primary{box-shadow:none}
.table-wrap,.scroll{border-color:var(--cm-border)}
tbody tr:nth-child(even){background:var(--cm-surface)}tbody tr:hover{background:#F8FAFC}
th,td{padding:15px 16px}thead th{background:#F8F9FC;color:#5B6478}
.badge{border-radius:99px;padding:3px 10px}.badge.upcoming{background:#EEF0FC;color:#3544B1}.answer{border-color:#B9E2DB;background:#E3F4F1;color:#0A5E57}
.toolbar{margin-bottom:18px}.tabs{background:transparent;padding:0;border-bottom:1px solid var(--cm-border);border-radius:0;gap:20px}
.tabs button{border:0;border-radius:0;padding:12px 2px;background:transparent}
.tabs button.primary,.tabs button.primary:hover{color:var(--cm-accent-text);background:transparent;border:0;border-bottom:2px solid var(--cm-accent);box-shadow:none}
.list-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 20px}.list-heading p{margin:0;font-size:13px}
.campaign-list-tools{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}.campaign-list-tools .status-tabs{margin:0;gap:2px}.campaign-list-tools .status-tabs button{font-size:12px;padding:8px}.campaign-search{flex:0 1 350px;flex-wrap:nowrap}.campaign-search input{width:auto;flex:1;min-width:120px}.campaign-list .summary{margin:10px 0}.campaign-list .table-wrap{border-inline:0;border-bottom:0;border-radius:0}.campaign-list th{text-transform:uppercase;font-weight:500}.campaign-list .table-wrap table{min-width:760px}.daily-chart>div{flex:0 0 32px;max-width:40px}.daily-chart{justify-content:flex-start}.draw-prize-cards{margin-bottom:16px}
.status-tabs button.primary:hover:not(:disabled){background:#C7E9E3;color:#0A5E57;border-color:transparent}
.schedule-card{padding:20px 24px}.schedule-months{display:grid;grid-template-columns:repeat(6,1fr);color:var(--cm-muted);font-size:12px;padding:0 0 10px}
.schedule-track{position:relative;border-top:1px solid var(--cm-border);background:repeating-linear-gradient(to right,transparent 0,transparent calc(16.6667% - 1px),var(--cm-border) calc(16.6667% - 1px),var(--cm-border) 16.6667%)}
.schedule-bar{position:absolute;z-index:1;min-height:30px;height:30px;text-align:left;justify-content:flex-start;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:block;font-size:11px;padding:5px 8px;border:1px solid #D6DCE8;border-radius:6px;background:#EEF0F5;color:#5B6478;min-width:0}
.schedule-bar.live{background:#E3F4F1;border-color:#B9E2DB;color:#0A5E57}.schedule-bar.upcoming{background:#EEF0FC;border-color:#C9CEF5;color:#3544B1}
.schedule-today{position:absolute;top:0;bottom:0;width:1px;background:#0E7C72;z-index:2;pointer-events:none}.schedule-today span{position:absolute;bottom:-17px;transform:translateX(-50%);white-space:nowrap;font-size:10px;color:#0A5E57;background:#fff;padding:0 3px}
.status-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}.status-tabs button{border:0;box-shadow:none;background:transparent;color:var(--cm-muted);padding:8px 10px}.status-tabs button.primary{background:var(--cm-accent-soft);color:var(--cm-accent-text)}.status-tabs button span{font-size:11px;border-radius:99px;background:#EEF0F5;padding:1px 7px}.status-tabs button.primary span{background:#C7E9E3}
.campaign-name{display:flex;justify-content:flex-start;text-align:left;white-space:normal;gap:9px;padding:0;border:0;box-shadow:none;color:var(--cm-text);background:transparent;max-width:360px}.campaign-name:hover:not(:disabled){background:transparent;color:var(--cm-accent-text)}.campaign-name+.block{max-width:360px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.schedule-progress{height:4px;border-radius:4px;background:#E3F4F1;margin-top:9px;overflow:hidden}.schedule-progress span{display:block;height:100%;background:#0E7C72}
dialog.campaign-editor{position:fixed;inset:0;margin:0 0 0 auto;width:calc(100vw - 260px);max-width:1500px;height:100dvh;max-height:100dvh;border:0;border-left:1px solid var(--cm-border);border-radius:0;background:var(--cm-page)}
.campaign-editor form>header{background:var(--cm-page);padding:20px 32px;border-bottom:0;align-items:flex-start}.campaign-editor header h2{font-size:24px;margin-top:10px}.campaign-editor header .badge{vertical-align:middle;font-size:11px;letter-spacing:0;margin-left:10px}
.editor-back{background:transparent;border:0;padding:0;min-height:24px;color:var(--cm-muted);box-shadow:none;font-size:12px}
.campaign-editor-body{display:grid;grid-template-columns:190px minmax(0,1fr);align-items:start;gap:24px;padding:10px 32px 28px}
.editor-nav{position:sticky;top:170px;background:#fff;border:1px solid var(--cm-border);border-radius:14px;padding:8px;display:grid;gap:4px}.editor-nav button{justify-content:flex-start;white-space:normal;text-align:left;border:0;box-shadow:none;padding:10px;background:transparent;font-size:12px}.editor-nav button span{display:inline-grid;place-items:center;border-radius:50%;width:22px;height:22px;flex-shrink:0;background:#EEF0F5;color:#5B6478}.editor-nav button[aria-current]{background:var(--cm-accent-soft);color:var(--cm-accent-text)}.editor-nav button[aria-current] span{background:var(--cm-accent);color:#fff}
.editor-sections{min-width:0}.editor-section{scroll-margin-top:180px;padding:24px;margin:0 0 18px}.editor-section>.form-grid{padding:0;gap:20px}.editor-section h2{margin:0 0 20px;font-size:17px}.editor-section .tree-heading,.editor-section .contest-tree{margin:0 0 16px}.editor-section .tree-heading h3{display:none}.editor-section .tree-heading p{margin:0}.editor-section .contest-prize-picker{margin:0;padding:0;background:transparent;border:0}.editor-section .contest-prize-picker>summary{font-size:13px;color:var(--cm-muted)}
details.editor-section{border:1px solid var(--cm-border);border-radius:14px;background:#fff}.editor-section>summary{font-size:15px;font-weight:600;cursor:pointer}.editor-section>summary small{font-weight:400}.editor-section[open]>summary{margin-bottom:20px}
.editor-lock-note{margin:0 32px 14px;padding:14px 18px;border:1px solid #F3D6A5;border-radius:10px;background:#FFF7E8;color:#8C5711;font-size:12px;line-height:1.7}
.campaign-editor .visibility-switch{background:#F8F9FC;border:0;padding:14px}.visibility-switch input{appearance:none;position:relative;width:40px!important;min-width:40px;height:24px;border:0;border-radius:99px;background:#CCD3E0}.visibility-switch input:checked{background:var(--cm-accent)}.visibility-switch input::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;box-shadow:0 1px 3px #0002}.visibility-switch input:checked::after{left:19px}
.campaign-editor form>footer{padding:16px 32px;background:#fff}.editor-save-status{margin-right:auto;color:var(--cm-muted);font-size:12px}.editor-save-status.dirty{color:#B25E09}
.attempt-stepper{display:flex;align-items:center;margin-top:7px;width:max-content;border:1px solid var(--cm-border-strong);border-radius:9px;overflow:hidden}.attempt-stepper input{width:70px!important;border:0!important;box-shadow:none!important;text-align:center;margin:0!important;border-radius:0!important;-moz-appearance:textfield}.attempt-stepper input::-webkit-inner-spin-button{appearance:none}.attempt-stepper button{border:0;border-radius:0;box-shadow:none;width:38px;background:#F8F9FC}.hard-question{padding:12px 0;border-bottom:1px solid var(--cm-border);margin-bottom:12px}.hard-question p{font-size:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.hard-question .panel-heading{margin-bottom:8px;font-size:12px}.hard-question meter{width:100%;height:6px;accent-color:var(--cm-accent)}.question-preview-trigger{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-align:left;white-space:normal;padding:0;border:0;box-shadow:none;background:transparent;color:var(--cm-text);font-size:13px;font-weight:500;line-height:1.7}.question-preview-trigger:hover:not(:disabled){color:var(--cm-accent-text);background:transparent}.question-workspace{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:20px;align-items:start}.question-workspace.no-preview{grid-template-columns:minmax(0,1fr)}:host(antc-contest-questions-table) .table-wrap table{min-width:700px}:host(antc-contest-questions-table) th:nth-child(2){width:32%}:host(antc-contest-questions-table) td:nth-child(2){min-width:200px}:host(antc-contest-questions-table) td:nth-child(3){min-width:130px}.question-preview{position:sticky;top:0;padding:24px;background:#fff;border:1px solid var(--cm-border);border-radius:14px}.question-preview h2{font-size:16px;line-height:1.7;margin:20px 0}.question-preview .preview-answer{display:flex;gap:12px;padding:12px;margin-bottom:8px;background:#F8F9FC;border:1px solid var(--cm-border);border-radius:9px;font-size:12px}.question-preview .preview-answer.correct{background:#E3F4F1;border-color:#B9E2DB}.preview-answer strong{display:grid;place-items:center;width:24px;height:24px;flex-shrink:0;border-radius:50%;background:#fff}.preview-answer.correct strong{background:#0E7C72;color:#fff}.question-preview p{font-size:12px}.question-preview .panel-heading{margin:0}.question-preview .actions{margin-bottom:0}
.dashboard-banner{background:linear-gradient(110deg,#0B3B3A,#0E5D55);border:0;color:#fff;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;padding:26px}.dashboard-banner h2{font-size:23px;margin:12px 0 8px}.dashboard-banner .muted{color:#C0DDD8}.dashboard-banner .badge{background:#ffffff20;color:#D7FFF0}.dashboard-banner .actions{margin:0;align-self:center}.dashboard-banner a{color:#fff;border:1px solid #ffffff40;border-radius:9px;padding:10px 14px;text-decoration:none;font-size:12px}.dashboard-banner a:first-child{background:#fff;color:#0A5E57}.dashboard-banner .schedule-progress{background:#ffffff20;max-width:560px}.dashboard-banner .schedule-progress span{background:#70D7BE}
.dashboard-panels{margin-bottom:20px;grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr)}.dashboard-panels section{margin:0}.dashboard-panels .chart{min-height:200px}.dashboard-links{display:grid;gap:12px}.dashboard-links a{display:block;padding:14px;border:1px solid var(--cm-border);border-radius:10px;text-decoration:none;color:var(--cm-text)}.dashboard-links a:hover{background:var(--cm-accent-soft)}.dashboard-links small{display:block;margin-top:5px}.chart.daily-chart{gap:6px}.daily-chart>div{flex:0 0 32px;min-width:24px}.daily-chart svg{width:100%}.metrics article:first-child{background:#fff;border-color:var(--cm-border)}.metrics article strong{font-size:30px}.metrics article::before{content:'';display:block;width:28px;height:4px;border-radius:4px;background:#0E7C72;margin-bottom:14px}.metrics article:nth-child(2)::before{background:#3544B1}.metrics article:nth-child(3)::before{background:#B25E09}.metrics article:nth-child(4)::before{background:#6941C6}
.draw-workspace{display:grid;grid-template-columns:minmax(300px,.85fr) minmax(0,1.3fr);gap:22px;align-items:start;margin-bottom:22px}.draw-workspace>section{margin:0}.draw-workspace .draw-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.draw-workspace .draw-fields>label:first-child,.draw-workspace .draw-fields>label:nth-child(2),.draw-workspace .draw-fields>label:last-child{grid-column:1/-1}.draw-workspace .draw-preview .table-wrap{max-height:320px}.draw-stage{background:radial-gradient(ellipse at top,#155D55,transparent 80%),#0B3B3A;border-color:#0B3B3A;color:#fff;padding:36px 20px}.draw-stage .eyebrow,.draw-stage .muted,.draw-stage .draw-countdown{color:#C0DDD8}.draw-stage .draw-reel{background:#ffffff10;border:1px solid #ffffff20;box-shadow:inset 0 2px 8px #0002}.draw-idle .draw-reel{display:grid;place-items:center;font-size:30px;font-weight:700;height:60px}.draw-idle h2{font-size:22px}.draw-prize-cards{display:grid;gap:8px;margin-top:14px}.draw-prize-cards button{justify-content:space-between;text-align:left;white-space:normal;padding:12px}.draw-prize-cards button[aria-pressed=true]{background:#E3F4F1;border-color:#0E7C72;color:#0A5E57}.draw-prize-cards small{font-size:11px}.draw-prize-cards span{display:block}
@media(max-width:1200px){.question-workspace{grid-template-columns:minmax(0,1fr) 280px}.campaign-editor-body{grid-template-columns:160px minmax(0,1fr);gap:16px;padding-inline:24px}.contest-prize-option{grid-template-columns:minmax(0,1fr) 80px}.contest-prize-option>label:nth-of-type(3){grid-column:1/-1}.dashboard-banner{grid-template-columns:1fr}}
@media(max-width:1000px){.question-workspace{grid-template-columns:1fr}.question-preview{position:static}.draw-workspace,.dashboard-panels{grid-template-columns:1fr}dialog.campaign-editor{width:100vw}.page{padding-inline:20px}}
@media(max-width:760px){.page{padding:0 16px 24px}.campaign-editor-body{grid-template-columns:1fr;padding:0 16px 20px}.editor-nav{position:static;display:flex;overflow:auto;border-radius:10px;gap:4px}.editor-nav button{flex-shrink:0}.editor-section{padding:18px;scroll-margin-top:160px}.editor-lock-note{margin-inline:16px}.campaign-editor form>header{padding:16px}.campaign-editor header h2{font-size:20px}.campaign-editor form>footer{padding:14px 16px;flex-wrap:wrap}.editor-save-status{flex-basis:100%}.list-heading{align-items:flex-start}.list-heading p{max-width:60%}.schedule-card{padding:16px}.dashboard-banner{padding:20px}.dashboard-banner h2{font-size:20px}.dashboard-banner .actions{flex-wrap:wrap}.status-tabs{gap:4px}.status-tabs button{font-size:11px;padding:7px}.draw-workspace .draw-fields{grid-template-columns:1fr}}
/* Compact page rhythm; keep control sizes and editor form spacing intact. */
.page-heading{padding:16px 0 12px;gap:16px}
.page-heading h1{margin-bottom:6px}.page-heading .eyebrow{margin-bottom:4px}
.toolbar{gap:12px;margin-bottom:12px;padding-bottom:0}
.toolbar>.actions{margin:0}
.tabs{gap:16px}.tabs button{padding:8px 2px}
.box,section,.report-panel{padding:16px;margin-bottom:14px}
.filter-panel{padding:16px 16px 0;margin-bottom:14px}
.advanced-search{margin-bottom:12px}
.metrics{gap:12px;margin-bottom:14px}
.dashboard-panels{gap:14px;margin-bottom:14px}
.draw-workspace{gap:16px;margin-bottom:14px}
.list-heading{margin-bottom:14px}
.summary{margin:14px 0 10px}.pager{margin-top:12px}
th,td{padding:12px 14px}
/* Match the contest list's nested header and calendar to the other compact pages. */
:host(antc-contest-view) .page-heading{padding-bottom:4px}
:host(antc-contest-view) .page-heading h1{margin-bottom:0}
:host(antc-contest-table) .list-heading{align-items:flex-start;gap:10px;margin-bottom:10px}
:host(antc-contest-table) .list-heading p{padding-top:4px}
.schedule-card{padding:12px 16px;margin-bottom:10px}
.schedule-card .panel-heading{margin-bottom:8px}
.schedule-card h2{font-size:16px}
.schedule-months{padding-bottom:6px}
.schedule-track{margin-bottom:14px}
.schedule-bar{height:28px;min-height:28px;padding:4px 8px}
.campaign-list-tools{margin-bottom:8px}
.campaign-list .summary{margin:8px 0}
.campaign-list th,.campaign-list td{padding:10px 14px}
.campaign-name{min-height:0;line-height:1.5}
.campaign-list .pager{margin-top:10px}
.campaign-dates{display:grid;gap:0;justify-items:center;width:max-content;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-variant-numeric:tabular-nums}
.campaign-dates time{display:block;line-height:1.5}
.campaign-date-arrow{color:var(--cm-muted);font-family:system-ui,sans-serif;font-size:14px;line-height:12px}
@media(max-width:760px){.page-heading{padding:14px 0 10px}.toolbar{gap:10px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media(forced-colors:active){button,input,select,textarea,.badge,.answer{border:1px solid ButtonText}button:focus-visible{outline:2px solid Highlight}}
`;

export const contestStyles = unsafeCSS(contestStylesText);

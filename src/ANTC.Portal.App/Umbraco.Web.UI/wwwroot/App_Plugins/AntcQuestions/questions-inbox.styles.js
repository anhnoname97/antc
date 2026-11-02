import { css } from '@umbraco-cms/backoffice/external/lit';

export const inboxStyles = css`
    :host { display:block; height:100%; min-width:0; color:#202438; --inbox-accent:#0b8078; }
    *, *::before, *::after { box-sizing:border-box; }
    button, input, textarea, select { font:inherit; }
    button { cursor:pointer; color:inherit; }
    button:disabled { opacity:.5; cursor:default; }
    :focus-visible { outline:2px solid #0b8078; outline-offset:3px; }
    .inbox-layout { display:grid; grid-template-columns:230px 362px minmax(0,1fr); height:100%; min-height:0; background:#fff; font-size:14px; line-height:1.5; }
    .inbox-layout h1,.inbox-layout h2,.inbox-layout h3,.inbox-layout p { margin:0; }
    .mail-sidebar { padding:20px 14px; border-right:1px solid #e3e8f2; overflow:auto; min-height:0; }
    .primary { background:var(--inbox-accent); color:white; border-color:var(--inbox-accent)!important; font-weight:700; }
    .create-question { display:flex; align-items:center; justify-content:center; gap:9px; width:100%; min-height:44px; border:0; border-radius:10px; font-size:14px; }
    .create-question>span { font-size:22px; font-weight:400; line-height:1; }
    .inbox-layout .nav-heading { font-size:12px; letter-spacing:.06em; font-weight:700; text-transform:uppercase; color:#707b92; padding:18px 12px 6px; }
    .folders,.type-nav { display:grid; gap:1px; }
    .folder { display:flex; align-items:center; gap:10px; border:0; background:transparent; padding:10px 12px; min-height:40px; border-radius:10px; text-align:left; }
    .folder>span { flex:1; font-weight:500; }
    .folder b { min-width:24px; text-align:center; border-radius:20px; padding:0 6px; background:#eef0f6; font-size:12px; color:#4c5670; }
    .folder.active { background:#e2f3f0; color:#00665e; }
    .folder.active>span { font-weight:700; }
    .folder.active b { background:var(--inbox-accent); color:#fff; }
    .folder-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; background:#8c96ac; }
    .folder-dot.new { background:#ee9300; }.folder-dot.working { background:#4546bd; }.folder-dot.pending { background:#7243ce; }.folder-dot.answered { background:#209947; }.folder-dot.public { background:#0d8078; }
    .inbox-layout .type-heading { padding-top:23px; }
    .type-nav button,.sidebar-tools button { display:block; width:100%; text-align:left; border:0; background:transparent; padding:10px 12px; border-radius:7px; font-size:14px; }
    .type-nav button.active { background:#f0f3fa; color:#0b8078; font-weight:700; }
    .sidebar-tools { border-top:1px solid #edf0f6; margin-top:22px; padding-top:12px; }
    .mail-list { display:flex; flex-direction:column; min-height:0; min-width:0; border-right:1px solid #e3e8f2; }
    .list-header { padding:17px 16px 12px; flex-shrink:0; }
    .list-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
    .inbox-layout .list-heading h1 { font-size:21px; font-weight:750; line-height:1.4; letter-spacing:-.02em; }
    .list-selection-toggle { border:0; background:transparent; color:#65718a; font-size:11px; font-weight:600; padding:5px 0 5px 8px; max-width:145px; line-height:1.4; text-align:right; border-radius:5px; }
    .list-selection-toggle[aria-pressed="true"] { color:#37445d; }
    .auto-update { font-size:12px; color:#65708a; white-space:nowrap; }
    .search-box { border:1px solid #d8deeb; border-radius:10px; min-height:42px; display:flex; align-items:center; gap:10px; padding:0 12px; }
    .search-box umb-icon { width:15px; height:15px; color:#63708c; flex-shrink:0; }
    .search-box input:focus,.search-box input:focus-visible { outline:none; border:0; box-shadow:none; }
    .search-box input { min-width:0; width:100%; border:0; background:transparent; height:39px; color:inherit; outline-offset:0; }
    .advanced-filters { margin-top:8px; font-size:11px; color:#65718a; }
    .advanced-filters summary { cursor:pointer; }
    .advanced-filters form { display:flex; align-items:flex-end; flex-wrap:wrap; gap:6px; margin-top:8px; }
    .advanced-filters label { flex:1; min-width:120px; }
    .advanced-filters input { display:block; width:100%; padding:6px; border:1px solid #d8deeb; border-radius:5px; }
    .advanced-filters button { height:34px; flex-shrink:0; border:1px solid var(--inbox-accent); border-radius:7px; padding:0 12px; background:var(--inbox-accent); color:#fff; font-size:12px; font-weight:600; white-space:nowrap; }
    .advanced-filters button:hover { background:#086f68; border-color:#086f68; }
    .message-list { flex:1; overflow:auto; min-height:0; }
    .message-item { position:relative; display:flex; border-bottom:1px solid #edf0f6; border-left:3px solid transparent; background:#fff; }
    .message-item:hover { background:#f7fafb; }.message-item.selected { background:#e1f3f0; border-left-color:var(--inbox-accent); }
    .message-button { display:block; text-align:left; width:100%; min-width:0; border:0; background:transparent; padding:12px 16px 11px 13px; }
    .message-meta { display:flex; align-items:center; gap:9px; font-size:11px; color:#66708a; margin-bottom:4px; }
    .message-meta time { margin-left:auto; white-space:nowrap; }
    .type-badge { display:inline-block; white-space:nowrap; border-radius:20px; background:#e9eaff; color:#313bac; padding:1px 9px; font-size:11px; line-height:1.4; font-weight:700; }
    .type-badge.gop-y { background:#dff3f1; color:#00756e; }.type-badge.kiennghi { background:#efe7ff; color:#6940bd; }
    .row-status { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .message-title { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-size:14px; font-weight:700; line-height:1.45; margin-bottom:2px; }
    .message-preview { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#626e86; font-size:13px; }
    .aggregation-tag { display:block; color:#0b8078; font-size:11px; padding-top:4px; }
    .row-checkbox { flex-shrink:0; margin:18px 0 0 9px; align-self:flex-start; accent-color:var(--inbox-accent); }
    .select-page-control { display:flex; align-items:center; gap:8px; padding:9px 16px; font-size:12px; border-bottom:1px solid #edf0f6; color:#65718a; }
    .select-page-control input { accent-color:var(--inbox-accent); }
    .empty-list { padding:35px 18px; text-align:center; color:#65718a; }
    .list-pagination { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-top:1px solid #edf0f6; font-size:11px; color:#65718a; }
    .list-pagination button { width:28px; height:28px; border:1px solid #d8deeb; border-radius:6px; background:white; }
    .bulk-toolbar { padding:12px; background:#edf5f3; border-bottom:1px solid #d8e9e5; font-size:12px; }
    .bulk-toolbar p { margin:6px 0!important; color:#626e86; font-size:11px; }.bulk-toolbar>div { display:flex; gap:5px; flex-wrap:wrap; }
    .bulk-toolbar button { border:1px solid #d8deeb; border-radius:5px; background:white; font-size:11px; padding:5px 8px; }
    .mail-detail { background:#f4f5fa; padding:24px 28px; overflow:auto; min-width:0; min-height:0; }
    .detail-meta { display:flex; align-items:center; flex-wrap:wrap; gap:10px; font-size:13px; color:#626e86; margin-bottom:9px; }
    .inbox-layout .detail-heading h2 { font-size:25px; font-weight:750; line-height:1.35; letter-spacing:-.02em; margin-bottom:14px; }
    .submission-card { border:1px solid #e1e6f1; border-radius:16px; background:#fff; padding:19px 20px; margin-bottom:14px; }
    .sender-heading { display:flex; align-items:center; gap:12px; margin-bottom:14px; }.sender-heading strong { font-size:14px; font-weight:700; }
    .avatar { display:grid; place-items:center; flex-shrink:0; width:40px; height:40px; border-radius:50%; background:#e8eafd; color:#343daa; font-size:14px; font-weight:700; }
    .sender-heading p { font-size:13px; color:#65718a; overflow-wrap:anywhere; }
    .original-content { white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.8; font-size:15px; }
    .common-reply-button { margin-top:14px; padding:8px 12px; border:1px solid #b5d9d3; border-radius:8px; color:#086f66; background:#edf8f5; font-size:12px; font-weight:600; }
    .common-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
    .common-cancel { flex-shrink:0; padding:8px 11px; border:1px solid #d8deeb; background:#fff; border-radius:7px; font-size:12px; }
    .common-sources h3 { font-size:14px; font-weight:700; }
    .common-sources details { margin-top:10px; padding-top:10px; border-top:1px solid #edf0f6; }
    .common-sources summary { font-size:13px; font-weight:600; cursor:pointer; }
    .common-sources summary>span { color:#65718a; margin-right:7px; font-weight:400; }
    .common-sources .original-content { font-size:13px; margin-top:10px; }
    .common-question { display:block; font-size:14px; font-weight:700; }
    .create-type { display:block; width:100%; margin:9px 0 20px; padding:10px; border:1px solid #d8deeb; border-radius:8px; background:white; color:#202438; font:inherit; }
    .create-detail .detail-heading { margin-bottom:20px; }
    .create-detail .detail-heading h2 { margin-bottom:6px; }
    .create-intro { color:#65718a; font-size:13px; line-height:1.6; }
    .create-grid { display:grid; gap:18px; align-items:start; }
    .create-grid .submission-card { padding:22px; margin:0; }
    .create-section-title { font-size:14px; font-weight:750; padding-bottom:16px; margin:0 0 18px; border-bottom:1px solid #edf0f6; }
    .create-detail .common-question { font-size:13px; font-weight:600; }
    .create-detail .common-question textarea { font-size:14px; line-height:1.7; padding:12px 14px; margin-top:8px; }
    .create-detail .create-type { margin-bottom:18px; font-size:14px; }
    .create-detail .guidance-fields { padding:18px 0 0; margin-top:20px; gap:14px; }
    .create-detail .guidance-fields label { font-size:12px; color:#3e4961; }
    .create-detail .guidance-fields input { padding:10px 12px; border-radius:8px; }
    .create-internal .create-field { margin-top:0; }
    .create-internal .handler-select { display:flex; flex-direction:column; align-items:stretch; margin-top:20px; color:#3e4961; }
    .create-internal .handler-select select { max-width:none; padding:10px 12px; }
    .create-footer { position:sticky; bottom:-24px; z-index:2; display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:18px; padding:16px 20px; background:#fff; border:1px solid #e1e6f1; border-radius:12px; box-shadow:0 -4px 18px #20243805; }
    .create-footer p { color:#65718a; font-size:12px; line-height:1.6; }
    .create-footer .create-actions { margin:0; }
    @media(min-width:1700px) { .create-grid { grid-template-columns:minmax(0,1fr) 280px; } }
    @media(max-width:1100px) { .create-footer { flex-wrap:wrap; }.create-footer .create-actions { margin-left:auto; } }
    .create-field { margin-top:20px; }
    .create-actions { justify-content:flex-end; margin-top:18px; }
    .common-question textarea { display:block; width:100%; padding:11px 13px; margin-top:9px; border:1px solid #d8deeb; border-radius:8px; font-size:14px; line-height:1.65; color:#202438; font-weight:400; resize:vertical; }
    .summary-source-links { display:flex; flex-wrap:wrap; align-items:center; gap:7px 12px; margin-top:13px; font-size:12px; color:#65718a; }
    .note-card { background:#fff8e6; border:1px solid #ffdf92; border-radius:13px; margin-bottom:18px; color:#684800; }
    .note-toggle { padding:11px 14px; display:flex; align-items:flex-start; gap:10px; width:100%; text-align:left; border:0; background:transparent; line-height:1.65; font-size:14px; }
    .note-toggle umb-icon { width:18px; height:18px; color:#a26800; flex-shrink:0; margin-top:2px; }.note-toggle small { font-size:inherit; }
    .note-editor { display:block; padding:0 15px 13px; font-size:12px; }.note-editor textarea { margin-top:6px; display:block; width:100%; border:1px solid #e8ce87; border-radius:6px; padding:10px; background:#fffdf7; color:#433400; resize:vertical; }
    .answer-card { background:#fff; border:1px solid #e1e6f1; border-radius:16px; overflow:hidden; }
    .answer-heading { display:flex; align-items:center; justify-content:space-between; gap:15px; padding:14px 18px; border-bottom:1px solid #edf0f6; }
    .inbox-layout .answer-heading h3 { font-size:15px; font-weight:700; }
    .handler-select { display:flex; align-items:center; gap:9px; font-size:12px; color:#65718a; }
    .handler-select select { max-width:190px; border:1px solid #d8deeb; border-radius:8px; padding:7px 9px; background:white; color:#202438; font-size:13px; }
    .answer-editor { display:block; border:0; border-radius:0; width:100%; min-height:186px; padding:17px 18px; color:#202438; resize:vertical; font-size:15px; line-height:1.8; background:white; }
    .answer-editor:focus { outline:2px solid #0b807866; outline-offset:-2px; }
    .published-snapshot-note { padding:10px 18px; border-top:1px solid #edf0f6; font-size:11px; color:#65718a; background:#f8fafc; }
    .note-actions { display:flex; justify-content:flex-end; padding:0 15px 13px; }
    .answer-footer { display:flex; justify-content:flex-end; align-items:center; gap:15px; padding:14px 18px; background:#fafbfe; border-top:1px solid #edf0f6; }
    .publication { display:flex; align-items:center; gap:10px; position:relative; cursor:pointer; }
    .publication input { position:absolute; left:0; top:50%; transform:translateY(-50%); width:44px; height:26px; margin:0; opacity:0; cursor:pointer; z-index:1; }
    .switch { position:relative; display:block; width:44px; height:26px; border-radius:20px; background:#a3acb8; flex-shrink:0; }.switch:after { content:''; position:absolute; width:20px; height:20px; top:3px; left:3px; border-radius:50%; background:white; transition:transform .15s; }
    .publication input:checked+.switch { background:var(--inbox-accent); }.publication input:checked+.switch:after { transform:translateX(18px); }.publication input:focus-visible+.switch { outline:2px solid #0b8078; outline-offset:3px; }.publication input:disabled+.switch { opacity:.5; }
    .publication b { display:block; font-size:13px; font-weight:700; white-space:nowrap; }.publication small { display:block; font-size:11px; color:#65718a; }
    .answer-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .answer-actions button,.note-actions button { border:1px solid #d8deeb; border-radius:9px; padding:11px 14px; font-size:13px; font-weight:700; background:white; white-space:nowrap; }.answer-actions button.primary,.note-actions button.primary { background:var(--inbox-accent); color:#fff; }
    .answer-actions button.delete-action { color:#b42318; border-color:#efc9c5; background:#fff; }
    .answer-actions button.delete-action:hover { background:#fff3f2; }
    .guidance-fields { display:grid; grid-template-columns:1fr 1fr; gap:12px; border-top:1px solid #edf0f6; padding:12px 18px; background:#fff; }
    .guidance-fields label { font-size:11px; color:#65718a; }.guidance-fields input { display:block; margin-top:5px; width:100%; min-width:0; border:1px solid #d8deeb; border-radius:6px; padding:8px; font-size:13px; color:#202438; }
    .answer-character-count { margin-right:auto; white-space:nowrap; font-size:11px; color:#65718a; }
    .detail-utilities { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:12px; font-size:11px; color:#65718a; }.detail-utilities>div { display:flex; gap:12px; flex-wrap:wrap; }.detail-utilities button,.inline-link { border:0; background:transparent; color:#52657e; font-size:11px; padding:3px 0; text-decoration:underline; text-underline-offset:3px; }
    .inbox-layout .private-meta { margin-top:10px; font-size:11px; line-height:1.7; color:#65718a; }
    .inbox-notice { border:1px solid; border-radius:8px; padding:10px 13px; margin-bottom:14px; font-size:13px; }.inbox-notice.error { color:#a1272a; background:#fff3f3; border-color:#efc2c2; }.inbox-notice.success { color:#00685e; background:#e8f6f2; border-color:#b2ded2; }
    .detail-empty { display:flex; align-items:center; justify-content:center; flex-direction:column; text-align:center; gap:12px; color:#65718a; }.detail-empty umb-icon { width:40px; height:40px; }.detail-empty h2 { font-size:18px; }.detail-empty p { font-size:13px; }
    @media(min-width:1600px) { .mail-detail { padding:26px 32px; }.answer-editor { min-height:230px; } }
    @media(max-width:1250px) { .inbox-layout { grid-template-columns:200px 310px minmax(0,1fr); }.mail-detail { padding:20px; }.answer-footer { align-items:flex-start; flex-direction:column; }.answer-actions { align-self:flex-end; }.handler-select { flex-wrap:wrap; gap:5px; }.detail-heading h2 { font-size:23px!important; } }
    @media(max-width:1000px) { .inbox-layout { grid-template-columns:175px 270px minmax(320px,1fr); overflow:auto; }.create-question { font-size:12px; }.folder { padding-left:7px; padding-right:7px; font-size:12px; gap:7px; }.list-header { padding-left:12px; padding-right:12px; }.list-heading h1 { font-size:18px!important; }.auto-update { font-size:10px; }.mail-detail { padding:18px; }.guidance-fields { grid-template-columns:1fr; } }
    @media(prefers-reduced-motion:reduce) { .switch:after { transition:none; } }
`;

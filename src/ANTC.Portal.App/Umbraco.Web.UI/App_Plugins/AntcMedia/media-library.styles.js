import { css } from '@umbraco-cms/backoffice/external/lit';
export const mediaStyles = css`
    :host { display: block; width: 100%; max-width: 100vw; height: 100%; min-height: 0; overflow-y: auto; overscroll-behavior-y: contain; scrollbar-gutter: stable; scroll-padding-bottom: 24px; min-width: 0; color: #1e2438; font-family: var(--uui-font-family, 'Manrope', sans-serif); font-size: 14px; --teal: #087f76; --border: #d7deed; }
    * { box-sizing: border-box; }
    button, input, select, textarea { font: inherit; color: inherit; }
    button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; background: white; border: 1px solid var(--border); border-radius: 10px; padding: 11px 16px; font-weight: 700; line-height: 1.35; }
    button:hover:not(:disabled) { border-color: var(--teal); background: #f0faf8; }
    button:disabled { opacity: .55; cursor: default; }
    button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid #27a99d; outline-offset: 3px; }
    button.primary { color: white; background: var(--teal); border-color: var(--teal); }
    button.primary:hover:not(:disabled) { background: #05685f; }
    umb-icon { font-size: 18px; flex: 0 0 18px; width: 18px; height: 18px; }
    .library { min-height: 100%; display: grid; grid-template-columns: 249px minmax(0, 1fr); background: #f5f6fb; }
    .sidebar { background: #fff; border-right: 1px solid #e0e5ef; padding: 22px 13px; min-width: 0; }
    .sidebar-heading { margin: 0 12px 9px; font-size: 12px; line-height: 1.5; letter-spacing: .5px; color: #6b758c; font-weight: 800; }
    .nav-item { display: flex; width: 100%; border: 0; border-radius: 9px; background: transparent; padding: 10px 12px; text-align: left; color: #3f4962; font-weight: 600; min-height: 40px; }
    .nav-item umb-icon { color: #758099; margin-right: 4px; }
    .nav-item span { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .nav-item small { font-size: 12px; color: #69748c; padding-left: 8px; font-weight: 700; }
    .nav-item.active { background: #e0f3f0; color: #00685f; font-weight: 800; }
    .nav-item.active umb-icon { color: #00685f; }
    .nav-item.nested { padding-left: 25px; font-size: 13px; }
    .cleanup-heading { margin-top: 24px; }
    main { padding: 27px 27px 40px 28px; min-width: 0; }
    header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; }
    .breadcrumb { color: #5d6882; font-size: 13px; margin-bottom: 6px; font-weight: 600; }
    h1 { font-size: 28px; line-height: 1.25; letter-spacing: -.6px; margin: 0; font-weight: 800; }
    .header-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .header-actions button { min-height: 44px; }
    .dropzone { display: flex; width: 100%; border: 2px dashed #b4e4de; border-radius: 14px; background: #e1f4f1; padding: 18px; min-height: 62px; margin-bottom: 18px; color: #414c60; font-weight: 500; }
    .dropzone umb-icon { width: 22px; height: 22px; flex-basis: 22px; color: #00695f; margin-right: 5px; }
    .dropzone.dragging { background: #c1e9e2; border-color: var(--teal); }
    .toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 17px; flex-wrap: wrap; }
    .search { display: flex; align-items: center; width: 286px; height: 42px; gap: 10px; background: white; border: 1px solid var(--border); border-radius: 11px; padding: 0 12px; }
    .search umb-icon { width: 16px; height: 16px; flex-basis: 16px; color: #758099; }
    .search input { padding: 0; border: 0; outline: 0; min-width: 0; width: 100%; background: transparent; }
    .search:focus-within { outline: 2px solid var(--teal); outline-offset: 2px; }
    .filters { display: flex; gap: 8px; }
    .chip { border-radius: 24px; padding: 8px 14px; font-size: 13px; min-height: 36px; }
    .chip.active { color: #006b62; background: #e0f4f1; border-color: #b8e4de; }
    select { border: 1px solid var(--border); border-radius: 10px; background: white; min-height: 40px; padding: 8px 32px 8px 16px; margin-left: auto; max-width: 100%; }
    .content { display: grid; grid-template-columns: minmax(0, 1fr) clamp(360px, 30vw, 480px); gap: 20px; align-items: start; }
    .results { min-width: 0; }
    .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 12px; }
    .media-card { padding: 0; border: 2px solid #e1e6f2; border-radius: 15px; display: block; text-align: left; min-width: 0; overflow: hidden; background: white; width: 100%; font-weight: 500; transition: border-color .15s, box-shadow .15s; }
    .media-card:hover:not(:disabled) { background: white; box-shadow: 0 4px 14px #172c4510; }
    .media-card.selected { border-color: #008b80; }
    .thumbnail { position: relative; height: auto; aspect-ratio: 1.5; background: #e9eef5; overflow: hidden; display: grid; place-items: center; }
    .thumbnail img { display: block; width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
    .extension { position: absolute; left: 7px; top: 7px; padding: 1px 7px; border-radius: 6px; background: #fffffff0; color: #3f4962; font-size: 11px; font-weight: 800; line-height: 1.4; }
    .check { position: absolute; right: 7px; top: 7px; width: 25px; height: 25px; background: var(--teal); color: white; display: grid; place-items: center; border-radius: 50%; }
    .check umb-icon { width: 14px; height: 14px; }
    .card-caption { padding: 10px 11px 9px; line-height: 1.3; }
    .card-caption strong { display: block; font-size: 13px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-caption > span { display: block; font-size: 12px; color: #6a7590; margin-top: 1px; }
    .document { background: #ffedeb; color: #b71d1d; }
    .video { background: #1e2438; color: #fff; }
    .folder { background: #fff3dc; color: #a16c00; }
    .file-symbol { display: grid; place-items: center; }
    .file-symbol umb-icon { font-size: 38px; width: 38px; height: 38px; }
    .detail-panel { border: 1px solid #dfe5f1; border-radius: 17px; overflow: hidden; background: white; min-width: 0; }
    .detail-preview { display: grid; place-items: center; aspect-ratio: 1.6; overflow: hidden; background: #e8edf5; }
    .detail-preview img { width: 100%; height: 100%; object-fit: cover; min-height: 0; }
    .detail-preview video { width: 100%; height: 100%; max-height: 240px; }
    .detail-preview .file-symbol umb-icon { font-size: 56px; width: 56px; height: 56px; }
    .detail-body { padding: 24px; }
    .detail-body h2 { font-size: 20px; }
    h2 { margin: 0 0 4px; font-size: 16px; font-weight: 800; line-height: 1.4; overflow-wrap: anywhere; }
    .file-meta { font-size: 13px; color: #5f6b86; margin: 0 0 18px; line-height: 1.55; }
    label:not(.search) { display: block; font-weight: 800; margin: 0 0 7px; }
    textarea, .dialog input { width: 100%; padding: 10px 12px; border: 1px solid #c8d1e4; border-radius: 10px; background: white; resize: vertical; line-height: 1.5; }
    .help { font-size: 12px; color: #616e89; margin: 5px 0 14px; line-height: 1.5; }
    h3 { font-size: 14px; line-height: 1.5; margin: 16px 0 7px; font-weight: 800; }
    .references { padding: 0; margin: 0 0 15px; list-style: none; }
    .references-toggle { padding: 4px 0; border: 0; border-radius: 4px; color: #006e64; background: transparent; font-size: 12px; margin: -7px 0 8px; }
    .references-toggle umb-icon { font-size: 14px; width: 14px; height: 14px; flex-basis: 14px; }
    .references li { padding: 5px 0; }
    .references a { color: #006e64; text-decoration: none; display: flex; gap: 8px; font-size: 14px; line-height: 1.6; }
    .references umb-icon { width: 14px; height: 14px; flex-basis: 14px; margin-top: 3px; }
    .references a:hover, .native-editor:hover { text-decoration: underline; }
    .detail-actions { border-top: 1px solid #edf0f7; padding-top: 14px; display: flex; gap: 8px; }
    .detail-actions button { font-size: 12px; padding: 10px; flex: 1; white-space: nowrap; }
    button.danger { color: #dc3916; background: #ffede7; border-color: #ffede7; }
    button.danger:hover:not(:disabled) { background: #ffdbcf; border-color: #f2957d; }
    .detail-actions .icon-button { flex: 0 0 39px; }
    .icon-button umb-icon { width: 15px; height: 15px; flex-basis: 15px; }
    .native-editor { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; margin-top: 15px; color: #65738d; text-decoration: none; }
    .native-editor umb-icon { width: 12px; height: 12px; }
    .empty, .empty-detail { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 260px; padding: 40px 24px; text-align: center; }
    .empty-detail { color: #728099; }
    .empty { border: 1px dashed var(--border); border-radius: 14px; background: #ffffff80; color: #6b7690; }
    .empty > umb-icon, .empty-detail > umb-icon { flex: none; font-size: 36px; width: 36px; height: 36px; }
    .empty h2 { margin: 0; font-size: 18px; color: #36415b; }
    .empty p, .empty-detail p { max-width: 38ch; margin: 0; line-height: 1.6; overflow-wrap: anywhere; }
    .notice { padding: 12px 16px; border-radius: 10px; margin-bottom: 14px; line-height: 1.6; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .notice button { padding: 6px 10px; white-space: nowrap; }
    .error { background: #fff0eb; color: #a12c12; border: 1px solid #f6c7b8; }
    .success { background: #e2f4ec; color: #086748; }
    .error-text { color: #ad341e; line-height: 1.6; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 14px; padding-top: 22px; color: #65718a; font-size: 12px; }
    .pagination button { padding: 7px 12px; }
    .dialog-backdrop { position: fixed; inset: 0; background: #17243c66; z-index: 1000; display: grid; place-items: center; padding: 24px; }
    .dialog { width: min(460px, 100%); padding: 26px; border-radius: 18px; background: white; box-shadow: 0 15px 60px #162c3f33; }
    .dialog h2 { font-size: 20px; margin-bottom: 18px; }
    .dialog p { line-height: 1.7; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
    [hidden] { display: none !important; }
    @media (min-width: 1700px) { .media-grid { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; } }
    @media (max-width: 1270px) { .library { grid-template-columns: 215px minmax(0, 1fr); } main { padding: 24px 20px; } .content { grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; } }
    @media (max-width: 1050px) { .library { grid-template-columns: 190px minmax(0, 1fr); } .content { grid-template-columns: minmax(0, 1fr) 320px; gap: 14px; } .media-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); } h1 { font-size: 24px; } header { flex-wrap: wrap; } .detail-body { padding: 16px; } }
    @media (max-width: 780px) { .library { grid-template-columns: 1fr; } .sidebar { padding: 14px; border-right: 0; border-bottom: 1px solid var(--border); } .sidebar nav { display: flex; overflow-x: auto; } .sidebar nav .nav-item { width: auto; flex-shrink: 0; } .sidebar .cleanup-heading, .sidebar > .nav-item { display: none; } main { padding: 20px 16px; } .content { grid-template-columns: minmax(0, 1fr) 300px; } .header-actions button { padding: 10px 12px; } .toolbar select { margin-left: 0; } }
    @media (max-height: 800px) and (min-width: 601px) {
        main { padding-top: 20px; padding-bottom: 40px; }
        header { margin-bottom: 14px; }
        .dropzone { padding: 14px; min-height: 54px; margin-bottom: 14px; }
        .toolbar { margin-bottom: 14px; }
        .detail-preview { height: clamp(120px, 24vh, 190px); aspect-ratio: auto; }
        .detail-body { padding: 18px; }
        .detail-body h2 { font-size: 18px; }
        .file-meta { margin-bottom: 12px; }
    }
    @media (max-width: 600px) { .content { grid-template-columns: 1fr; } .detail-panel { grid-row: 1; } .empty-detail { display: none; } .detail-preview { max-height: 220px; } .media-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .search { width: 100%; } .dropzone { font-size: 12px; text-align: left; } .detail-actions button { flex: none; padding: 10px 16px; } }
`;

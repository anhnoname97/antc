import { css } from '@umbraco-cms/backoffice/external/lit';

// Scoped to the article view; other Umbraco workspaces keep their own theme.
export const editorStyles = css`
  :host {
    --antc-primary: #0e7c72;
    --antc-tint: #e3f4f1;
    --antc-tint-text: #0a5e57;
    --antc-ring: #b9e2db;
    --antc-bg: #f4f6fb;
    --antc-surface: #fff;
    --antc-border: #e3e7f0;
    --antc-text: #1a2033;
    --antc-muted: #5b6478;
    --antc-warning-bg: #fff1dc;
    --antc-warning-text: #8a4a06;
    --antc-success-bg: #e6f4ea;
    --antc-success-text: #17692f;
    --antc-radius: 16px;
    --antc-space: 24px;
    display: block;
    height: 100%;
    min-width: 0;
    color: var(--antc-text);
    background: var(--antc-bg);
    font-family: Roboto, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    container-type: inline-size;
  }
  * { box-sizing: border-box; }
  .scroll-area { height: 100%; overflow: auto; scrollbar-gutter: stable; }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 264px;
    align-items: start;
    gap: var(--antc-space);
    width: 100%;
    margin: 0;
    padding: var(--antc-space);
  }
  main, aside, section { min-width: 0; }
  aside { align-self: stretch; }
  .paper, .side-card {
    background: var(--antc-surface);
    border: 1px solid var(--antc-border);
    border-radius: var(--antc-radius);
  }
  .paper { overflow: clip; }
  .intro { padding: var(--antc-space); border-bottom: 1px solid var(--antc-border); }
  .compose-tabs { position: sticky; top: 0; z-index: 3; display: flex; gap: 4px; min-height: 56px; padding: 0 16px; background: var(--antc-surface); border-bottom: 1px solid var(--antc-border); overflow-x: auto; }
  .compose-tabs > button { flex: 0 0 auto; display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 12px 16px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--antc-muted); font: inherit; font-size: 14px; cursor: pointer; white-space: nowrap; }
  .compose-tabs > button:hover { color: var(--antc-tint-text); background: var(--antc-tint); }
  .compose-tabs > button[aria-selected='true'] { color: var(--antc-tint-text); border-bottom-color: var(--antc-primary); font-weight: 700; }
  .compose-tabs > button:focus-visible { outline: 2px solid var(--antc-primary); outline-offset: -4px; }
  .tab-error { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: var(--antc-warning-bg); color: var(--antc-warning-text); font-size: 12px; font-weight: 700; }
  .compose-panel[hidden] { display: none !important; }
  .compose-panel:focus-visible { outline: 2px solid var(--antc-primary); outline-offset: -4px; }
  .history-view { padding: var(--antc-space); }
  .history-view umb-extension-slot { display: block; min-width: 0; }
  .eyebrow { margin: 0 0 8px; color: var(--antc-tint-text); font-size: 12px; font-weight: 700; letter-spacing: .04em; }
  h2 { margin: 0; font-size: 28px; line-height: 1.35; font-weight: 700; overflow-wrap: anywhere; }
  h3 { margin: 0; font-size: 16px; line-height: 1.5; font-weight: 700; }
  p { margin: 8px 0 0; }
  .muted, .hint, .count { color: var(--antc-muted); font-size: 13px; }
  .section { position: relative; padding: var(--antc-space); scroll-margin-top: 72px; }
  /* The native property already includes its label, description and spacing. */
  .leading-field { padding-top: 0; padding-bottom: 0; }
  .leading-field > .count { position: absolute; top: 4px; right: var(--antc-space); z-index: 1; }
  .section + .section { border-top: 1px solid var(--antc-border); }
  .section:focus { outline: 2px solid var(--antc-primary); outline-offset: -4px; }
  .section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .section-heading h3 { flex: 1; }
  .count { font-variant-numeric: tabular-nums; }
  umb-content-workspace-property { display: block; min-width: 0; }
  #body {
    --umb-tiptap-top: 56px;
  }
  .side-stack { display: grid; gap: 16px; position: sticky; top: var(--antc-space); max-height: calc(100dvh - 224px); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
  .search-preview { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--antc-border); }
  .seo-share-inline { margin-top: 24px; max-width: 480px; }
  .seo-share-inline h4 { margin: 0 0 12px; font-size: 14px; }
  .side-card { padding: 20px; }
  .status-card h3 { margin-bottom: 12px; }
  .required-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .required-heading h3 { font-size: 14px; }
  .required-list { display: grid; gap: 14px; margin: 16px 0 0; padding: 0; list-style: none; font-size: 13px; }
  .required-list li { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 8px; }
  .required-icon { display: grid; place-items: center; height: 18px; border-radius: 50%; background: var(--antc-warning-bg); color: var(--antc-warning-text); font-size: 12px; }
  [data-ready='true'] .required-icon { background: var(--antc-success-bg); color: var(--antc-success-text); }
  .required-list small { display: block; margin-top: 4px; color: var(--antc-muted); }
  .required-link { display: block; min-height: 32px; border: 0; padding: 4px 0; background: transparent; color: var(--antc-tint-text); font: inherit; text-decoration: underline; cursor: pointer; }
  .required-link:focus-visible { outline: 2px solid var(--antc-primary); outline-offset: 3px; }
  .status { display: inline-flex; align-items: center; gap: 8px; border-radius: 99px; padding: 4px 12px; background: var(--antc-tint); color: var(--antc-tint-text); font-size: 13px; font-weight: 600; }
  .status::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .status[data-tone='draft'] { background: var(--antc-warning-bg); color: var(--antc-warning-text); }
  .status[data-tone='published'] { background: var(--antc-success-bg); color: var(--antc-success-text); }
  dl { margin: 16px 0 0; }
  dt { margin-top: 12px; color: var(--antc-muted); font-size: 13px; }
  dd { margin: 4px 0 0; overflow-wrap: anywhere; }
  .note { border-left: 3px solid var(--antc-primary); padding-left: 12px; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
  .loading { padding: 32px; }
  @container (max-width: 900px) {
    .layout { grid-template-columns: minmax(0, 1fr); gap: 16px; padding: 16px; }
    aside { grid-row: 1; }
    .side-stack { position: static; max-height: none; overflow: visible; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
    .side-card { padding: 16px; }
    .status-card dl { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-top: 8px; }
    dt { margin-top: 0; }
    .status-card .hint { margin-top: 12px; }
  }
  @container (max-width: 600px) {
    h2 { font-size: 24px; }
    .side-stack { grid-template-columns: minmax(0, 1fr); }
  }
`;

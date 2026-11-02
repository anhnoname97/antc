// BO-02 / BO-04: use the header's CSS API, without replacing native navigation.
export async function onInit(host) {
  if (!document.getElementById('antc-backoffice-theme')) {
    const link = document.createElement('link');
    link.id = 'antc-backoffice-theme';
    link.rel = 'stylesheet';
    link.href = new URL('./antc-theme.css?v=0.1.2', import.meta.url).href;
    document.head.append(link);
  }

  // The logo has no header-specific hover token. Scope UUI's public variable
  // to its native button so primary buttons and the system popover keep theirs.
  await host.updateComplete;
  const header = host.shadowRoot?.querySelector('umb-backoffice-header');
  await header?.updateComplete;
  const logo = header?.shadowRoot?.querySelector('umb-backoffice-header-logo');
  await logo?.updateComplete;
  if (!host.isConnected) return;
  const button = logo?.shadowRoot?.querySelector('#header-logo-button');
  button?.style.setProperty('--uui-button-background-color-hover', 'var(--antc-header-logo-hover)');
  button?.style.setProperty('--uui-button-contrast-hover', 'var(--antc-header-text-emphasis)');
}

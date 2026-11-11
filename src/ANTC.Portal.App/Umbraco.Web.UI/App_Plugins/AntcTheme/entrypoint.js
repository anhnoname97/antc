// BO-02 / BO-04: use the header's CSS API, without replacing native navigation.
export async function onInit(host) {
  patchTreePickerHeader();

  if (!document.getElementById('antc-backoffice-theme')) {
    const link = document.createElement('link');
    link.id = 'antc-backoffice-theme';
    link.rel = 'stylesheet';
    link.href = new URL('./antc-theme.css?v=0.1.3', import.meta.url).href;
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

// Hop chon trang (tree picker): dua nut doi kieu xem (Dang cay / Dang bang) len cung dong voi duong dan "Noi dung",
// bo dong trong ben duoi. Phan nay nam trong Shadow DOM nen gan them stylesheet vao tung hop chon sau moi lan ve lai.
// Le am dat tren #breadcrumb: khi khong co duong dan thi bo cuc giu nguyen nhu Umbraco goc.
function patchTreePickerHeader() {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`
    #breadcrumb {
      position: relative;
      z-index: 1;
      width: calc(100% - 48px);
      min-height: 21px;
      margin-bottom: -24px;
    }
  `);
  customElements.whenDefined('umb-tree-picker-modal').then(() => {
    const proto = customElements.get('umb-tree-picker-modal')?.prototype;
    if (!proto || proto.__antcHeaderPatched) return;
    proto.__antcHeaderPatched = true;
    const updated = proto.updated;
    proto.updated = function (changed) {
      updated?.call(this, changed);
      const root = this.shadowRoot;
      if (root && !root.adoptedStyleSheets.includes(sheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    };
  });
}

// Replace the renderer before backoffice permissions and routes are initialized.
// Preserve the native section alias, permissions and retained URLs.
export function onInit(_host, registry) {
    const mediaElement = () => import('./media-section.js?v=1.0.10');
    registry.extensions.subscribe(extensions => {
        const section = extensions.find(x => x.alias === 'Umb.Section.Media');
        if (!section || section.element === mediaElement) return;
        registry.unregister(section.alias);
        registry.register({ ...section, element: mediaElement });
    });
}

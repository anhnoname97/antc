// Các nhãn này được Umbraco/tiện ích ghi trực tiếp trong manifest, không tra bộ dịch.
// Giữ nguyên bí danh vì cấu hình bộ sưu tập tham chiếu trực tiếp đến bí danh chế độ xem.
const labels = {
    'Umbraco Learning Base': 'Học sử dụng Umbraco', 'Community Forum': 'Diễn đàn cộng đồng',
    'Extension Insights': 'Thông tin tiện ích', 'Synchronisation': 'Đồng bộ dữ liệu',
    'Telemetry Data': 'Dữ liệu chẩn đoán', 'System information': 'Thông tin hệ thống',
    'Grid': 'Dạng lưới', 'Table': 'Dạng bảng', 'List': 'Danh sách',
    'Copy': 'Sao chép', 'Replace': 'Thay thế', 'Profile': 'Hồ sơ',
    'History': 'Lịch sử', 'Child items': 'Mục con'
};

export function onInit(_host, registry) {
    document.documentElement.style.setProperty('--umb-header-logo-width', '20px');
    document.documentElement.style.setProperty('--umb-header-logo-height', '20px');

    // Server-rendered configuration is available before initialization, with no extra request or flicker.
    // Exclusions also apply when a package registers its sections later during startup.
    const hiddenSections = JSON.parse(document.getElementById('antc-hidden-sections')?.textContent || '[]');
    for (const alias of hiddenSections) {
        registry.exclude(alias);
    }

    const handled = new Set();
    registry.extensions.subscribe(extensions => {
        for (const extension of extensions) {
            if (handled.has(extension.alias) || extension.alias.startsWith('Antc.')) continue;
            if (!['menu', 'menuItem', 'dashboard', 'workspaceView', 'sectionSidebarApp', 'collectionView'].includes(extension.type)) continue;
            const label = labels[extension.meta?.label];
            if (!label) continue;
            handled.add(extension.alias);
            registry.unregister(extension.alias);
            registry.register({ ...extension, meta: { ...extension.meta, label } });
        }
    });
    registry.kinds.subscribe(kinds => {
        for (const kind of kinds) {
            const label = labels[kind.manifest?.meta?.label];
            if (!label) continue;
            registry.defineKind({ ...kind, manifest: { ...kind.manifest, meta: { ...kind.manifest.meta, label } } });
        }
    });
}

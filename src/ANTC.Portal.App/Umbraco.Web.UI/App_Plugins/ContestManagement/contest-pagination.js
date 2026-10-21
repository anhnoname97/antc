// Presentation-only pagination. Keep the complete filtered data for totals and CSV exports.
export function paginate(items, state = {}, defaultSize = 50) {
    const size = [10, 20, 50, 100].includes(state.size) ? state.size : defaultSize;
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const page = Math.min(pages, Math.max(1, Math.trunc(Number(state.page) || 1)));
    const start = total ? (page - 1) * size + 1 : 0;
    return { items: items.slice((page - 1) * size, page * size), total, size, page, pages, start, end: Math.min(page * size, total) };
}

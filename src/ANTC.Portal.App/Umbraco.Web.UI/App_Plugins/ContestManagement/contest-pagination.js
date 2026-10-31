// Presentation-only pagination. Keep the complete filtered data for totals and CSV exports.
export const PAGE_SIZES = [10, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;
export function paginate(items, state = {}, defaultSize = DEFAULT_PAGE_SIZE) {
    const size = PAGE_SIZES.includes(state.size) ? state.size : PAGE_SIZES.includes(defaultSize) ? defaultSize : DEFAULT_PAGE_SIZE;
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const page = Math.min(pages, Math.max(1, Math.trunc(Number(state.page) || 1)));
    const start = total ? (page - 1) * size + 1 : 0;
    return { items: items.slice((page - 1) * size, page * size), total, size, page, pages, start, end: Math.min(page * size, total) };
}

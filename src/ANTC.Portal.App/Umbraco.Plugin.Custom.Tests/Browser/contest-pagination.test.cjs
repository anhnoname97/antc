const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const source = readFileSync(resolve(__dirname, '../../Umbraco.Web.UI/App_Plugins/ContestManagement/contest-pagination.js'), 'utf8');
const modulePromise = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('pagination handles empty lists and disables movement through one logical page', async () => {
    const { paginate } = await modulePromise;
    assert.deepEqual(paginate([]), { items: [], total: 0, size: 10, page: 1, pages: 1, start: 0, end: 0 });
});
test('first, middle and last pages preserve order without duplicate or missing rows', async () => {
    const { paginate } = await modulePromise;
    const rows = Array.from({ length: 121 }, (_, i) => i + 1);
    const pages = [1, 2, 3].map(page => paginate(rows, { page, size: 50 }));
    assert.deepEqual(pages.map(p => p.items.length), [50, 50, 21]);
    assert.deepEqual(pages.flatMap(p => p.items), rows);
    assert.deepEqual([pages[2].start, pages[2].end, pages[2].total], [101, 121, 121]);
    assert.equal(rows.length, 121);
});
test('out-of-range pages clamp after filtering instead of showing a blank table', async () => {
    const { paginate } = await modulePromise;
    for (const page of [-1, 0, 'invalid']) assert.equal(paginate([1, 2], { page }).page, 1);
    const p = paginate([1, 2], { page: 999, size: 20 });
    assert.equal(p.page, 1); assert.deepEqual(p.items, [1, 2]);
});
test('supported page sizes and per-list defaults work without changing source totals', async () => {
    const { paginate } = await modulePromise;
    const rows = Array.from({ length: 200 }, (_, i) => i);
    for (const size of [10, 50, 100]) {
        const p = paginate(rows, { page: 2, size });
        assert.equal(p.items.length, size); assert.equal(p.items[0], size); assert.equal(p.total, 200);
    }
    assert.equal(paginate(rows, {}, 10).size, 10);
    assert.equal(paginate(rows).items.length, 10);
    assert.equal(paginate(rows, { size: 0 }).size, 10);
    assert.equal(paginate(rows, { size: 20 }).size, 10);
});

// Editorial text from CMS blocks. Business values are supplied by the API/state layer.
// Always escape the returned text when composing HTML; textContent is safe as-is.
export function blockCopy(block, key, fallback, values = {}) {
  const node = document.querySelector(`[data-contest-copy="${block}"]`);
  const text = node?.dataset[key]?.trim() || fallback;
  return text.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
}

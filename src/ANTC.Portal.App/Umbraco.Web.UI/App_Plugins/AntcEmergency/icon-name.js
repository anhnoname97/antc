// Old demo codes remain readable until an editor chooses a native Umbraco icon.
const aliases = {
  money: 'icon-coins', key: 'icon-key', link: 'icon-link', app: 'icon-mobile',
  call: 'icon-phone', phone: 'icon-mobile', chat: 'icon-chat', users: 'icon-users',
  person: 'icon-user', shield: 'icon-shield', alert: 'icon-alert', lock: 'icon-lock',
  face: 'icon-user', id: 'icon-vcard', sim: 'icon-simcard', hush: 'icon-lock',
  stop: 'icon-stop', clock: 'icon-time', chart: 'icon-chart', coins: 'icon-coins',
  brief: 'icon-briefcase', cart: 'icon-shopping-basket', mail: 'icon-message-unopened', globe: 'icon-globe',
  book: 'icon-book', doc: 'icon-document', pen: 'icon-edit', quiz: 'icon-help-alt',
  search: 'icon-search', inbox: 'icon-inbox', gift: 'icon-gift', home: 'icon-home',
  mega: 'icon-megaphone', trophy: 'icon-trophy', badge: 'icon-badge', bank: 'icon-company'
};
export function iconName(value) {
  const code = String(value || '').split(' · ').at(-1).trim().split(/\s+/)[0];
  return aliases[code] || (/^icon-[a-z0-9-]+$/.test(code) ? code : '');
}

export function computeWizard(data, input) {
  const chosen = [2, 3].flatMap(step => (data[`step${step}Options`] || []).filter(option => (input[`step${step}`] || []).includes(option.key)));
  const stops = chosen.filter(option => option.optionKind === 'phaiDung');
  const holds = chosen.filter(option => option.optionKind === 'tamHoan');
  const unknown = [2, 3].some(step => (input[`step${step}`] || []).includes('unk'));
  const cautionLevel = stops.length ? 'ratCao' : holds.length || unknown ? 'cao' : 'thuong';
  const keys = new Set(chosen.map(option => option.key));
  const channel = data.step1Options.find(option => option.key === input.step1)?.channel;
  const situations = (data.tactics || []).filter(tactic => tactic.isActive !== false).map((tactic, index) => {
    const matches = [...new Set(tactic.wizardAnswers || [])].filter(key => keys.has(key)).length;
    return { tactic, index, matches, score: matches ? matches * 2 + (channel && tactic.channels.includes(channel) ? 3 : 0) : 0 };
  }).filter(item => item.matches).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, Math.max(1, Math.min(3, Number(data.maxSituations) || 3)));
  const signs = [...stops, ...holds].map(option => option.stopSign ? { stopSign: option.stopSign, text: option.resolvedSign || option.signText || '' } : { text: option.signText || '' });
  if (unknown) signs.push({ text: data.unknownSignText });
  const all = new Set([...keys, input.step1]);
  const allowed = row => (!(row.onlyIf || []).length || row.onlyIf.some(key => all.has(key))) && !(row.skipIf || []).some(key => all.has(key));
  const actions = (data[{ ratCao: 'stopActions', cao: 'holdActions', thuong: 'clearActions' }[cautionLevel]] || []).filter(allowed).slice(0, 4);
  const first = situations[0]?.tactic;
  return { cautionLevel, situations, signs: signs.filter(sign => sign.stopSign || sign.text).slice(0, 3), actions,
    ifAlready: (data.ifAlreadyLinks || []).filter(allowed), guideArticle: first?.containingArticle || null,
    guideUrl: first?.articleUrl || null, checklist: first?.checklist || data.defaultChecklist || null,
    checklistUrl: first?.checklistUrl || data.defaultChecklistUrl || null };
}

export function toggleWizardOption(selected, key) {
  if (key === 'none' || key === 'unk') return selected.includes(key) ? [] : [key];
  const next = selected.filter(value => value !== 'none' && value !== 'unk');
  return next.includes(key) ? next.filter(value => value !== key) : [...next, key];
}

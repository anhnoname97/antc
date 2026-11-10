import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeWizard, toggleWizardOption } from '../../Umbraco.Web.UI/wwwroot/assets/js/emergency-wizard-rules.mjs';
const root = new URL('../../../../', import.meta.url);
const seed = JSON.parse(readFileSync(new URL('docs/ban-giao/PORTAL-V2/cong-cu/seed-portal-v2.json', root), 'utf8'));
const cases = JSON.parse(readFileSync(new URL('docs/ban-giao/PORTAL-V2/cong-cu/wizard-cases.json', root), 'utf8'));
const wizard = seed.nodes.find(node => node.contentType === 'wizardPage').values;
const tactics = seed.nodes.filter(node => node.contentType === 'tacticItem').sort((a, b) => a.sortOrder - b.sortOrder).map(node => {
  const article = seed.nodes.find(item => item.key === node.values.containingArticle);
  const topic = seed.nodes.find(item => item.key === article?.values.topic);
  return { key: node.key, name: node.name, ...node.values, checklist: topic?.values.checklist };
});
for (const entry of cases.cases) test(entry.description, () => {
  const result = computeWizard({ ...wizard, tactics }, entry.input);
  assert.equal(result.cautionLevel, entry.expect.cautionLevel);
  assert.deepEqual(result.situations.map(item => ({ tactic: item.tactic.key, name: item.tactic.name, score: item.score })), entry.expect.situations);
  assert.deepEqual(result.signs.map(sign => sign.stopSign ? { stopSign: sign.stopSign } : { text: sign.text }), entry.expect.signs);
  assert.deepEqual(result.actions.map(action => action.text ? { text: action.text } : { page: action.page, stepNumber: Number(action.stepNumber) }), entry.expect.actions);
  assert.deepEqual(result.ifAlready.map(item => item.targetPage), entry.expect.ifAlready);
  assert.equal(result.guideArticle, entry.expect.guideArticle);
  assert.equal(result.checklist, entry.expect.checklist);
});
test('None and unknown exclude specific answers in both directions', () => {
  assert.deepEqual(toggleWizardOption(['a', 'b'], 'unk'), ['unk']);
  assert.deepEqual(toggleWizardOption(['unk'], 'a'), ['a']);
  assert.deepEqual(toggleWizardOption(['a'], 'none'), ['none']);
  assert.deepEqual(toggleWizardOption(['none'], 'b'), ['b']);
  assert.deepEqual(toggleWizardOption(['a'], 'a'), []);
});

export function checklistResult(questions, items, answers, checked) {
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 8
      || !Array.isArray(items) || items.length < 1 || items.length > 15
      || !Array.isArray(answers) || answers.length !== questions.length
      || !Array.isArray(checked) || checked.length !== items.length
      || Array.from({ length: questions.length }, (_, i) => answers[i]).some(a => !['y','n','u'].includes(a))
      || Array.from({ length: items.length }, (_, i) => checked[i]).some(a => typeof a !== 'boolean')) return null;
  const yes = questions.filter((_, i) => answers[i] === 'y');
  if (yes.length) return { level: 'd', reasons: yes.map(text => 'Có việc: ' + text) };
  const unknown = questions.filter((_, i) => answers[i] === 'u');
  const pending = items.filter((_, i) => !checked[i]);
  if (unknown.length || pending.length) return { level: 'h', reasons: [...unknown.map(text => 'Chưa biết chắc: ' + text), ...pending.map(text => 'Chưa trả lời được: ' + text)] };
  return { level: 'n', reasons: [] };
}

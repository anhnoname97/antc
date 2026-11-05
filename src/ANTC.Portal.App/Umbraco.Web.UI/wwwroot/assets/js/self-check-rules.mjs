const kinds = new Set(['phaiDung', 'tamHoan', 'canKiemTra']);
const meanings = new Set(['co', 'khong', 'chuaBiet']);

// Answers and option indices are local to this page. Missing/invalid answers never yield N.
export function evaluateAnswers(questions, answers) {
  const reasons = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const index = answers[i];
    if (!kinds.has(q.kind) || !Number.isInteger(index) || index < 0 || index >= q.options.length) return null;
    const answer = q.options[index].mean;
    if (!meanings.has(answer)) return null;
    if (q.kind === 'phaiDung' && answer === 'co') return { level: 'd', reasons: [{ index: i, prefix: 'Bạn chọn “Có” ở câu: ' }], lastIndex: i };
    if (q.kind === 'phaiDung' && answer === 'chuaBiet') reasons.push({ index: i, prefix: 'Bạn chưa biết chắc: ' });
    if (q.kind === 'tamHoan' && answer !== 'khong') reasons.push({ index: i, prefix: answer === 'co' ? 'Bạn chọn “Có” ở câu: ' : 'Bạn chưa biết chắc: ' });
    if (q.kind === 'canKiemTra' && answer !== 'co') reasons.push({ index: i, prefix: answer === 'khong' ? 'Chưa làm: ' : 'Bạn chưa biết chắc: ' });
  }
  return questions.length ? { level: reasons.length ? 'h' : 'n', reasons, lastIndex: questions.length - 1 } : null;
}

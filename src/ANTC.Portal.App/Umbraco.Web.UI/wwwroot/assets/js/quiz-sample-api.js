// QUIZ-03 uses the same question contract as the shared FE-23 renderers.
export async function loadSampleQuestions(fetcher = fetch) {
  const response = await fetcher('/api/v1/quiz/sample', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Không tải được câu hỏi. Vui lòng thử lại.');
  const questions = await response.json();
  if (!Array.isArray(questions) || questions.length !== 8) {
    throw new Error('Bộ câu hỏi Thử sức chưa sẵn sàng. Vui lòng thử lại sau.');
  }
  const codes = new Set();
  for (const q of questions) {
    if (!q || typeof q.code !== 'string' || !q.code || codes.has(q.code) ||
        typeof q.q !== 'string' || !q.q.trim() ||
        !Array.isArray(q.opt) || ![2, 4].includes(q.opt.length) ||
        !q.opt.every(option => Array.isArray(option) && option.length === 2 &&
          option.every(value => typeof value === 'string')) ||
        new Set(q.opt.map(([letter]) => letter)).size !== q.opt.length ||
        !q.opt.some(([letter]) => letter === q.ans) || !q.exp || typeof q.exp !== 'object' ||
        !q.opt.every(([letter]) => typeof q.exp[letter] === 'string')) {
      throw new Error('Dữ liệu câu hỏi chưa hợp lệ. Vui lòng thử lại sau.');
    }
    codes.add(q.code);
  }
  return questions;
}

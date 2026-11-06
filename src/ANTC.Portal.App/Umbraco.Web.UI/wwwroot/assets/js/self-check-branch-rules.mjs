// All questions must be answered. Unknown keeps the corresponding guidance group.
// Preserve editorial order: threats, account/device, money/goods, identity/papers.
export function branchResult(questionCount, answers) {
  if (!Number.isInteger(questionCount) || questionCount < 2 || questionCount > 8
      || !Array.isArray(answers) || answers.length !== questionCount
      || Array.from({ length: questionCount }, (_, i) => answers[i]).some(a => !['y', 'n', 'u'].includes(a))) return null;
  return answers.flatMap((answer, index) => answer === 'n' ? [] : [{ index, unsure: answer === 'u' }]);
}

import { animateContestCommunity } from './contest-community.js';
import { animateQaPublishedAnswers, initQaLoadMore, initQaAnchor } from './qa-published.js';
import { initQaSubmissions, animateQaSubmissionBlocks } from './qa-submission.js';
import { animateQaProcesses } from './qa-process.js';
import { initReferencePage } from './reference-page.js';
import { animateContestHeroes } from './contest-hero.js';

const page = document.getElementById('nj-hoi-dap');
if (page) {
  initReferencePage(page);
  animateContestHeroes(page);
  animateQaProcesses(page);
  initQaSubmissions(page);
  animateQaSubmissionBlocks(page);
  animateQaPublishedAnswers(page);
  initQaLoadMore(page);
  animateContestCommunity(page);
  initQaAnchor(page);
}

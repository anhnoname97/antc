import { DEFAULT_PAGE_SIZE } from './contest-pagination.js?v=1.15.7';
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { css, html } from "@umbraco-cms/backoffice/external/lit";
import { contestStyles, contestStylesText } from './contest-theme.js?v=1.15.7';
import { UMB_CONFIRM_MODAL, umbOpenModal } from '@umbraco-cms/backoffice/modal';
import './contest-reports.js?v=1.15.7';
import './contest-draws.js?v=1.15.7';
import { ContestBankView } from './contest-bank.js?v=1.15.7';
import { campaignState, scheduleMarkup, loadCampaigns } from './contest-layout.js?v=1.15.7';
import { arrangeCampaignEditor } from './contest-editor.js?v=1.15.7';

const API = "/api/v1/admin/quiz";
const CONTEST_API = "/api/v1/admin/contest";
const keys = ["A", "B", "C", "D"];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const formatDate = (v) => v ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(v)) : "—";
const formatContestDate = (v) => v ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(v)) : "—";
const lines = (v) => String(v || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const pager = (r) => `<div class="pager"><label class="page-size">Số dòng<select data-page-size aria-label="Số dòng mỗi trang">${[10, 50, 100].map(n => `<option value="${n}" ${(r?.pageSize || DEFAULT_PAGE_SIZE) === n ? "selected" : ""}>${n}</option>`).join("")}</select></label><button data-prev ${!r || r.page <= 1 ? "disabled" : ""}>← Trước</button><span>Trang ${r?.page || 1}/${Math.max(1, r?.totalPages || 1)}</span><button data-next ${!r || r.page >= r.totalPages ? "disabled" : ""}>Sau →</button></div>`;

class AdminPage extends UmbElementMixin(HTMLElement) {
  constructor(title) { super(); this.title = title; this.page = 1; this.pageSize = DEFAULT_PAGE_SIZE; this.loading = false; this.message = ""; this.error = ""; this.attachShadow({ mode: "open" }); }
  async connectedCallback() {
    super.connectedCallback?.();
    this.loading = true;
    this.render();
    try {
      this.auth = await this.getContext(UMB_AUTH_CONTEXT);
      if (!this.auth) throw new Error("Không lấy được ngữ cảnh xác thực của Umbraco Backoffice.");
      await this.load();
    } catch (error) {
      this.loading = false;
      this.error = error?.message || "Không thể khởi tạo màn hình quản trị.";
      this.render();
    }
  }
  async request(path, options = {}) {
    const token = await this.auth.getLatestToken();
    const response = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => null);
    if (!response.ok) { const error = new Error(payload?.error?.message || `Yêu cầu thất bại (${response.status}).`); error.fields = payload?.error?.fields || {}; throw error; }
    return payload;
  }
  async confirmDelete(content) {
    try {
      await umbOpenModal(this, UMB_CONFIRM_MODAL, { data: {
        headline: 'Xác nhận xóa', content, confirmLabel: 'Xóa', cancelLabel: 'Hủy', color: 'danger',
      } });
      return true;
    } catch { return false; }
  }
  async run(action, success) {
    if (this.saving) return;
    this.saving = true;
    const editor = this.shadowRoot.querySelector('dialog[open]');
    const buttons = editor ? [...editor.querySelectorAll('button')].map(button => [button, button.disabled]) : [];
    const preventClose = event => event.preventDefault();
    editor?.addEventListener('cancel', preventClose);
    buttons.forEach(([button]) => { button.disabled = true; });
    editor?.querySelector('[data-save-error]')?.remove();
    this.error = "";
    try { await action(); this.message = success; setTimeout(() => { this.message = ""; if (!this.shadowRoot.querySelector('dialog[open]')) this.render(); }, 3500); }
    catch (error) {
      this.error = `${error.message}${Object.values(error.fields || {}).length ? ` ${Object.values(error.fields).join(" ")}` : ""}`;
      if (editor?.open && editor.isConnected) {
        const notice = document.createElement('div');
        notice.className = 'notice error'; notice.dataset.saveError = ''; notice.setAttribute('role', 'alert'); notice.tabIndex = -1;
        notice.textContent = this.error;
        editor.querySelector('header').after(notice); notice.focus();
        return; // Giữ nguyên DOM, dữ liệu, lựa chọn cây và trạng thái mở của form.
      }
    }
    finally {
      this.saving = false;
      editor?.removeEventListener('cancel', preventClose);
      buttons.forEach(([button, disabled]) => { button.disabled = disabled; });
    }
    this.render();
  }
  shell(content) {
    // Preserve disclosure state across legacy table renders without changing form bindings.
    const expanded = this.shadowRoot.querySelector('.advanced-search')?.open || false;
    const count = [this.search, this.status, this.topicId, this.active].filter(value => value !== '' && value != null).length;
    if (!(this instanceof ContestPage) && !(this instanceof QuestionsPage)) content = content.replace(/<form id="search"[\s\S]*?<\/form>/g, form => `<details class="advanced-search" ${expanded ? 'open' : ''}><summary>Tìm kiếm nâng cao <span class="filter-status">${count ? `${count} điều kiện đang áp dụng` : 'Chưa áp dụng bộ lọc'}</span></summary>${form}</details>`);
    if (this.hasAttribute('embedded')) return `<style>${styles}</style><div class="embedded-page">${this.error ? `<div class="notice error" role="alert">${esc(this.error)}</div>` : ""}${this.message ? `<div class="notice success" role="status">${esc(this.message)}</div>` : ""}${content}</div>`;
    const descriptions = { "Chuyên đề": "Tổ chức nội dung theo chuyên đề, quản lý trạng thái và theo dõi số câu đang sử dụng.", "Câu hỏi": "Quản lý ngân hàng câu hỏi với 2–4 lựa chọn và duy nhất 1 đáp án đúng.", "Cuộc thi": "Thiết lập cuộc thi, chọn chuyên đề và câu hỏi.", "Ngân hàng câu hỏi": "Quản lý nguồn dữ liệu dùng chung cho luyện tập và các cuộc thi." };
    return `<style>${styles}</style><umb-body-layout main-no-padding><div class="page"><header class="page-heading"><div><div class="eyebrow">Quản lý cuộc thi</div><h1>${esc(this.title)}</h1><p class="page-description">${esc(descriptions[this.title] || "")}</p></div></header>${this.error ? `<div class="notice error" role="alert">${esc(this.error)}</div>` : ""}${this.message ? `<div class="notice success" role="status">${esc(this.message)}</div>` : ""}${content}</div></umb-body-layout>`;
  }
  bindPager() {
    this.shadowRoot.querySelectorAll('[data-page-size],[data-prev],[data-next]').forEach(element => { element.disabled ||= this.loading; });
    this.shadowRoot.querySelector("[data-page-size]")?.addEventListener("change", event => { this.pageSize = Number(event.target.value); this.page = 1; this.load(); });
    this.shadowRoot.querySelector("[data-prev]")?.addEventListener("click", () => { if (this.page > 1) { this.page--; this.load(); } });
    this.shadowRoot.querySelector("[data-next]")?.addEventListener("click", () => { if (this.page < (this.result?.totalPages || 1)) { this.page++; this.load(); } });
  }
}

class TopicsPage extends AdminPage {
  constructor() { super("Chuyên đề"); this.search = ""; this.status = ""; }
  async load() {
    this.loading = true; this.render(); const q = new URLSearchParams({ page: this.page, pageSize: this.pageSize });
    if (this.search) q.set("search", this.search); if (this.status) q.set("isActive", this.status);
    try { this.result = await this.request(`/topics?${q}`); this.error = ""; } catch (e) { this.error = e.message; } finally { this.loading = false; this.render(); }
  }
  render() {
    if (!this.shadowRoot) return;
    const rows = (this.result?.items || []).map(x => `<tr><td class="mono">${x.id}</td><td><strong>${esc(x.title)}</strong></td><td>${x.questionCount}</td><td>${x.activeQuestionCount}</td><td><span class="badge ${x.isActive ? "on" : "off"}">${x.isActive ? "Đang dùng" : "Ngừng dùng"}</span></td><td>${formatDate(x.updatedAt)}</td><td class="actions"><button data-edit="${x.id}">Sửa</button><button class="danger ghost" data-delete="${x.id}">Xóa</button></td></tr>`).join("");
    this.shadowRoot.innerHTML = this.shell(`<section class="box"><div class="toolbar"><form id="search" class="filters"><input name="term" value="${esc(this.search)}" placeholder="Tìm theo mã hoặc tên chuyên đề…"><select name="status"><option value="">Tất cả trạng thái</option><option value="true" ${this.status === "true" ? "selected" : ""}>Đang dùng</option><option value="false" ${this.status === "false" ? "selected" : ""}>Ngừng dùng</option></select><button>Tìm kiếm</button></form><button class="primary" id="create">+ Thêm chuyên đề</button></div><div class="summary">${this.loading ? "Đang tải…" : `${this.result?.totalItems || 0} chuyên đề`}</div><div class="table-wrap"><table><thead><tr><th>Mã</th><th>Tên chuyên đề</th><th>Tổng câu</th><th>Câu đang dùng</th><th>Trạng thái</th><th>Cập nhật</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="7" class="empty">Không có dữ liệu phù hợp.</td></tr>`}</tbody></table></div>${pager(this.result)}</section><dialog id="editor"></dialog>`);
    this.shadowRoot.querySelector("#search")?.addEventListener("submit", e => { e.preventDefault(); const d = new FormData(e.currentTarget); this.search = d.get("term").trim(); this.status = d.get("status"); this.page = 1; this.load(); });
    this.shadowRoot.querySelector("#create")?.addEventListener("click", () => this.openEditor());
    this.shadowRoot.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", async () => this.openEditor(await this.request(`/topics/${b.dataset.edit}`))));
    this.shadowRoot.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => this.remove(b.dataset.delete))); this.bindPager();
  }
  openEditor(item = null) {
    const dialog = this.shadowRoot.querySelector("#editor");
    dialog.innerHTML = `<form method="dialog" id="form"><header><h2>${item ? "Cập nhật" : "Thêm"} chuyên đề</h2><button type="button" data-close class="close" aria-label="Đóng">×</button></header><div class="form-grid"><label>Mã chuyên đề<span>*</span><input name="id" type="number" min="1" required value="${item?.id || ""}" ${item ? "readonly" : ""}></label><label>Tên chuyên đề<span>*</span><input name="title" maxlength="200" required value="${esc(item?.title)}"></label><label class="wide">Giới thiệu <small>Mỗi đoạn một dòng</small><textarea name="intro" rows="4">${esc((item?.intro || []).join("\n"))}</textarea></label><label class="wide">Thuật ngữ <small>Mỗi dòng: Thuật ngữ | Giải nghĩa</small><textarea name="terms" rows="5">${esc((item?.terms || []).map(x => `${x.term} | ${x.definition}`).join("\n"))}</textarea></label><label class="check wide"><input name="active" type="checkbox" ${item?.isActive !== false ? "checked" : ""}> Đang sử dụng</label></div><footer><button type="button" data-close>Hủy</button><button type="submit" value="save" class="primary">Lưu chuyên đề</button></footer></form>`;
    const form = dialog.querySelector("#form"); dialog.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => dialog.close())); form.addEventListener("submit", e => { e.preventDefault(); const d = new FormData(form); const payload = { id: Number(d.get("id")), title: d.get("title"), intro: lines(d.get("intro")), terms: lines(d.get("terms")).map(line => { const [term, ...rest] = line.split("|"); return { term: term.trim(), definition: rest.join("|").trim() }; }), isActive: d.get("active") === "on", expectedRevision: item?.revision ?? null }; this.run(async () => { await this.request(item ? `/topics/${item.id}` : "/topics", { method: item ? "PUT" : "POST", body: JSON.stringify(payload) }); dialog.close(); await this.load(); }, "Đã lưu chuyên đề."); }); dialog.showModal();
  }
  async remove(id) { if (!await this.confirmDelete("Xóa chuyên đề này? Chuyên đề có câu hỏi sẽ không được phép xóa.")) return; await this.run(async () => { await this.request(`/topics/${id}`, { method: "DELETE" }); await this.load(); }, "Đã xóa chuyên đề."); }
}

class QuestionsPage extends AdminPage {
  constructor() { super("Câu hỏi"); this.search = ""; this.topicId = ""; this.status = ""; this.topics = []; this.pageSize = DEFAULT_PAGE_SIZE; }
  async request(path, options = {}) {
    const result = await super.request(path, options);
    if (['POST', 'PUT', 'DELETE'].includes(options.method))
      this.dispatchEvent(new CustomEvent('quiz-data-changed', { bubbles: true, composed: true }));
    return result;
  }
  async load() {
    this.loading = true; this.render();
    try { if (!this.topics.length) { let page = 1, result; do { result = await this.request(`/topics?page=${page}&pageSize=100`); this.topics.push(...result.items); page++; } while (page <= result.totalPages); } const q = new URLSearchParams({ page: this.page, pageSize: this.pageSize }); if (this.search) q.set("search", this.search); if (this.topicId) q.set("topicId", this.topicId); if (this.status) q.set("isActive", this.status); this.result = await this.request(`/questions?${q}`); this.error = ""; } catch (e) { this.error = e.message; } finally { this.loading = false; this.render(); }
  }
  render() {
    if (!this.shadowRoot) return; const topicOptions = this.topics.map(x => `<option value="${x.id}" ${String(x.id) === String(this.topicId) ? "selected" : ""}>${x.id} — ${esc(x.title)}</option>`).join("");
    const rows = (this.result?.items || []).map(x => `<tr><td class="mono"><button class="link" data-view="${esc(x.code)}">${esc(x.code)}</button></td><td><button type="button" class="question-preview-trigger" data-view="${esc(x.code)}">${esc(x.question)}</button><small>${esc(x.kind)}</small></td><td>${esc(x.topicTitle)}</td><td><span class="answer">${esc(x.correctAnswer)}</span></td><td><span class="badge ${x.isActive ? "on" : "off"}">${x.isActive ? "Đang dùng" : "Ngừng dùng"}</span></td><td class="actions"><button data-edit="${esc(x.code)}">Sửa</button><button class="danger ghost" data-delete="${esc(x.code)}">Xóa</button></td></tr>`).join("");
    this.shadowRoot.innerHTML = this.shell(`<section class="box"><div class="toolbar"><form id="search" class="filters"><input name="term" value="${esc(this.search)}" placeholder="Tìm mã, nội dung hoặc loại câu hỏi…"><select name="topic"><option value="">Tất cả chuyên đề</option>${topicOptions}</select><select name="status"><option value="">Tất cả trạng thái</option><option value="true" ${this.status === "true" ? "selected" : ""}>Đang dùng</option><option value="false" ${this.status === "false" ? "selected" : ""}>Ngừng dùng</option></select><button>Tìm kiếm</button></form><button class="primary" id="create">+ Thêm câu hỏi</button></div><div class="summary">${this.loading ? "Đang tải…" : `${this.result?.totalItems || 0} câu hỏi`}</div><div class="table-wrap"><table><thead><tr><th>Mã</th><th>Câu hỏi</th><th>Chuyên đề</th><th>Đáp án đúng</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="6" class="empty">Không có dữ liệu phù hợp.</td></tr>`}</tbody></table></div>${pager(this.result)}</section><dialog id="editor" class="large"></dialog>`);
    this.shadowRoot.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => this.dispatchEvent(new CustomEvent('question-view', { detail: this.result.items.find(q => q.code === button.dataset.view), bubbles: true, composed: true }))));
    this.shadowRoot.querySelector("#search")?.addEventListener("submit", e => { e.preventDefault(); const d = new FormData(e.currentTarget); this.search = d.get("term").trim(); this.topicId = d.get("topic"); this.status = d.get("status"); this.page = 1; this.load(); }); this.shadowRoot.querySelector("#create")?.addEventListener("click", () => this.openEditor()); this.shadowRoot.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", async () => this.openEditor(await this.request(`/questions/${encodeURIComponent(b.dataset.edit)}`)))); this.shadowRoot.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => this.remove(b.dataset.delete))); this.bindPager();
  }
  openEditor(item = null) {
    const dialog = this.shadowRoot.querySelector("#editor"); const answers = Object.fromEntries((item?.answers || []).map(x => [x.key, x]));
    const answerRows = keys.map((key, i) => `<div class="answer-row"><label class="correct"><input type="radio" name="correct" value="${key}" ${answers[key]?.isCorrect || (!item && i === 0) ? "checked" : ""}><strong>${key}</strong><small>Đúng</small></label><label>Nội dung đáp án (có thể bỏ trống)<textarea name="text-${key}" rows="2" maxlength="1000">${esc(answers[key]?.text)}</textarea></label><label>Giải thích<textarea name="exp-${key}" rows="2" maxlength="2000">${esc(answers[key]?.explanation)}</textarea></label></div>`).join("");
    dialog.innerHTML = `<form method="dialog" id="form"><header><div><h2>${item ? "Cập nhật" : "Thêm"} câu hỏi</h2><p>Có từ 2–4 lựa chọn và duy nhất 1 đáp án đúng.</p></div><button type="button" data-close class="close" aria-label="Đóng">×</button></header><div class="form-grid"><label>Mã câu hỏi<span>*</span><input name="code" maxlength="16" required value="${esc(item?.code)}" ${item ? "readonly" : ""}></label><label>Chuyên đề<span>*</span><select name="topic" required>${this.topics.map(x => `<option value="${x.id}" ${x.id === item?.topicId ? "selected" : ""}>${x.id} — ${esc(x.title)}</option>`).join("")}</select></label><label class="wide">Loại câu hỏi<span>*</span><input name="kind" maxlength="40" required value="${esc(item?.kind || "Chọn đáp án phù hợp nhất")}"></label><label class="wide">Tình huống<textarea name="situation" rows="2" maxlength="2000">${esc(item?.situation)}</textarea></label><label class="wide">Nội dung câu hỏi<span>*</span><textarea name="question" rows="3" minlength="5" maxlength="2000" required>${esc(item?.question)}</textarea></label></div><h3>Đáp án</h3><div class="answers">${answerRows}</div><div class="form-grid"><label class="wide">Khuyến nghị an toàn<textarea name="safe" rows="3" maxlength="3000">${esc(item?.safeAction)}</textarea></label><label>Thứ tự hiển thị<input name="sort" type="number" min="0" required value="${item?.sortOrder ?? 0}"></label><label>Thời gian đọc (giây)<input name="seconds" type="number" min="0" max="600" required value="${item?.readSeconds ?? 0}"></label><label>Thứ tự Thử sức<input name="sampleOrder" type="number" min="1" value="${item?.sampleOrder ?? ""}"></label><label>Nhãn Thử sức<input name="sampleLabel" maxlength="60" value="${esc(item?.sampleLabel)}"></label><label class="check wide"><input name="active" type="checkbox" ${item?.isActive !== false ? "checked" : ""}> Đang sử dụng</label></div><footer><button type="button" data-close>Hủy</button><button type="submit" value="save" class="primary">Lưu câu hỏi</button></footer></form>`;
    dialog.querySelector('header p').textContent = 'Có từ 2–4 lựa chọn và duy nhất 1 đáp án đúng. Câu Đúng–Sai để trống C/D; không chọn đáp án trống làm đáp án đúng.';
    dialog.querySelector('input[name="sampleOrder"]').max = '8';
    const form = dialog.querySelector("#form"); dialog.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => dialog.close())); form.addEventListener("submit", e => { e.preventDefault(); const d = new FormData(form); const correct = d.get("correct"); const payload = { code: d.get("code"), topicId: Number(d.get("topic")), kind: d.get("kind"), situation: d.get("situation"), question: d.get("question"), answers: keys.map(key => ({ key, text: d.get(`text-${key}`), explanation: d.get(`exp-${key}`), isCorrect: key === correct })), safeAction: d.get("safe"), readSeconds: Number(d.get("seconds")), sampleOrder: d.get("sampleOrder") ? Number(d.get("sampleOrder")) : null, sampleLabel: d.get("sampleLabel") || null, sortOrder: Number(d.get("sort")), isActive: d.get("active") === "on", expectedRevision: item?.revision ?? null }; this.run(async () => { await this.request(item ? `/questions/${encodeURIComponent(item.code)}` : "/questions", { method: item ? "PUT" : "POST", body: JSON.stringify(payload) }); dialog.close(); await this.load(); }, "Đã lưu câu hỏi và cập nhật ngân hàng."); }); dialog.showModal();
  }
  async remove(code) { if (!await this.confirmDelete(`Xóa câu hỏi ${code}? Nếu đã có người trả lời, hệ thống chỉ chuyển sang Ngừng dùng để bảo toàn lịch sử.`)) return; await this.run(async () => { const result = await this.request(`/questions/${encodeURIComponent(code)}`, { method: "DELETE" }); await this.load(); this.message = result.deactivated ? "Câu hỏi đã có dữ liệu dự thi nên được chuyển sang Ngừng dùng." : "Đã xóa câu hỏi."; }, "Đã xử lý câu hỏi."); }
}



class ContestPage extends AdminPage {
  constructor() { super("Cuộc thi"); this.search = ""; this.active = ""; this.state = ''; this.campaigns = []; }
  async request(path, options = {}) {
    const token = await this.auth.getLatestToken();
    const response = await fetch(`${CONTEST_API}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => null);
    if (!response.ok) { const error = new Error(payload?.error?.message || `Yêu cầu thất bại (${response.status}).`); error.fields = payload?.error?.fields || {}; throw error; }
    return payload;
  }
  async load() {
    this.loading = true; this.render();
    try {
      this.campaigns = await loadCampaigns(path => this.request(path));
      this.filterCampaigns();
      this.error = "";
    } catch (e) { this.error = e.message; } finally { this.loading = false; this.render(); }
  }
  filterCampaigns() {
    const term = this.search.toLocaleLowerCase('vi-VN').replace(/^#/, '');
    const filtered = this.campaigns.filter(c => (!term || String(c.id) === term || `${c.name} ${c.description || ''}`.toLocaleLowerCase('vi-VN').includes(term)) && (!this.active || String(c.isActive) === this.active) && (!this.state || campaignState(c).key === this.state));
    const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize)); this.page = Math.min(this.page, totalPages);
    this.result = { items: filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize), totalItems: filtered.length, page: this.page, pageSize: this.pageSize, totalPages };
  }
  bindPager() {
    const update = () => { this.filterCampaigns(); this.render(); };
    this.shadowRoot.querySelector('[data-page-size]')?.addEventListener('change', event => { this.pageSize = Number(event.target.value); this.page = 1; update(); });
    this.shadowRoot.querySelector('[data-prev]')?.addEventListener('click', () => { this.page = Math.max(1, this.page - 1); update(); });
    this.shadowRoot.querySelector('[data-next]')?.addEventListener('click', () => { this.page = Math.min(this.result.totalPages, this.page + 1); update(); });
    this.shadowRoot.querySelectorAll('[data-page-size],[data-prev],[data-next],#create-campaign,[data-state]').forEach(el => { el.disabled ||= this.loading; });
  }
  render() {
    const now = Date.now();
    const rows = (this.result?.items || []).map(x => {
      const state = campaignState(x, now);
      const progress = Math.max(0, Math.min(100, 100 * (now - Date.parse(x.startAt)) / (Date.parse(x.endAt) - Date.parse(x.startAt))));
      return `<tr><td><button class="campaign-name" data-open-campaign="${x.id}"><span class="mono">#${x.id}</span><strong>${esc(x.name)}</strong></button><small class="block">${esc(x.description || "")}</small></td><td class="nowrap"><div class="campaign-dates"><time datetime="${esc(x.startAt)}" aria-label="Bắt đầu: ${formatContestDate(x.startAt)}">${formatContestDate(x.startAt)}</time><span class="campaign-date-arrow" aria-hidden="true">↓</span><time class="muted" datetime="${esc(x.endAt)}" aria-label="Kết thúc: ${formatContestDate(x.endAt)}">${formatContestDate(x.endAt)}</time></div>${state.key === 'live' ? `<div class="schedule-progress"><span style="width:${progress}%"></span></div>` : ''}</td><td>${x.topicCount} chuyên đề<small class="block">${x.questionCount} câu hỏi · ${x.maxAttempts === 0 ? "Không giới hạn lượt" : `${x.maxAttempts} lượt/người`}</small></td><td><strong>${x.entryCount}</strong></td><td><span class="badge ${state.color}">${state.label}</span></td><td class="actions"><button data-edit-campaign="${x.id}">Mở</button><button class="danger ghost" data-delete-campaign="${x.id}" ${x.entryCount || Date.parse(x.startAt) <= now ? 'disabled title="Cuộc thi đã bắt đầu hoặc có lượt thi, không thể xóa"' : ''}>Xóa</button></td></tr>`;
    }).join("");
    const headers = "<th>Cuộc thi</th><th>Thời gian</th><th>Bộ đề</th><th>Lượt dự thi</th><th>Trạng thái</th><th>Thao tác</th>";
    const tabs = [['', 'Tất cả'], ['live', 'Đang diễn ra'], ['upcoming', 'Sắp diễn ra'], ['ended', 'Đã kết thúc'], ['inactive', 'Ngừng dùng']].map(([key,label]) => `<button type="button" data-state="${key}" aria-pressed="${this.state === key}" class="${this.state === key ? 'primary' : ''}">${label}<span>${this.campaigns.filter(c => !key || campaignState(c).key === key).length}</span></button>`).join('');
    this.shadowRoot.innerHTML = this.shell(`<div class="list-heading"><p class="muted">Mỗi cuộc thi có lịch riêng, không được trùng thời gian với cuộc thi khác.</p><button class="primary" id="create-campaign">+ Tạo cuộc thi</button></div>${scheduleMarkup(this.campaigns)}<section class="box campaign-list"><div class="campaign-list-tools"><div class="status-tabs" role="group" aria-label="Lọc theo trạng thái">${tabs}</div><form id="search" class="filters campaign-search"><input type="search" name="term" aria-label="Tìm cuộc thi" value="${esc(this.search)}" placeholder="Tìm theo tên hoặc mã cuộc thi"><button>Tìm kiếm</button></form></div><div class="summary" role="status">${this.loading ? "Đang tải…" : `${this.result?.totalItems || 0} cuộc thi`}</div><div class="table-wrap"><table><thead><tr>${headers}</tr></thead><tbody>${rows || `<tr><td colspan="6" class="empty">Không có dữ liệu phù hợp.</td></tr>`}</tbody></table></div>${pager(this.result)}</section><dialog id="editor" class="large"></dialog>`);
    this.shadowRoot.querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => { this.state = button.dataset.state; this.page = 1; this.filterCampaigns(); this.render(); }));
    this.shadowRoot.querySelector("#search").addEventListener("submit", e => { e.preventDefault(); const d = new FormData(e.currentTarget); this.search = d.get("term").trim(); this.active = ""; this.page = 1; this.filterCampaigns(); this.render(); });
    this.shadowRoot.querySelector("#create-campaign").addEventListener("click", () => this.openCampaign());
    this.shadowRoot.querySelectorAll("[data-edit-campaign],[data-open-campaign]").forEach(b => b.addEventListener("click", async () => this.openCampaign(await this.request(`/campaigns/${b.dataset.editCampaign || b.dataset.openCampaign}`))));
    this.shadowRoot.querySelectorAll("[data-delete-campaign]").forEach(b => b.addEventListener("click", () => this.removeCampaign(b.dataset.deleteCampaign)));
    this.bindPager();
  }
  async openCampaign(item = null) {
    const dialog = this.shadowRoot.querySelector("#editor");
    const tree = item?.topics || await this.request("/campaigns/question-tree");
    const selectedPrizes = new Map((item?.prizes || []).map(p => [p.prizeId, p]));
    const prizeOptions = []; let prizePage = 1, prizeResult;
    do { prizeResult = await this.request(`/prizes?page=${prizePage++}&pageSize=100`); prizeOptions.push(...prizeResult.items); } while (prizePage <= prizeResult.totalPages);
    const prizeHtml = `<details class="contest-prize-picker"><summary>Chọn giải thưởng và số lượng <span data-prize-count>${selectedPrizes.size} đã chọn</span></summary><p class="muted">Danh mục dùng chung; số lượng đặt riêng cho cuộc thi này. Tạo loại giải tại menu Giải thưởng. Không cấu hình giải thì không thể quay thưởng.</p><input type="search" data-prize-search placeholder="Tìm mã hoặc tên giải…" aria-label="Tìm giải để chọn"><div class="contest-prize-options">${prizeOptions.filter(p => p.isActive || selectedPrizes.has(p.id)).map(p => { const selected = selectedPrizes.get(p.id); return `<div class="contest-prize-option" data-prize-option="${p.id}" data-prize-text="${esc(`${p.code} ${p.name}`.toLowerCase())}"><label class="check"><input type="checkbox" data-prize="${p.id}" ${selected ? 'checked' : ''} ${selected?.awarded ? 'disabled' : ''}> <strong>${esc(p.code)} — ${esc(p.name)}</strong>${!p.isActive ? ' (Ngừng dùng)' : ''}</label><label>Số lượng<input type="number" data-prize-quantity="${p.id}" min="${Math.max(1, selected?.awarded || 0)}" max="1000" required value="${selected?.quantity || 1}" ${selected ? '' : 'disabled'}></label><label>Tiền thưởng/suất (VNĐ)<input type="number" data-prize-money="${p.id}" min="0" max="9007199254740991" step="1" required value="${selected?.prizeMoney ?? 0}" ${selected ? '' : 'disabled'}></label><small>Đã trao: ${selected?.awarded || 0} · ${esc(p.description || '')}</small></div>`; }).join('') || '<p>Chưa có giải đang dùng. Hãy tạo giải thưởng trước.</p>'}</div>${item?.id ? '<button type="button" data-save-prizes class="secondary">Lưu riêng cấu hình giải thưởng</button>' : ''}</details>`;
    const localValue = value => { if (!value) return ""; const d = new Date(value); const offset = d.getTimezoneOffset(); return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16); };
    const treeHtml = tree.map(topic => `<details class="tree-topic" data-topic-node="${topic.id}"><summary><span class="tree-caret" aria-hidden="true">›</span><label><input type="checkbox" data-topic="${topic.id}" ${topic.isSelected ? "checked" : ""} ${topic.isActive ? "" : "disabled"}> <strong>${topic.id} — ${esc(topic.title)}</strong></label><span class="tree-count">${topic.questions.filter(x => x.isSelected).length}/${topic.questions.length} câu</span>${topic.isActive ? "" : `<em>Ngừng dùng</em>`}</summary><div class="tree-questions">${topic.questions.map(question => `<label class="tree-question ${question.isActive ? "" : "inactive"}"><input type="checkbox" data-question="${esc(question.code)}" ${question.isSelected ? "checked" : ""} ${topic.isActive && question.isActive ? "" : "disabled"}> <span class="mono">${esc(question.code)}</span><span>${esc(question.question)}</span>${question.isActive ? "" : `<em>Ngừng dùng</em>`}</label>`).join("") || `<p class="empty-tree">Chuyên đề chưa có câu hỏi.</p>`}</div></details>`).join("");
    dialog.innerHTML = `<form method="dialog" id="form"><header><div><h2>${item ? "Cập nhật" : "Tạo"} cuộc thi</h2><p>Chọn chuyên đề và câu hỏi. Thời gian diễn ra không được trùng với cuộc thi khác, kể cả cuộc thi ngừng sử dụng.</p></div><button type="button" data-close class="close" aria-label="Đóng">×</button></header><div class="form-grid"><label class="wide">Tên cuộc thi<span>*</span><input name="name" minlength="2" maxlength="200" required value="${esc(item?.name)}"></label><label class="wide">Mô tả<textarea name="description" maxlength="2000" rows="3">${esc(item?.description)}</textarea></label><label>Bắt đầu<span>*</span><input name="startAt" type="datetime-local" required value="${localValue(item?.startAt)}"></label><label>Kết thúc<span>*</span><input name="endAt" type="datetime-local" required value="${localValue(item?.endAt)}"></label><label>Số lượt tối đa<span>*</span><input name="maxAttempts" type="number" min="0" max="1000" required value="${item?.maxAttempts ?? 2}"><small>Nhập 0 để không giới hạn lượt thi.</small></label><label>Gia hạn nộp bài (giờ)<span>*</span><input name="submitGraceHours" type="number" min="0" max="168" required value="${item?.submitGraceHours ?? 24}"></label><label>Hệ số thời gian đọc<span>*</span><input name="readTimerFactor" type="number" min="0" max="5" step="0.1" required value="${item?.readTimerFactor ?? 1}"></label><label>Lĩnh vực <small>Chữ thường không dấu, số, gạch ngang hoặc gạch dưới</small><input name="focusArea" maxlength="50" pattern="[a-z0-9_\-]{1,50}" value="${esc(item?.focusArea)}"></label><label class="check"><input name="active" type="checkbox" ${item?.isActive !== false ? "checked" : ""}> Đang sử dụng</label>${item?.entryCount ? `<p class="wide">Cuộc thi đã có ${item.entryCount} lượt dự thi: không thể đổi bộ đề hoặc xóa cuộc thi.</p>` : ""}</div>${prizeHtml}<div class="tree-heading"><div><h3>Chuyên đề và câu hỏi<span>*</span></h3><p>Click vào chuyên đề để xem danh sách câu hỏi; checkbox chuyên đề chọn hoặc bỏ chọn toàn bộ câu hỏi con.</p></div><button type="button" id="expand-tree">Mở tất cả</button></div><div class="contest-tree">${treeHtml || `<p class="empty">Chưa có chuyên đề trong ngân hàng câu hỏi.</p>`}</div><footer><button type="button" data-close>Hủy</button><button type="submit" class="primary">Lưu cuộc thi</button></footer></form>`;
    const { deckLocked } = arrangeCampaignEditor(dialog, item);
    const updateTopicState = node => { const parent = node.querySelector("[data-topic]"); const children = [...node.querySelectorAll("[data-question]")]; const checked = children.filter(x => x.checked).length; parent.checked = children.length > 0 && checked === children.length; parent.indeterminate = checked > 0 && checked < children.length; node.querySelector(".tree-count").textContent = `${checked}/${children.length} câu`; };
    dialog.querySelectorAll('[data-prize]').forEach(box => box.addEventListener('change', () => {
      dialog.querySelector(`[data-prize-quantity="${box.dataset.prize}"]`).disabled = !box.checked; dialog.querySelector(`[data-prize-money="${box.dataset.prize}"]`).disabled = !box.checked;
      dialog.querySelector('[data-prize-count]').textContent = `${dialog.querySelectorAll('[data-prize]:checked').length} đã chọn`;
    }));
    dialog.querySelector('[data-prize-search]')?.addEventListener('input', e => dialog.querySelectorAll('[data-prize-option]').forEach(row => { row.hidden = !row.dataset.prizeText.includes(e.target.value.trim().toLowerCase()); }));
    dialog.querySelectorAll("[data-topic-node]").forEach(node => { updateTopicState(node); node.querySelector("[data-topic]").addEventListener("change", e => { node.querySelectorAll("[data-question]:not(:disabled)").forEach(x => x.checked = e.currentTarget.checked); updateTopicState(node); }); node.querySelectorAll("[data-question]").forEach(x => x.addEventListener("change", () => updateTopicState(node))); });
    dialog.querySelector('[data-save-prizes]')?.addEventListener('click', () => this.run(async () => { const prizes = [...dialog.querySelectorAll('[data-prize]:checked')].map(box => ({ prizeId: Number(box.dataset.prize), quantity: Number(dialog.querySelector(`[data-prize-quantity="${box.dataset.prize}"]`).value), prizeMoney: Number(dialog.querySelector(`[data-prize-money="${box.dataset.prize}"]`).value) })); await this.request(`/campaigns/${item.id}/prizes`, { method: 'PUT', body: JSON.stringify({ prizes, expectedRevision: item.revision }) }); dialog.close(); await this.load(); }, 'Đã cập nhật giải thưởng, không thay đổi lịch hoặc bộ đề.'));
    dialog.querySelector("#expand-tree")?.addEventListener("click", e => { const nodes = [...dialog.querySelectorAll(".tree-topic")]; const open = nodes.some(x => !x.open); nodes.forEach(x => x.open = open); e.currentTarget.textContent = open ? "Thu gọn tất cả" : "Mở tất cả"; });
    dialog.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => dialog.close()));
    dialog.querySelector("#form").addEventListener("submit", e => { e.preventDefault(); const d = new FormData(e.currentTarget); const topics = deckLocked ? (item.topics || []).map(t => ({ topicId: t.id, questionCodes: t.questions.filter(q => q.isSelected).map(q => q.code) })).filter(t => t.questionCodes.length) : [...dialog.querySelectorAll("[data-topic-node]")].map(node => ({ topicId: Number(node.dataset.topicNode), questionCodes: [...node.querySelectorAll("[data-question]:checked:not(:disabled)")].map(x => x.dataset.question) })).filter(x => x.questionCodes.length); const instant = (field, stored, second) => { const typed = d.get(field); if (stored && typed === localValue(stored)) return stored; const t = new Date(typed); t.setSeconds(second, 0); return t.toISOString(); }; const payload = { name: d.get("name"), description: d.get("description") || null, startAt: instant("startAt", item?.startAt, 0), endAt: instant("endAt", item?.endAt, 59), maxAttempts: Number(d.get("maxAttempts")), submitGraceHours: Number(d.get("submitGraceHours")), readTimerFactor: Number(d.get("readTimerFactor")), focusArea: d.get("focusArea")?.trim() || null, isActive: d.get("active") === "on", topics, prizes: [...dialog.querySelectorAll('[data-prize]:checked')].map(box => ({ prizeId: Number(box.dataset.prize), quantity: Number(dialog.querySelector(`[data-prize-quantity="${box.dataset.prize}"]`).value), prizeMoney: Number(dialog.querySelector(`[data-prize-money="${box.dataset.prize}"]`).value) })), expectedRevision: item?.revision ?? null }; this.run(async () => { await this.request(item ? `/campaigns/${item.id}` : "/campaigns", { method: item ? "PUT" : "POST", body: JSON.stringify(payload) }); dialog.close(); await this.load(); }, item ? "Đã cập nhật cuộc thi." : "Đã tạo cuộc thi."); });
    dialog.showModal();
  }
  async removeCampaign(id) { if (!await this.confirmDelete("Xóa cuộc thi và toàn bộ cấu hình chuyên đề/câu hỏi đã chọn?")) return; await this.run(async () => { await this.request(`/campaigns/${id}`, { method: "DELETE" }); await this.load(); }, "Đã xóa cuộc thi."); }
}

const styles = contestStylesText;

class ContestManagementLitView extends UmbLitElement {
  static properties = { view: { type: String } };
  static styles = css`:host{display:block;height:100%;min-height:240px}`;
  constructor() { super(); this.view = ""; }
  render() {
    if (this.view === "questions") return html`<antc-contest-questions-table></antc-contest-questions-table>`;
    if (this.view === "topics") return html`<antc-contest-topics-table></antc-contest-topics-table>`;
    if (this.view === "contest") return html`<antc-contest-table></antc-contest-table>`;
    return html`<antc-contest-questions-view></antc-contest-questions-view>`;
  }
}

// One workspace owns the existing CRUD table, Excel import/export and import history.
class QuestionsLitView extends ContestBankView {}
class TopicsLitView extends ContestManagementLitView { constructor() { super(); this.view = "topics"; } }
class QuestionBankLitView extends QuestionsLitView {}
class ContestLitView extends UmbLitElement {
  static properties = { _tab: { state: true }, _visited: { state: true } };
  static styles = contestStyles;
  constructor() { super(); this._tab = 'campaigns'; this._visited = new Set(['campaigns']); }
  _selectTab(key) { this._visited.add(key); this._tab = key; }
  render() {
    const tabs = [['campaigns', 'Danh sách cuộc thi'], ['entries', 'Lượt dự thi'], ['draws', 'Quay số trúng thưởng']];
    return html`<umb-body-layout main-no-padding><div class="page">
      <header class="page-heading"><div><div class="eyebrow">Vận hành</div><h1>Cuộc thi</h1></div>
      <div class="tabs" role="tablist" aria-label="Quản lý cuộc thi">${tabs.map(([key, label]) => html`<button id=${`contest-tab-${key}`} role="tab" class=${this._tab === key ? 'primary' : ''} aria-selected=${this._tab === key} aria-controls=${`contest-panel-${key}`} @click=${() => this._selectTab(key)}>${label}</button>`)}</div></header>
      <div id="contest-panel-campaigns" role="tabpanel" aria-labelledby="contest-tab-campaigns" ?hidden=${this._tab !== 'campaigns'}><antc-contest-table embedded></antc-contest-table></div>
      <div id="contest-panel-entries" role="tabpanel" aria-labelledby="contest-tab-entries" ?hidden=${this._tab !== 'entries'}>${this._visited.has('entries') ? html`<antc-contest-entries-report-view embedded></antc-contest-entries-report-view>` : ''}</div>
      <div id="contest-panel-draws" role="tabpanel" aria-labelledby="contest-tab-draws" ?hidden=${this._tab !== 'draws'}>${this._visited.has('draws') ? html`<antc-contest-draws-view embedded></antc-contest-draws-view>` : ''}</div>
    </div></umb-body-layout>`;
  }
}

if (!customElements.get("antc-contest-topics-table")) customElements.define("antc-contest-topics-table", TopicsPage);
if (!customElements.get("antc-contest-questions-table")) customElements.define("antc-contest-questions-table", QuestionsPage);

if (!customElements.get("antc-contest-table")) customElements.define("antc-contest-table", ContestPage);
if (!customElements.get("antc-contest-topics-view")) customElements.define("antc-contest-topics-view", TopicsLitView);
if (!customElements.get("antc-contest-questions-view")) customElements.define("antc-contest-questions-view", QuestionsLitView);
if (!customElements.get("antc-contest-question-bank-view")) customElements.define("antc-contest-question-bank-view", QuestionBankLitView);
if (!customElements.get("antc-contest-view")) customElements.define("antc-contest-view", ContestLitView);

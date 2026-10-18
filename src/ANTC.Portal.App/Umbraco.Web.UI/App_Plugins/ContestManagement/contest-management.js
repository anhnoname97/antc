import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { css, html } from "@umbraco-cms/backoffice/external/lit";

const API = "/api/v1/admin/quiz";
const CONTEST_API = "/api/v1/admin/contest";
const keys = ["A", "B", "C", "D"];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const formatDate = (v) => v ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(v)) : "—";
const lines = (v) => String(v || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const pager = (r) => `<div class="pager"><button data-prev ${!r || r.page <= 1 ? "disabled" : ""}>← Trước</button><span>Trang ${r?.page || 1}/${Math.max(1, r?.totalPages || 1)}</span><button data-next ${!r || r.page >= r.totalPages ? "disabled" : ""}>Sau →</button></div>`;

class AdminPage extends UmbElementMixin(HTMLElement) {
  constructor(title) { super(); this.title = title; this.page = 1; this.pageSize = 20; this.loading = false; this.message = ""; this.error = ""; this.attachShadow({ mode: "open" }); }
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
  async run(action, success) {
    this.error = "";
    try { await action(); this.message = success; setTimeout(() => { this.message = ""; this.render(); }, 3500); }
    catch (error) { this.error = `${error.message}${Object.values(error.fields || {}).length ? ` ${Object.values(error.fields).join(" ")}` : ""}`; }
    this.render();
  }
  shell(content) { return `<style>${styles}</style><umb-body-layout headline="${esc(this.title)}"><div class="page">${this.error ? `<div class="notice error">${esc(this.error)}</div>` : ""}${this.message ? `<div class="notice success">${esc(this.message)}</div>` : ""}${content}</div></umb-body-layout>`; }
  bindPager() {
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
    const form = dialog.querySelector("#form"); dialog.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => dialog.close())); form.addEventListener("submit", e => { e.preventDefault(); const d = new FormData(form); const payload = { id: Number(d.get("id")), title: d.get("title"), intro: lines(d.get("intro")), terms: lines(d.get("terms")).map(line => { const [term, ...rest] = line.split("|"); return { term: term.trim(), definition: rest.join("|").trim() }; }), isActive: d.get("active") === "on" }; this.run(async () => { await this.request(item ? `/topics/${item.id}` : "/topics", { method: item ? "PUT" : "POST", body: JSON.stringify(payload) }); dialog.close(); await this.load(); }, "Đã lưu chuyên đề."); }); dialog.showModal();
  }
  async remove(id) { if (!confirm("Xóa chuyên đề này? Chuyên đề có câu hỏi sẽ không được phép xóa.")) return; await this.run(async () => { await this.request(`/topics/${id}`, { method: "DELETE" }); await this.load(); }, "Đã xóa chuyên đề."); }
}

class QuestionsPage extends AdminPage {
  constructor() { super("Câu hỏi"); this.search = ""; this.topicId = ""; this.status = ""; this.topics = []; }
  async load() {
    this.loading = true; this.render();
    try { if (!this.topics.length) this.topics = (await this.request("/topics?page=1&pageSize=100")).items; const q = new URLSearchParams({ page: this.page, pageSize: this.pageSize }); if (this.search) q.set("search", this.search); if (this.topicId) q.set("topicId", this.topicId); if (this.status) q.set("isActive", this.status); this.result = await this.request(`/questions?${q}`); this.error = ""; } catch (e) { this.error = e.message; } finally { this.loading = false; this.render(); }
  }
  render() {
    if (!this.shadowRoot) return; const topicOptions = this.topics.map(x => `<option value="${x.id}" ${String(x.id) === String(this.topicId) ? "selected" : ""}>${x.id} — ${esc(x.title)}</option>`).join("");
    const rows = (this.result?.items || []).map(x => `<tr><td class="mono"><strong>${esc(x.code)}</strong></td><td><div class="question">${esc(x.question)}</div><small>${esc(x.kind)}</small></td><td>${esc(x.topicTitle)}</td><td><span class="answer">${esc(x.correctAnswer)}</span></td><td>${x.sortOrder}</td><td>${x.sampleOrder ? `#${x.sampleOrder}` : "—"}</td><td><span class="badge ${x.isActive ? "on" : "off"}">${x.isActive ? "Đang dùng" : "Ngừng dùng"}</span></td><td class="actions"><button data-edit="${esc(x.code)}">Sửa</button><button class="danger ghost" data-delete="${esc(x.code)}">Xóa</button></td></tr>`).join("");
    this.shadowRoot.innerHTML = this.shell(`<section class="box"><div class="toolbar"><form id="search" class="filters"><input name="term" value="${esc(this.search)}" placeholder="Tìm mã, nội dung hoặc loại câu hỏi…"><select name="topic"><option value="">Tất cả chuyên đề</option>${topicOptions}</select><select name="status"><option value="">Tất cả trạng thái</option><option value="true" ${this.status === "true" ? "selected" : ""}>Đang dùng</option><option value="false" ${this.status === "false" ? "selected" : ""}>Ngừng dùng</option></select><button>Tìm kiếm</button></form><button class="primary" id="create">+ Thêm câu hỏi</button></div><div class="summary">${this.loading ? "Đang tải…" : `${this.result?.totalItems || 0} câu hỏi`}</div><div class="table-wrap"><table><thead><tr><th>Mã</th><th>Câu hỏi</th><th>Chuyên đề</th><th>Đáp án đúng</th><th>Thứ tự</th><th>Thử sức</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="8" class="empty">Không có dữ liệu phù hợp.</td></tr>`}</tbody></table></div>${pager(this.result)}</section><dialog id="editor" class="large"></dialog>`);
    this.shadowRoot.querySelector("#search")?.addEventListener("submit", e => { e.preventDefault(); const d = new FormData(e.currentTarget); this.search = d.get("term").trim(); this.topicId = d.get("topic"); this.status = d.get("status"); this.page = 1; this.load(); }); this.shadowRoot.querySelector("#create")?.addEventListener("click", () => this.openEditor()); this.shadowRoot.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", async () => this.openEditor(await this.request(`/questions/${encodeURIComponent(b.dataset.edit)}`)))); this.shadowRoot.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => this.remove(b.dataset.delete))); this.bindPager();
  }
  openEditor(item = null) {
    const dialog = this.shadowRoot.querySelector("#editor"); const answers = Object.fromEntries((item?.answers || []).map(x => [x.key, x]));
    const answerRows = keys.map((key, i) => `<div class="answer-row"><label class="correct"><input type="radio" name="correct" value="${key}" ${answers[key]?.isCorrect || (!item && i === 0) ? "checked" : ""}><strong>${key}</strong><small>Đúng</small></label><label>Nội dung đáp án<span>*</span><textarea name="text-${key}" rows="2" maxlength="1000" required>${esc(answers[key]?.text)}</textarea></label><label>Giải thích<textarea name="exp-${key}" rows="2" maxlength="2000">${esc(answers[key]?.explanation)}</textarea></label></div>`).join("");
    dialog.innerHTML = `<form method="dialog" id="form"><header><div><h2>${item ? "Cập nhật" : "Thêm"} câu hỏi</h2><p>Phải có đúng 4 đáp án và duy nhất 1 đáp án đúng.</p></div><button type="button" data-close class="close" aria-label="Đóng">×</button></header><div class="form-grid"><label>Mã câu hỏi<span>*</span><input name="code" maxlength="16" required value="${esc(item?.code)}" ${item ? "readonly" : ""}></label><label>Chuyên đề<span>*</span><select name="topic" required>${this.topics.map(x => `<option value="${x.id}" ${x.id === item?.topicId ? "selected" : ""}>${x.id} — ${esc(x.title)}</option>`).join("")}</select></label><label class="wide">Loại câu hỏi<span>*</span><input name="kind" maxlength="40" required value="${esc(item?.kind || "Chọn đáp án phù hợp nhất")}"></label><label class="wide">Tình huống<textarea name="situation" rows="2" maxlength="2000">${esc(item?.situation)}</textarea></label><label class="wide">Nội dung câu hỏi<span>*</span><textarea name="question" rows="3" minlength="5" maxlength="2000" required>${esc(item?.question)}</textarea></label></div><h3>Đáp án</h3><div class="answers">${answerRows}</div><div class="form-grid"><label class="wide">Khuyến nghị an toàn<textarea name="safe" rows="3" maxlength="3000">${esc(item?.safeAction)}</textarea></label><label>Thứ tự hiển thị<input name="sort" type="number" min="0" required value="${item?.sortOrder ?? 0}"></label><label>Thời gian đọc (giây)<input name="seconds" type="number" min="0" max="600" required value="${item?.readSeconds ?? 0}"></label><label>Thứ tự Thử sức<input name="sampleOrder" type="number" min="1" value="${item?.sampleOrder ?? ""}"></label><label>Nhãn Thử sức<input name="sampleLabel" maxlength="60" value="${esc(item?.sampleLabel)}"></label><label class="check wide"><input name="active" type="checkbox" ${item?.isActive !== false ? "checked" : ""}> Đang sử dụng</label></div><footer><button type="button" data-close>Hủy</button><button type="submit" value="save" class="primary">Lưu câu hỏi</button></footer></form>`;
    const form = dialog.querySelector("#form"); dialog.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => dialog.close())); form.addEventListener("submit", e => { e.preventDefault(); const d = new FormData(form); const correct = d.get("correct"); const payload = { code: d.get("code"), topicId: Number(d.get("topic")), kind: d.get("kind"), situation: d.get("situation"), question: d.get("question"), answers: keys.map(key => ({ key, text: d.get(`text-${key}`), explanation: d.get(`exp-${key}`), isCorrect: key === correct })), safeAction: d.get("safe"), readSeconds: Number(d.get("seconds")), sampleOrder: d.get("sampleOrder") ? Number(d.get("sampleOrder")) : null, sampleLabel: d.get("sampleLabel") || null, sortOrder: Number(d.get("sort")), isActive: d.get("active") === "on" }; this.run(async () => { await this.request(item ? `/questions/${encodeURIComponent(item.code)}` : "/questions", { method: item ? "PUT" : "POST", body: JSON.stringify(payload) }); dialog.close(); await this.load(); }, "Đã lưu câu hỏi và cập nhật ngân hàng."); }); dialog.showModal();
  }
  async remove(code) { if (!confirm(`Xóa câu hỏi ${code}? Nếu đã có người trả lời, hệ thống chỉ chuyển sang Ngừng dùng để bảo toàn lịch sử.`)) return; await this.run(async () => { const result = await this.request(`/questions/${encodeURIComponent(code)}`, { method: "DELETE" }); await this.load(); this.message = result.deactivated ? "Câu hỏi đã có dữ liệu dự thi nên được chuyển sang Ngừng dùng." : "Đã xóa câu hỏi."; }, "Đã xử lý câu hỏi."); }
}

class QuestionBankPage extends AdminPage { constructor() { super("Ngân hàng câu hỏi"); } async load() { this.render(); } render() { this.shadowRoot.innerHTML = this.shell(`<section class="box"><h2>Ngân hàng câu hỏi</h2><p>Quản lý dữ liệu tại menu <strong>Chuyên đề</strong> và <strong>Câu hỏi</strong>. Mỗi thay đổi tự tạo phiên bản mới và làm mới bộ nhớ QuestionBank.</p></section>`); } }

class ContestPage extends AdminPage {
  constructor() { super("Cuộc thi"); this.tab = "campaigns"; this.search = ""; this.status = ""; this.mode = ""; this.active = ""; }
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
      const q = new URLSearchParams({ page: this.page, pageSize: this.pageSize });
      if (this.search) q.set("search", this.search);
      if (this.tab === "campaigns") {
        if (this.active) q.set("isActive", this.active);
        this.result = await this.request(`/campaigns?${q}`);
      } else if (this.tab === "entries") {
        if (this.status) q.set("status", this.status);
        if (this.mode) q.set("mode", this.mode);
        this.result = await this.request(`/entries?${q}`);
      } else this.result = await this.request(`/draws?${q}`);
      this.error = "";
    } catch (e) { this.error = e.message; } finally { this.loading = false; this.render(); }
  }
  render() {
    const now = Date.now();
    const rows = (this.result?.items || []).map(x => {
      if (this.tab === "campaigns") {
        const state = !x.isActive ? ["off", "Ngừng dùng"] : now < Date.parse(x.startAt) ? ["off", "Sắp diễn ra"] : now > Date.parse(x.endAt) ? ["off", "Đã kết thúc"] : ["on", "Đang diễn ra"];
        return `<tr><td class="mono">#${x.id}</td><td><strong>${esc(x.name)}</strong><small class="block">${esc(x.description || "")}</small></td><td>${formatDate(x.startAt)}<br>→ ${formatDate(x.endAt)}</td><td>${x.topicCount}</td><td>${x.questionCount}</td><td>${x.maxAttempts}</td><td><span class="badge ${state[0]}">${state[1]}</span></td><td class="actions"><button data-edit-campaign="${x.id}">Sửa</button><button class="danger ghost" data-delete-campaign="${x.id}">Xóa</button></td></tr>`;
      }
      if (this.tab === "entries") return `<tr><td class="mono"><strong>${esc(x.code)}</strong></td><td>${esc(x.fullName || "Ẩn danh")}</td><td>${esc(x.phone || "—")}</td><td>${x.score ?? "—"}/${x.totalQuestions ?? "—"}</td><td><span class="badge ${x.status === "submitted" ? "on" : "off"}">${x.status === "submitted" ? "Đã nộp" : "Đang làm"}</span></td><td>${formatDate(x.createdAt)}</td><td><button data-entry="${x.id}">Chi tiết</button></td></tr>`;
      return `<tr><td class="mono">#${x.id}</td><td>${formatDate(x.createdAt)}</td><td>${esc(x.createdBy)}</td><td>${x.minScore}</td><td>${x.winners.length}/${x.winnersRequested}</td><td>${x.eligibleCount}</td><td>${esc(x.note || "—")}</td><td class="actions"><button data-edit-draw="${x.id}">Sửa</button><button class="danger ghost" data-delete-draw="${x.id}">Xóa</button></td></tr>`;
    }).join("");
    const filters = this.tab === "campaigns" ? `<select name="active"><option value="">Tất cả trạng thái</option><option value="true" ${this.active === "true" ? "selected" : ""}>Đang sử dụng</option><option value="false" ${this.active === "false" ? "selected" : ""}>Ngừng sử dụng</option></select>` : this.tab === "entries" ? `<select name="status"><option value="">Tất cả trạng thái</option><option value="submitted" ${this.status === "submitted" ? "selected" : ""}>Đã nộp</option><option value="in_progress" ${this.status === "in_progress" ? "selected" : ""}>Đang làm</option></select><select name="mode"><option value="">Tất cả hình thức</option><option value="named" ${this.mode === "named" ? "selected" : ""}>Có tên</option><option value="anon" ${this.mode === "anon" ? "selected" : ""}>Ẩn danh</option></select>` : "";
    const headers = this.tab === "campaigns" ? "<th>Mã</th><th>Cuộc thi</th><th>Thời gian</th><th>Chuyên đề</th><th>Câu hỏi</th><th>Lượt tối đa</th><th>Trạng thái</th><th></th>" : this.tab === "entries" ? "<th>Mã</th><th>Người dự thi</th><th>Điện thoại</th><th>Điểm</th><th>Trạng thái</th><th>Tạo lúc</th><th></th>" : "<th>Mã lần quay</th><th>Thời gian</th><th>Người tạo</th><th>Điểm sàn</th><th>Trúng thưởng</th><th>Đủ điều kiện</th><th>Ghi chú</th><th></th>";
    const placeholder = this.tab === "campaigns" ? "Tìm tên hoặc mô tả cuộc thi…" : this.tab === "entries" ? "Tìm mã, họ tên, điện thoại, đơn vị…" : "Tìm người tạo hoặc ghi chú…";
    const createButton = this.tab === "campaigns" ? `<button class="primary" id="create-campaign">+ Tạo cuộc thi</button>` : this.tab === "draws" ? `<button class="primary" id="create-draw">+ Tạo lần quay</button>` : "";
    this.shadowRoot.innerHTML = this.shell(`<section class="box"><div class="toolbar"><div class="tabs"><button class="${this.tab === "campaigns" ? "primary" : ""}" data-tab="campaigns">Danh sách cuộc thi</button><button class="${this.tab === "entries" ? "primary" : ""}" data-tab="entries">Lượt dự thi</button><button class="${this.tab === "draws" ? "primary" : ""}" data-tab="draws">Lần quay số</button></div>${createButton}</div><form id="search" class="filters" style="margin-top:16px"><input name="term" value="${esc(this.search)}" placeholder="${placeholder}">${filters}<button>Tìm kiếm</button></form><div class="summary">${this.loading ? "Đang tải…" : `${this.result?.totalItems || 0} bản ghi`}</div><div class="table-wrap"><table><thead><tr>${headers}</tr></thead><tbody>${rows || `<tr><td colspan="8" class="empty">Không có dữ liệu phù hợp.</td></tr>`}</tbody></table></div>${pager(this.result)}</section><dialog id="editor" class="large"></dialog>`);
    this.shadowRoot.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => { this.tab = b.dataset.tab; this.page = 1; this.search = ""; this.load(); }));
    this.shadowRoot.querySelector("#search")?.addEventListener("submit", e => { e.preventDefault(); const d = new FormData(e.currentTarget); this.search = d.get("term").trim(); this.status = d.get("status") || ""; this.mode = d.get("mode") || ""; this.active = d.get("active") || ""; this.page = 1; this.load(); });
    this.shadowRoot.querySelector("#create-campaign")?.addEventListener("click", () => this.openCampaign());
    this.shadowRoot.querySelector("#create-draw")?.addEventListener("click", () => this.openDraw());
    this.shadowRoot.querySelectorAll("[data-edit-campaign]").forEach(b => b.addEventListener("click", async () => this.openCampaign(await this.request(`/campaigns/${b.dataset.editCampaign}`))));
    this.shadowRoot.querySelectorAll("[data-delete-campaign]").forEach(b => b.addEventListener("click", () => this.removeCampaign(b.dataset.deleteCampaign)));
    this.shadowRoot.querySelectorAll("[data-edit-draw]").forEach(b => b.addEventListener("click", async () => this.openDraw(await this.request(`/draws/${b.dataset.editDraw}`))));
    this.shadowRoot.querySelectorAll("[data-delete-draw]").forEach(b => b.addEventListener("click", () => this.removeDraw(b.dataset.deleteDraw)));
    this.shadowRoot.querySelectorAll("[data-entry]").forEach(b => b.addEventListener("click", async () => this.showEntry(await this.request(`/entries/${b.dataset.entry}`))));
    this.bindPager();
  }
  async openCampaign(item = null) {
    const dialog = this.shadowRoot.querySelector("#editor");
    const tree = item?.topics || await this.request("/campaigns/question-tree");
    const localValue = value => { if (!value) return ""; const d = new Date(value); const offset = d.getTimezoneOffset(); return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16); };
    const treeHtml = tree.map(topic => `<details class="tree-topic" data-topic-node="${topic.id}"><summary><span class="tree-caret" aria-hidden="true">›</span><label><input type="checkbox" data-topic="${topic.id}" ${topic.isSelected ? "checked" : ""}> <strong>${topic.id} — ${esc(topic.title)}</strong></label><span class="tree-count">${topic.questions.filter(x => x.isSelected).length}/${topic.questions.length} câu</span>${topic.isActive ? "" : `<em>Ngừng dùng</em>`}</summary><div class="tree-questions">${topic.questions.map(question => `<label class="tree-question ${question.isActive ? "" : "inactive"}"><input type="checkbox" data-question="${esc(question.code)}" ${question.isSelected ? "checked" : ""}> <span class="mono">${esc(question.code)}</span><span>${esc(question.question)}</span>${question.isActive ? "" : `<em>Ngừng dùng</em>`}</label>`).join("") || `<p class="empty-tree">Chuyên đề chưa có câu hỏi.</p>`}</div></details>`).join("");
    dialog.innerHTML = `<form method="dialog" id="form"><header><div><h2>${item ? "Cập nhật" : "Tạo"} cuộc thi</h2><p>Chọn chuyên đề và từng câu hỏi sẽ sử dụng trong cuộc thi.</p></div><button type="button" data-close class="close" aria-label="Đóng">×</button></header><div class="form-grid"><label class="wide">Tên cuộc thi<span>*</span><input name="name" minlength="2" maxlength="200" required value="${esc(item?.name)}"></label><label class="wide">Mô tả<textarea name="description" maxlength="2000" rows="3">${esc(item?.description)}</textarea></label><label>Bắt đầu<span>*</span><input name="startAt" type="datetime-local" required value="${localValue(item?.startAt)}"></label><label>Kết thúc<span>*</span><input name="endAt" type="datetime-local" required value="${localValue(item?.endAt)}"></label><label>Số lượt tối đa<span>*</span><input name="maxAttempts" type="number" min="1" max="1000" required value="${item?.maxAttempts ?? 2}"></label><label class="check"><input name="active" type="checkbox" ${item?.isActive !== false ? "checked" : ""}> Đang sử dụng</label></div><div class="tree-heading"><div><h3>Chuyên đề và câu hỏi<span>*</span></h3><p>Click vào chuyên đề để xem danh sách câu hỏi; checkbox chuyên đề chọn hoặc bỏ chọn toàn bộ câu hỏi con.</p></div><button type="button" id="expand-tree">Mở tất cả</button></div><div class="contest-tree">${treeHtml || `<p class="empty">Chưa có chuyên đề trong ngân hàng câu hỏi.</p>`}</div><footer><button type="button" data-close>Hủy</button><button type="submit" class="primary">Lưu cuộc thi</button></footer></form>`;
    const updateTopicState = node => { const parent = node.querySelector("[data-topic]"); const children = [...node.querySelectorAll("[data-question]")]; const checked = children.filter(x => x.checked).length; parent.checked = children.length > 0 && checked === children.length; parent.indeterminate = checked > 0 && checked < children.length; node.querySelector(".tree-count").textContent = `${checked}/${children.length} câu`; };
    dialog.querySelectorAll("[data-topic-node]").forEach(node => { updateTopicState(node); node.querySelector("[data-topic]").addEventListener("change", e => { node.querySelectorAll("[data-question]").forEach(x => x.checked = e.currentTarget.checked); updateTopicState(node); }); node.querySelectorAll("[data-question]").forEach(x => x.addEventListener("change", () => updateTopicState(node))); });
    dialog.querySelector("#expand-tree")?.addEventListener("click", e => { const nodes = [...dialog.querySelectorAll("details")]; const open = nodes.some(x => !x.open); nodes.forEach(x => x.open = open); e.currentTarget.textContent = open ? "Thu gọn tất cả" : "Mở tất cả"; });
    dialog.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => dialog.close()));
    dialog.querySelector("#form").addEventListener("submit", e => { e.preventDefault(); const d = new FormData(e.currentTarget); const topics = [...dialog.querySelectorAll("[data-topic-node]")].map(node => ({ topicId: Number(node.dataset.topicNode), questionCodes: [...node.querySelectorAll("[data-question]:checked")].map(x => x.dataset.question) })).filter(x => x.questionCodes.length); const payload = { name: d.get("name"), description: d.get("description") || null, startAt: new Date(d.get("startAt")).toISOString(), endAt: new Date(d.get("endAt")).toISOString(), maxAttempts: Number(d.get("maxAttempts")), isActive: d.get("active") === "on", topics }; this.run(async () => { await this.request(item ? `/campaigns/${item.id}` : "/campaigns", { method: item ? "PUT" : "POST", body: JSON.stringify(payload) }); dialog.close(); await this.load(); }, item ? "Đã cập nhật cuộc thi." : "Đã tạo cuộc thi."); });
    dialog.showModal();
  }
  async removeCampaign(id) { if (!confirm("Xóa cuộc thi và toàn bộ cấu hình chuyên đề/câu hỏi đã chọn?")) return; await this.run(async () => { await this.request(`/campaigns/${id}`, { method: "DELETE" }); await this.load(); }, "Đã xóa cuộc thi."); }
  openDraw(item = null) {
    const dialog = this.shadowRoot.querySelector("#editor");
    dialog.innerHTML = `<form method="dialog" id="form"><header><h2>${item ? "Cập nhật" : "Tạo"} lần quay số</h2><button type="button" data-close class="close">×</button></header><div class="form-grid"><label>Điểm tối thiểu<input name="minScore" type="number" min="0" required value="${item?.minScore ?? 0}"></label><label>Số người trúng<input name="winners" type="number" min="1" max="1000" required value="${item?.winnersRequested ?? 1}"></label><label class="wide">Ghi chú<textarea name="note" maxlength="200">${esc(item?.note)}</textarea></label><label class="check wide"><input name="exclude" type="checkbox" ${item?.excludePrevious ? "checked" : ""}> Loại người đã từng trúng trước đây</label></div><footer><button type="button" data-close>Hủy</button><button type="submit" class="primary">Lưu</button></footer></form>`;
    dialog.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => dialog.close()));
    dialog.querySelector("#form").addEventListener("submit", e => { e.preventDefault(); const d = new FormData(e.currentTarget); const payload = { minScore: Number(d.get("minScore")), winnersRequested: Number(d.get("winners")), excludePrevious: d.get("exclude") === "on", note: d.get("note") || null }; this.run(async () => { await this.request(item ? `/draws/${item.id}` : "/draws", { method: item ? "PUT" : "POST", body: JSON.stringify(payload) }); dialog.close(); await this.load(); }, item ? "Đã cập nhật lần quay." : "Đã tạo lần quay."); });
    dialog.showModal();
  }
  async removeDraw(id) { if (!confirm("Xóa lần quay số và danh sách người trúng?")) return; await this.run(async () => { await this.request(`/draws/${id}`, { method: "DELETE" }); await this.load(); }, "Đã xóa lần quay."); }
  showEntry(item) { alert(`Mã: ${item.code}\nNgười dự thi: ${item.fullName || "Ẩn danh"}\nĐiểm: ${item.score ?? "—"}/${item.totalQuestions ?? "—"}\nTrạng thái: ${item.status}`); }
}

const styles = `:host{display:block;height:100%;font-family:var(--uui-font-family,sans-serif);color:var(--uui-color-text,#1b2640)}*{box-sizing:border-box}.page{padding:24px}.box{background:#fff;border:1px solid #d8d7d9;border-radius:8px;padding:20px}.toolbar{display:flex;gap:16px;justify-content:space-between;align-items:center;flex-wrap:wrap}.filters{display:flex;gap:8px;flex:1;flex-wrap:wrap}.filters input{min-width:260px;flex:1}input,select,textarea,button{font:inherit}input,select,textarea{border:1px solid #b8b7ba;border-radius:4px;padding:9px 10px;background:#fff;width:100%}textarea{resize:vertical}button{border:1px solid #9b9a9d;background:#fff;border-radius:4px;padding:8px 13px;cursor:pointer}button:hover{background:#f3f3f5}button.primary{background:#1b2640;color:#fff;border-color:#1b2640}button.danger{color:#b42020}.ghost{border-color:transparent}button:disabled{opacity:.45;cursor:not-allowed}.summary{margin:18px 0 8px;color:#68676b}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;min-width:840px}th,td{text-align:left;padding:12px;border-bottom:1px solid #e7e6e8;vertical-align:middle}th{font-size:12px;text-transform:uppercase;color:#68676b;background:#fafafa}.actions{white-space:nowrap;text-align:right}.question{max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.block{display:block;margin-top:4px;color:#777}.mono{font-family:ui-monospace,monospace}.badge{display:inline-block;padding:4px 8px;border-radius:99px;font-size:12px;font-weight:600}.badge.on{background:#dff5e7;color:#176b38}.badge.off{background:#eeeef0;color:#56555a}.answer{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#1b2640;color:#fff;font-weight:700}.empty{text-align:center;padding:40px;color:#777}.pager{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:16px}.notice{padding:12px 16px;border-radius:5px;margin-bottom:12px}.notice.error{background:#fde7e7;color:#9e1a1a}.notice.success{background:#e0f5e8;color:#166534}dialog{border:0;border-radius:8px;padding:0;width:min(720px,calc(100vw - 40px));max-height:90vh;overflow:auto;box-shadow:0 16px 60px #0005}dialog.large{width:min(1050px,calc(100vw - 40px))}dialog::backdrop{background:#18203399}dialog form>header,dialog form>footer{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #ddd;background:#fff}dialog form>footer{border:0;border-top:1px solid #ddd;justify-content:flex-end;gap:8px}dialog header h2{margin:0}dialog header p{margin:4px 0 0;color:#666}.close{font-size:24px;border:0}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px 22px}.form-grid label{display:block;font-weight:600}.form-grid label>input:not([type="checkbox"]),.form-grid label>select,.form-grid label>textarea{display:block;margin-top:6px}.form-grid label span,.answer-row label span,.tree-heading h3 span{display:inline;color:#b42020;margin-left:2px}.form-grid small{font-weight:400;color:#777}.wide{grid-column:1/-1}.check{display:flex!important;align-items:center;gap:6px}.check input{width:auto;margin:0}.answers{padding:0 22px}h3{padding:0 22px;margin:8px 0 12px}.answer-row{display:grid;grid-template-columns:78px 1fr 1fr;gap:12px;padding:12px;border:1px solid #ddd;border-radius:6px;margin-bottom:10px}.answer-row label{display:block}.answer-row label>textarea{display:block;margin-top:5px}.answer-row .correct{display:flex;flex-direction:column;gap:5px;align-items:center;justify-content:center}.correct input{width:auto}.correct strong{font-size:20px}.correct small{color:#777}.tree-heading{display:flex;align-items:center;justify-content:space-between;padding:0 22px 10px}.tree-heading h3{padding:0;margin:0}.tree-heading p{margin:4px 0 0;color:#666}.contest-tree{margin:0 22px 22px;border:1px solid #d8d7d9;border-radius:6px;overflow:hidden}.tree-topic+ .tree-topic{border-top:1px solid #ddd}.tree-topic summary{display:flex;align-items:center;gap:12px;padding:13px 16px;background:#f7f7f8;cursor:pointer;list-style:none}.tree-topic summary::-webkit-details-marker{display:none}.tree-caret{font-size:24px;line-height:16px;color:#555;transition:transform .15s ease}.tree-topic[open] .tree-caret{transform:rotate(90deg)}.tree-topic summary label{display:flex;align-items:center;gap:7px;flex:1;cursor:pointer}.tree-topic summary input,.tree-question input{width:auto}.tree-count{color:#666;font-size:13px;white-space:nowrap}.tree-topic em,.tree-question em{color:#986b00;font-size:12px;font-style:normal}.tree-questions{padding:4px 16px 8px 52px}.tree-question{display:grid;grid-template-columns:auto 90px 1fr auto;align-items:start;gap:9px;padding:9px 0;border-bottom:1px solid #eee;cursor:pointer}.tree-question:last-child{border-bottom:0}.tree-question.inactive{color:#777}.empty-tree{color:#777;font-style:italic}.tabs{display:flex;gap:6px;flex-wrap:wrap}@media(max-width:800px){.form-grid{grid-template-columns:1fr}.wide{grid-column:auto}.answer-row{grid-template-columns:60px 1fr}.answer-row label:last-child{grid-column:2}.tree-question{grid-template-columns:auto 80px 1fr}.tree-question em{grid-column:3}.page{padding:12px}}`;

class ContestManagementLitView extends UmbLitElement {
  static properties = { view: { type: String } };
  static styles = css`:host{display:block;height:100%;min-height:240px}`;
  constructor() { super(); this.view = ""; }
  render() {
    if (this.view === "questions") return html`<antc-contest-questions-table></antc-contest-questions-table>`;
    if (this.view === "topics") return html`<antc-contest-topics-table></antc-contest-topics-table>`;
    if (this.view === "contest") return html`<antc-contest-table></antc-contest-table>`;
    return html`<antc-contest-question-bank-content></antc-contest-question-bank-content>`;
  }
}

class QuestionsLitView extends ContestManagementLitView { constructor() { super(); this.view = "questions"; } }
class TopicsLitView extends ContestManagementLitView { constructor() { super(); this.view = "topics"; } }
class QuestionBankLitView extends ContestManagementLitView { constructor() { super(); this.view = "question-bank"; } }
class ContestLitView extends ContestManagementLitView { constructor() { super(); this.view = "contest"; } }

if (!customElements.get("antc-contest-topics-table")) customElements.define("antc-contest-topics-table", TopicsPage);
if (!customElements.get("antc-contest-questions-table")) customElements.define("antc-contest-questions-table", QuestionsPage);
if (!customElements.get("antc-contest-question-bank-content")) customElements.define("antc-contest-question-bank-content", QuestionBankPage);
if (!customElements.get("antc-contest-table")) customElements.define("antc-contest-table", ContestPage);
if (!customElements.get("antc-contest-topics-view")) customElements.define("antc-contest-topics-view", TopicsLitView);
if (!customElements.get("antc-contest-questions-view")) customElements.define("antc-contest-questions-view", QuestionsLitView);
if (!customElements.get("antc-contest-question-bank-view")) customElements.define("antc-contest-question-bank-view", QuestionBankLitView);
if (!customElements.get("antc-contest-view")) customElements.define("antc-contest-view", ContestLitView);

import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';

// Thay bảng tin bên ngoài (nội dung tiếng Anh) bằng hướng dẫn dành cho biên tập viên.
class AntcWelcomeDashboard extends UmbLitElement {
    render() {
        return html`<uui-box headline="Quản trị An toàn tài chính">
            <p>Chọn khu vực trên thanh điều hướng để quản lý nội dung và hoạt động của trang web.</p>
            <dl>
                <dt>Nội dung</dt><dd>Quản lý trang, bố cục, bài viết và các thông tin dùng chung tại mục An toàn tài chính.</dd>
                <dt>Phương tiện</dt><dd>Tải lên và quản lý hình ảnh, video, tài liệu.</dd>
                <dt>Hỏi – Đáp</dt><dd>Xem câu hỏi và góp ý, biên tập câu trả lời và duyệt công bố.</dd>
                <dt>Quản lý cuộc thi</dt><dd>Quản lý câu hỏi, chuyên đề, lịch thi, giải thưởng, quay số và báo cáo.</dd>
            </dl>
            <p>Sau khi chỉnh sửa, chọn <strong>Lưu</strong> để giữ bản nháp hoặc <strong>Lưu và xuất bản</strong> để cập nhật nội dung công khai.</p>
            <p>Các mục hiển thị phụ thuộc vào quyền truy cập của tài khoản.</p>
        </uui-box>`;
    }
    static styles = css`
        :host { display: block; padding: var(--uui-size-layout-1); }
        p, dd { line-height: 1.7; }
        dl { display: grid; grid-template-columns: minmax(120px, 180px) 1fr; gap: 16px; margin: 24px 0; }
        dt { font-weight: 600; } dd { margin: 0; }
        @media (max-width: 600px) { dl { grid-template-columns: 1fr; gap: 8px; } dd { margin-bottom: 12px; } }
    `;
}
customElements.define('antc-welcome-dashboard', AntcWelcomeDashboard);
export default AntcWelcomeDashboard;

import { UMB_CONFIRM_MODAL, umbOpenModal } from '@umbraco-cms/backoffice/modal';

export const statuses = { moi: 'Mới', 'dang-xu-ly': 'Đang xử lý', 'cho-duyet': 'Chờ duyệt', 'da-xu-ly': 'Đã xử lý', 'bo-qua': 'Bỏ qua', 'luu-tru': 'Lưu trữ' };
export const types = { 'cau-hoi': 'Câu hỏi', 'gop-y': 'Góp ý', kiennghi: 'Kiến nghị' };
export const sources = { portal: 'Trang web', 'quan-tri': 'Quản trị', 'tong-hop': 'Tổng hợp' };
export const date = value => value ? new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date(value)) : '—';

export async function confirmDiscard(host) {
    try {
        await umbOpenModal(host, UMB_CONFIRM_MODAL, { data: {
            headline: 'Bỏ thay đổi chưa lưu?',
            content: 'Các thay đổi chưa lưu sẽ bị mất. Bạn có thể tiếp tục chỉnh sửa để lưu lại trước khi đóng.',
            confirmLabel: 'Bỏ thay đổi', cancelLabel: 'Tiếp tục chỉnh sửa', color: 'danger',
        } });
        return true;
    } catch {
        return false;
    }
}

export async function confirmAction(host, headline, content, confirmLabel = 'Xóa') {
    try {
        await umbOpenModal(host, UMB_CONFIRM_MODAL, { data: {
            headline, content, confirmLabel, cancelLabel: 'Hủy', color: 'danger',
        } });
        return true;
    } catch { return false; }
}

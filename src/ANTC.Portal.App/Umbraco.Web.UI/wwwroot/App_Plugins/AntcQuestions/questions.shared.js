import { UMB_CONFIRM_MODAL, umbOpenModal } from '@umbraco-cms/backoffice/modal';

export const statuses = { moi: 'Mới', 'dang-xu-ly': 'Đang xử lý', 'da-xu-ly': 'Đã xử lý', 'bo-qua': 'Bỏ qua' };
export const types = { 'cau-hoi': 'Câu hỏi, kiến nghị', 'gop-y': 'Góp ý' };
export const sources = { portal: 'Portal', 'quan-tri': 'Quản trị' };
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

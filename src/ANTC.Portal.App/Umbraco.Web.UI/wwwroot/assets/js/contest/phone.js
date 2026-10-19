// Chuan hoa va kiem tra so dien thoai (khop quy tac BE-22). FE-29 (submit.js) dung lai ham nay.

// Bo ky tu khong phai so; dau 84 (11 so) doi thanh 0.
export function normalizePhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) digits = '0' + digits.slice(2);
  return digits;
}

// Hop le khi du 10 so va bat dau bang 0.
export function isValidPhone(normalized) {
  return /^0\d{9}$/.test(normalized);
}

// Kiem tra thong tin lien he dung chung cho dang ky (register.js) va nop bai / gan thong tin (submit.js).
// Thu tu: ten, so, dong y. Tra ve { error, field: 'fullName' | 'phone' | 'consent' } hoac { contact }.
export const MSG_NAME = 'Chưa có họ tên. Ban Tổ chức cần tên để xác minh khi trao giải.';
export const MSG_PHONE = 'Số điện thoại chưa đúng. Nhập số bạn đang dùng, chỉ gồm chữ số.';
export const MSG_CONSENT = 'Cần tích ô đồng ý với Thể lệ và nội dung xử lý dữ liệu thì mới vào thi được.';

export function checkContact({ fullName, phone, org, consent }, consentMsg = MSG_CONSENT) {
  const name = String(fullName ?? '').trim();
  const digits = normalizePhone(phone);
  if (!name) return { error: MSG_NAME, field: 'fullName' };
  if (!isValidPhone(digits)) return { error: MSG_PHONE, field: 'phone' };
  if (!consent) return { error: consentMsg, field: 'consent' };
  return { contact: { fullName: name, phone: digits, org: String(org ?? '').trim(), consent: true } };
}

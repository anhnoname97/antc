// Chuan hoa va kiem tra so dien thoai (khop quy tac BE-22). FE-29 dung lai ham nay.

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

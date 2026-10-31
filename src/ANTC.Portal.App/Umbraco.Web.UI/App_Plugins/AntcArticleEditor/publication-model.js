export const isPublished = variant => ['Published', 'PublishedPendingChanges'].includes(variant?.state);
export const invariantVariant = document => document?.variants?.find(variant => !variant.culture && !variant.segment);
export const invariantValue = (document, alias) => document?.values?.find(value => value.alias === alias && !value.culture && !value.segment)?.value;

export function publicationLabel(variant, isNew) {
  if (isNew) return 'Bài chưa được tạo';
  if (!variant) return 'Đang tải trạng thái…';
  if (variant.state === 'Draft' && variant.scheduledPublishDate) return 'Đã hẹn xuất bản';
  return { Draft: 'Bản nháp', Published: 'Đã xuất bản', PublishedPendingChanges: 'Có thay đổi chưa xuất bản',
    AwaitingRelease: 'Đã hẹn xuất bản', Unpublished: 'Chưa xuất bản', Trashed: 'Trong thùng rác' }[variant.state] ?? 'Chưa xuất bản';
}

export function publicArticleUrl(raw, origin) {
  if (typeof raw !== 'string' || (!raw.startsWith('/') && !/^https?:\/\//i.test(raw))) return null;
  try {
    const url = new URL(raw, origin);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

// Umbraco may label invariant URLs with the default CMS language (e.g. en-US).
export function resolvedArticleUrl(items, key, origin) {
  const urls = items?.find(item => item.unique === key)?.urls ?? [];
  const ordered = [...urls.filter(item => !item.culture), ...urls.filter(item => item.culture)];
  return ordered.map(item => publicArticleUrl(item.url, origin)).find(Boolean) ?? null;
}

const formatter = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit',
  year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export function publicationDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

export function activityLabel(type) {
  return { New: 'Tạo bài', Save: 'Lưu bài', SaveVariant: 'Lưu bài', Publish: 'Xuất bản', PublishVariant: 'Xuất bản',
    Unpublish: 'Hủy xuất bản', UnpublishVariant: 'Hủy xuất bản', Move: 'Di chuyển', Copy: 'Sao chép',
    RollBack: 'Khôi phục phiên bản', SendToPublish: 'Gửi duyệt', Sort: 'Sắp xếp', Open: 'Mở bài' }[type] ?? 'Thao tác trong hệ thống';
}

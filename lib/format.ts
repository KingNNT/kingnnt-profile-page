/**
 * "2026-07" → "07.2026". Định dạng cố định thay vì `Intl.DateTimeFormat` vì
 * cột này là mono và phải thẳng hàng ở cả hai locale — tên tháng đã dịch có độ
 * dài khác nhau sẽ phá cột.
 */
export function formatPeriod(from: string, to: string | null, nowLabel: string): string {
  const fmt = (value: string) => {
    const [year, month] = value.split("-");
    return `${month}.${year}`;
  };
  return `${fmt(from)} — ${to === null ? nowLabel : fmt(to)}`;
}

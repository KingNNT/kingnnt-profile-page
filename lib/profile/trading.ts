export interface TradingMilestone {
  id: string;
  year: number;
  market: "crypto" | "forex" | "equities";
}

/**
 * Chỉ các mốc. Câu chuyện nằm trong catalog — và không có con số lợi nhuận nào
 * ở cả hai nơi: một câu khoe hiệu suất sẽ kéo trang cá nhân này vào phạm trù
 * YMYL mà nó không có lý do gì để bước vào.
 */
export const TRADING: readonly TradingMilestone[] = [
  { id: "crypto", year: 2020, market: "crypto" },
  { id: "forex", year: 2023, market: "forex" },
  { id: "equities", year: 2024, market: "equities" },
];

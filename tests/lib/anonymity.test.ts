import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// `import.meta.url` phải gán ra biến trước khi dùng: Vite bắt tĩnh đúng mẫu
// `new URL("...", import.meta.url)` và coi đó là tham chiếu asset của trình
// duyệt, phân giải theo origin của dev server thay vì theo hệ thống tệp — làm
// hỏng lần đọc file phía Node trong vitest.
const moduleUrl = import.meta.url;
const ROOT = fileURLToPath(new URL("../../", moduleUrl));

/**
 * Tên không bao giờ được xuất hiện trong chữ hiển thị. Gỡ một mục khỏi đây là
 * hành động có chủ đích, để lại dấu vết trong git — đó chính là điểm của test
 * này. Ràng buộc "đừng nhắc tên công ty" bị vi phạm dễ nhất lúc dán một đoạn
 * từ CV vào catalog trong lúc vội; một dòng ghi chú không chặn được điều đó.
 */
const DENYLIST = [
  "SyncSoft",
  "FPT",
  "Kaopiz",
  "Tap Hospitality",
  "SmartGoldFish",
  "ArtinLeap",
  "SHB",
  "Saigon-Hanoi",
  "Saigon Hanoi",
  "KPIRB",
  "TMC",
  "GICRM",
  "RENEW02",
  "E-Concierge",
  "Accommod",
  "Zyrahh",
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/**
 * Bỏ giá trị của trường `url`. Trang sản phẩm Orkestrators nằm dưới
 * `artinleap.com`, nên URL hợp lệ tất yếu chứa một tên bị cấm. Một URL là địa
 * chỉ công khai kiểm chứng được, không phải lời khẳng định về nơi làm việc —
 * ràng buộc áp lên chữ hiển thị, không áp lên đích của link.
 */
function stripUrls(source: string): string {
  return source.replace(/url:\s*"[^"]*"/g, 'url: ""').replace(/"url":\s*"[^"]*"/g, '"url": ""');
}

function occurrences(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Ranh giới từ: token ngắn như "TMC" hay "SHB" so kiểu substring sẽ bắt nhầm.
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "iu").test(haystack);
}

const FILES = [...walk(join(ROOT, "lib", "profile")), ...walk(join(ROOT, "messages"))];

describe("anonymity", () => {
  it("scans a non-empty set of files", () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  it.each(FILES)("%s carries no denylisted name", (file) => {
    const content = stripUrls(readFileSync(file, "utf8"));
    for (const name of DENYLIST) {
      expect(occurrences(content, name), `"${name}" found in ${file}`).toBe(false);
    }
  });
});

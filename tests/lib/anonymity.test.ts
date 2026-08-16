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
  return source
    .replace(/(?<![\p{L}\p{N}_])url:\s*"[^"]*"/gu, 'url: ""')
    .replace(/"url":\s*"[^"]*"/g, '"url": ""');
}

function occurrences(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Ranh giới từ: token ngắn như "TMC" hay "SHB" so kiểu substring sẽ bắt nhầm.
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "iu").test(haystack);
}

const PROFILE_FILES = walk(join(ROOT, "lib", "profile"));
const MESSAGE_FILES = walk(join(ROOT, "messages"));
const FILES = [...PROFILE_FILES, ...MESSAGE_FILES];

describe("anonymity", () => {
  /**
   * Bảo vệ riêng từng cây, không phải tổng. Nếu `lib/profile` từng không đóng
   * góp file nào, `messages/*.json` một mình vẫn giữ tổng > 0 và guard cũ sẽ
   * xanh trong khi tầng dữ liệu không được quét chút nào.
   */
  it("scans both protected trees", () => {
    expect(PROFILE_FILES.length).toBeGreaterThan(0);
    expect(MESSAGE_FILES.length).toBeGreaterThan(0);
  });

  it.each(FILES)("%s carries no denylisted name", (file) => {
    const content = stripUrls(readFileSync(file, "utf8"));
    for (const name of DENYLIST) {
      expect(occurrences(content, name), `"${name}" found in ${file}`).toBe(false);
    }
  });

  it("detects a denylisted name outside a url field", () => {
    const leaked = 'role: "Engineer at SyncSoft", url: "https://example.com/SyncSoft"';
    const content = stripUrls(leaked);
    expect(occurrences(content, "SyncSoft")).toBe(true);
  });

  it("does not flag a denylisted name that only appears inside a url field", () => {
    const clean = 'name: "Orkestrators", url: "https://www.artinleap.com/products/orkestrators"';
    const content = stripUrls(clean);
    expect(occurrences(content, "ArtinLeap")).toBe(false);
  });
});

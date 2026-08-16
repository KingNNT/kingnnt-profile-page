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
 * `artinleap.com`, nên URL hợp lệ tất yếu chứa một tên bị cấm. Ràng buộc áp
 * lên các khẳng định văn xuôi về nơi làm việc; địa chỉ công khai của một sản
 * phẩm được miễn trừ ở mọi cách serialize, có markup hay không — một chuỗi
 * thuần văn bản trong `llms.txt` mà đích của link chính là chữ hiển thị vẫn
 * nằm trong diện miễn trừ này y như một `href` trong markup.
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

/**
 * `components/**` và `app/**` render vào HTML crawler đọc được; `lib/**` bao
 * gồm `lib/llms.ts` và `lib/structured-data.ts`, cả hai đều phát ra văn bản
 * cho answer engine. Mọi tên bị cấm dán nhầm vào bất kỳ chỗ nào trong số này
 * cũng nghiêm trọng như dán vào `lib/profile` hay `messages`.
 */
const ROOTS: Record<string, string[]> = {
  "lib/profile": walk(join(ROOT, "lib", "profile")),
  messages: walk(join(ROOT, "messages")),
  components: walk(join(ROOT, "components")),
  app: walk(join(ROOT, "app")),
  // `lib/profile` nằm bên trong `lib` — dedupe để không quét hai lần.
  lib: walk(join(ROOT, "lib")).filter((file) => !file.startsWith(join(ROOT, "lib", "profile"))),
};
const FILES = [...new Set(Object.values(ROOTS).flat())];

describe("anonymity", () => {
  /**
   * Bảo vệ riêng từng cây, không phải tổng. Nếu một cây từng không đóng góp
   * file nào, các cây còn lại vẫn giữ tổng > 0 và guard cũ sẽ xanh trong khi
   * cây đó không được quét chút nào — một đường dẫn gõ sai sẽ không thể âm
   * thầm quét trống mà vẫn báo xanh.
   */
  it.each(Object.entries(ROOTS))("scans the %s tree", (_label, files) => {
    expect(files.length).toBeGreaterThan(0);
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

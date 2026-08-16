import { ImageResponse } from "next/og";
import { IDENTITY } from "@/lib/profile";
import { SITE_URL } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${IDENTITY.fullName} — ${IDENTITY.jobTitle}`;

/**
 * Ảnh chân dung được nạp qua URL công khai của chính site chứ không đọc từ đĩa:
 * đọc file bằng `fs` trong route này phụ thuộc vào việc bundler có trace được
 * đường dẫn hay không, và nó im lặng hỏng trên Vercel trong khi build cục bộ
 * vẫn xanh. Card lùi về bản thuần chữ khi: fetch lỗi mạng, status không phải
 * 2xx, phản hồi 200 nhưng content-type không phải ảnh, hoặc bytes không mở
 * đầu bằng magic number của JPEG. Một body vượt qua cả ba kiểm tra này nhưng
 * vẫn không giải mã được bên trong Satori thì KHÔNG bắt được nữa — `ImageResponse`
 * render trong callback `start` của một `ReadableStream`, sau khi response đã
 * commit 200, nên lỗi đó làm hỏng response stream chứ không ném ra để try/catch
 * ở đây hay ở route bắt được.
 */
export async function portraitDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(`${SITE_URL}/images/portrait.jpg`);
    if (!response.ok) return null;
    const type = response.headers.get("content-type");
    if (!type?.startsWith("image/")) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    // Magic number của JPEG — điểm cuối cùng còn chặn được kiểu lỗi mô tả ở
    // docstring phía trên, trước khi data URL được dựng.
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null;
    return `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Màu viết thẳng dạng hex chứ không đọc từ token: `ImageResponse` render bằng
 * Satori, thứ không hiểu biến CSS — các token thật trong `app/globals.css` là
 * OKLCH, không có chuỗi chung nào để grep. Đây là bản sao thủ công có chủ đích
 * của accent; nếu đổi `--primary` trong globals.css thì phải đổi ở đây.
 */
function card(portrait: string | null) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 64,
        padding: 80,
        background: "#0d0b09",
        color: "#f2efe9",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 24, letterSpacing: 6, color: "#8a8073" }}>
          {`${IDENTITY.englishName.toUpperCase()} · ${IDENTITY.nickname.toUpperCase()}`}
        </div>
        <div style={{ fontSize: 76, marginTop: 24, lineHeight: 1.1 }}>{IDENTITY.fullName}</div>
        <div style={{ fontSize: 32, marginTop: 20, color: "#e0a24a" }}>{IDENTITY.jobTitle}</div>
        <div style={{ height: 2, width: 160, marginTop: 40, background: "#e0a24a" }} />
        <div style={{ fontSize: 24, marginTop: 40, color: "#8a8073" }}>kingnnt.org</div>
      </div>
      {portrait ? (
        // biome-ignore lint: ImageResponse renders to a static png, not to the DOM
        <img
          src={portrait}
          width={330}
          height={452}
          style={{ objectFit: "cover", borderRadius: 4 }}
          alt=""
        />
      ) : null}
    </div>
  );
}

export default async function OpengraphImage() {
  const portrait = await portraitDataUrl();
  return new ImageResponse(card(portrait), size);
}

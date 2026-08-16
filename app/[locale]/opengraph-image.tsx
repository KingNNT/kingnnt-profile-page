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
 * vẫn xanh. Nếu fetch hỏng, card vẫn ra — chỉ là bản thuần chữ.
 */
async function portraitDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(`${SITE_URL}/images/portrait.jpg`);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const portrait = await portraitDataUrl();

  return new ImageResponse(
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
    </div>,
    size,
  );
}

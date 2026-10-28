// 병 사진 흰 배경 지우기 — 가장자리에서 이어진 거의 흰 픽셀만 투명으로(병 안 흰 라벨은 테두리로 막혀 남는다). 무료 · 로컬
const sharp = require(process.cwd() + "/node_modules/sharp");
const fs = require("fs");
const D = process.argv[2];
(async () => {
  const files = fs.readdirSync(D + "img").filter((f) => f.endsWith(".webp"));
  fs.mkdirSync(D + "cut", { recursive: true });
  for (const f of files) {
    const { data, info } = await sharp(D + "img/" + f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    const white = (i) => { const r = data[i], g = data[i + 1], b = data[i + 2]; const mn = Math.min(r, g, b), mx = Math.max(r, g, b); return mn > 234 && mx - mn < 22; };
    const bg = new Uint8Array(W * H);
    const q = [];
    const push = (x, y) => { const p = y * W + x; if (bg[p] || !white(p * 4)) return; bg[p] = 1; q.push(p); };
    for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
    for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
    while (q.length) { const p = q.pop(); const x = p % W, y = (p / W) | 0; if (x > 0) push(x - 1, y); if (x < W - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < H - 1) push(x, y + 1); }
    for (let p = 0; p < W * H; p++) {
      const i = p * 4;
      if (bg[p]) { data[i + 3] = 0; continue; }
      // 배경과 붙은 가장자리 한 줄은 흰 정도만큼 반투명(계단 줄이기)
      const x = p % W, y = (p / W) | 0;
      const edge = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
      if (edge) { const mn = Math.min(data[i], data[i + 1], data[i + 2]); data[i + 3] = Math.max(0, Math.min(255, Math.round(((255 - mn) / 60) * 255))); }
    }
    await sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 0 }).webp({ quality: 88, alphaQuality: 90 }).toFile(D + "cut/" + f);
  }
  console.log("done", files.length);
})();

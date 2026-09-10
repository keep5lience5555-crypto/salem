// 用 OpenAI Images API (gpt-image-1) 批次生成獵巫鎮的美術資源
// 使用方式：
//   設定環境變數 OPENAI_API_KEY 之後執行
//   Windows PowerShell:  $env:OPENAI_API_KEY = "sk-...";  node generate-art.js
//   bash:                 OPENAI_API_KEY="sk-..." node generate-art.js

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = path.join(__dirname, 'assets');

const STYLE_SUFFIX =
  'Impressionist painting style, loose expressive brushstrokes, visible textured paint, ' +
  'soft dappled candlelight, muted dusky palette (parchment beige, deep purple, aged gold, blood red), ' +
  '17th century New England witch-hunt atmosphere, no text, no watermark';

const JOBS = [
  {
    name: 'sheriff',
    size: '1024x1024',
    prompt: `Portrait of a stern town sheriff of colonial Salem, holding a wooden gavel, badge on coat, ${STYLE_SUFFIX}`,
  },
  {
    name: 'witch',
    size: '1024x1024',
    prompt: `Portrait of a mysterious hooded witch hiding in shadow, faint eerie glow in her eyes, ${STYLE_SUFFIX}`,
  },
  {
    name: 'villager',
    size: '1024x1024',
    prompt: `Portrait of a plain colonial villager/farmer, worried expression, simple period clothing, ${STYLE_SUFFIX}`,
  },
  {
    name: 'card-black',
    size: '1024x1024',
    prompt: `Simple icon of a crescent moon over a burning candle, symbolizing a night event card, ${STYLE_SUFFIX}`,
  },
  {
    name: 'card-blue',
    size: '1024x1024',
    prompt: `Simple icon of a black cat silhouette and a shield crest, symbolizing an equipment card, ${STYLE_SUFFIX}`,
  },
  {
    name: 'card-green',
    size: '1024x1024',
    prompt: `Simple icon of a bundle of herbs and a small vial, symbolizing a one-time effect card, ${STYLE_SUFFIX}`,
  },
  {
    name: 'card-red',
    size: '1024x1024',
    prompt: `Simple icon of a pointing accusing finger over a wanted poster, symbolizing an accusation card, ${STYLE_SUFFIX}`,
  },
  {
    name: 'background',
    size: '1024x1536',
    prompt: `Vertical composition, a dark colonial New England village at night surrounded by wild forest, single lit window, fog rolling in, ${STYLE_SUFFIX}`,
  },
];

async function generateOne(job) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: job.prompt,
      size: job.size,
      n: 1,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('回應裡沒有 b64_json，API 回傳格式不符預期: ' + JSON.stringify(json).slice(0, 300));
  }
  const outPath = path.join(OUT_DIR, `${job.name}.png`);
  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
  return outPath;
}

async function main() {
  if (!API_KEY) {
    console.error('❌ 找不到環境變數 OPENAI_API_KEY，請先設定再執行。');
    console.error('   PowerShell 範例: $env:OPENAI_API_KEY = "sk-..."; node generate-art.js');
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`準備生成 ${JOBS.length} 張圖，輸出到 ${OUT_DIR}\n`);

  let okCount = 0;
  for (const job of JOBS) {
    process.stdout.write(`→ ${job.name} (${job.size}) ... `);
    try {
      const outPath = await generateOne(job);
      console.log(`完成 → ${outPath}`);
      okCount++;
    } catch (err) {
      console.log(`失敗：${err.message}`);
    }
  }

  console.log(`\n${okCount}/${JOBS.length} 張成功。`);
  if (okCount < JOBS.length) {
    console.log('失敗的可以單獨重跑，或修改上面 JOBS 裡對應的 prompt 後整支重跑。');
  }
}

main();

#!/usr/bin/env node
/**
 * 글마다 공유 카드(og:image) PNG를 만든다.
 *
 * 사용법: node tools/og-cards.mjs [사이트 출력 디렉터리, 기본값 _site]
 *
 * jekyll build가 끝나면 _plugins/og-image.rb가 .og-cache/posts.json에 글 목록을 쓴다.
 * 이 스크립트는 그 목록을 읽어 tools/og-card.html을 1200x630으로 찍고
 * <출력 디렉터리>/assets/og/<글 파일 이름>.png에 복사한다.
 *
 * 카드는 .og-cache/cards에 보관하고, 글마다 카드에 들어가는 값과 템플릿의 해시를
 * .og-cache/manifest.json에 적는다. 해시가 같으면 다시 찍지 않는다. CI는 .og-cache를
 * 캐시로 보관하므로 새 글이나 제목이 바뀐 글만 다시 찍는다.
 *
 * 브라우저는 Playwright의 Chromium을 쓰고, 없으면 설치된 Chrome을 쓴다.
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = path.join(ROOT, '.og-cache');
const CARD_DIR = path.join(CACHE_DIR, 'cards');
const MANIFEST = path.join(CACHE_DIR, 'manifest.json');
const POSTS = path.join(CACHE_DIR, 'posts.json');
const TEMPLATE = path.join(ROOT, 'tools', 'og-card.html');
const OUT_DIR = path.join(path.resolve(ROOT, process.argv[2] || '_site'), 'assets', 'og');

const sha = (...parts) => createHash('sha256').update(parts.join('\0')).digest('hex');

const readJson = (file, fallback) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;

async function launch() {
  try {
    return await chromium.launch();
  } catch (err) {
    console.warn(`Playwright Chromium을 열지 못해 설치된 Chrome을 씁니다: ${err.message.split('\n')[0]}`);
    return chromium.launch({ channel: 'chrome' });
  }
}

async function main() {
  const { site, posts } = readJson(POSTS, null) ?? {};
  if (!posts) {
    throw new Error(`${POSTS}가 없습니다. jekyll build를 먼저 실행하세요.`);
  }

  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const avatarFile = path.join(ROOT, site.avatar.replace(/^\//, ''));
  const avatar = fs.readFileSync(avatarFile);
  const avatarData = `data:image/${path.extname(avatarFile).slice(1)};base64,${avatar.toString('base64')}`;

  // 템플릿, 이 스크립트, 사이트 공통 값이 바뀌면 모든 카드를 다시 만든다.
  const templateHash = sha(template, fs.readFileSync(fileURLToPath(import.meta.url), 'utf8'), site.title, site.author, sha(avatar));
  const manifest = readJson(MANIFEST, {});
  fs.mkdirSync(CARD_DIR, { recursive: true });

  const jobs = posts
    .map((post) => ({ ...post, hash: sha(templateHash, post.title, post.url) }))
    .filter((post) => manifest[post.name] !== post.hash || !fs.existsSync(path.join(CARD_DIR, `${post.name}.png`)));

  if (jobs.length) {
    const browser = await launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(template, { waitUntil: 'networkidle' });

    for (const post of jobs) {
      await page.evaluate((data) => window.render(data), { site: { ...site, avatarData }, title: post.title, url: post.url });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(CARD_DIR, `${post.name}.png`) });
      manifest[post.name] = post.hash;
    }
    await browser.close();
  }

  // 지워진 글의 카드는 캐시에서도 지운다.
  const names = new Set(posts.map((post) => post.name));
  for (const file of fs.readdirSync(CARD_DIR)) {
    const name = path.basename(file, '.png');
    if (!names.has(name)) {
      fs.rmSync(path.join(CARD_DIR, file));
      delete manifest[name];
    }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const post of posts) {
    fs.copyFileSync(path.join(CARD_DIR, `${post.name}.png`), path.join(OUT_DIR, `${post.name}.png`));
  }

  console.log(`공유 카드 ${posts.length}개 중 ${jobs.length}개를 새로 만들었습니다.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

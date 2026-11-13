import { cp, mkdir, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { article, feed, notFound } from './render.mjs';
import { categories, homeCategory } from './site.mjs';

const project = await realpath(fileURLToPath(new URL('..', import.meta.url)));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const coverPattern = /^\/assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:svg|avif|webp|png|jpe?g)$/i;

function publicationTime(value) {
  if (typeof value !== 'string') return NaN;
  const dateOnly = datePattern.test(value);
  if (!dateOnly && !timestampPattern.test(value)) return NaN;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return NaN;

  const normalized = new Date(time).toISOString();
  if (dateOnly) {
    // Use midnight KST (UTC+09:00) for a date with no recorded time.
    return normalized.slice(0, 10) === value ? Date.parse(`${value}T00:00:00.000+09:00`) : NaN;
  }
  return normalized === value ? time : NaN;
}

async function readPost(folder, filename, preview) {
  try {
    const slug = filename.slice(0, -'.html'.length);
    if (!slugPattern.test(slug)) throw new Error('파일 이름에는 소문자 영문, 숫자, 하이픈만 사용하세요.');

    const source = await readFile(join(project, folder, filename), 'utf8');
    const match = source.match(/^\s*<!--\s*([\s\S]*?)\s*-->([\s\S]*)$/);
    if (!match) throw new Error('파일 첫 HTML 주석에 JSON으로 글 정보를 입력하세요.');

    const metadata = JSON.parse(match[1]);
    if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
      throw new Error('글 정보는 JSON 객체여야 합니다.');
    }

    const { title, summary, date, category: key, cover, coverAlt } = metadata;
    const category = categories.find((entry) => entry.key === key && key !== 'all');
    const body = match[2].trim();
    if (![title, summary].every((value) => typeof value === 'string' && value.trim())) {
      throw new Error('title과 summary를 입력하세요.');
    }
    const publishedAt = publicationTime(date);
    if (!Number.isFinite(publishedAt)) {
      throw new Error('date에는 YYYY-MM-DD 날짜 또는 YYYY-MM-DDTHH:mm:ss.sssZ UTC 발행 시각을 입력하세요.');
    }
    if (!category) throw new Error('category에는 tech, daily, retrospect 중 하나를 입력하세요.');
    if (!body) throw new Error('글 본문을 입력하세요.');
    if (cover !== undefined) {
      if (typeof cover !== 'string' || !coverPattern.test(cover)) {
        throw new Error('cover에는 /assets/ 아래의 이미지 경로를 입력하세요.');
      }
      const file = await stat(join(project, cover.slice(1))).catch(() => null);
      if (!file?.isFile()) throw new Error(`cover 이미지가 없습니다 (${cover}).`);
    }
    if (coverAlt !== undefined && typeof coverAlt !== 'string') {
      throw new Error('coverAlt에는 이미지 설명을 입력하세요.');
    }

    return { slug, title, summary, date, publishedAt, category, cover, coverAlt, body, preview, path: `/posts/${slug}/` };
  } catch (error) {
    throw new Error(`${folder}/${filename}: ${error.message}`, { cause: error });
  }
}

async function readPosts(folder, preview = false) {
  const entries = await readdir(join(project, folder), { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.html'));
  const posts = await Promise.all(files.map((entry) => readPost(folder, entry.name, preview)));
  return posts.sort((first, second) => second.publishedAt - first.publishedAt || first.slug.localeCompare(second.slug));
}

async function writePage(output, route, html) {
  const directory = join(output, route.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), html, 'utf8');
}

export async function buildSite({ preview = false } = {}) {
  const publicPosts = await readPosts('content');
  const posts = preview && publicPosts.length === 0 ? await readPosts('preview', true) : publicPosts;
  const output = join(project, preview ? '.preview-dist' : 'dist');
  const existingOutput = await realpath(output).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (existingOutput && existingOutput !== output) throw new Error(`출력 폴더가 다른 위치를 가리킵니다: ${output}`);

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(join(project, 'assets'), join(output, 'assets'), { recursive: true });
  await Promise.all([
    writePage(output, '/', feed(homeCategory, posts, preview, '/')),
    ...categories.map((category) => writePage(output, category.path, feed(category, posts, preview))),
    ...posts.map((post, index) => writePage(output, post.path, article(post, posts[index - 1], posts[index + 1], preview))),
    writeFile(join(output, '404.html'), notFound(), 'utf8'),
  ]);
  console.log(`Built ${posts.length} posts in ${output}`);
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { preview: { type: 'boolean' } } });
  await buildSite({ preview: values.preview });
}

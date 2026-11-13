import { categories, site } from './site.mjs';

const characters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => characters[character]);
const brand = escape(site.name);
const author = escape(site.author);
const github = escape(site.github);
const initial = escape(Array.from(site.name)[0]);
const brandMark = `${initial}<span>.</span>`;
const icons = {
  feed: '<path d="M4 6h16M4 12h12M4 18h8"/>',
  github: '<path d="M9 19c-4.3 1.3-4.3-2.2-6-2.7M15 22v-3.3a2.9 2.9 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6A4.7 4.7 0 0 0 18.4 7a4.4 4.4 0 0 0-.1-3.3s-1-.3-3.5 1.3a13.2 13.2 0 0 0-6 0C6.3 3.4 5.3 3.7 5.3 3.7A4.4 4.4 0 0 0 5.2 7a4.7 4.7 0 0 0-1.3 3.5c0 4.7 2.8 5.7 5.5 6a2.9 2.9 0 0 0-.8 2.2V22"/>',
  left: '<path d="M19 12H5m7-7-7 7 7 7"/>',
  right: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}

const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeZone: 'Asia/Seoul' });
const calendarDateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeZone: 'UTC' });
const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Seoul',
});

function date(post, className, { withTime = false } = {}) {
  const hasTime = post.date.includes('T');
  const dateLabel = hasTime ? dateFormat.format(post.publishedAt) : calendarDateFormat.format(new Date(post.date));
  const timeLabel = withTime && hasTime ? ` ${timeFormat.format(post.publishedAt)}` : '';
  return `<time class="${className}" datetime="${post.date}">${dateLabel}${timeLabel}</time>`;
}

function layout({ page, title, description, path, preview, image, content }) {
  const canonical = path && !preview ? escape(new URL(path, site.url).href) : '';
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  ${canonical ? `<link rel="canonical" href="${canonical}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="${page === 'post' ? 'article' : 'website'}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">` : '<meta name="robots" content="noindex">'}
  ${image && canonical ? `<meta property="og:image" content="${escape(new URL(image, site.url).href)}">` : ''}
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="page-${page}">
  <a class="skip-link" href="#main-content">본문으로 건너뛰기</a>
  <aside class="sidebar">
    <a class="sidebar-brand" href="/" aria-label="${brand} 홈">${brandMark}</a>
    <nav class="sidebar-nav" aria-label="주 메뉴">
      <a class="sidebar-link" href="/" ${path === '/' ? 'aria-current="page"' : page !== 'error' ? 'aria-current="location"' : ''} aria-label="피드" title="피드">${icon('feed')}</a>
    </nav>
    <div class="sidebar-bottom">
      <a class="sidebar-link" href="${github}" aria-label="GitHub 프로필" title="GitHub">${icon('github')}</a>
    </div>
  </aside>
  <div class="site-shell">
    <main id="main-content" tabindex="-1">
      ${content}
    </main>
    <footer class="site-footer">
      <span>© ${new Date().getUTCFullYear()} ${author}</span>
      <a href="${github}">GitHub <span aria-hidden="true">↗</span></a>
    </footer>
  </div>
</body>
</html>
`;
}

function card(post) {
  const cover = post.cover
    ? `<img class="card-cover" src="${escape(post.cover)}" width="640" height="360" alt="${escape(post.coverAlt || '')}" decoding="async">`
    : `<div class="card-cover" data-category="${post.category.key}" aria-hidden="true">${brandMark}</div>`;
  return `<li><article class="post-card">
    <a class="card-link" href="${post.path}" aria-labelledby="post-${post.slug}-title">
      ${cover}
      <div class="card-meta"><span class="author-mark" aria-hidden="true">${initial}</span><span>${author}</span><span class="category-label">${post.category.label}</span></div>
      <h3 class="card-title" id="post-${post.slug}-title">${escape(post.title)}</h3>
      <p class="card-summary">${escape(post.summary)}</p>
      ${date(post, 'card-date')}
    </a>
  </article></li>`;
}

export function feed(current, posts, preview) {
  const isAll = current.key === 'all';
  const visible = isAll ? posts : posts.filter(({ category }) => category === current);
  const tabs = categories.map(({ key, label, path }) => `<a class="category-link" href="${path}" ${key === current.key ? 'aria-current="page"' : ''}>${label}</a>`).join('\n        ');
  const listing = visible.length
    ? `<ul class="post-grid" role="list">${visible.map(card).join('\n')}</ul>`
    : `<div class="empty-state" data-category="${current.key}"><h3>아직 올라온 글이 없어요.</h3><p>${isAll ? '새 글을 올리면 이곳에 표시됩니다.' : '다른 카테고리의 글을 둘러보세요.'}</p></div>`;

  return layout({
    page: 'feed',
    title: isAll ? site.name : `${current.label} | ${site.name}`,
    description: site.description,
    path: current.path,
    preview,
    content: `<header class="hero">
      <h1 class="wordmark">${brand}</h1>
      <p class="hero-description">${escape(site.description)}</p>
    </header>
    <section class="feed" aria-labelledby="feed-title">
      <header class="feed-toolbar">
        <div class="feed-heading"><h2 id="feed-title">${current.title}<span>.</span></h2><span class="sort-label">최신순</span>${visible.some((post) => post.preview) ? '<span class="preview-note">예시 글</span>' : ''}</div>
        <nav class="category-nav" aria-label="글 카테고리">${tabs}</nav>
      </header>
      ${listing}
    </section>`,
  });
}

export function article(post, newer, older, preview) {
  const title = escape(post.title);
  const summary = escape(post.summary);
  const cover = post.cover ? `<img class="article-cover" src="${escape(post.cover)}" width="640" height="360" alt="${escape(post.coverAlt || '')}" decoding="async">` : '';
  const neighbors = [
    newer && `<a rel="prev" href="${newer.path}">${icon('left')} <span>더 최근 글<strong>${escape(newer.title)}</strong></span></a>`,
    older && `<a rel="next" href="${older.path}"><span>이전 글<strong>${escape(older.title)}</strong></span> ${icon('right')}</a>`,
  ].filter(Boolean).join('\n');

  return layout({
    page: 'post',
    title: `${post.title} | ${site.name}`,
    description: post.summary,
    path: post.path,
    preview,
    image: post.cover,
    content: `<article class="article-frame">
      <header class="article-header">
        <a class="back-link" href="${post.category.path}">${icon('left')} ${post.category.label} 목록</a>
        <div class="article-meta"><a class="category-label" href="${post.category.path}">${post.category.label}</a>${post.preview ? '<span class="preview-note">예시 글</span>' : ''}</div>
        <h1 class="article-title">${title}</h1>
        <p class="article-summary">${summary}</p>
        <div class="article-byline"><span class="author-mark" aria-hidden="true">${initial}</span><span>${author}</span>${date(post, 'article-date', { withTime: true })}</div>
      </header>
      ${cover}
      <div class="article-content">${post.body}</div>
      ${neighbors ? `<nav class="article-navigation" aria-label="다른 글">${neighbors}</nav>` : ''}
    </article>`,
  });
}

export function notFound() {
  return layout({
    page: 'error',
    title: `페이지를 찾을 수 없습니다 | ${site.name}`,
    description: '요청하신 페이지를 찾을 수 없습니다.',
    content: `<div class="empty-state"><h1>페이지를 찾을 수 없어요.</h1><p>주소를 확인하거나 전체 글로 돌아가세요.</p><a class="back-link" href="/">${icon('left')} 전체 글 보기</a></div>`,
  });
}

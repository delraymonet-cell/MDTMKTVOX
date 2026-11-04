import { readFile, writeFile } from 'node:fs/promises';

const siteUrl = 'https://mdntmrktvox.netlify.app';
const libraryUrl = siteUrl + '/library/';
const feedUrl = libraryUrl + 'linkjar.xml';
const catalog = JSON.parse(await readFile(new URL('../public/library/catalog.json', import.meta.url), 'utf8'));
const output = new URL('../public/library/linkjar.xml', import.meta.url);

if (!Array.isArray(catalog.items)) {
  throw new Error('Expected an items array in the Reading Room catalog.');
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function publicLinkjarUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'linkjar.to' ||
        url.username || url.password || url.port || url.search || url.hash ||
        url.pathname === '/') return null;
    return url;
  } catch {
    return null;
  }
}

function publicationDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

const entries = [];
const seenIds = new Set();
const seenUrls = new Set();
for (const item of catalog.items) {
  const { id, title, category, description, publishedAt } = item ?? {};
  if (typeof id !== 'string' || !id.trim() || typeof title !== 'string' || !title.trim() ||
      typeof category !== 'string' || !category.trim() || /^draft$/i.test(category.trim()) ||
      /^\s*\[draft\]/i.test(title)) continue;

  const url = publicLinkjarUrl(item.url);
  if (!url) continue;
  const key = url.href.replace(/\/+$/, '');
  if (seenIds.has(id) || seenUrls.has(key)) continue;
  seenIds.add(id);
  seenUrls.add(key);
  entries.push({ id, title, category, description, url: url.href, date: publicationDate(publishedAt) });
}

// Dated entries appear newest first. Older catalog entries have no publication dates.
entries.sort((first, second) => (second.date?.getTime() ?? Number.MIN_SAFE_INTEGER) - (first.date?.getTime() ?? Number.MIN_SAFE_INTEGER));

const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  '  <channel>',
  '    <title>MDNT MRKT PRESS | Linkjar publications</title>',
  '    <link>' + libraryUrl + '</link>',
  '    <description>Linkjar publications listed in the MDNT MRKT Reading Room.</description>',
  '    <language>en</language>',
  '    <atom:link href="' + feedUrl + '" rel="self" type="application/rss+xml"/>',
];
for (const { id, title, category, description, url, date } of entries) {
  feed.push(
    '    <item>',
    '      <title>' + escapeXml(title) + '</title>',
    '      <link>' + escapeXml(url) + '</link>',
    '      <guid isPermaLink="false">urn:mdnt-mrkt:linkjar:' + escapeXml(id) + '</guid>',
    '      <category>' + escapeXml(category) + '</category>',
  );
  if (typeof description === 'string' && description.trim()) {
    feed.push('      <description>' + escapeXml(description) + '</description>');
  }
  if (date) feed.push('      <pubDate>' + date.toUTCString() + '</pubDate>');
  feed.push('    </item>');
}
feed.push('  </channel>', '</rss>', '');

await writeFile(output, feed.join('\n'));
console.log('Generated Linkjar RSS with ' + entries.length + ' Reading Room entries.');

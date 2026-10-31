/* MDNT MRKT VOX — RSS-powered listening room.
   Only the public feed URL is consumed; private subscriber feeds are never used.
   The browser parses safe text from same-origin RSS; no HTML from the feed is injected. */
(() => {
  'use strict';
  const RSS = 'https://api.substack.com/feed/podcast/7894037.rss';
  const feedEndpoint = '/api/feed';
  const elements = {
    status: document.querySelector('#feed-status'),
    error: document.querySelector('#feed-error'),
    list: document.querySelector('#episode-list'),
    search: document.querySelector('#episode-search'),
    count: document.querySelector('#episode-count'),
    featureTitle: document.querySelector('#feature-heading'),
    featureSummary: document.querySelector('#feature-summary'),
    featureActions: document.querySelector('#feature-actions'),
    player: document.querySelector('#audio-player'),
    playerBar: document.querySelector('#player-bar'),
    playerTitle: document.querySelector('#player-title'),
    close: document.querySelector('#close-player'),
    retry: document.querySelector('#retry-feed')
  };
  document.querySelector('#year').textContent = String(new Date().getFullYear());
  let episodes = [];
  let showCover = '';

  function textOf(node, names) {
    for (const tag of names) {
      const found = node.getElementsByTagName(tag)[0];
      if (found && found.textContent && found.textContent.trim()) return found.textContent.trim();
    }
    return '';
  }
  function child(node, name) {
    return Array.from(node.children || []).find(n => n.tagName.toLowerCase() === name.toLowerCase()) || null;
  }
  function directText(node, names) {
    for (const name of names) {
      const found = child(node, name);
      if (found && found.textContent?.trim()) return found.textContent.trim();
    }
    return textOf(node, names);
  }
  function extractPlain(value) {
    // Feed descriptions often include HTML markup inside CDATA. Strip it to plain text.
    const doc = new DOMParser().parseFromString(value || '', 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function safeUrl(raw) {
    if (!raw) return '';
    try {
      const url = new URL(raw.trim());
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch { return ''; }
  }
  function getAudio(item) {
    for (const enclosure of Array.from(item.getElementsByTagName('enclosure'))) {
      const src = safeUrl(enclosure.getAttribute('url'));
      const type = String(enclosure.getAttribute('type') || '').toLowerCase();
      if (src && (type.startsWith('audio/') || /\.(mp3|m4a|wav|aac|ogg)(?:$|\?)/i.test(src))) return src;
    }
    for (const media of Array.from(item.getElementsByTagName('media:content'))) {
      const src = safeUrl(media.getAttribute('url'));
      if (src && String(media.getAttribute('medium') || media.getAttribute('type') || '').toLowerCase().includes('audio')) return src;
    }
    return '';
  }
  function imageOf(item) {
    for (const tag of ['itunes:image', 'media:thumbnail', 'media:content']) {
      for (const image of Array.from(item.getElementsByTagName(tag))) {
        if (tag === 'media:content' && !/image/i.test(image.getAttribute('type') || image.getAttribute('medium') || '')) continue;
        const src = safeUrl(image.getAttribute('href') || image.getAttribute('url'));
        if (src) return src;
      }
    }
    return showCover;
  }
  function formatDate(value) {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'}).toUpperCase() : 'ARCHIVE';
  }
  function formatDuration(value) {
    if (!value) return '';
    const bits = String(value).split(':').map(Number);
    if (bits.some(Number.isNaN)) return '';
    const sec = bits.length === 3 ? bits[0]*3600 + bits[1]*60 + bits[2] : bits.length === 2 ? bits[0]*60+bits[1] : bits[0];
    const min = Math.ceil(sec/60);
    return min >= 60 ? `${Math.floor(min/60)}H ${min%60}M` : `${min} MIN`;
  }
  function parseRSS(xmlString) {
    const xml = new DOMParser().parseFromString(xmlString, 'application/xml');
    if (xml.getElementsByTagName('parsererror').length) throw new Error('The response could not be parsed as XML.');
    const channel = xml.getElementsByTagName('channel')[0];
    if (!channel) throw new Error('The source did not return a podcast RSS channel.');
    const imageTag = channel.getElementsByTagName('itunes:image')[0];
    const channelImage = channel.getElementsByTagName('image')[0];
    showCover = safeUrl(imageTag?.getAttribute('href')) || safeUrl(channelImage ? directText(channelImage, ['url']) : '') || '';
    const items = Array.from(channel.getElementsByTagName('item'));
    return items.map((item,i) => {
      const title = directText(item,['title']) || `Transmission ${i + 1}`;
      const summaryHtml = directText(item,['itunes:summary','description','content:encoded']);
      const description = extractPlain(summaryHtml);
      const dateRaw = directText(item,['pubDate','dc:date']);
      const dateParsed = Date.parse(dateRaw);
      return {
        title,
        description,
        url: safeUrl(directText(item,['link'])) || 'https://mdntmrktcont.substack.com/',
        audio: getAudio(item),
        image: imageOf(item),
        date: formatDate(dateRaw),
        dateValue: Number.isFinite(dateParsed) ? dateParsed : 0,
        duration: formatDuration(textOf(item,['itunes:duration'])),
        id: directText(item,['guid']) || `${i}`
      };
    }).sort((a,b)=>b.dateValue - a.dateValue);
  }
  function create(tag, cls, value) {
    const element=document.createElement(tag);
    if (cls) element.className=cls;
    if (value !== undefined) element.textContent=value;
    return element;
  }
  function play(ep) {
    if (!ep.audio) { window.open(ep.url,'_blank','noopener,noreferrer'); return; }
    elements.player.pause();
    elements.player.src=ep.audio;
    elements.playerTitle.textContent=ep.title;
    elements.playerBar.hidden=false;
    elements.player.load();
    elements.player.play().catch(()=>{ /* browser controls still let the listener start playback manually */ });
  }
  function renderCard(ep,index) {
    const article=create('article','episode');
    const cover=create('button','episode-art-trigger');cover.type='button';cover.setAttribute('aria-label',`Listen to ${ep.title}`);cover.addEventListener('click',()=>play(ep));
    const placeholder=()=>{cover.replaceChildren();const fallback=create('div','episode-art episode-fallback','VOX');fallback.setAttribute('aria-hidden','true');cover.append(fallback);};
    if (ep.image) {
      const img=create('img','episode-art');img.src=ep.image;img.alt=`Cover artwork for ${ep.title}`;img.loading='lazy';img.decoding='async';img.addEventListener('error',placeholder,{once:true});cover.append(img);
    } else placeholder();
    article.append(cover);
    const body=create('div','episode-body');
    const meta=create('div','episode-meta');
    [ `TRANSMISSION ${String(index+1).padStart(2,'0')}`, ep.date, ep.duration ].filter(Boolean).forEach(s=>meta.append(create('span','',s)));
    body.append(meta,create('h3','episode-title',ep.title),create('p','episode-desc',ep.description.length>230 ? ep.description.slice(0,227).trimEnd()+'…' : ep.description || 'Listen to the latest transmission.'));
    article.append(body);
    const actions=create('div','episode-actions');
    if(ep.audio){const btn=create('button','episode-play','▶ LISTEN');btn.type='button';btn.setAttribute('aria-label',`Play ${ep.title}`);btn.addEventListener('click',()=>play(ep));actions.append(btn);}
    const link=create('a','episode-link',ep.audio ? 'EPISODE ↗' : 'OPEN ↗');link.href=ep.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',`Open ${ep.title} on Substack`);actions.append(link);
    article.append(actions);return article;
  }
  function render() {
    const q=elements.search.value.trim().toLowerCase();
    const filtered=episodes.filter(ep=>(ep.title+' '+ep.description).toLowerCase().includes(q));
    elements.count.textContent=`${filtered.length} / ${episodes.length} TRANSMISSIONS`;
    elements.list.replaceChildren();
    if(!filtered.length){elements.list.append(create('div','empty', q ? 'No transmissions match that search.' : 'No public podcast episodes are listed yet.'));return;}
    const fragment=document.createDocumentFragment();
    filtered.forEach((ep,i)=>fragment.append(renderCard(ep,i)));
    elements.list.append(fragment);
  }
  function showLatest() {
    const ep=episodes[0];
    if(!ep)return;
    elements.featureTitle.replaceChildren(document.createTextNode(ep.title),create('span','signal-punct','.'));
    elements.featureSummary.textContent=ep.description.length>300 ? ep.description.slice(0,297).trimEnd()+'…' : (ep.description || 'Listen to the latest transmission.');
    elements.featureActions.replaceChildren();
    if(ep.audio){const playBtn=create('button','button button-lime','▶ PLAY LATEST');playBtn.type='button';playBtn.addEventListener('click',()=>play(ep));elements.featureActions.append(playBtn);}
    const link=create('a','text-link','READ EPISODE ↗');link.href=ep.url;link.target='_blank';link.rel='noopener noreferrer';elements.featureActions.append(link);
  }
  async function loadFeed() {
    elements.error.hidden=true;
    elements.status.hidden=false;
    elements.status.textContent='CONTACTING THE SUBSTACK TRANSMISSION…';
    elements.count.textContent='CONNECTING / RSS';
    try {
      const response=await fetch(feedEndpoint,{headers:{Accept:'application/rss+xml, application/xml, text/xml'},cache:'no-store'});
      if (!response.ok) throw new Error(`The feed returned HTTP ${response.status}.`);
      const xml=await response.text();
      episodes=parseRSS(xml);
      elements.status.textContent=episodes.length ? `SIGNAL RECEIVED // ${episodes.length} TRANSMISSION${episodes.length===1?'':'S'} ARCHIVED` : 'SIGNAL RECEIVED // NO PUBLIC EPISODES YET';
      showLatest();render();
    } catch (err) {
      console.warn('MDNT MRKT VOX feed unavailable:',err);
      elements.status.textContent='THE CONNECTION COULD NOT BE VERIFIED';
      elements.error.hidden=false;
      elements.count.textContent='RSS / OFFLINE';
    }
  }
  elements.search.addEventListener('input',render);
  elements.retry.addEventListener('click',loadFeed);
  elements.close.addEventListener('click',()=>{elements.player.pause();elements.player.removeAttribute('src');elements.player.load();elements.playerBar.hidden=true;});
  loadFeed();
})();

/* MDNT MRKT: anonymous, first-party reading interactions. Opt out: localStorage mdnt_analytics_optout = '1'. */
(() => {
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl || localStorage.getItem('mdnt_analytics_optout') === '1') return;
  const idKey='mdnt_reader_token',timeKey='mdnt_reader_started';
  try {
    if (!localStorage.getItem(idKey) || Date.now()-Number(localStorage.getItem(timeKey)||0)>30*86400000) {
      localStorage.setItem(idKey,crypto.randomUUID()); localStorage.setItem(timeKey,String(Date.now()));
    }
  } catch { return; }
  const visitor=localStorage.getItem(idKey),session=crypto.randomUUID();
  function send(type,extra={}) {
    const payload={type,path:location.pathname,visitor,session,referrer:document.referrer ? (()=>{try{return new URL(document.referrer).hostname}catch{return ''}})() : '',...extra};
    const body=JSON.stringify(payload);
    if(navigator.sendBeacon) navigator.sendBeacon('/api/analytics-event',new Blob([body],{type:'application/json'}));
    else fetch('/api/analytics-event',{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true}).catch(()=>{});
  }
  send('page_view');
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link) return;
    let url;try{url=new URL(link.href,location.href)}catch{return}
    if(url.hostname==='linkjar.to'||url.hostname==='pdflink.to') {
      const card=link.closest('.archive-card');
      send('publication_click',{title:(card?.querySelector('h2')?.textContent||link.textContent||'').slice(0,100),genre:(card?.querySelector('.label')?.textContent||'').slice(0,80)});
    } else if(url.pathname.startsWith('/library/')) send('library_click');
    else if(link.href.includes('mailto:')||/wholesale|bookstore|catalog/i.test(link.textContent||''))send('bookseller_action');
    else if(url.hostname!==location.hostname)send('external_click',{destination:url.hostname.slice(0,80)});
  });
  document.addEventListener('click',event=>{
    const btn=event.target.closest('button');
    if(btn&&/listen|play/i.test(btn.textContent||''))send('episode_play',{title:(btn.closest('.episode')?.querySelector('h3')?.textContent||'').slice(0,100)});
  });
})();
import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';
function authorized(request) {
  const expected=process.env.ANALYTICS_ADMIN_TOKEN||'';
  const provided=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  const a=Buffer.from(expected),b=Buffer.from(provided);
  return expected.length>=24&&a.length===b.length&&timingSafeEqual(a,b);
}
function countBy(rows,key){const out={};for(const r of rows){const k=r[key]||'Unknown';out[k]=(out[k]||0)+1}return Object.entries(out).sort((a,b)=>b[1]-a[1]).slice(0,25)}
export default async function handler(request){
  if(request.method!=='GET')return new Response('',{status:405});
  if(!authorized(request))return new Response(JSON.stringify({error:'Unauthorized. Configure ANALYTICS_ADMIN_TOKEN in Netlify.'}),{status:401,headers:{'content-type':'application/json','cache-control':'no-store'}});
  try{
    const from=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
    const store=getStore('readership-events');
    const {blobs}=await store.list();
    const keys=blobs.filter(b=>b.key.slice(0,10)>=from).slice(-6000);
    const events=(await Promise.all(keys.map(k=>store.get(k.key,{type:'json'})))).filter(Boolean);
    const visitors=new Set(events.map(e=>e.visitor)),sessions=new Set(events.map(e=>e.session));
    const views=events.filter(e=>e.type==='page_view'),clicks=events.filter(e=>e.type==='publication_click');
    const byVisitor=new Map();
    for(const e of events){if(!byVisitor.has(e.visitor))byVisitor.set(e.visitor,[]);byVisitor.get(e.visitor).push(e)}
    let migrators=0,delayed=0; const affinity={};
    for(const es of byVisitor.values()){
      const publications=es.filter(e=>e.type==='publication_click');
      const genres=[...new Set(publications.map(e=>e.genre).filter(Boolean))];
      if(genres.length>=2)migrators++;
      const visits=es.filter(e=>e.type==='page_view').map(e=>new Date(e.at).getTime()).sort((a,b)=>a-b);
      if(visits.length>1&&visits.at(-1)-visits[0]>=7*86400000)delayed++;
      const titles=[...new Set(publications.map(e=>e.title).filter(Boolean))];
      for(let i=0;i<titles.length;i++)for(let j=i+1;j<titles.length;j++){const key=[titles[i],titles[j]].sort().join(' + ');affinity[key]=(affinity[key]||0)+1}
    }
    const booksellerViews=views.filter(e=>/wholesale|bookstore|catalog/i.test(e.path));
    const result={
      period:'Last 30 days',eventsAnalyzed:events.length,limited:blobs.length>6000,
      uniqueVisitors:visitors.size,pageViews:views.length,sessions:sessions.size,
      libraryClicks:events.filter(e=>e.type==='library_click').length,
      publicationClicks:clicks.length,
      readershipClickRate:views.length?Math.round(clicks.length/views.length*1000)/10:0,
      genreMigrationRate:visitors.size?Math.round(migrators/visitors.size*1000)/10:0,
      delayedDiscoveryRate:visitors.size?Math.round(delayed/visitors.size*1000)/10:0,
      booksellerActions:events.filter(e=>e.type==='bookseller_action').length,
      booksellerIntentRate:booksellerViews.length?Math.round(events.filter(e=>e.type==='bookseller_action').length/booksellerViews.length*1000)/10:null,
      pages:countBy(views,'path'),publications:countBy(clicks,'title'),genres:countBy(clicks,'genre'),
      referrals:countBy(views,'referrer'),countries:countBy(views,'country'),regions:countBy(views,'region'),cities:countBy(views,'city'),
      outboundDomains:countBy(events.filter(e=>e.type==='external_click'),'destination'),
      catalogAffinity:Object.entries(affinity).sort((a,b)=>b[1]-a[1]).slice(0,15),
      podcastPlays:events.filter(e=>e.type==='episode_play').length,
      unavailable:['Actual Linkjar/PDFLink reading depth and completed reads (requires provider data)','Age bands (requires separate consented data)','Language preference (requires separate consented data)','Network/IP threat detection (use Netlify logs or dedicated security service)'],
      caveat:'Anonymous first-party interaction signals, not verified sales or third-party reading analytics. No raw IP addresses are recorded. Approximate locations depend on Netlify geo headers.'
    };
    return new Response(JSON.stringify(result),{headers:{'content-type':'application/json','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
  }catch(err){console.error('Analytics report unavailable',err?.message);return new Response(JSON.stringify({error:'Analytics data unavailable; check the deployment and Blob configuration.'}),{status:503,headers:{'content-type':'application/json','cache-control':'no-store'}})}
}
import { getStore } from '@netlify/blobs';
const allowed=new Set(['page_view','publication_click','library_click','bookseller_action','external_click','episode_play']);
export default async function handler(request,context) {
  if(request.method!=='POST')return new Response('',{status:405});
  const len=Number(request.headers.get('content-length')||0);
  if(len>2500)return new Response('',{status:413});
  let v;try{const txt=await request.text();if(txt.length>2500)return new Response('',{status:413});v=JSON.parse(txt)}catch{return new Response('',{status:400})}
  if(!allowed.has(v.type)||typeof v.path!=='string'||v.path.length>150 || !/^\/[a-z0-9/_-]*$/i.test(v.path))return new Response('',{status:400});
  const safe=(s,n=100)=>typeof s==='string'?s.slice(0,n).replace(/[<>]/g,''):'';
  const token=safe(v.visitor,40),session=safe(v.session,40);
  if(!/^[0-9a-f-]{36}$/i.test(token)||!/^[0-9a-f-]{36}$/i.test(session))return new Response('',{status:400});
  const geo=context.geo||{};
  const event={at:new Date().toISOString(),type:v.type,path:v.path,visitor:token,session,
    referrer:safe(v.referrer,80),title:safe(v.title),genre:safe(v.genre,80),
    destination:safe(v.destination,80),country:safe(geo.country?.code||geo.country,50),
    region:safe(geo.subdivision?.name||'',60),city:safe(geo.city,60)};
  try{
    const store=getStore('readership-events');
    await store.setJSON(event.at.slice(0,10)+'/'+Date.now()+'-'+crypto.randomUUID(),event);
    return new Response('',{status:204,headers:{'cache-control':'no-store'}});
  }catch(err){console.error('Analytics write unavailable',err?.message);return new Response('',{status:503})}
}
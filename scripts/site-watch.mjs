#!/usr/bin/env node
// Safe, production-facing MDNT MRKT VOX checks. No attack payloads, login attempts,
// aggressive crawling, credential guesses, or destructive probes.
import {writeFileSync} from 'node:fs';
const ORIGIN='https://mdntmrktvox.netlify.app';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const results=[];
async function probe(path,{method='GET',headers={},body,timeout=14000,retries=2}={}){
  let error='';
  for(let attempt=0;attempt<=retries;attempt++){
    try{
      const res=await fetch(ORIGIN+path,{method,headers,body,redirect:'follow',signal:AbortSignal.timeout(timeout),cache:'no-store'});
      const text=method==='HEAD'?'':await res.text();
      return {status:res.status,headers:res.headers,text,finalURL:res.url};
    }catch(e){error=String(e.message||e);if(attempt<retries)await sleep(850*(attempt+1));}
  }
  throw new Error('Network failure after retries: '+error);
}
function check(label,ok,detail,critical=false){
  results.push({label,ok:!!ok,detail,critical});
  process.stdout.write((ok?'PASS':'FAIL')+' '+label+': '+detail+'\n');
}
async function route(path,pattern,label,critical=true){
  try{
    const r=await probe(path);
    check(label,r.status===200&&(pattern?r.text.includes(pattern):true),'HTTP '+r.status,critical);
    return r;
  }catch(e){check(label,false,e.message,critical);return null;}
}
const home=await route('/','MDNT MRKT','Homepage');
const library=await route('/library/','archive-grid','Library');
const catalog=await route('/library/catalog.json','"items"','Publication catalog');
await route('/admin/analytics/','Readership Intelligence','Analytics dashboard');
const scripts=await route('/app.js','parseRSS','Podcast application code');
await route('/analytics.js','page_view','Visitor event script');
if(catalog?.status===200){
 try {
   const data=JSON.parse(catalog.text);
   const items=Array.isArray(data.items)?data.items:[];
   const valid=items.filter(it=>it.category!=='Draft');
   const bad=valid.filter(it=>{
     try{const u=new URL(it.url);return u.protocol!=='https:'||!['linkjar.to','pdflink.to'].includes(u.hostname)}catch{return true}
   });
   check('Catalog integrity',items.length>0&&bad.length===0,items.length+' entries, '+bad.length+' unsafe/invalid URL(s)',true);
 }catch(e){check('Catalog JSON',false,e.message,true)}
}
for(const [label,r] of [['Homepage headers',home],['Library headers',library]]){
 if(r)check(label,r.headers.get('x-content-type-options')==='nosniff' &&
   (r.headers.get('referrer-policy')||'').includes('strict-origin'),
   'nosniff '+String(r.headers.get('x-content-type-options'))+', referrer '+String(r.headers.get('referrer-policy')),false);
}
try{
 const r=await probe('/api/analytics-report');
 check('Private analytics access',r.status===401,'Unauthenticated HTTP '+r.status,true);
}catch(e){check('Private analytics access',false,e.message,true)}
try{
 const r=await probe('/api/analytics-event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'invalid'})});
 check('Event validation',r.status===400,'Invalid event HTTP '+r.status,true);
}catch(e){check('Event validation',false,e.message,true)}
const failed=results.filter(r=>!r.ok);
const critical=failed.filter(r=>r.critical);
const report={checkedAt:new Date().toISOString(),origin:ORIGIN,
  total:results.length,failed:failed.length,critical:critical.length,
  results,summary:failed.length?failed.map(r=>r.label+': '+r.detail).join('\n'):'All checks passed'};
writeFileSync('site-watch-report.json',JSON.stringify(report,null,2));
if(process.env.GITHUB_OUTPUT){
 const {appendFileSync}=await import('node:fs');
 appendFileSync(process.env.GITHUB_OUTPUT,'critical='+critical.length+'\nfailures='+failed.length+'\n');
}
if(failed.length)process.exitCode=1;
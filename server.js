// Uzma's Glory shop — zero dependencies, needs Node 22.5+ (built-in SQLite)
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {DatabaseSync}=require('node:sqlite');
const PORT=process.env.PORT||3000,PW=process.env.ADMIN_PASSWORD||'uzma123';
const PUB=path.join(__dirname,'public'),UP=path.join(PUB,'uploads');
fs.mkdirSync(UP,{recursive:true});fs.mkdirSync(path.join(__dirname,'data'),{recursive:true});
const db=new DatabaseSync(path.join(__dirname,'data','shop.db'));
db.exec(`CREATE TABLE IF NOT EXISTS store(k TEXT PRIMARY KEY,v TEXT);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,at TEXT,n TEXT,ph TEXT,a TEXT,pm TEXT,t TEXT,total INTEGER,items TEXT)`);
if(!db.prepare("SELECT 1 FROM store WHERE k='main'").get())
  db.prepare("INSERT INTO store VALUES('main',?)").run(fs.readFileSync(path.join(__dirname,'seed.json'),'utf8'));
const getStore=()=>JSON.parse(db.prepare("SELECT v FROM store WHERE k='main'").get().v);
const tokens=new Set(),MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
const send=(r,c,o)=>{r.writeHead(c,{'content-type':'application/json'});r.end(JSON.stringify(o))};
const body=q=>new Promise((ok,no)=>{let b='',n=0;q.on('data',d=>{n+=d.length;if(n>8e6){no(new Error('big'));q.destroy()}else b+=d});q.on('end',()=>{try{ok(JSON.parse(b||'{}'))}catch(e){no(e)}})});
const authed=q=>tokens.has((q.headers.authorization||'').replace('Bearer ',''));
const str=(v,m=300)=>String(v??'').slice(0,m);
http.createServer(async(q,r)=>{
 try{
  const u=new URL(q.url,'http://x'),p=u.pathname,m=q.method;
  if(p.startsWith('/api/')){
   if(p=='/api/store'&&m=='GET')return send(r,200,getStore());
   if(p=='/api/login'&&m=='POST'){const {pw}=await body(q);
     const a=Buffer.from(String(pw||'')),b=Buffer.from(PW);
     if(a.length!=b.length||!crypto.timingSafeEqual(a,b))return send(r,401,{error:'wrong password'});
     const t=crypto.randomBytes(24).toString('hex');tokens.add(t);return send(r,200,{token:t})}
   if(p=='/api/orders'&&m=='POST'){const o=await body(q),s=getStore();
     const ph=str(o.ph,20).replace(/\D/g,'');
     if(!str(o.n)||!/^01\d{9}$/.test(ph)||!str(o.a,500)||!Array.isArray(o.items)||!o.items.length||o.items.length>30)return send(r,400,{error:'invalid'});
     const pm=['bk','ng','cod'].includes(o.pm)?o.pm:'cod';let sub=0,lines=[];
     for(const i of o.items){const pr=s.products.find(x=>x.id==i.id),q2=Math.max(1,Math.min(50,+i.q||1));
       if(!pr)return send(r,400,{error:'product missing'});const img=pr.imgs[i.ci]||pr.imgs[0];
       sub+=pr.price*q2;lines.push(`${pr.name} (${img.c}) ×${q2}`)}
     const total=sub-(pm=='cod'?0:Math.round(sub*s.cfg.dc/100)),id='UG'+Date.now().toString().slice(-6);
     db.prepare('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?)').run(id,new Date().toLocaleString('bn-BD',{timeZone:'Asia/Dhaka'}),str(o.n),ph,str(o.a,500),pm,str(o.t,60),total,JSON.stringify(lines));
     return send(r,200,{id,total})}
   if(!authed(q))return send(r,401,{error:'login required'});
   if(p=='/api/store'&&m=='PUT'){const d=await body(q);
     if(!Array.isArray(d.products)||!Array.isArray(d.brands)||!Array.isArray(d.reviews)||!d.cfg)return send(r,400,{error:'invalid'});
     delete d.cfg.pw;db.prepare("UPDATE store SET v=? WHERE k='main'").run(JSON.stringify({products:d.products,brands:d.brands,reviews:d.reviews,cfg:d.cfg,cover:d.cover}));return send(r,200,{ok:1})}
   if(p=='/api/upload'&&m=='POST'){const {d}=await body(q),x=/^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(d||'');
     if(!x)return send(r,400,{error:'image only'});const f=crypto.randomBytes(8).toString('hex')+(x[1]=='jpeg'?'.jpg':'.'+x[1]);
     fs.writeFileSync(path.join(UP,f),Buffer.from(x[2],'base64'));return send(r,200,{url:'/uploads/'+f})}
   if(p=='/api/orders'&&m=='GET')return send(r,200,db.prepare('SELECT * FROM orders ORDER BY rowid DESC').all().map(o=>({...o,items:JSON.parse(o.items)})));
   if(p=='/api/orders'&&m=='DELETE'){db.exec('DELETE FROM orders');return send(r,200,{ok:1})}
   return send(r,404,{error:'not found'})}
  let f=path.normalize(path.join(PUB,p=='/'?'index.html':p));
  if(!f.startsWith(PUB)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('Not found')}
  r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);
 }catch(e){send(r,500,{error:'server error'})}
}).listen(PORT,()=>console.log('Shop running: http://localhost:'+PORT+'  (admin: /#admin)'));

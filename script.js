const $=s=>document.querySelector(s),W=400,H=720,R=32,BR=10,TX=50,TY=140,TW=300,TH=440,NY=360;
const WIN=11,GR=.3,E=.8,NETH=18,SZ=22,SO=44; /* regras: 11 pontos, diferença de 2, saque a cada 2 pontos */
const cv=$('#cv'),cx=cv.getContext('2d'),wrap=$('#wrap'),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a);
const RED='#ff2d75',BLUE='#00e5ff';
const OPT={config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]}};
let mode='',peer,conn,G,last=0,me=0,raf,S=2,sendT=0,pend=null,P=[];
const show=id=>document.querySelectorAll('.screen').forEach(e=>e.classList.toggle('on',e.id===id));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));

/* ---------- tamanho responsivo ---------- */
function resize(){
  const w=wrap.clientWidth;if(!w)return;
  S=Math.min(devicePixelRatio||1,3)*w/W;cv.width=Math.round(W*S);cv.height=Math.round(H*S);
  document.documentElement.style.setProperty('--u',w/W+'px');
}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));

/* ---------- jogo ---------- */
function newGame(){
  const fs=Math.random()<.5?0:1;
  G={b:{x:200,y:360,z:SZ,vx:0,vy:0,vz:0},p:[{x:200,y:600,vx:0,vy:0},{x:200,y:120,vx:0,vy:0}],
     s:[0,0],ph:'serve',t:25,fs,sv:fs,st:0,bs:[0,0],cd:[0,0],tr:[],h:0,w:0,lh:-1,mc:0,msg:'',mt:0,be:0,T:null};
  if(mode==='bot')G.p[1].bot=true;
  readyServe();P=[];upd();
}
function start(m){
  mode=m;me=m==='guest'?1:0;newGame();
  const n={bot:['VOCÊ','ROBÔ'],'2p':['VERMELHO','AZUL'],host:['VOCÊ','ADVERSÁRIO'],guest:['VOCÊ','ADVERSÁRIO']}[m];
  $('#n0').textContent=n[0];$('#n1').textContent=n[1];$('#hud').className=m==='guest'?'g':'';
  show('game');resize();cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(loop);
}
function upd(){
  const g=mode==='guest',[a,b]=G.s;
  $('#s0').textContent=g?b:a;$('#s1').textContent=g?a:b;
  const ov=G.ph==='over';$('#over').classList.toggle('on',ov);
  if(ov){const w=a>b?0:1;$('#ot').textContent=mode==='2p'?(w?'Azul venceu!':'Vermelho venceu!'):(w===me?'Você venceu! 🏆':'Você perdeu!');}
}
function boom(x,y,c,n=12){for(let i=0;i<n;i++)P.push({x,y,vx:rnd(-3.5,3.5),vy:rnd(-3.5,3.5),l:1,c});}
function flash(t){G.msg=t;G.mt=80;G.mc++;}

/* ---------- regras do tênis de mesa ---------- */
const serveDelay=()=>mode==='bot'&&G.sv===1?60:25;
function clampServer(){const q=G.p[G.sv];q.y=G.sv===0?Math.max(q.y,470):Math.min(q.y,250);}
function readyServe(){
  const b=G.b;G.ph='serve';G.st=0;G.bs=[0,0];G.lh=-1;b.vx=b.vy=b.vz=0;b.z=SZ;G.tr=[];
  G.t=serveDelay();clampServer();
}
/* ponto para w; saque troca a cada 2 pontos (a cada 1 a partir de 10-10); vence quem chega a 11 com 2 de vantagem */
function point(w,t){
  boom(G.b.x,cl(G.b.y,TY,TY+TH),'#fff');if(t)flash(t);
  G.s[w]++;const [a,b]=G.s,tot=a+b;
  if(Math.max(a,b)>=WIN&&Math.abs(a-b)>=2){G.ph='over';G.b.vx=G.b.vy=G.b.vz=0;upd();return;}
  G.sv=(G.fs+Math.floor(Math.min(tot,20)/2)+Math.max(0,tot-20))%2;
  readyServe();upd();
}
function letServe(){flash('LET! SAQUE REPETIDO');readyServe();}
/* saque: bate para baixo, quica primeiro no lado de quem saca, passa a rede e quica no lado do adversário */
const SVZ=-4.3;
function simServe(b0,s,vy,vx){
  const u=s?1:-1;let x=b0.x,y=b0.y,z=b0.z,vz=SVZ,st=1;
  for(let n=0;n<200;n++){
    const oy=y,oz=z;x+=vx;y+=u*vy;z+=vz-.5*GR;vz-=GR;
    if((oy-NY)*(y-NY)<0&&x>TX-8&&x<TX+TW+8){if(oz+(z-oz)*(NY-oy)/(y-oy)<NETH+4)return false;}
    if(z<=0&&vz<0){
      z=0;const on=x>=TX&&x<=TX+TW&&y>=TY&&y<=TY+TH,side=y>NY?0:1;
      if(st===1){if(!(on&&side===s))return false;st=2;}else return on&&side===1-s;
      vz=-vz*E;
    }
  }
  return false;
}
function doServe(){
  const s=G.sv,q=G.p[s],b=G.b,u=s?1:-1,vx=cl((q.vx||0)*.4+rnd(-.8,.8),-1.6,1.6),ok=[];
  for(let vy=3;vy<=12;vy+=.25)if(simServe(b,s,vy,vx))ok.push(vy);
  b.vy=u*(ok.length?ok[ok.length*Math.random()|0]:6.5);b.vx=vx;b.vz=SVZ;
  G.ph='play';G.st=1;G.lh=s;G.bs=[0,0];G.cd[s]=15;boom(b.x,b.y,s?BLUE:RED);
}
/* devolução: a velocidade da raquete no toque define a força da bola (leve = bola lenta e curta, rápida = bola forte e funda);
   o ponto de contato define o lado. O robô simula uma batida com força variável. */
function swing(i){
  const q=G.p[i],u=i?1:-1;
  if(q.bot)return Math.random()<.1?20:rnd(4,10); /* 10% do tempo o robô exagera e erra */
  const f=Math.max(0,u*q.vy,u*(q.ay||0)),l=Math.max(Math.abs(q.vx),Math.abs(q.ax||0));
  return f+.35*l;
}
function hit(i){
  const q=G.p[i],b=G.b,u=i?1:-1,z0=Math.max(b.z,3),sw=swing(i);
  const inc=Math.hypot(b.vx,b.vy),v=cl(3.5+sw*.75+inc*.12,3.5,15);
  const f0=cl(.28+(v-3.5)/11.5*.8+rnd(-.04,.04),.28,1.1);
  const lx=cl(b.x+(b.x-q.x)/(R+BR)*50+q.vx*3,TX+8,TX+TW-8);
  /* tenta a profundidade pedida; se não passar a rede, a bola sai mais alta/funda (empurrão) */
  let ly,dy,t,ok=false;
  for(let f=f0;f<=Math.max(f0,1)+1e-6;f+=.03){
    ly=NY+u*f*220;dy=Math.max(1,Math.abs(ly-b.y));t=Math.min(Math.max(4,dy/v),45);
    if((b.y-NY)*(ly-NY)>=0){ok=true;break;}
    const vz=(.5*GR*t*t-z0)/t,tn=t*Math.abs(NY-b.y)/dy;
    if(z0+vz*tn-.5*GR*tn*tn>=NETH+8){ok=true;break;}
  }
  if(!ok){ /* sem solução: levanta a bola até passar (ou bate na rede) */
    ly=NY+u*f0*220;dy=Math.max(1,Math.abs(ly-b.y));
    for(t=Math.max(4,dy/v);t<100;t++){
      const vz=(.5*GR*t*t-z0)/t,tn=t*Math.abs(NY-b.y)/dy;
      if((b.y-NY)*(ly-NY)>=0||z0+vz*tn-.5*GR*tn*tn>=NETH+8)break;
    }
  }
  b.vx=(lx-b.x)/t;b.vy=(ly-b.y)/t;b.vz=(.5*GR*t*t-z0)/t;
  G.bs=[0,0];G.lh=i;G.cd[i]=12;G.h++;G.w=i;G.be=rnd(-22,22);boom(b.x,b.y,i?BLUE:RED,Math.round(4+v));
}
function ground(){
  const b=G.b,on=b.x>=TX&&b.x<=TX+TW&&b.y>=TY&&b.y<=TY+TH,side=b.y>NY?0:1,h=G.lh,o=1-h;
  if(G.st===1){if(on&&side===h){G.st=2;return;}point(o,'SAQUE ERRADO!');return;}
  if(G.st===2){if(on&&side===o){G.st=0;G.bs[o]=1;return;}point(o,'SAQUE ERRADO!');return;}
  if(!on){if(G.bs[o]>=1)point(h,'');else point(o,'FORA!');return;}
  if(side===h){point(o,'FALTA!');return;}
  if(++G.bs[o]>=2)point(h,'2 QUIQUES!');
}
/* ---------- robô ---------- */
function predict(i){
  const b=G.b;let x=b.x,y=b.y,z=b.z,vx=b.vx,vy=b.vy,vz=b.vz,got=G.bs[i]>=1,bx=x,by=y;
  for(let n=0;n<200;n++){
    x+=vx;y+=vy;z+=vz-.5*GR;vz-=GR;
    if(z<=0&&vz<0){
      const on=x>=TX&&x<=TX+TW&&y>=TY&&y<=TY+TH,side=y>NY?0:1;
      if(got||!on)return{x,y,bx,by,out:!got&&!on};
      z=0;vz=-vz*E;if(side===i){got=true;bx=x;by=y;}
    }else if(got&&vz<0&&z<26)return{x,y,bx,by};
  }
  return{x,y,bx,by};
}
function bot(i,dt){
  const q=G.p[i],sp=4.4*dt,home=i?110:610;let tx=200,ty=home;
  if(G.ph==='serve'){if(G.sv===i)ty=i?150:570;}
  else if(G.ph==='play'&&G.lh!==i){const pt=predict(i);if(pt.out)pt.x=200,pt.y=pt.by=home; /* bola vai fora: deixa passar */
    tx=pt.x+G.be;
    /* fica atrás do ponto de quique (senão bate antes de quicar = voleio) */
    ty=i?Math.min(pt.y-22,pt.by-52):Math.max(pt.y+22,pt.by+52);}
  ty=i?cl(ty,30,310):cl(ty,410,690);tx=cl(tx,25,375);
  q.x+=cl(tx-q.x,-sp,sp);q.y+=cl(ty-q.y,-sp,sp);
  if(G.ph==='serve'&&G.sv===i)clampServer();
}
function req(i){
  if(!G||G.ph!=='serve'||G.sv!==i)return;
  if(mode==='guest'){if(conn&&conn.open)conn.send({t:'sv'});}
  else if(G.t<=0)doServe();
}
function step(dt){
  const {b,p,cd}=G;
  p.forEach(q=>{q.vx=(q.x-(q.ox??q.x))/dt;q.vy=(q.y-(q.oy??q.y))/dt;q.ox=q.x;q.oy=q.y;q.ax=(q.ax||0)*.5+q.vx*.5;q.ay=(q.ay||0)*.5+q.vy*.5;});
  if(mode==='bot')bot(1,dt);
  if(G.ph==='serve'){
    const s=G.sv,q=p[s];
    b.x=q.x;b.y=s===0?q.y-SO:q.y+SO;b.z=SZ;b.vx=b.vy=b.vz=0;
    if(G.t>0)G.t-=dt;
    if(mode==='bot'&&s===1&&G.t<=0)doServe();
  }else if(G.ph==='play'){
    const oy=b.y,oz=b.z;
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt-.5*GR*dt*dt;b.vz-=GR*dt;
    if((oy-NY)*(b.y-NY)<0&&b.x>TX-8&&b.x<TX+TW+8){
      const zc=oz+(b.z-oz)*(NY-oy)/(b.y-oy);
      if(zc<NETH){if(G.st>0)letServe();else point(1-G.lh,'REDE!');return;}
    }
    if(b.z<=0&&b.vz<0){
      b.z=0;ground();if(G.ph!=='play')return;
      b.vz=-b.vz*E;boom(b.x,b.y,'rgba(255,255,255,.8)',4);
    }
    p.forEach((q,i)=>{
      cd[i]-=dt;
      if(G.ph!=='play'||cd[i]>0||i===G.lh||b.z>45)return;
      if(Math.hypot(b.x-q.x,b.y-q.y)<R+BR){
        if(G.bs[i]<1){point(1-i,'VOLEIO!');return;} /* bateu antes de quicar no seu lado */
        hit(i);
      }
    });
  }
  sendT+=dt;
  if(mode==='host'&&conn&&conn.open&&sendT>=1){
    sendT=0;
    if(!conn.dataChannel||conn.dataChannel.bufferedAmount<8192)
      conn.send({t:'s',b:[b.x,b.y,b.z],a:[p[0].x,p[0].y],c:[p[1].x,p[1].y],s:G.s,sv:G.sv,ph:G.ph,h:G.h,w:G.w,mc:G.mc,mg:G.msg});
  }
}
function guestSync(dt){
  const T=G.T;if(T){
    const k=1-Math.pow(.55,dt),b=G.b,p=G.p[0],kb=Math.hypot(T.b[0]-b.x,T.b[1]-b.y)>120?1:k;
    b.x+=(T.b[0]-b.x)*kb;b.y+=(T.b[1]-b.y)*kb;b.z+=(T.b[2]-b.z)*kb;p.x+=(T.a[0]-p.x)*k;p.y+=(T.a[1]-p.y)*k;
  }
  if(G.ph==='serve'&&G.sv===me&&G.p[1].y>250)move(1,G.p[1].x,G.p[1].y);
  if(conn&&conn.open&&pend){conn.send({t:'m',x:pend[0],y:pend[1]});pend=null;}
}
const K={};onkeydown=e=>{
  const k=e.key.toLowerCase();K[k]=1;
  if((k===' '||k==='enter')&&G&&mode&&$('#game').classList.contains('on')){e.preventDefault();req(mode==='2p'?G.sv:me);}
};onkeyup=e=>K[e.key.toLowerCase()]=0;
function keys(dt){
  const f=mode==='guest'?-1:1,sp=7*dt*f;
  const mv=(i,l,r,u,d)=>{const dx=(K[r]?1:0)-(K[l]?1:0),dy=(K[d]?1:0)-(K[u]?1:0);if(dx||dy){const q=G.p[i];move(i,q.x+dx*sp,q.y+dy*sp);}};
  if(mode==='2p'){mv(0,'arrowleft','arrowright','arrowup','arrowdown');mv(1,'a','d','w','s');}
  else{mv(me,'arrowleft','arrowright','arrowup','arrowdown');mv(me,'a','d','w','s');}
}
function loop(t){
  raf=requestAnimationFrame(loop);
  const dt=Math.min(2,(t-last)/16.67||1);last=t;
  keys(dt);if(G.mt>0)G.mt-=dt;
  if(mode==='guest')guestSync(dt);else step(dt);
  G.tr.push([G.b.x,G.b.y,G.b.z]);if(G.tr.length>10)G.tr.shift();
  P.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=.04*dt;});P=P.filter(p=>p.l>0);
  draw();
}

/* ---------- controles (mouse, toque e teclado) ---------- */
const ptr={};
const pos=e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;return mode==='guest'?[W-x,H-y]:[x,y];};
const who=y=>mode==='2p'?(y<360?1:0):me;
function move(i,x,y){
  const q=G.p[i],sv=G.ph==='serve'&&G.sv===i;
  q.x=cl(x,25,375);q.y=i===0?cl(y,sv?470:370,690):cl(y,30,sv?250:350);
  if(mode==='guest')pend=[q.x,q.y];
}
cv.onpointerdown=e=>{
  cv.setPointerCapture(e.pointerId);const [x,y]=pos(e);
  ptr[e.pointerId]={i:who(y),x,y,t:performance.now(),d:0};
  if(e.pointerType==='mouse'&&G&&mode)req(who(y));
};
cv.onpointermove=e=>{
  if(!G||!mode)return;const [x,y]=pos(e);
  if(e.pointerType==='mouse'){move(who(y),x,y);return;}
  const o=ptr[e.pointerId];if(!o)return;
  o.d+=Math.hypot(x-o.x,y-o.y);move(o.i,G.p[o.i].x+x-o.x,G.p[o.i].y+y-o.y);o.x=x;o.y=y;
};
cv.onpointerup=e=>{
  const o=ptr[e.pointerId];delete ptr[e.pointerId];
  if(o&&e.pointerType!=='mouse'&&G&&mode&&performance.now()-o.t<300&&o.d<12)req(o.i);
};
cv.onpointercancel=e=>delete ptr[e.pointerId];

/* ---------- desenho ---------- */
const glow=(c,b)=>{cx.shadowColor=c;cx.shadowBlur=b;};
function racket(q,col,dir){
  cx.save();cx.lineJoin='round';glow(col,14);cx.strokeStyle=col;cx.lineWidth=5;cx.fillStyle='#0a1230';
  cx.beginPath();cx.roundRect(q.x-7,dir>0?q.y+R-12:q.y-R-16,14,28,4);cx.fill();cx.stroke();
  cx.beginPath();cx.arc(q.x,q.y,R-4,0,7);cx.fill();cx.stroke();
  cx.shadowBlur=0;cx.lineWidth=2;cx.globalAlpha=.55;cx.beginPath();cx.arc(q.x,q.y,R-14,0,7);cx.stroke();
  cx.globalAlpha=1;cx.fillStyle=col;cx.beginPath();cx.arc(q.x,q.y,4,0,7);cx.fill();cx.restore();
}
function draw(){
  cx.setTransform(S,0,0,S,0,0);cx.clearRect(0,0,W,H);
  if(mode==='guest'){cx.translate(W,H);cx.rotate(Math.PI);}
  cx.fillStyle='#071433';cx.fillRect(TX,TY,TW,TH);
  cx.fillStyle='rgba(0,229,255,.07)';cx.fillRect(TX,TY,TW,TH/2);
  cx.fillStyle='rgba(255,45,117,.07)';cx.fillRect(TX,TY+TH/2,TW,TH/2);
  cx.strokeStyle='rgba(0,229,255,.12)';cx.lineWidth=1;cx.beginPath();
  for(let x=TX+30;x<TX+TW;x+=30){cx.moveTo(x,TY);cx.lineTo(x,TY+TH);}
  for(let y=TY+40;y<TY+TH;y+=40){cx.moveTo(TX,y);cx.lineTo(TX+TW,y);}cx.stroke();
  cx.setLineDash([10,8]);cx.strokeStyle='rgba(255,255,255,.3)';cx.lineWidth=2;cx.beginPath();cx.moveTo(200,TY);cx.lineTo(200,TY+TH);cx.stroke();cx.setLineDash([]);
  cx.save();glow(BLUE,16);cx.strokeStyle=BLUE;cx.lineWidth=4;cx.strokeRect(TX,TY,TW,TH);
  glow('#fff',10);cx.strokeStyle='#fff';cx.lineWidth=3;cx.beginPath();cx.moveTo(TX-8,360);cx.lineTo(TX+TW+8,360);cx.stroke();
  cx.lineWidth=2;cx.beginPath();cx.moveTo(TX-8,354);cx.lineTo(TX-8,366);cx.moveTo(TX+TW+8,354);cx.lineTo(TX+TW+8,366);cx.stroke();cx.restore();
  racket(G.p[1],BLUE,-1);racket(G.p[0],RED,1);
  const b=G.b,zz=b.z*.8,n=G.tr.length,sh=1-Math.min(b.z,90)/280;
  cx.save();cx.fillStyle='rgba(0,0,0,.5)';cx.beginPath();cx.ellipse(b.x,b.y,BR*sh,BR*.6*sh,0,0,7);cx.fill();cx.restore();
  G.tr.forEach((t,i)=>{cx.fillStyle=`rgba(255,225,77,${i/n*.5})`;cx.beginPath();cx.arc(t[0],t[1]-t[2]*.8,BR*i/n,0,7);cx.fill();});
  P.forEach(p=>{cx.globalAlpha=p.l;cx.fillStyle=p.c;cx.fillRect(p.x-2,p.y-2,4,4);});cx.globalAlpha=1;
  cx.save();glow('#ffe14d',20);cx.fillStyle='#fff';cx.beginPath();cx.arc(b.x,b.y-zz,BR*(1+b.z/260),0,7);cx.fill();cx.restore();
  cx.setTransform(S,0,0,S,0,0);cx.textAlign='center';
  if(G.ph==='serve'){
    const mine=mode==='2p'||G.sv===me,coarse=matchMedia('(pointer:coarse)').matches;
    const m=mine?(coarse?'TOQUE PARA SACAR':'CLIQUE PARA SACAR'):(mode==='bot'?'ROBÔ VAI SACAR':'ADVERSÁRIO VAI SACAR');
    cx.save();cx.font='900 20px Orbitron,system-ui,sans-serif';glow(mine?RED:BLUE,16);cx.fillStyle='#fff';cx.fillText(m,200,330);
    cx.font='700 12px Orbitron,system-ui,sans-serif';glow(BLUE,8);
    if(mode==='2p')cx.fillText((G.sv?'AZUL':'VERMELHO')+' SACA',200,308);
    else if(mine&&!coarse)cx.fillText('ou pressione ESPAÇO',200,308);
    cx.restore();
  }
  if(G.mt>0&&G.msg){cx.save();cx.font='900 26px Orbitron,system-ui,sans-serif';cx.globalAlpha=Math.min(1,G.mt/20);glow(RED,18);cx.fillStyle='#fff';cx.fillText(G.msg,200,270);cx.restore();}
}

/* ---------- local ---------- */
$('#l2').onclick=()=>start('2p');
$('#l1').onclick=()=>start('bot');

/* ---------- online (salas via PeerJS, funciona entre PC e celular) ---------- */
const CH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',say=t=>$('#msg').textContent=t;
const mkCode=()=>Array.from({length:4},()=>CH[Math.random()*CH.length|0]).join('');
function cleanup(){try{conn&&conn.close();peer&&peer.destroy();}catch(e){}conn=peer=null;}
function leave(){mode='';cancelAnimationFrame(raf);cleanup();show('menu');}
function wire(c){
  c.on('data',d=>{
    if(mode==='host'){
      if(d.t==='m')move(1,d.x,d.y);
      if(d.t==='sv')req(1);
      if(d.t==='rm'){newGame();c.send({t:'new'});}
    }else if(mode==='guest'){
      if(d.t==='new')newGame();
      if(d.t==='s'){
        G.T={b:d.b,a:d.a};G.s=d.s;G.sv=d.sv;G.ph=d.ph;
        if(d.h!==G.h){G.h=d.h;boom(d.b[0],d.b[1],d.w?BLUE:RED);}
        if(d.mc!==G.mc){G.mc=d.mc;G.msg=d.mg;G.mt=80;}
        upd();
      }
    }
  });
  c.on('close',()=>{if(mode==='host'||mode==='guest'){alert('O outro jogador saiu da sala.');leave();}else if(conn===c)conn=null;});
}
function host(code,n){
  cleanup();say('');peer=new Peer('rkclash-'+code,OPT);
  peer.on('open',()=>{$('#room').textContent=code;show('lobby');});
  peer.on('error',e=>{if(e.type==='unavailable-id'&&n<5)host(mkCode(),n+1);else say('Erro de conexão. Tente de novo.');});
  peer.on('connection',c=>{
    if(conn){c.close();return;}
    conn=c;wire(c);const go=()=>start('host');c.open?go():c.on('open',go);
  });
}
$('#mk').onclick=()=>host(mkCode(),0);
$('#lb').onclick=()=>{cleanup();show('online');};
$('#jn').onclick=()=>{
  const c=$('#code').value.trim().toUpperCase();
  if(c.length!==4)return say('Digite o código de 4 letras.');
  cleanup();say('Conectando...');peer=new Peer(OPT);
  peer.on('open',()=>{conn=peer.connect('rkclash-'+c);wire(conn);conn.on('open',()=>start('guest'));});
  peer.on('error',()=>say('Sala não encontrada.'));
  setTimeout(()=>{if(mode!=='guest'&&peer&&$('#online').classList.contains('on'))say('Não foi possível conectar. Confira o código e a internet.');},10000);
};

/* ---------- botões da partida ---------- */
$('#back').onclick=$('#exit').onclick=leave;
$('#again').onclick=()=>{
  if(mode==='guest')conn.send({t:'rm'});
  else{newGame();if(mode==='host')conn.send({t:'new'});}
};

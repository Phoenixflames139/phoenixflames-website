/* Phoenixflames 3D product concept. Original cosmetic meshes, not a scan or construction plan. */
(()=>{
'use strict';
const studio=document.querySelector('[data-staff-studio]');if(!studio)return;
const canvas=studio.querySelector('[data-staff-3d]'),fallback=studio.querySelector('svg.staff-model'),help=studio.querySelector('[data-staff-3d-help]');
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>mul(a,1/(Math.hypot(...a)||1));
const colors={metal:[.47,.49,.51],black:[.12,.13,.14],grey:[.33,.35,.36],brown:[.42,.25,.13],wick:[.82,.70,.42]};
const shapes={'two-beat-isis':[16.5,5.1],'three-beat-crown-sinnet':[18.3,5.9],'dna-rapture':[20.4,5.1],'monkey-fist':[12.6,6.3],'sushi-roll':[16.1,5.3]};
function build(v){
 const data=[],L=Number(v.length),r=Number(v.diameter)/20,[W,baseR]=shapes[v.wick],R=baseR*Number(v.diameter)/25,cloth=colors.wick;
 const put=(p,n,u,w,c,m)=>data.push(...p,...n,u,w,...c,m);
 const sample=(n,fn)=>Array.from({length:n+1},(_,i)=>fn(i/n));
 function tube(path,rad,c,m,segments=12){
  const rings=[];let distance=0;
  for(let i=0;i<path.length;i++){
   if(i)distance+=Math.hypot(...sub(path[i],path[i-1]));
   const t=norm(sub(path[Math.min(i+1,path.length-1)],path[Math.max(0,i-1)]));
   const e=norm(cross(t,Math.abs(t[0])<.9?[1,0,0]:[0,1,0])),f=norm(cross(t,e));
   const radius=typeof rad==='function'?rad(i/(path.length-1)):rad,ring=[];
   for(let j=0;j<=segments;j++){const a=j/segments*TAU,n=add(mul(e,Math.cos(a)),mul(f,Math.sin(a)));ring.push([add(path[i],mul(n,radius)),n,distance,a*radius,c,m]);}
   rings.push(ring);
  }
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){
   const a=rings[i][j],b=rings[i+1][j],d=rings[i][j+1],e=rings[i+1][j+1];
   [a,b,d,b,e,d].forEach(x=>put(...x));
  }
  for(const i of [0,rings.length-1]){
   const n=mul(norm(sub(path[Math.min(i+1,path.length-1)],path[Math.max(0,i-1)])),i===0?-1:1);
   for(let j=0;j<segments;j++){put(path[i],n,0,0,c,m);for(const q of [rings[i][j][0],rings[i][j+1][0]])put(q,n,q[1],q[2],c,m);}
  }
 }
 const cylinder=(a,b,radius,c,m)=>tube([[a,0,0],[b,0,0]],radius,c,m,40);
 cylinder(-L/2,L/2,r,colors.metal,0);
 cylinder(-L*.24,L*.24,r+.38,colors[v.grip]||colors.black,2);
 for(const side of [-1,1]){
  const x=side*(L/2-W/2),local=(u,y,z)=>[x+side*u,y,z],kind=v.wick;
  if(kind==='sushi-roll'){
   const points=[[-W/2+.05,R*.85],[-W/2+.35,R*.96],[-W/2+.8,R],[W/2-.8,R],[W/2-.35,R*.96],[W/2-.05,R*.85]];
   tube(points.map(p=>local(p[0],0,0)),t=>points[Math.round(t*(points.length-1))][1],cloth,1,48);
   for(const end of [-1,1])for(let q=1;q<=4;q++){
    const rr=r+(R-r)*q/5;
    tube(sample(48,t=>local(end*(W/2-.03),rr*Math.cos(t*TAU),rr*Math.sin(t*TAU))),.095,cloth.map(v=>v*.82),1,6);
   }
  }else if(kind==='monkey-fist'){
   tube(sample(28,t=>local(-W/2+.14+(W-.28)*t,0,0)),t=>Math.max(.18,R*.76*Math.sin(Math.PI*t)**.65),cloth.map(v=>v*.85),1,28);
   for(let axis=0;axis<3;axis++)for(let j=-1;j<=1;j++){
    const offset=j*R*.32,rr=R*.78*Math.sqrt(1-(offset/R)**2);
    tube(sample(64,t=>{const a=t*TAU,lift=1+.09*Math.sin(4*a+axis*1.7+j*.5);
     const p=[offset,rr*lift*Math.cos(a),rr*lift*Math.sin(a)],q=axis===0?p:axis===1?[p[1],p[0],p[2]]:[p[1],p[2],p[0]];
     return local(q[0]*W/(R*2),q[1],q[2]);}),R*.165,cloth,1,12);
   }
  }else{
   const n=kind==='three-beat-crown-sinnet'?3:2,turns=kind==='dna-rapture'?2.15:kind==='three-beat-crown-sinnet'?1.65:1.55,thick=R*(n===3?.29:.34),mid=R-thick;
   tube([local(-W/2+thick,0,0),local(W/2-thick,0,0)],R*.56,cloth.map(v=>v*.78),1,24);
   for(const hand of [-1,1])for(let j=0;j<n;j++){
    const phase=j*TAU/n+(hand===1?Math.PI/n:0);
    tube(sample(80,t=>{const a=hand*turns*t*TAU+phase,interlace=Math.cos(n*(2*hand*turns*t*TAU+phase)+(hand===1?0:Math.PI)),rr=(mid+thick*.28*interlace)*(.82+.18*Math.sin(Math.PI*t));return local(-W/2+thick+(W-2*thick)*t,rr*Math.cos(a),rr*Math.sin(a));}),thick,cloth.map(v=>v*(hand===1?1:.94)),1,12);
   }
  }
 }
 return {vertices:new Float32Array(data),L,W,R};
}
let gl,program,buffer,locations;
const vs='precision mediump float; attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV; attribute vec3 aColor; attribute float aMaterial; uniform vec3 uTarget,uRight,uUp,uForward; uniform vec2 uScale; varying vec3 vNormal,vColor; varying vec2 vUV; varying float vMaterial; void main(){vec3 p=aPosition-uTarget;gl_Position=vec4(dot(p,uRight)*uScale.x,dot(p,uUp)*uScale.y,-dot(p,uForward)/240.0,1.0);vNormal=vec3(dot(aNormal,uRight),dot(aNormal,uUp),dot(aNormal,uForward));vUV=aUV;vColor=aColor;vMaterial=aMaterial;}';
const fs='precision mediump float; varying vec3 vNormal,vColor; varying vec2 vUV; varying float vMaterial; void main(){vec3 n=normalize(vNormal);float diffuse=max(0.0,dot(n,normalize(vec3(-.35,.8,.65))));float rim=pow(1.0-max(0.0,n.z),2.0)*.10;float grain=1.0;float shine=0.0;if(vMaterial>.5&&vMaterial<1.5){float warp=sin(vUV.x*39.0+sin(vUV.y*43.0)*.7);float weft=sin(vUV.y*43.0);grain=.92+.075*warp+.055*weft+.045*warp*weft;}else if(vMaterial>1.5){grain=.93+.06*sin(vUV.x*12.0+vUV.y*18.0);shine=.055*pow(max(0.0,dot(n,normalize(vec3(-.18,.4,1.0)))),20.0);}else{shine=.52*pow(max(0.0,dot(n,normalize(vec3(-.18,.4,1.0)))),28.0);grain=.97+.025*sin(vUV.y*58.0);}gl_FragColor=vec4(clamp(vColor*(.40+.68*diffuse+rim)*grain+vec3(shine),0.0,1.0),1.0);}';
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function init(){
 gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)throw Error('WebGL unavailable');
 program=gl.createProgram();const a=shader(gl.VERTEX_SHADER,vs),b=shader(gl.FRAGMENT_SHADER,fs);
 gl.attachShader(program,a);gl.attachShader(program,b);gl.linkProgram(program);gl.deleteShader(a);gl.deleteShader(b);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 let offset=0;for(const [name,n] of [['aPosition',3],['aNormal',3],['aUV',2],['aColor',3],['aMaterial',1]]){const loc=gl.getAttribLocation(program,name);if(loc<0)throw Error(name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,48,offset*4);offset+=n;}
 locations=Object.fromEntries(['uTarget','uRight','uUp','uForward','uScale'].map(n=>[n,gl.getUniformLocation(program,n)]));
 gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
}
let model,signature='',view='full',yaw=.16,pitch=.19,zoom=1,center=0,span=175,animation=0,ready=false;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const values=()=>Object.fromEntries(['length','diameter','grip','wick'].map(k=>[k,studio.querySelector('[data-staff-option="'+k+'"]').value]));
function draw(){
 if(!ready||!model)return;const box=canvas.getBoundingClientRect();if(!box.width||!box.height)return;
 const ratio=Math.min(window.devicePixelRatio||1,2),w=Math.round(box.width*ratio),h=Math.round(box.height*ratio);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const forward=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],right=norm(cross([0,1,0],forward)),up=norm(cross(forward,right)),scale=2*zoom/span;
 gl.uniform3f(locations.uTarget,center,0,0);gl.uniform3fv(locations.uRight,right);gl.uniform3fv(locations.uUp,up);gl.uniform3fv(locations.uForward,forward);gl.uniform2f(locations.uScale,scale,scale*w/h);
 gl.drawArrays(gl.TRIANGLES,0,model.vertices.length/12);
}
function focus(next,instant=false){
 view=next;const aspect=Math.max(2,canvas.clientWidth/Math.max(1,canvas.clientHeight));
 const target=next==='wick'?[model.L/2-model.W/2,Math.max(model.W*1.65,model.R*2.7*aspect)]:next==='grip'?[0,model.L*.63]:next==='diameter'?[-model.L*.34,Math.max(25,aspect*8)]:[0,model.L*1.13];
 const from=[center,span,yaw,pitch,zoom],to=[target[0],target[1],next==='wick'?.38:.13,.19,1];cancelAnimationFrame(animation);
 const apply=p=>{[center,span,yaw,pitch,zoom]=from.map((v,i)=>v+(to[i]-v)*p);draw();};
 if(instant||reduced){apply(1);return;}let start;const step=now=>{if(start===undefined)start=now;const t=Math.min(1,(now-start)/350);apply(1-(1-t)**3);if(t<1)animation=requestAnimationFrame(step);};animation=requestAnimationFrame(step);
}
function sync(next,instant=false){
 const v=values();if(!v.length||!v.diameter||!shapes[v.wick])return;
 const key=JSON.stringify(v),changed=key!==signature;
 if(changed){model=build(v);signature=key;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,model.vertices,gl.STATIC_DRAW);}
 focus(next,instant);
}
function fail(){ready=false;cancelAnimationFrame(animation);canvas.hidden=true;help.hidden=true;fallback.hidden=false;}
try{init();canvas.hidden=false;fallback.hidden=true;help.hidden=false;ready=true;sync('full',true);}catch(e){console.warn('Contact Staff 3D fallback:',e);fail();return;}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail();});
studio.addEventListener('staff:view',e=>{if(ready)try{sync(e.detail.view,e.detail.instant);}catch(error){console.warn('Staff 3D:',error);fail();}});
const pointers=new Map();
canvas.addEventListener('pointerdown',e=>{cancelAnimationFrame(animation);canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);});
canvas.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId),next=[e.clientX,e.clientY];
 if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)[1],a=Math.hypot(...sub(old,other)),b=Math.hypot(...sub(next,other));if(a>3)zoom=clamp(zoom*b/a,.6,3);}
 else{yaw+=(next[0]-old[0])*.009;pitch=clamp(pitch+(next[1]-old[1])*.009,-1.45,1.45);}pointers.set(e.pointerId,next);draw();
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>pointers.delete(e.pointerId));
canvas.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();cancelAnimationFrame(animation);zoom=clamp(zoom*Math.exp(-e.deltaY*.003),.6,3);draw();},{passive:false});
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;e.preventDefault();cancelAnimationFrame(animation);if(e.key==='Home'){focus(view);return;}if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=clamp(pitch+.15,-1.45,1.45);if(e.key==='ArrowDown')pitch=clamp(pitch-.15,-1.45,1.45);if(e.key==='+'||e.key==='=')zoom=clamp(zoom*1.15,.6,3);if(e.key==='-')zoom=clamp(zoom/1.15,.6,3);draw();});
studio.querySelectorAll('[data-3d-zoom]').forEach(b=>b.addEventListener('click',()=>{cancelAnimationFrame(animation);zoom=clamp(zoom*Number(b.getAttribute('data-3d-zoom')),.6,3);draw();}));
if(typeof ResizeObserver!=='undefined')new ResizeObserver(draw).observe(canvas);else window.addEventListener('resize',draw);
})();

/* Phoenixflames – Contact Staff visual configurator.
   Draft catalogue only. Replace example entries with approved product data.
   Price fields remain null until real prices are supplied. */
(() => {
  'use strict';
  const de = document.documentElement.lang === 'de';
  const T = (g,e) => de ? g : e;
  const catalogue = {
    basePrice: null,
    standard: { length: '150', diameter: '25', grip: 'black', wick: 'sushi-roll' },
    options: {
      length: ['140','150','160','170','180'].map(value => ({value, label:value+' cm', surcharge:null})),
      diameter: ['22','25','28'].map(value => ({value, label:value+' mm', surcharge:null})),
      grip: [
        {value:'black',label:T('Schwarz','Black'),color:'#252729',highlight:'#777a7b',surcharge:null},
        {value:'grey',label:T('Anthrazit','Charcoal'),color:'#53575a',highlight:'#979b9e',surcharge:null},
        {value:'brown',label:T('Braun','Brown'),color:'#765039',highlight:'#c49768',surcharge:null}
      ],
      wick: [
        {value:'two-beat-isis',label:'Two Beat Isis',visualWidth:76,visualHeight:48,surcharge:null},
        {value:'three-beat-crown-sinnet',label:'Three Beat Crown Sinnet',visualWidth:84,visualHeight:56,surcharge:null},
        {value:'dna-rapture',label:'DNA Rapture',visualWidth:94,visualHeight:48,surcharge:null},
        {value:'monkey-fist',label:'Monkey Fist',visualWidth:58,visualHeight:58,surcharge:null},
        {value:'sushi-roll',label:'Sushi Roll',visualWidth:74,visualHeight:49,surcharge:null}
      ]
    }
  };
  const keys = Object.keys(catalogue.standard);
  const option = (key,value) => catalogue.options[key].find(o => o.value === value);
  const label = {length:T('Stablänge','Staff length'),diameter:T('Durchmesser','Diameter'),grip:'Grip',wick:'Wick'};
  const validConfig = values => keys.every(k => !!option(k,values[k]));
  const isStandard = values => keys.every(k => values[k] === catalogue.standard[k]);
  function priceFor(values){
    const costs=keys.map(k=>option(k,values[k]).surcharge);
    if (!Number.isFinite(catalogue.basePrice) || costs.some(n=>!Number.isFinite(n))) return null;
    return catalogue.basePrice + costs.reduce((a,b)=>a+b,0);
  }
  function inquiryText(values){
    return [
      T('Unverbindliche Anfrage – Contact Staff (Konfigurationsentwurf)','Non-binding inquiry – Contact Staff (configuration concept)'),
      T('Modell: ','Model: ') + (isStandard(values)?T('Standardentwurf','Standard concept'):'Custom Build'),
      ...keys.map(k=>label[k]+': '+option(k,values[k]).label),
      '',
      T('Bitte bestätigt mir Machbarkeit, finale Spezifikationen und Preis.','Please confirm feasibility, final specifications and price.')
    ].join('\n');
  }
  // Existing booking form: carry only known configuration values into the
  // editable message. Never submit automatically.
  const booking = document.querySelector('.booking-form');
  if (booking) {
    const params=new URLSearchParams(location.search);
    if(params.get('tool')!=='contact-staff')return;
    const values=Object.fromEntries(keys.map(k=>[k,params.get(k)]));
    if(!validConfig(values))return;
    const type=booking.querySelector('#request-type'), message=booking.querySelector('#message');
    if(type)type.value='Fire Tool';
    if(message&&!message.value)message.value=inquiryText(values);
    return;
  }
  const studio=document.querySelector('[data-staff-studio]');
  if(!studio)return;
  const svg=studio.querySelector('.staff-model');
  const controls=Object.fromEntries(keys.map(k=>[k,studio.querySelector('[data-staff-option="'+k+'"]')]));
  const el=id=>studio.querySelector('[data-part="'+id+'"]');
  const request=studio.querySelector('.staff-request');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let values={...catalogue.standard}, view='full', camera=[0,0,900,300], frame=0, geometry;
  for(const key of keys){
    for(const entry of catalogue.options[key]){
      const opt=document.createElement('option');
      opt.value=entry.value;opt.textContent=entry.label;
      controls[key].appendChild(opt);
    }
    controls[key].value=values[key];
  }
  function attrs(node, object){for(const [k,v] of Object.entries(object))node.setAttribute(k,String(v));}
  // Original, illustrative SVG product assets; exact handmade knot geometry is not implied.
  const wickAsset = kind => '/assets/wicks/'+kind+'.svg?v=1';
  function wickArt(kind){
    return '<image href="'+wickAsset(kind)+'" width="100" height="60" preserveAspectRatio="none"/>';
  }
  // Preload all variants so changing models does not flash a blank wick.
  for(const entry of catalogue.options.wick){const img=new Image();img.src=wickAsset(entry.value);}
  function renderModel(){
    const length=Number(values.length), diameter=Number(values.diameter);
    const grip=option('grip',values.grip),wick=option('wick',values.wick);
    const width=690*length/150, x1=450-width/2, x2=450+width/2;
    const shaft=14*diameter/25, gripHeight=shaft+7, gripWidth=width*.48;
    const gw=wick.visualWidth,gh=wick.visualHeight*diameter/25;
    geometry={x1,x2,width,gw,gh,gripWidth};
    attrs(el('shaft'),{x:x1,y:150-shaft/2,width,height:shaft,rx:shaft/2});
    attrs(el('grip'),{x:450-gripWidth/2,y:150-gripHeight/2,width:gripWidth,height:gripHeight,rx:gripHeight/2});
    attrs(el('gripTexture'),{x:450-gripWidth/2,y:150-gripHeight/2,width:gripWidth,height:gripHeight,rx:gripHeight/2});
    attrs(el('gripColor'),{'stop-color':grip.highlight});attrs(el('gripDark'),{'stop-color':grip.color});
    for(const side of ['left','right']){
      const x=side==='left'?x1:x2-gw;
      const group=el(side+'wick');
      const sx=gw/100,sy=gh/60;
      attrs(group,{transform:side==='left'?'translate('+x+' '+(150-gh/2)+') scale('+sx+' '+sy+')':'translate('+(x+gw)+' '+(150-gh/2)+') scale('+(-sx)+' '+sy+')'});
      group.innerHTML=wickArt(wick.value);
    }
    // The full model remains scaled consistently; detail views are camera zooms.
    el('dimension').textContent=length+' cm';
    attrs(el('measure'),{x1,y1:224,x2,y2:224});
    attrs(el('tickL'),{x1,y1:217,x2:x1,y2:231});
    attrs(el('tickR'),{x1:x2,y1:217,x2,y2:231});
  }
  function targetCamera(){
    if(view==='grip'){const w=Math.max(300,geometry.gripWidth+85);return [450-w/2,150-w/6,w,w/3];}
    if(view==='wick'){const w=Math.max(200,geometry.gh*3.5,geometry.gw+65);const cx=geometry.x2-geometry.gw/2;return [cx-w/2,150-w/6,w,w/3];}
    if(view==='diameter'){const w=240;const cx=geometry.x1+geometry.width*.15;return [cx-w/2,150-w/6,w,w/3];}
    const w=Math.max(900,geometry.width+110);return [450-w/2,150-w/6,w,w/3];
  }
  function setView(next,instant=false){
    view=next;
    studio.dispatchEvent(new CustomEvent('staff:view',{detail:{view,instant}}));
    const names={full:T('Gesamtansicht','Full view'),grip:T('Grip im Fokus','Grip detail'),wick:T('Wick im Fokus','Wick detail'),diameter:T('Durchmesser im Fokus','Diameter detail')};
    studio.querySelector('[data-view-label]').textContent=names[view];
    studio.querySelectorAll('[data-staff-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.staffView===view)));
    const from=camera.slice(),to=targetCamera();
    cancelAnimationFrame(frame);
    const apply=arr=>{camera=arr;svg.setAttribute('viewBox',arr.join(' '));};
    if(reduced||instant){apply(to);return;}
    let start=null;
    const animate=now=>{if(start===null)start=now;const p=Math.min(1,(now-start)/320),q=1-Math.pow(1-p,3);apply(from.map((v,i)=>v+(to[i]-v)*q));if(p<1)frame=requestAnimationFrame(animate);};
    frame=requestAnimationFrame(animate);
  }
  function update(instant=false){
    renderModel();
    setView(view,instant);
    const standard=isStandard(values);
    studio.querySelector('[data-model-label]').textContent=standard?T('Standardentwurf','Standard concept'):'Custom Build';
    keys.forEach(k=>studio.querySelector('[data-summary="'+k+'"]').textContent=option(k,values[k]).label);
    const price=priceFor(values);
    studio.querySelector('[data-price]').textContent=price===null?T('Auf Anfrage','On request'):new Intl.NumberFormat(de?'de-DE':'en-IE',{style:'currency',currency:'EUR'}).format(price);
    const params=new URLSearchParams({tool:'contact-staff',...values});
    request.href=(de?'/booking.html':'/en/booking.html')+'?'+params.toString()+'#message';
    request.removeAttribute('aria-disabled');
  }
  for(const key of keys){
    const target=key==='length'?'full':key;
    controls[key].addEventListener('focus',()=>setView(target));
    controls[key].addEventListener('pointerdown',()=>setView(target));
    controls[key].addEventListener('change',()=>{if(!option(key,controls[key].value))return;values[key]=controls[key].value;view=target;update();});
  }
  studio.querySelectorAll('[data-staff-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.staffView)));
  studio.querySelector('.staff-reset').addEventListener('click',()=>{values={...catalogue.standard};keys.forEach(k=>controls[k].value=values[k]);view='full';update();});
  update(true);
})();

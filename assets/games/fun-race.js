(function(){
'use strict';
const $=id=>document.getElementById(id),R=window.FunRaceRules,T=window.THREE;
const fail=message=>{$('error').hidden=false;$('error-message').textContent=message;};
if(!R||!T){fail('No se han podido cargar los archivos del juego. Vuelve al inicio y abre la carrera de nuevo.');return;}
const canvas=$('game');let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});}
catch(error){fail('No se ha podido iniciar el motor 3D. Este juego necesita WebGL 2: prueba a activar la aceleración gráfica o a abrirlo en otro navegador.');return;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),scene=new T.Scene();
scene.background=new T.Color(0xa5dff5);scene.fog=new T.Fog(0xa5dff5,48,125);
const camera=new T.PerspectiveCamera(54,1,.1,180);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
scene.add(new T.HemisphereLight(0xffffff,0x6d9c8c,2.5));
const sun=new T.DirectionalLight(0xffefd5,2.6);sun.position.set(-12,24,-9);scene.add(sun);
const geometries={box:new T.BoxGeometry(2,2,2),sphere:new T.SphereGeometry(1,12,8),cylinder:new T.CylinderGeometry(1,1,1,10),disc:new T.CircleGeometry(1,20)};
const colors={track:0xf7fafb,edge:0x3aaccd,grass:0x6ab7a0,blue:0x259bc9,yellow:0xffd15d,danger:0xf75883,dark:0x244765,white:0xffffff,skin:0xffcc9f,you:0x138fe2,coral:0xf77769,violet:0x9c6ee6};
const materials=Object.fromEntries(Object.entries(colors).map(([name,color])=>[name,new T.MeshStandardMaterial({color,roughness:.8})]));
materials.shadow=new T.MeshBasicMaterial({color:0x315c70,transparent:true,opacity:.19,depthWrite:false});
function shape(parent,type,color,x,y,z,sx,sy,sz){const m=new T.Mesh(geometries[type],materials[color]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
function box(parent,color,x,y,z,hx,hy,hz){return shape(parent,'box',color,x,y,z,hx,hy,hz);}
let stage=null,obstacleViews=[],runnerViews=[],race=R.createRace(),paused=false,contextLost=false;
const keys=new Set(),runPointers=new Set(),steerPointers=new Map();let canvasPointer=null,pointerX=0,desiredX=null;
let records={unlocked:1,best:{}},storageAvailable=true;
try{const data=JSON.parse(localStorage.getItem('invernot_fun_race_v1'));if(data&&Number.isInteger(data.unlocked)&&data.unlocked>=1&&data.unlocked<=999){records.unlocked=data.unlocked;if(data.best&&typeof data.best==='object')for(const [level,time] of Object.entries(data.best))if(Number.isFinite(time)&&time>0)records.best[level]=time;}}
catch(error){storageAvailable=false;}
function save(){try{localStorage.setItem('invernot_fun_race_v1',JSON.stringify(records));}catch(error){storageAvailable=false;}}
const format=seconds=>{const tenths=Math.floor(Math.max(0,seconds)*10);return `${Math.floor(tenths/600)}:${String(Math.floor(tenths/10)%60).padStart(2,'0')}.${tenths%10}`;};
function clearInput(){keys.clear();runPointers.clear();steerPointers.clear();canvasPointer=null;desiredX=null;document.querySelectorAll('[data-hold]').forEach(b=>b.setAttribute('aria-pressed','false'));}
function runningInput(){return keys.has('Space')||keys.has('ArrowUp')||keys.has('KeyW')||runPointers.size>0||canvasPointer!==null;}
function input(dt){
 let steer=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
 for(const value of steerPointers.values())steer+=value;
 if(!steer&&desiredX!==null)steer=clamp((desiredX-race.runners[0].x)/(4*dt),-1,1);
 return {run:runningInput(),steer:clamp(steer,-1,1)};
}
function buildCourse(){
 if(stage)scene.remove(stage);stage=new T.Group();scene.add(stage);obstacleViews=[];runnerViews=[];
 const length=race.track.length;
 box(stage,'grass',0,-.68,length/2,90,.42,length/2+50);
 box(stage,'track',0,-.21,length/2,3.12,.21,length/2+5);
 for(const x of [-3.23,3.23])box(stage,'edge',x,.10,length/2,.11,.16,length/2+5);
 for(let z=0;z<length;z+=5)for(const x of [-1.04,1.04])box(stage,'edge',x,.008,z,.025,.008,.55);
 for(let z=5;z<length;z+=18)for(const x of [-8.5,8.5]){
  box(stage,'dark',x,.55,z,.18,.65,.18);shape(stage,'sphere','grass',x,2,z,1.2,1.45,1.2);
 }
 for(const o of race.track.obstacles){
  const group=new T.Group();stage.add(group);
  const views=R.hazards(o,0).map(h=>shape(group,h.shape,'danger',0,0,0,1,1,1));
  // Todo lo rosa colisiona; los soportes azules quedan fuera del recorrido.
  for(const side of [-1,1])box(group,'blue',side*3.2,1.8,o.z,.13,1.8,.21);
  box(group,'yellow',0,3.65,o.z,3.3,.12,.22);
  if(o.type==='wheel'){
   shape(group,'sphere','yellow',0,2.8,o.z,.24,.24,.24);
   for(let i=0;i<24;i++){const angle=i*Math.PI/12;shape(group,'sphere','blue',Math.sin(angle)*2,2.8+Math.cos(angle)*2,o.z+.03,.055,.055,.055);}
  }
  let rod=null;if(o.type==='hammer')rod=shape(group,'cylinder','dark',0,0,0,.07,1,.07);
  const checkpoint=box(group,'edge',0,.015,o.z+2.5,3,.015,.09);
  obstacleViews.push({o,views,rod,checkpoint});
 }
 for(let i=0;i<10;i++)box(stage,i%2?'dark':'white',-2.7+i*.6,.025,length,.3,.025,.6);
 for(const x of [-3.2,3.2])box(stage,'blue',x,1.8,length,.16,1.8,.2);
 box(stage,'yellow',0,3.5,length,3.35,.2,.25);
 for(const actor of race.runners){
  const group=new T.Group();stage.add(group);
  shape(group,'sphere',actor.id,0,.92,0,.32,.43,.28);
  shape(group,'sphere','skin',0,1.43,0,.25,.27,.25);
  box(group,'dark',0,1.68,0,.26,.07,.25);box(group,actor.id,0,1.64,.24,.27,.035,.15);
  for(const x of [-.09,.09])shape(group,'sphere','dark',x,1.48,.232,.035,.04,.02);
  const legs=[],arms=[];
  for(const side of [-1,1]){
   const leg=new T.Group();leg.position.set(side*.15,.59,0);group.add(leg);box(leg,'dark',0,-.28,0,.11,.28,.13);legs.push(leg);
   const arm=new T.Group();arm.position.set(side*.39,1.15,0);group.add(arm);box(arm,actor.id,0,-.2,0,.085,.23,.09);arms.push(arm);
  }
  const shadow=shape(stage,'disc','shadow',0,.015,0,.45,.37,1);shadow.rotation.x=-Math.PI/2;
  runnerViews.push({group,legs,arms,shadow,actor});
 }
 camera.position.set(0,7.2,-12);camera.lookAt(0,.9,10);updateScene(0,true);
}
function updateScene(dt,snap=false){
 for(const {o,views,rod,checkpoint} of obstacleViews){
  const bodies=R.hazards(o,race.time);
  bodies.forEach((h,i)=>{const mesh=views[i];mesh.position.set(h.x,h.y,h.z);mesh.rotation.y=h.yaw||0;if(h.shape==='box')mesh.scale.set(h.hx,h.hy,h.hz);else mesh.scale.setScalar(h.r);});
  if(rod){const h=bodies[0],from=new T.Vector3(0,3.65,o.z),to=new T.Vector3(h.x,h.y,h.z),direction=to.clone().sub(from);rod.position.copy(from.add(to).multiplyScalar(.5));rod.scale.y=direction.length();rod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());}
  checkpoint.material=race.runners[0].checkpoint>=o.z+2.5?materials.you:materials.edge;
 }
 for(const v of runnerViews){
  const a=v.actor,run=race.phase==='racing'&&!paused&&a.stun<=0&&(a.id!=='you'||runningInput());
  const stride=run?Math.sin(race.time*15+a.z)*.6:0,bounce=run?Math.abs(Math.sin(race.time*15))*.055:0;
  v.group.position.set(a.x,bounce,a.z);v.group.rotation.z=a.stun>0?Math.sin(a.stun*24)*.2:0;
  v.group.visible=a.shield<=0||Math.floor(race.time*12)%2===0||a.stun>0;
  v.legs[0].rotation.x=stride;v.legs[1].rotation.x=-stride;v.arms[0].rotation.x=-stride*.7;v.arms[1].rotation.x=stride*.7;
  v.shadow.position.set(a.x,.015,a.z);
 }
 const player=race.runners[0],distance=innerWidth<650?13:11.5,desired=new T.Vector3(player.x*.25,7.4,player.z-distance);
 if(snap||Math.abs(camera.position.z-desired.z)>7)camera.position.copy(desired);else camera.position.lerp(desired,1-Math.exp(-dt*6));
 camera.lookAt(player.x*.18,.8,player.z+10);
}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
const overlay=$('overlay'),card=$('card');
function panel(html){clearInput();overlay.hidden=false;card.innerHTML=html+'<p class="menu-home"><a href="../index.html">Volver al menú de juegos</a></p>';const title=card.querySelector('h2');title.id='dialog-title';title.tabIndex=-1;title.focus({preventScroll:true});}
function intro(){
 $('pause').disabled=true;
 panel(`<p class="eyebrow">Reflejos · Ritmo · Obstáculos</p><h2>🏁 Fun Race 3D</h2><p>Eres el corredor azul. Supera ocho tipos de trampas y cruza la meta antes que tus dos rivales.</p><ul><li><strong>Mantén para correr; suelta para esperar.</strong></li><li>Esquiva con ← → / A D o los botones. También puedes mantener y arrastrar sobre la pista.</li><li>Todo lo rosa golpea. Cada obstáculo superado guarda un punto de control.</li></ul><p id="record">Nivel desbloqueado: ${records.unlocked}. ${records.best[records.unlocked]?`Mejor marca: ${format(records.best[records.unlocked])}.`:''}</p><div class="actions"><button id="start">Jugar · nivel ${records.unlocked}</button>${records.unlocked>1?'<button id="from-first" class="secondary">Desde el nivel 1</button>':''}</div>`);
 $('start').onclick=()=>begin(records.unlocked);if($('from-first'))$('from-first').onclick=()=>begin(1);
}
function begin(level){race=R.createRace(level);paused=false;clearInput();buildCourse();R.start(race);overlay.hidden=true;$('pause').disabled=false;accumulator=0;updateHud();canvas.focus({preventScroll:true});}
function pause(){
 if(paused||!['countdown','racing'].includes(race.phase)||contextLost)return;
 paused=true;clearInput();
 panel(`<p class="eyebrow">Nivel ${race.track.level}</p><h2>Carrera en pausa</h2><p>La carrera y los obstáculos están detenidos. Puedes continuar desde el mismo punto.</p><div class="actions"><button id="resume">Continuar</button><button id="retry" class="secondary">Reiniciar carrera</button></div>`);
 $('resume').onclick=resume;$('retry').onclick=()=>begin(race.track.level);
}
function resume(){if(!paused||contextLost)return;clearInput();paused=false;overlay.hidden=true;accumulator=0;canvas.focus({preventScroll:true});}
function end(){
 const won=race.phase==='won',player=race.runners[0],level=race.track.level,time=player.finishedAt??race.elapsed,previous=records.best[level];
 if(won){records.unlocked=Math.max(records.unlocked,Math.min(999,level+1));records.best[level]=Math.min(previous||Infinity,time);save();}
 $('pause').disabled=true;
 panel(`<p class="eyebrow">Nivel ${level} · ${won?'Meta alcanzada':'Carrera terminada'}</p><h2>${won?'🏆 ¡Primera posición!':'¡La próxima puede ser tuya!'}</h2><p>${won?'Has superado el circuito. El siguiente nivel cambia el orden y el ritmo de los obstáculos.':'Un rival ha llegado antes. Suelta para esperar el hueco y vuelve a intentarlo desde la salida.'}</p><div class="results"><div class="result"><strong>${format(time)}</strong>Tiempo</div><div class="result"><strong>${player.hits}</strong>Golpes</div><div class="result"><strong>${R.rank(race).findIndex(a=>a.id==='you')+1} / 3</strong>Posición</div></div>${won?`<p>${!previous||time<previous?'✨ Nueva mejor marca de este nivel.':`Mejor marca: ${format(records.best[level])}.`}</p>`:''}${!storageAvailable?'<p id="notice">El navegador no permite guardar la marca. Puedes seguir jugando en esta pestaña.</p>':''}<div class="actions">${won?'<button id="next">Siguiente nivel →</button>':''}<button id="retry" class="${won?'secondary':''}">${won?'Repetir circuito':'Reintentar'}</button></div>`);
 if($('next'))$('next').onclick=()=>begin(Math.min(999,level+1));$('retry').onclick=()=>begin(level);
}
let hudClock=0,lastCheckpoint=0;
function updateHud(){
 const p=race.runners[0],position=R.rank(race).findIndex(a=>a.id==='you')+1,progress=clamp(p.z/race.track.length*100,0,100);
 $('level').textContent=race.track.level;$('position').textContent=`${position} / 3`;$('time').textContent=format(race.elapsed);$('hits').textContent=p.hits;
 $('progress').style.width=progress+'%';$('bar').setAttribute('aria-valuenow',String(Math.round(progress)));
 const done=race.track.obstacles.filter(o=>p.checkpoint>=o.z+2.5).length;
 $('checkpoints').textContent=`Control ${done} / ${race.track.obstacles.length}`;
 const next=race.track.obstacles.find(o=>p.z<o.z+2);
 $('upcoming').textContent=next?`${R.INFO[next.type].name} · ${R.INFO[next.type].tip}`:'¡Últimos metros hasta la meta!';
 $('run-state').textContent=p.stun>0?'💥 Golpe: vuelves al último control.':race.phase==='countdown'?'Prepárate…':paused?'En pausa':runningInput()?'Corriendo · suelta para esperar':'Esperando · mantén para correr';
 if(done!==lastCheckpoint){lastCheckpoint=done;$('announcement').textContent=`Punto de control ${done} de ${race.track.obstacles.length}`;}
}
function acceptInput(){return !paused&&!contextLost&&overlay.hidden&&['countdown','racing'].includes(race.phase);}
canvas.addEventListener('pointerdown',event=>{if(!acceptInput()||canvasPointer!==null||event.button>0)return;event.preventDefault();canvasPointer=event.pointerId;pointerX=event.clientX;desiredX=race.runners[0].x;canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(event.pointerId!==canvasPointer||!acceptInput())return;desiredX=clamp(desiredX+(event.clientX-pointerX)*6/Math.min(innerWidth,650),-R.TRACK_LIMIT,R.TRACK_LIMIT);pointerX=event.clientX;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===canvasPointer){canvasPointer=null;desiredX=null;}});
document.querySelectorAll('[data-hold]').forEach(button=>{
 button.addEventListener('pointerdown',event=>{if(!acceptInput()||event.button>0)return;event.preventDefault();button.setPointerCapture(event.pointerId);button.setAttribute('aria-pressed','true');if(button.dataset.hold==='run')runPointers.add(event.pointerId);else steerPointers.set(event.pointerId,button.dataset.hold==='left'?-1:1);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,event=>{runPointers.delete(event.pointerId);steerPointers.delete(event.pointerId);button.setAttribute('aria-pressed','false');});
});
const gameKeys=['Space','ArrowUp','ArrowLeft','ArrowRight','KeyW','KeyA','KeyD'];
addEventListener('keydown',event=>{
 if(event.code==='Tab'&&!overlay.hidden&&$('error').hidden){
  const options=[...card.querySelectorAll('button:not(:disabled),a[href]')],index=options.indexOf(document.activeElement);
  if(options.length&&(index===-1||(!event.shiftKey&&index===options.length-1)||(event.shiftKey&&index===0))){event.preventDefault();options[event.shiftKey?options.length-1:0].focus();}return;
 }
 if(event.code==='Escape'||event.code==='KeyP'){if(!event.repeat){event.preventDefault();paused?resume():pause();}return;}
 // Las teclas activan botones con normalidad en los menús.
 if(gameKeys.includes(event.code)&&acceptInput()){event.preventDefault();keys.add(event.code);}
});
addEventListener('keyup',event=>keys.delete(event.code));
addEventListener('blur',()=>{clearInput();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});
document.addEventListener('contextmenu',event=>{if(event.target===canvas||event.target.closest('[data-hold]'))event.preventDefault();});
$('pause').onclick=()=>pause();
// Evitar que el teclado alcance controles situados detrás del menú.
function syncControls(){const enabled=acceptInput();document.querySelectorAll('[data-hold]').forEach(button=>button.disabled=!enabled);}
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();contextLost=true;fail('Se ha interrumpido el motor gráfico. Recarga la página para volver a la carrera; los niveles guardados se conservan.');});
let accumulator=0,previous=performance.now();const FIXED=1/120;
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.06);previous=now;
 if(!paused&&!contextLost&&['countdown','racing'].includes(race.phase)){
  accumulator=Math.min(accumulator+dt,.10);
  while(accumulator>=FIXED){R.step(race,FIXED,input(FIXED));accumulator-=FIXED;if(['won','lost'].includes(race.phase)){end();break;}}
 }else accumulator=0;
 const count=race.phase==='countdown'?String(Math.ceil(race.countdown)):race.phase==='racing'&&race.elapsed<.55?'¡YA!':'';
 $('countdown').textContent=count;$('countdown').hidden=!count||paused;
 hudClock+=dt;if(hudClock>.08){hudClock=0;updateHud();syncControls();}
 if(!contextLost){updateScene(dt);renderer.render(scene,camera);}
}
buildCourse();intro();updateHud();syncControls();requestAnimationFrame(frame);
})();

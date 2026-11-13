import {THREE,engine,box,ball,remove,stars,clamp} from './engine.js';
const kind=document.body.dataset.game;
if(kind==='spaceship')spaceship();
else if(kind==='tennis')tennis();
else if(kind==='snake')snake();
else if(kind==='escape')escape();

function spaceship(){
 const g=engine({title:'Aventura Espacial 3D',instructions:'Mueve la nave con ← → o A/D. Mantén Espacio o Disparar para destruir los asteroides antes de que lleguen a tu base. En móvil usa los botones o arrastra la nave.',width:20,depth:30});stars(g.scene);
 const ship=new THREE.Group();g.scene.add(ship);box(ship,1,.45,2.3,0x56e8ff);box(ship,2.8,.2,.8,0x367cae,0,-.1,.5);ball(ship,.42,0xe3faff,0,.35,-.2);const flame=ball(ship,.35,0xffb34e,0,0,1.35);ship.position.z=11;
 box(g.scene,20,.15,.25,0x488ac4,0,0,13);
 let rocks=[],shots=[],score=0,spawn=0,cooldown=0;
 function reset(){for(const m of [...rocks,...shots])remove(g.scene,m);rocks=[];shots=[];score=0;spawn=.8;cooldown=0;ship.position.x=0;g.stats.textContent='Puntos: 0 · Nivel: 1';}
 let drag=null;g.canvas.onpointerdown=e=>{if(g.active){drag=e.pointerId;g.canvas.setPointerCapture(e.pointerId);move(e);}};g.canvas.onpointermove=e=>{if(drag===e.pointerId)move(e);};for(const ev of ['pointerup','pointercancel','lostpointercapture'])g.canvas.addEventListener(ev,()=>drag=null);function move(e){const p=g.pointer(e);if(p)ship.position.x=clamp(p.x,-9,9);}
 g.setup(reset,dt=>{const level=1+Math.floor(score/50);ship.position.x=clamp(ship.position.x+((g.keys.has('ArrowRight')?1:0)-(g.keys.has('ArrowLeft')?1:0))*13*dt,-9,9);flame.scale.setScalar(.8+Math.random()*.4);cooldown-=dt;spawn-=dt;
  if(g.keys.has('Space')&&cooldown<=0){shots.push(box(g.scene,.16,.16,1,0xffeb73,ship.position.x,0,9.7));cooldown=.22;}
  if(spawn<=0){const r=ball(g.scene,.65+Math.random()*.3,0x9e8c83,-9+Math.random()*18,0,-14);rocks.push(r);spawn=Math.max(.38,1.15-level*.06);}
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.position.z-=26*dt;if(s.position.z< -16){remove(g.scene,s);shots.splice(i,1);continue;}const j=rocks.findIndex(r=>Math.abs(r.position.x-s.position.x)<1&&Math.abs(r.position.z-s.position.z)<1.1);if(j>=0){remove(g.scene,rocks[j]);rocks.splice(j,1);remove(g.scene,s);shots.splice(i,1);score+=10;}}
  for(const r of rocks){r.position.z+=(3+level*.45)*dt;r.rotation.x+=dt;r.rotation.z+=dt*.6;if(r.position.z>13||r.position.distanceTo(ship.position)<1.4){g.end(`Fin de la misión · ${score} puntos`);break;}}
  g.pressed.length=0;g.stats.textContent=`Puntos: ${score} · Nivel: ${level}`;
 });
}

function tennis(){
 const g=engine({title:'Tenis Espacial 3D',instructions:'Mueve tu pala azul con ↑ ↓ o W/S, o arrastra sobre la pista. Gana el primero en llegar a 7 puntos.',width:28,depth:20});g.hideFire();stars(g.scene);
 box(g.scene,28,.4,20,0x102641,0,-.5);for(const z of [-10,10])box(g.scene,28,.35,.18,0x55cfff,0,0,z);for(let z=-9;z<=9;z+=2)box(g.scene,.12,.05,1,0x7595bb,0,-.25,z);
 const player=box(g.scene,.65,.8,4,0x4ce6ff,-12,.3),ai=box(g.scene,.65,.8,4,0xec68d2,12,.3),orb=ball(g.scene,.4,0xffdf62,0,.35);
 let ps=0,cs=0,vx=9,vz=5,wait=0;
 function serve(direction){orb.position.set(0,.35,0);vx=direction*(9+Math.min(5,Math.floor((ps+cs)/3)));vz=(Math.random()<.5?-1:1)*5;wait=.8;}
 g.setup(()=>{ps=cs=0;player.position.z=ai.position.z=0;serve(Math.random()<.5?-1:1);g.stats.textContent='Tú: 0 · Rival: 0';},dt=>{
  player.position.z=clamp(player.position.z+((g.keys.has('ArrowDown')?1:0)-(g.keys.has('ArrowUp')?1:0))*15*dt,-8,8);
  ai.position.z=clamp(ai.position.z+clamp(orb.position.z-ai.position.z,-7*dt,7*dt),-8,8);
  if(wait>0){wait-=dt;return;}orb.position.x+=vx*dt;orb.position.z+=vz*dt;orb.rotation.y+=dt*3;
  if(Math.abs(orb.position.z)>9.6){orb.position.z=clamp(orb.position.z,-9.6,9.6);vz*=-1;}
  for(const p of [player,ai])if((p===player?vx<0:vx>0)&&Math.abs(orb.position.x-p.position.x)<.85&&Math.abs(orb.position.z-p.position.z)<2.4){orb.position.x=p.position.x+(p===player?.86:-.86);vx*=-1.035;vz=clamp((orb.position.z-p.position.z)*4,-8,8);}
  if(Math.abs(orb.position.x)>14){if(orb.position.x>0)ps++;else cs++;g.stats.textContent=`Tú: ${ps} · Rival: ${cs} · Nivel: ${1+Math.floor((ps+cs)/3)}`;if(ps>=7||cs>=7)g.end(ps>=7?'¡Has ganado el duelo!':'El rival gana · ¡Prueba otra vez!');else serve(orb.position.x>0?-1:1);}
  g.pressed.length=0;
 });
 let drag=null;const move=e=>{if(!g.active)return;const p=g.pointer(e);if(p)player.position.z=clamp(p.z,-8,8);};g.canvas.onpointerdown=e=>{drag=e.pointerId;g.canvas.setPointerCapture(e.pointerId);move(e);};g.canvas.onpointermove=e=>{if(drag===e.pointerId)move(e);};for(const ev of ['pointerup','pointercancel','lostpointercapture'])g.canvas.addEventListener(ev,()=>drag=null);
}

function snake(){
 const g=engine({title:'Serpiente del Desierto 3D',instructions:'Recoge las gotas de agua con flechas, WASD o los botones. También puedes deslizar el dedo. Los bordes te llevan al lado opuesto. Evita los cactus y tu propia cola; cada 5 gotas subes de nivel.',width:23,depth:25,background:0xc7a37a});g.hideFire();
 box(g.scene,21,.5,21,0xe7be7e,0,-.4);const grid=new THREE.GridHelper(20,20,0xb28c55,0xd4aa70);grid.position.y=-.12;g.scene.add(grid);
 let body=[],parts=[],cacti=[],cactusMeshes=[],water,drop=null,direction=null,pending=null,elapsed=0,score=0;
 const vectors={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
 const equal=(a,b)=>a.x===b.x&&a.z===b.z;
 function empty(){const available=[];for(let x=0;x<20;x++)for(let z=0;z<20;z++)if(!body.some(p=>p.x===x&&p.z===z)&&!cacti.some(p=>p.x===x&&p.z===z))available.push({x,z});return available[Math.floor(Math.random()*available.length)];}
 function placeWater(){if(drop)remove(g.scene,drop);water=empty();if(!water){g.end('¡Has llenado el desierto!');return;}drop=meshDrop(water);}
 function meshDrop(p){const m=ball(g.scene,.4,0x249fff,p.x-9.5,.48,p.z-9.5);return m;}
 function draw(){while(parts.length<body.length)parts.push(box(g.scene,.86,.7,.86,parts.length?0x36996a:0x8cdb6a));while(parts.length>body.length)remove(g.scene,parts.pop());body.forEach((p,i)=>parts[i].position.set(p.x-9.5,.3,p.z-9.5));}
 g.setup(()=>{for(const m of [...parts,...cactusMeshes])remove(g.scene,m);parts=[];cactusMeshes=[];cacti=[];body=[{x:10,z:10},{x:10,z:11},{x:10,z:12}];direction=pending=null;score=elapsed=0;for(let i=0;i<10;i++){const p=empty();cacti.push(p);const group=new THREE.Group();g.scene.add(group);group.position.set(p.x-9.5,0,p.z-9.5);box(group,.42,1.6,.42,0x477953,0,.75);box(group,.9,.24,.25,0x477953,0,.9);cactusMeshes.push(group);}placeWater();draw();g.stats.textContent='Agua: 0 · Nivel: 1';},dt=>{
  for(const k of g.pressed.splice(0)){const v=vectors[k];if(!v||pending)continue;const old=vectors[direction];if(!old||v[0]!==-old[0]||v[1]!==-old[1])pending=k;}
  if(drop){drop.rotation.y+=dt*2;drop.position.y=.5+Math.sin(performance.now()/250)*.1;}elapsed+=dt;const interval=Math.max(.075,.23-Math.floor(score/5)*.02);if(elapsed<interval)return;elapsed=0;if(pending){direction=pending;pending=null;}if(!direction)return;
  const v=vectors[direction],head={x:(body[0].x+v[0]+20)%20,z:(body[0].z+v[1]+20)%20},grow=equal(head,water);
  if(cacti.some(p=>equal(p,head))||body.slice(0,grow?body.length:-1).some(p=>equal(p,head))){g.end(`Fin de la aventura · ${score} gotas`);return;}
  body.unshift(head);if(grow){score++;placeWater();}else body.pop();draw();g.stats.textContent=`Agua: ${score} · Nivel: ${1+Math.floor(score/5)}`;
 });
 let touch=null;g.canvas.onpointerdown=e=>{touch={x:e.clientX,y:e.clientY};g.canvas.setPointerCapture(e.pointerId);};g.canvas.onpointerup=e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;if(Math.hypot(dx,dy)>15&&g.active)g.pressed.push(Math.abs(dx)>Math.abs(dy)?(dx>0?'ArrowRight':'ArrowLeft'):(dy>0?'ArrowDown':'ArrowUp'));touch=null;};g.canvas.onpointercancel=()=>touch=null;
}

function escape(){
 const g=engine({title:'Escapa del Monstruo 3D',instructions:'Sobrevive todo lo que puedas. Muévete con flechas o WASD; también puedes mantener pulsado y arrastrar por el escenario. Los monstruos aparecen en los bordes y te persiguen.',width:28,depth:28,background:0x17263a});g.hideFire();
 box(g.scene,26,.5,26,0x304e52,0,-.4);const grid=new THREE.GridHelper(26,13,0x5b8180,0x3e6264);grid.position.y=-.12;g.scene.add(grid);for(const x of [-13,13])box(g.scene,.3,.6,26,0x527274,x,.1);for(const z of [-13,13])box(g.scene,26,.6,.3,0x527274,0,.1,z);
 function character(color){const p=new THREE.Group();box(p,.8,1.1,.6,color,0,.65);ball(p,.4,color,0,1.55);for(const x of [-.17,.17])ball(p,.08,0xffffff,x,1.6,-.34);g.scene.add(p);return p;}
 const hero=character(0x79e5ad);let enemies=[],time=0,spawn=0,target=null,pointer=null;
 function move(e){const p=g.pointer(e);if(p)target={x:clamp(p.x,-12,12),z:clamp(p.z,-12,12)};}
 g.canvas.onpointerdown=e=>{if(!g.active)return;pointer=e.pointerId;g.canvas.setPointerCapture(e.pointerId);move(e);};g.canvas.onpointermove=e=>{if(pointer===e.pointerId)move(e);};for(const ev of ['pointerup','pointercancel','lostpointercapture'])g.canvas.addEventListener(ev,()=>{pointer=null;target=null;});
 g.setup(()=>{enemies.forEach(e=>remove(g.scene,e.mesh));enemies=[];hero.position.set(0,0,0);target=null;time=0;spawn=1;g.stats.textContent='Tiempo: 0 s';},dt=>{
  time+=dt;spawn-=dt;let dx=(g.keys.has('ArrowRight')?1:0)-(g.keys.has('ArrowLeft')?1:0),dz=(g.keys.has('ArrowDown')?1:0)-(g.keys.has('ArrowUp')?1:0);
  if(!dx&&!dz&&pointer!==null&&target){dx=target.x-hero.position.x;dz=target.z-hero.position.z;const len=Math.hypot(dx,dz);if(len<.15){dx=dz=0;}else{const scale=Math.min(1,len/(8*dt));dx=dx/len*scale;dz=dz/len*scale;}}
  const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len;}hero.position.x=clamp(hero.position.x+dx*8*dt,-12,12);hero.position.z=clamp(hero.position.z+dz*8*dt,-12,12);if(dx||dz)hero.rotation.y=Math.atan2(-dx,-dz);
  if(spawn<=0&&enemies.length<50){const m=character(0xe76884),side=Math.floor(Math.random()*4),v=-12+Math.random()*24;m.position.set(side<2?(side===0?-12.5:12.5):v,0,side>=2?(side===2?-12.5:12.5):v);enemies.push({mesh:m,speed:1.9+Math.random()*1.2+Math.min(time/60,1.7)});spawn=Math.max(.65,2-time*.015);}
  for(const e of enemies){const p=e.mesh.position,x=hero.position.x-p.x,z=hero.position.z-p.z,d=Math.hypot(x,z);if(d<1){g.end(`¡Te han atrapado! · ${Math.floor(time)} segundos`);break;}p.x+=x/d*e.speed*dt;p.z+=z/d*e.speed*dt;e.mesh.rotation.y=Math.atan2(-x,-z);}
  g.pressed.length=0;g.stats.textContent=`Tiempo: ${Math.floor(time)} s · Monstruos: ${enemies.length}`;
 });
}

/* Física y reglas compartidas por el juego y sus comprobaciones. Sin dependencias. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TYPES=['wheel','doors','sweeper','hammer','gate','spinner','piston','zigzag'];
const INFO={
 wheel:{name:'Noria',tip:'Busca un lado libre cuando bajen las palas.'},
 doors:{name:'Puertas',tip:'Espera a que se abra el hueco central.'},
 sweeper:{name:'Barra móvil',tip:'La barra gira y se desplaza: cambia de lado.'},
 hammer:{name:'Martillo',tip:'Pasa por el lado contrario al golpe.'},
 gate:{name:'Bloque deslizante',tip:'Aprovecha el espacio que deja a los lados.'},
 spinner:{name:'Hélice',tip:'Rodéala por un lateral cuando gire.'},
 piston:{name:'Prensas',tip:'Cruza por una columna cuando esté levantada.'},
 zigzag:{name:'Zigzag',tip:'Son tres bloques: observa también el siguiente.'}
};
const RUNNER_RADIUS=.29,SEGMENT_BOTTOM=.40,SEGMENT_TOP=1.32,TRACK_LIMIT=2.64;
function levelNumber(value){return clamp(Math.floor(Number(value)||1),1,999);}
function course(level=1){
 level=levelNumber(level);
 const count=9+Math.min(level,5),spacing=11.5;
 return {level,length:24+count*spacing,obstacles:Array.from({length:count},(_,i)=>({
  id:i,type:TYPES[(i+level-1)%TYPES.length],z:15+i*spacing,phase:i*1.79+level*.31,
  rate:1+Math.min(level-1,10)*.025
 }))};
}
function hazards(obstacle,time){
 const t=time*1.35*obstacle.rate+obstacle.phase,z=obstacle.z;
 const box=(x,y,z,hx,hy,hz,yaw=0)=>({shape:'box',x,y,z,hx,hy,hz,yaw});
 const sphere=(x,y,z,r)=>({shape:'sphere',x,y,z,r});
 switch(obstacle.type){
  case 'wheel':return Array.from({length:4},(_,i)=>{const a=t*.85+i*Math.PI/2;return box(Math.sin(a)*2,2.8+Math.cos(a)*2,z,.72,.24,.38);});
  case 'doors':{const opening=1.95+1.65*Math.sin(t*.85),half=(3-opening/2)/2;return [-1,1].map(side=>box(side*(opening/2+half),1.05,z,half,1.05,.30));}
  case 'sweeper':return [box(Math.sin(t)*.65,.92,z,2.05,.19,.22,t*.8),box(Math.sin(t)*.65,.48,z,.19,.48,.19)];
  case 'hammer':return [sphere(Math.sin(t)*1.85,1.12+.38*(1-Math.cos(t)),z,.62)];
  case 'gate':return [box(Math.sin(t)*1.9,1.0,z,.72,1,.35)];
  case 'spinner':return [box(0,.91,z,2.55,.18,.23,t),box(0,.48,z,.20,.48,.20)];
  case 'piston':return [-1,0,1].map(i=>box(i*1.95,2.6+Math.sin(t+i*1.7)*1.8,z,.69,.66,.45));
  case 'zigzag':return Array.from({length:3},(_,i)=>box(Math.sin(t+i*2)*1.85,.65,z+(i-1)*1.1,.61,.65,.31));
  default:throw new Error('Obstáculo desconocido: '+obstacle.type);
 }
}
// Cápsula vertical frente a esfera o caja orientada. Son las mismas formas que se dibujan.
function intersects(runner,hazard){
 const dy=hazard.y-clamp(hazard.y,SEGMENT_BOTTOM,SEGMENT_TOP);
 if(hazard.shape==='sphere')return Math.hypot(runner.x-hazard.x,runner.z-hazard.z,dy)<RUNNER_RADIUS+hazard.r;
 const dx=runner.x-hazard.x,dz=runner.z-hazard.z,c=Math.cos(hazard.yaw),s=Math.sin(hazard.yaw);
 const localX=c*dx-s*dz,localZ=s*dx+c*dz;
 const qx=Math.max(0,Math.abs(localX)-hazard.hx),qz=Math.max(0,Math.abs(localZ)-hazard.hz);
 const qy=Math.max(0,Math.abs(dy)-hazard.hy);
 return qx*qx+qy*qy+qz*qz<RUNNER_RADIUS*RUNNER_RADIUS;
}
function collisionAt(track,x,z,time){
 for(const obstacle of track.obstacles){
  if(Math.abs(obstacle.z-z)>4)continue;
  if(hazards(obstacle,time).some(h=>intersects({x,z},h)))return obstacle;
 }
 return null;
}
function runner(id,x,speed){return {id,x,z:0,speed,checkpoint:0,hits:0,stun:0,shield:0,target:x,decision:0,finishedAt:null};}
function createRace(level=1){
 const track=course(level),base=7.1+Math.min(track.level-1,10)*.06;
 return {track,phase:'ready',time:0,elapsed:0,countdown:3,winner:null,
  runners:[runner('you',-1.3,base),runner('coral',0,5.5+Math.min(track.level-1,10)*.065),runner('violet',1.3,5.35+Math.min(track.level-1,10)*.065)]};
}
function start(race){if(race.phase==='ready')race.phase='countdown';}
function botInput(race,actor,dt){
 actor.decision-=dt;
 if(actor.decision<=0){
  actor.decision=.2;
  let best=actor.x,bestScore=-Infinity;
  for(const lane of [-2.48,-1.24,0,1.24,2.48]){
   const horizon=.75,steps=6;let clear=0;
   for(let i=1;i<=steps;i++){
    const t=horizon*i/steps,x=actor.x+clamp(lane-actor.x,-4*t,4*t),z=actor.z+actor.speed*t;
    if(collisionAt(race.track,x,z,race.time+t))break;
    clear++;
   }
   const score=clear*3-Math.abs(lane-actor.x)*.65-Math.abs(lane-actor.target)*.08;
   if(score>bestScore){bestScore=score;best=lane;}
  }
  actor.target=best;
 }
 const steer=clamp((actor.target-actor.x)/(4*dt),-1,1);
 const futureX=actor.x+steer*4*.16;
 const run=!collisionAt(race.track,clamp(futureX,-TRACK_LIMIT,TRACK_LIMIT),actor.z+actor.speed*.16,race.time+.16);
 return {run,steer};
}
function rank(race){return [...race.runners].sort((a,b)=>{
 if(a.finishedAt!==null||b.finishedAt!==null){if(a.finishedAt===null)return 1;if(b.finishedAt===null)return -1;return a.finishedAt-b.finishedAt;}
 return b.z-a.z||race.runners.indexOf(a)-race.runners.indexOf(b);
});}
function step(race,dt,input={}){
 if(!['countdown','racing'].includes(race.phase)||!Number.isFinite(dt)||dt<=0)return;
 // El controlador usa pasos de 1/120 s; limitar impide atravesar obstáculos con llamadas accidentales grandes.
 dt=Math.min(dt,1/60);race.time+=dt;
 if(race.phase==='countdown'){race.countdown=Math.max(0,race.countdown-dt);if(race.countdown===0)race.phase='racing';return;}
 race.elapsed+=dt;
 const finishers=[];
 for(const actor of race.runners){
  if(actor.finishedAt!==null)continue;
  actor.shield=Math.max(0,actor.shield-dt);
  if(actor.stun>0){actor.stun=Math.max(0,actor.stun-dt);continue;}
  const command=actor.id==='you'?input:botInput(race,actor,dt);
  actor.x=clamp(actor.x+clamp(Number(command.steer)||0,-1,1)*4*dt,-TRACK_LIMIT,TRACK_LIMIT);
  const oldZ=actor.z;if(command.run)actor.z+=actor.speed*dt;
  if(actor.shield<=0&&collisionAt(race.track,actor.x,actor.z,race.time)){
   actor.hits++;actor.stun=.65;actor.shield=1.35;actor.z=actor.checkpoint;
  }
  for(const obstacle of race.track.obstacles)if(actor.z>obstacle.z+2.5)actor.checkpoint=Math.max(actor.checkpoint,obstacle.z+2.5);
  if(actor.z>=race.track.length){
   const fraction=(race.track.length-oldZ)/(actor.z-oldZ||1);
   actor.finishedAt=race.elapsed-dt+dt*clamp(fraction,0,1);actor.z=race.track.length;finishers.push(actor);
  }
 }
 // Resolver todos los cruces del mismo paso evita dar ventaja por orden de actualización.
 if(finishers.length){const first=rank(race)[0];race.winner=first.id;race.phase=first.id==='you'?'won':'lost';}
}
const api={TYPES,INFO,TRACK_LIMIT,RUNNER_RADIUS,course,hazards,intersects,collisionAt,createRace,start,step,rank};
if(typeof module==='object'&&module.exports)module.exports=api;else root.FunRaceRules=api;
})(typeof window!=='undefined'?window:globalThis);

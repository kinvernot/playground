const test=require('node:test');
const assert=require('node:assert/strict');
const R=require('../assets/games/fun-race-rules.js');
const DT=1/120;
function ticks(race,count,input={}){for(let i=0;i<count;i++)R.step(race,DT,input);}

test('circuitos reproducibles con los ocho tipos y separación de controles',()=>{
 for(const level of [1,2,5,12,999]){
  const a=R.course(level),b=R.course(level);assert.deepEqual(a,b);
  assert.equal(new Set(a.obstacles.map(o=>o.type)).size,8);
  assert.ok(a.obstacles.at(-1).z+4<a.length);
  assert.ok(a.obstacles.every((o,i)=>i===0||o.z-a.obstacles[i-1].z>10));
 }
 assert.equal(R.course(-4).level,1);assert.equal(R.course(2000).level,999);
});
test('la cuenta atrás bloquea a todos y correr, esperar y girar son independientes',()=>{
 const race=R.createRace();R.start(race);ticks(race,100,{run:true,steer:1});
 assert.equal(race.phase,'countdown');assert.ok(race.runners.every(a=>a.z===0));
 ticks(race,261);assert.equal(race.phase,'racing');const p=race.runners[0],old=p.z;
 ticks(race,60,{run:false,steer:1});assert.equal(p.z,old);assert.ok(p.x>0);
 ticks(race,60,{run:true});assert.ok(p.z>old+3);ticks(race,120,{steer:1});assert.equal(p.x,R.TRACK_LIMIT);
});
test('colisión de cápsula con cajas giradas, bordes y prensas elevadas',()=>{
 const box={shape:'box',x:0,y:1,z:0,hx:2,hy:.2,hz:.2,yaw:0};
 assert.ok(R.intersects({x:1.7,z:0},box));assert.ok(!R.intersects({x:0,z:1},box));
 const rotated={...box,yaw:Math.PI/2};assert.ok(!R.intersects({x:1.7,z:0},rotated));assert.ok(R.intersects({x:0,z:1.7},rotated));
 assert.ok(!R.intersects({x:0,z:0},{...box,y:3}));
 assert.ok(!R.intersects({x:2.31,z:0},box));assert.ok(R.intersects({x:2.28,z:0},box));
 const sphere={shape:'sphere',x:0,y:1,z:0,r:.6};assert.ok(R.intersects({x:.8,z:0},sphere));assert.ok(!R.intersects({x:1,z:0},sphere));
});
test('un obstáculo en movimiento golpea aunque el corredor esté esperando',()=>{
 const race=R.createRace();race.phase='racing';race.track.obstacles=[{id:0,type:'gate',z:15,phase:0,rate:1}];
 const p=race.runners[0];p.x=1.6;p.z=15;p.checkpoint=3;
 assert.equal(R.collisionAt(race.track,p.x,p.z,race.time),null);ticks(race,90);
 assert.equal(p.hits,1);assert.equal(p.z,3);assert.ok(p.shield>0);
});
test('cada subobstáculo del zigzag colisiona en su posición real',()=>{
 const o={id:0,type:'zigzag',z:20,phase:0,rate:1};
 const bodies=R.hazards(o,0);assert.deepEqual(bodies.map(h=>h.z),[18.9,20,21.1]);
 for(const h of bodies)assert.equal(R.collisionAt({obstacles:[o]},h.x,h.z,0),o);
});
test('superar un obstáculo guarda un control y un golpe conserva el progreso anterior',()=>{
 const race=R.createRace();race.phase='racing';race.track.obstacles=[{id:0,type:'gate',z:8,phase:0,rate:1},{id:1,type:'gate',z:20,phase:0,rate:1}];
 const p=race.runners[0];p.z=11;R.step(race,DT);assert.equal(p.checkpoint,10.5);
 p.z=20;p.x=Math.sin((race.time+DT)*1.35)*1.9;R.step(race,DT);
 assert.equal(p.z,10.5);assert.equal(p.hits,1);
});
test('el orden de actualización no decide una llegada casi simultánea',()=>{
 const race=R.createRace();race.phase='racing';race.track.obstacles=[];
 const [p,r]=race.runners;p.z=race.track.length-.04;r.z=race.track.length-.01;
 R.step(race,DT,{run:true});assert.equal(race.winner,r.id);assert.equal(race.phase,'lost');assert.ok(r.finishedAt<p.finishedAt);
 const victory=R.createRace();victory.phase='racing';victory.track.obstacles=[];victory.runners[0].z=victory.track.length-.01;
 R.step(victory,DT,{run:true});assert.equal(victory.phase,'won');assert.equal(victory.winner,'you');
 const snapshot=JSON.stringify(victory);ticks(victory,100,{run:true});assert.equal(JSON.stringify(victory),snapshot);
});
test('los rivales pueden completar todos los tipos de obstáculo y los niveles no son imposibles',()=>{
 for(const level of [1,2,5,12]){
  const race=R.createRace(level);R.start(race);
  for(let i=0;i<120*240&&race.phase!=='lost';i++)R.step(race,DT);
  assert.equal(race.phase,'lost',`Rivales atascados en nivel ${level}`);
  assert.ok(race.elapsed<240);
  assert.ok(race.runners.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.z)));
 }
});
test('una ruta de avance, espera y cambio de carril puede ganar circuitos completos sin saltar obstáculos',()=>{
 for(const level of [1,2,5,12]){
  const race=R.createRace(level);R.start(race);let target=-1.3,decision=0;
  for(let tick=0;tick<120*180&&!['won','lost'].includes(race.phase);tick++){
   const player=race.runners[0];
   if((decision-=DT)<=0){
    decision=.15;let best=-Infinity;
    for(const lane of [-2.5,-1.875,-1.25,-.625,0,.625,1.25,1.875,2.5]){
     let clear=0;
     for(let j=1;j<=8;j++){
      const t=.8*j/8,x=player.x+Math.max(-4*t,Math.min(4*t,lane-player.x));
      if(R.collisionAt(race.track,x,player.z+player.speed*t,race.time+t))break;
      clear++;
     }
     const score=clear*3-Math.abs(lane-player.x)*.6;
     if(score>best){best=score;target=lane;}
    }
   }
   const steer=Math.max(-1,Math.min(1,(target-player.x)/(4*DT)));
   const run=!R.collisionAt(race.track,player.x+steer*4*.16,player.z+player.speed*.16,race.time+.16);
   R.step(race,DT,{run,steer});
  }
  assert.equal(race.phase,'won',`No se puede ganar el circuito ${level}`);
  assert.equal(race.runners[0].z,race.track.length);
  assert.ok(race.runners[0].checkpoint>=race.track.obstacles.at(-1).z+2.5);
 }
});

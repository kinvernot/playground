import * as THREE from '../vendor/three/three.module.js';
export {THREE};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function engine({title,instructions,width=24,depth=30,background=0x080e22}){
 document.title=title+' · Familia Invernot';
 document.body.innerHTML=`<a class="invernot-home" href="../index.html">← Volver al inicio</a><header><h1>${title}</h1><div id="stats" aria-live="polite"></div></header><button id="pause" aria-label="Pausar juego">Pausa</button><div id="hint">Flechas / WASD · P: pausa</div><div id="controls"><div class="dpad"><button class="up" data-code="ArrowUp" aria-label="Arriba">▲</button><button class="left" data-code="ArrowLeft" aria-label="Izquierda">◀</button><button class="down" data-code="ArrowDown" aria-label="Abajo">▼</button><button class="right" data-code="ArrowRight" aria-label="Derecha">▶</button></div><button id="fire" data-code="Space">Disparar</button></div><div id="overlay"><div class="panel"><h2 id="message">${title}</h2><p id="instructions">${instructions}</p><button id="start">Jugar</button></div></div>`;
 const scene=new THREE.Scene();scene.background=new THREE.Color(background);
 const camera=new THREE.PerspectiveCamera(42,1,.1,250);camera.up.set(0,1,0);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(e){document.getElementById('instructions').textContent='No se ha podido iniciar WebGL. Prueba con un navegador con aceleración gráfica.';document.getElementById('start').disabled=true;throw e;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));document.body.prepend(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xd9efff,0x3c3045,2.5));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(-10,25,10);scene.add(sun);
 const keys=new Set(),pressed=[];let active=false,started=false,reset=()=>{},update=()=>{};
 const overlay=document.getElementById('overlay'),start=document.getElementById('start'),stats=document.getElementById('stats');
 function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;const distance=Math.max(depth*1.55,width*1.6/camera.aspect);camera.position.set(0,distance*.90,distance*.48);camera.lookAt(0,0,0);camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
 function clear(){keys.clear();pressed.length=0;}
 function pause(){if(!started||!overlay.hidden)return;active=false;clear();overlay.hidden=false;document.getElementById('message').textContent='En pausa';start.textContent='Continuar';}
 start.onclick=()=>{if(!started){reset();started=true;}active=true;overlay.hidden=true;clear();};document.getElementById('pause').onclick=pause;
 const aliases={KeyW:'ArrowUp',KeyS:'ArrowDown',KeyA:'ArrowLeft',KeyD:'ArrowRight'};
 addEventListener('keydown',e=>{const c=aliases[e.code]||e.code;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(c)){e.preventDefault();if(!keys.has(c)&&active)pressed.push(c);keys.add(c);}if(e.code==='KeyP'||e.code==='Escape')pause();});addEventListener('keyup',e=>keys.delete(aliases[e.code]||e.code));addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 document.querySelectorAll('[data-code]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(active){keys.add(b.dataset.code);pressed.push(b.dataset.code);}};for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.code));});
 let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(active)update(dt);renderer.render(scene,camera);}requestAnimationFrame(frame);
 return {scene,camera,canvas:renderer.domElement,keys,pressed,stats,clamp,get active(){return active;},setup(r,u){reset=r;update=u;},end(message){active=false;started=false;clear();overlay.hidden=false;document.getElementById('message').textContent=message;start.textContent='Volver a jugar';},hideFire(){document.getElementById('fire').hidden=true;},pointer(e){const p=new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());}};
}
export function mesh(scene,shape,color,x=0,y=0,z=0){const m=new THREE.Mesh(shape,new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.2}));m.position.set(x,y,z);scene.add(m);return m;}
export function box(scene,w,h,d,color,x=0,y=0,z=0){return mesh(scene,new THREE.BoxGeometry(w,h,d),color,x,y,z);}
export function ball(scene,r,color,x=0,y=0,z=0){return mesh(scene,new THREE.IcosahedronGeometry(r,1),color,x,y,z);}
export function remove(scene,m){scene.remove(m);m.traverse(o=>{o.geometry?.dispose();if(o.material)for(const mat of [].concat(o.material))mat.dispose();});}
export function stars(scene){const a=[];for(let i=0;i<350;i++)a.push((Math.random()-.5)*150,-5-Math.random()*25,(Math.random()-.5)*150);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xc9e8ff,size:.16})));}


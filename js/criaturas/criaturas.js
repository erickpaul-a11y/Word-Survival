class GestorCriaturas {
constructor(motor,datos){this.m=motor;this.d=datos||{};this.lista=[];this.tiempoSpawn=0;this.maxTerrestres=24;this.maxPeces=12;this.inicialesGeneradas=false;}
mat(c){return new THREE.MeshLambertMaterial({color:c,flatShading:true});}
pieza(g,m,x,y,z,p,tipo=null){const q=new THREE.Mesh(g,m);q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;if(tipo)q.userData.tipo=tipo;p.add(q);return q;}
modeloAnimal(tipo){
 const p=new THREE.Group();p.name='Animal_'+tipo;p.userData.tipo=tipo;p.userData.criatura=true;
 const negro=this.mat(0x151515),blanco=this.mat(0xf2eee3),gris=this.mat(0x777777),amarillo=this.mat(0xd9a62e),rojo=this.mat(0xb84b42),azul=this.mat(0x3b82c4);
 const pol=(g,m,x,y,z,tipoP=tipo)=>this.pieza(g,m,x,y,z,p,tipoP);
 if(tipo==='vaca'){
  const m=this.mat(0xf0ece0),marron=this.mat(0x76503a);
  pol(new THREE.BoxGeometry(1.85,.88,.86,4,3,4),m,0,1.00,0);
  const lomo=pol(new THREE.IcosahedronGeometry(.64,2),m,-.12,1.35,0);lomo.scale.set(1.45,.68,.82);
  [[-.64,-.30],[.64,-.30],[-.64,.30],[.64,.30]].forEach(a=>pol(new THREE.BoxGeometry(.23,.76,.23,3,3,3),gris,a[0],.38,a[1]));
  pol(new THREE.BoxGeometry(.62,.56,.58,3,3,3),m,1.12,1.20,0);
  pol(new THREE.BoxGeometry(.43,.23,.46,3,2,3),marron,1.43,1.05,0);
  pol(new THREE.BoxGeometry(.16,.18,.11,2,2,2),marron,1.18,1.50,-.31);pol(new THREE.BoxGeometry(.16,.18,.11,2,2,2),marron,1.18,1.50,.31);
  pol(new THREE.ConeGeometry(.095,.27,6,2),gris,1.18,1.62,-.18).rotation.z=-.38;
  pol(new THREE.ConeGeometry(.095,.27,6,2),gris,1.18,1.62,.18).rotation.z=-.38;
  pol(new THREE.IcosahedronGeometry(.06,1),negro,1.43,1.34,-.20,'ojo');pol(new THREE.IcosahedronGeometry(.06,1),negro,1.43,1.34,.20,'ojo');
  const manchas=[];for(let i=0;i<5;i++){const s=pol(new THREE.IcosahedronGeometry(.18+(i%3)*.055,1),marron,-.65+(i%3)*.48,1.0+(i%2)*.35,((i*2)%3-1)*.28);s.scale.set(1.5,.6,.35);manchas.push(s);}
  p.userData.animacion={patas:p.children.filter(n=>n.geometry&&n.geometry.type==='BoxGeometry'&&n.position.y<.7),modo:'caminar',cuerpo:lomo,cabeza:p.children[2]};
 }
 else if(tipo==='oveja'){
  const lana=this.mat(0xf0eee6);
  const patas=[[-.56,-.29],[.56,-.29],[-.56,.29],[.56,.29]].map(a=>pol(new THREE.BoxGeometry(.21,.70,.21,3,3,3),gris,a[0],.35,a[1]));
  [[0,1.02,0],[-.42,1.08,0],[.42,1.08,0],[0,1.34,0],[-.25,1.30,.26],[-.25,1.30,-.26],[.25,1.30,.26],[.25,1.30,-.26]].forEach(a=>{const s=pol(new THREE.IcosahedronGeometry(.40,1),lana,a[0],a[1],a[2]);s.scale.set(1,.85,.8);});
  const cabeza=pol(new THREE.IcosahedronGeometry(.34,1),gris,1.00,1.17,0);cabeza.scale.set(1,.9,.9);
  pol(new THREE.IcosahedronGeometry(.065,1),negro,1.27,1.29,-.16,'ojo');pol(new THREE.IcosahedronGeometry(.065,1),negro,1.27,1.29,.16,'ojo');
  p.userData.animacion={patas,modo:'caminar',cuerpo:p.children[4],cabeza};
 }
 else if(tipo==='pollo'){
  const cuerpo=this.mat(0xf3e7c4);
  pol(new THREE.IcosahedronGeometry(.46,2),cuerpo,0,.80,0);
  pol(new THREE.IcosahedronGeometry(.32,1),blanco,.40,1.08,0);
  const patas=[pol(new THREE.BoxGeometry(.10,.43,.10,2,3,2),amarillo,-.18,.30,0),pol(new THREE.BoxGeometry(.10,.43,.10,2,3,2),amarillo,.18,.30,0)];
  pol(new THREE.ConeGeometry(.105,.25,6,2),amarillo,.70,1.08,0).rotation.z=Math.PI/2;
  pol(new THREE.ConeGeometry(.12,.22,6,2),rojo,.42,1.39,0);
  pol(new THREE.IcosahedronGeometry(.048,1),negro,.61,1.17,-.15,'ojo');pol(new THREE.IcosahedronGeometry(.048,1),negro,.61,1.17,.15,'ojo');
  p.userData.animacion={patas,modo:'caminar',cuerpo:p.children[0],cabeza:p.children[1]};
 }
 else if(tipo==='pez'){
  const m=this.mat(0x3b82c4);
  const cuerpo=pol(new THREE.IcosahedronGeometry(.40,2),m,0,0,0);
  cuerpo.scale.set(1.25,.75,.72);
  const cola=pol(new THREE.ConeGeometry(.27,.52,6,2),m,-.52,0,0);cola.rotation.z=-Math.PI/2;
  const aleta=pol(new THREE.ConeGeometry(.15,.32,6,2),m,.02,.28,0);
  const ojo1=pol(new THREE.IcosahedronGeometry(.05,1),blanco,.27,.12,-.17,'ojo');
  const ojo2=pol(new THREE.IcosahedronGeometry(.05,1),blanco,.27,.12,.17,'ojo');
  p.userData.animacion={cola,aleta,modo:'nadar',cuerpo};
 }
 return p;
}
crear(tipo,x,z,opciones={}){const d=this.d[tipo];if(!d||!this.m||!this.m.mundo)return null;const pez=tipo==='pez',agua=this.m.mundo.esAgua(x,z);if(pez&&!agua)return null;if(!pez&&agua)return null;
 const y=pez?this.m.mundo.getWaterHeightAt(x,z)-.45:this.m.getGroundHeightAt(x,z);const modelo=this.modeloAnimal(tipo);modelo.position.set(x,y,z);this.m.escena.add(modelo);
 const c={tipo,x,y,z,vida:d.vida,vidaMax:d.vida,daño:0,modelo,direccion:Math.random()*Math.PI*2,velocidad:d.velocidad||1,caminando:true,tiempoMovimiento:1+Math.random()*3,acuatico:pez,edad:0,faseAnimacion:Math.random()*Math.PI*2};this.lista.push(c);return c;}
posicionAleatoria(){if(!this.m||!this.m.j||!this.m.mundo)return null;for(let i=0;i<120;i++){const a=Math.random()*Math.PI*2,d=16+Math.random()*60,x=this.m.j.x+Math.cos(a)*d,z=this.m.j.z+Math.sin(a)*d;if(!this.m.mundo.esAgua(x,z)&&this.lista.every(c=>c.acuatico||Math.hypot(c.x-x,c.z-z)>5))return[x,z];}return null;}
buscarAgua(){if(!this.m||!this.m.j||!this.m.mundo)return null;for(let i=0;i<120;i++){const a=Math.random()*Math.PI*2,d=16+Math.random()*60,x=this.m.j.x+Math.cos(a)*d,z=this.m.j.z+Math.sin(a)*d;if(this.m.mundo.esAgua(x,z)&&this.lista.every(c=>!c.acuatico||Math.hypot(c.x-x,c.z-z)>3))return[x,z];}return null;}
generarIniciales(){if(this.inicialesGeneradas)return;this.inicialesGeneradas=true;const iniciales=[['vaca',8,8],['vaca',-12,5],['vaca',15,-10],['oveja',-18,-8],['oveja',20,12],['oveja',-20,15],['pollo',12,-18],['pollo',-8,-14],['pollo',18,4]];iniciales.forEach(p=>this.crear(p[0],p[1],p[2]));let peces=0;for(let i=0;i<80&&peces<8;i++){const p=this.buscarAgua();if(p&&this.crear('pez',p[0],p[1]))peces++;}}
contar(acuatico){return this.lista.filter(c=>c.acuatico===acuatico&&c.vida>0).length;}
spawnContinuo(){if(!this.m||!this.m.j)return;const terrestres=this.contar(false),peces=this.contar(true);if(terrestres<this.maxTerrestres){const p=this.posicionAleatoria();if(p){const tipos=['vaca','oveja','pollo'];this.crear(tipos[Math.floor(Math.random()*tipos.length)],p[0],p[1]);}}if(peces<this.maxPeces){const p=this.buscarAgua();if(p)this.crear('pez',p[0],p[1]);}}
recibirDaño(cantidad){if(!this.m||!this.m.j)return;let objetivo=null,distancia=Infinity;for(const c of this.lista){const d=Math.hypot(this.m.j.x-c.x,this.m.j.z-c.z);if(c.vida>0&&d<2.5&&d<distancia){objetivo=c;distancia=d;}}if(!objetivo)return;objetivo.vida-=cantidad;if(objetivo.vida<=0&&objetivo.modelo.parent)objetivo.modelo.parent.remove(objetivo.modelo);this.lista=this.lista.filter(c=>c.vida>0);}
cambiarDireccion(c){c.direccion=Math.random()*Math.PI*2;}
actualizar(dt=.016){this.tiempoSpawn+=dt;if(this.tiempoSpawn>=3){this.tiempoSpawn=0;this.spawnContinuo();}
 for(const c of this.lista){
  c.edad+=dt;c.faseAnimacion+=dt*(c.caminando?(c.velocidad>1?9:6):1.5);c.tiempoMovimiento-=dt;
  if(c.tiempoMovimiento<=0){c.caminando=Math.random()>.25;c.tiempoMovimiento=1.5+Math.random()*4;if(c.caminando)this.cambiarDireccion(c);}
  const anim=c.modelo.userData.animacion;
  if(anim&&c.caminando){const paso=Math.sin(c.faseAnimacion)*.42;if(anim.patas)anim.patas.forEach((p,i)=>p.rotation.x=paso*(i%2===0?1:-1));if(anim.cuerpo)anim.cuerpo.rotation.z=Math.sin(c.faseAnimacion*2)*.025;}
  else if(anim&&anim.patas)anim.patas.forEach(p=>p.rotation.x*=.85);
  if(anim&&anim.cabeza&&!c.acuatico)anim.cabeza.rotation.y=Math.sin(c.faseAnimacion*.5)*.025;
  if(anim&&anim.modo==='nadar'){anim.cola.rotation.y=Math.sin(c.faseAnimacion)*.38;anim.aleta.rotation.x=Math.sin(c.faseAnimacion*1.2)*.22;anim.cuerpo.rotation.z=Math.sin(c.faseAnimacion*.7)*.08;}
  if(!c.caminando)continue;
  const nx=c.x+Math.sin(c.direccion)*c.velocidad*dt,nz=c.z+Math.cos(c.direccion)*c.velocidad*dt;if(!this.m.mundo)continue;const agua=this.m.mundo.esAgua(nx,nz);
  if(c.acuatico){if(!agua){this.cambiarDireccion(c);continue;}c.x=nx;c.z=nz;c.y=this.m.mundo.getWaterHeightAt(c.x,c.z)-.45+Math.sin(c.edad*3+c.x)*.08;}
  else{if(agua){this.cambiarDireccion(c);continue;}c.x=nx;c.z=nz;c.y=this.m.getGroundHeightAt(c.x,c.z);}
  c.modelo.position.set(c.x,c.y,c.z);c.modelo.rotation.y=c.direccion;
 }
}
}
window.GestorCriaturas=GestorCriaturas;

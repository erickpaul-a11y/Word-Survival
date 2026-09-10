/* WORD SURVIVAL ∞ — LOW-POLY REAL + HAND-PAINTED
   La geometría es la forma: mallas simples, angulares y flat-shaded.
   La textura es pintura difusa: manchas, pinceladas y variaciones de tono.
   NO se dibujan triángulos encima de ninguna textura.
*/
(function(){
'use strict';

const RUTA='textura/';
const ARCHIVOS={
  terreno:'terreno.svg', tierra:'terreno.svg', piedra:'piedra.svg',
  madera:'madera.svg', palo:'madera.svg', arena:'terreno.svg', hojas:'terreno.svg',
  agua:'agua.svg', humano:'humano.svg', vaca:'vaca.svg', oveja:'oveja.svg', pollo:'pollo.svg', pez:'pez.svg'
};
const colores={
  terreno:0x5b9140,tierra:0x765033,piedra:0x777b7b,madera:0x7a4b27,palo:0xa96b37,
  arena:0xd0b16d,hojas:0x347d38,agua:0x2e8bb7,humano:0xffffff,
  vaca:0xffffff,oveja:0xffffff,pollo:0xffffff,pez:0xffffff
};
const texturas={};
const aguas=[];
const estilizados=new WeakSet();
const loader=new THREE.TextureLoader();

function cargarTextura(tipo){
  if(!ARCHIVOS[tipo])return null;
  if(texturas[tipo])return texturas[tipo];
  const t=loader.load(RUTA+ARCHIVOS[tipo],()=>{
    t.needsUpdate=true;
  },undefined,()=>{});
  t.magFilter=THREE.LinearFilter;
  t.minFilter=THREE.LinearMipMapLinearFilter;
  t.generateMipmaps=true;
  t.wrapS=THREE.RepeatWrapping;
  t.wrapT=THREE.RepeatWrapping;
  texturas[tipo]=t;
  return t;
}

function tipoLocal(n){
  const u=n.userData||{};
  const id=u.pickup&&u.pickup.id;
  const raw=String(u.tipo||id||n.name||'').toLowerCase();
  if(raw==='agua')return'agua';
  if(raw==='cesped'||raw==='terreno')return'terreno';
  if(raw.includes('tierra'))return'tierra';
  if(raw.includes('piedra')||raw.includes('roca'))return'piedra';
  if(raw.includes('madera')||raw==='tronco'||raw.includes('arbol'))return'madera';
  if(raw==='palo')return'palo';
  if(raw.includes('arena'))return'arena';
  if(raw==='hojas')return'hojas';
  if(raw==='mano'||raw.includes('piel')||raw.includes('humano'))return'humano';
  if(raw==='vaca'||raw==='oveja'||raw==='pollo'||raw==='pez')return raw;
  return null;
}
function detectarTipo(n){
  let a=n;
  while(a){const t=tipoLocal(a);if(t)return t;a=a.parent;}
  return null;
}

function materialLowPoly(material,tipo){
  if(!material)return;
  if(Array.isArray(material)){material.forEach(m=>materialLowPoly(m,tipo));return;}
  if(material.flatShading!==undefined)material.flatShading=true;
  if(tipo&&material.map!==undefined){
    const tex=cargarTextura(tipo);
    if(tex){material.map=tex;material.color&&material.color.setHex(colores[tipo]??0xffffff);}
  }
  if(material.bumpMap!==undefined){material.bumpMap=null;material.bumpScale=0;}
  if(material.normalMap!==undefined)material.normalMap=null;
  if(material.metalness!==undefined)material.metalness=0;
  if(material.roughness!==undefined)material.roughness=.95;
  if(material.shininess!==undefined)material.shininess=3;
  if(material.specular&&material.specular.set)material.specular.set(0x222222);
  material.needsUpdate=true;
}

function prepararAgua(n){
  if(n.userData.__aguaPoligonal)return;
  const g0=n.geometry;
  if(!g0||!g0.attributes||!g0.attributes.position)return;
  n.geometry=g0.clone();
  const g=n.geometry,pos=g.attributes.position;
  n.userData.__aguaPoligonal=true;
  n.userData.__aguaBase=new Float32Array(pos.array);
  n.userData.__aguaFase=(Math.sin((n.position.x+13)*17.31+(n.position.z-7)*9.17)*43758.5453%1)*6.283;
  const tex=cargarTextura('agua');
  n.material=new THREE.MeshLambertMaterial({map:tex,color:0xffffff,transparent:true,opacity:.68,depthWrite:false,side:THREE.DoubleSide,flatShading:true});
  aguas.push(n);
}

function animarAgua(t){
  for(let i=aguas.length-1;i>=0;i--){
    const n=aguas[i];
    if(!n||!n.parent){aguas.splice(i,1);continue;}
    const pos=n.geometry.attributes.position,base=n.userData.__aguaBase,fase=n.userData.__aguaFase||0;
    for(let j=0;j<pos.count;j++){
      const k=j*3,x=base[k],z=base[k+2];
      pos.array[k+1]=base[k+1]+Math.sin(x*.72+t*1.55+fase)*.035+Math.cos(z*.58+t*1.2+fase)*.028+Math.sin((x+z)*.32+t*.75+fase)*.018;
    }
    pos.needsUpdate=true;
  }
}

function aplicar(){
  const m=window.motor;if(!m||!m.escena)return;
  m.escena.traverse(n=>{
    if(!n||!n.isMesh)return;
    const tipo=detectarTipo(n);
    if(!estilizados.has(n)){
      materialLowPoly(n.material,tipo);
      if(n.material&&n.material.flatShading!==undefined)n.material.flatShading=true;
      estilizados.add(n);
    }
    if(tipo==='agua')prepararAgua(n);
  });
}

const originalRender=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(scene,camera){
  if(window.motor&&window.motor.escena===scene)animarAgua(performance.now()*.001);
  return originalRender.call(this,scene,camera);
};

setInterval(aplicar,250);
window.WordSurvivalPoligonal={aplicar,animarAgua,texturas};
})();

/* WORD SURVIVAL ∞ - ESTILO LOW-POLY + HAND-PAINTED
   IMPORTANTE: no dibuja polígonos encima de las texturas.
   La forma viene de la geometría low-poly + flat shading y las texturas son
   difusas/pintadas con manchas, luces y sombras suaves.
*/
(function(){
'use strict';

const PALETAS={
  terreno:['#3f7f35','#4e8d3d','#5b9845','#356b2d','#6aa34f','#78ae58'],
  tierra:['#6b452c','#7a5032','#8a5b38','#5c3b26','#956541','#a86d45'],
  piedra:['#666d73','#777e84','#858b90','#555b60','#92979b','#a4a8aa'],
  madera:['#70431f','#845128','#965f30','#603919','#a36d3d','#b8783d'],
  palo:['#a86b36','#bd7d42','#8e552a','#cb8c4c','#77451f','#d19355'],
  arena:['#c2a05b','#d0b16d','#b08e4d','#dec27f','#a8874a','#e4ca8a'],
  hojas:['#286d30','#347f38','#438c42','#205b28','#57964c','#6aa956'],
  agua:['#17639f','#267db5','#3d93c8','#14588d','#61b1d7','#82d0df'],
  humano:['#8f563f','#a9664b','#bd7958','#7d4938','#cf8865','#df9b76'],
  vaca:['#eee9dc','#d9d0bd','#8a5b3d','#5b4638','#f5f1e7','#bca98e'],
  oveja:['#eeeae0','#d8d3c8','#c2bcb0','#f5f2e9','#77716a','#b8b2a7'],
  pollo:['#ead9ad','#f3e8c7','#d3a84f','#c77b35','#a94932','#fff0c8'],
  pez:['#286fa8','#3b8fbd','#55aacb','#1f557f','#79c4d8','#91d6e3']
};

function ruido(x,y,s){
  const n=Math.sin(x*127.1+y*311.7+s*17.3)*43758.5453;
  return n-Math.floor(n);
}

/* Textura realmente pintada: gradientes, manchas y pinceladas irregulares.
   No se dibujan triángulos ni una malla falsa sobre la imagen. */
function crearTexturaPintada(tipo){
  const S=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=S;
  const ctx=canvas.getContext('2d');
  const pal=PALETAS[tipo]||PALETAS.terreno;

  ctx.fillStyle=pal[0];
  ctx.fillRect(0,0,S,S);

  // Variaciones grandes de pintura para que la textura no parezca un patrón repetitivo.
  for(let i=0;i<22;i++){
    const x=ruido(i*13.7,3.1,tipo.length)*S;
    const y=ruido(i*7.3,9.4,tipo.length+2)*S;
    const r=18+ruido(i*4.1,12.8,tipo.length+7)*48;
    const color=pal[1+Math.floor(ruido(i*2.7,17.1,tipo.length+11)*(pal.length-1))];
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color+'cc');
    g.addColorStop(.55,color+'55');
    g.addColorStop(1,color+'00');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.ellipse(x,y,r*(.7+ruido(i,21,tipo.length)*.7),r*(.45+ruido(i,28,tipo.length)*.55),ruido(i,35,tipo.length)*Math.PI,0,Math.PI*2);
    ctx.fill();
  }

  // Pinceladas pequeñas, nunca triangulares.
  for(let i=0;i<70;i++){
    const x=ruido(i*5.2,41,tipo.length)*S;
    const y=ruido(i*8.8,53,tipo.length+5)*S;
    const w=2+ruido(i,61,tipo.length)*13;
    const h=1+ruido(i,67,tipo.length)*5;
    const color=pal[Math.floor(ruido(i,73,tipo.length+9)*pal.length)];
    ctx.globalAlpha=.12+ruido(i,79,tipo.length)*.20;
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.ellipse(x,y,w,h,ruido(i,83,tipo.length)*Math.PI,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha=1;

  const tex=new THREE.CanvasTexture(canvas);
  tex.magFilter=THREE.LinearFilter;
  tex.minFilter=THREE.LinearMipMapLinearFilter;
  tex.generateMipmaps=true;
  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;
  return tex;
}

const texturas={};
Object.keys(PALETAS).forEach(k=>{texturas[k]=crearTexturaPintada(k)});

const estilizados=new WeakSet();
const aguas=[];

function tipoLocal(n){
  const u=n.userData||{};
  const id=u.pickup&&u.pickup.id;
  const t=String(u.tipo||id||n.name||'').toLowerCase();
  if(t==='agua')return'agua';
  if(t==='cesped'||t==='terreno')return'terreno';
  if(t.includes('tierra'))return'tierra';
  if(t.includes('piedra'))return'piedra';
  if(t.includes('madera')||t==='tronco')return'madera';
  if(t==='palo')return'palo';
  if(t.includes('arena'))return'arena';
  if(t==='hojas')return'hojas';
  if(t==='mano'||t.includes('piel')||t.includes('humano'))return'humano';
  if(t==='vaca'||t==='oveja'||t==='pollo'||t==='pez')return t;
  return null;
}

function detectarTipo(n){
  let a=n;
  while(a){
    const t=tipoLocal(a);
    if(t)return t;
    a=a.parent;
  }
  return null;
}

function prepararMaterial(material,tipo){
  if(!material)return;
  if(Array.isArray(material)){
    material.forEach(m=>prepararMaterial(m,tipo));
    return;
  }

  // La geometría manda: cada cara conserva su plano y su iluminación.
  if(material.flatShading!==undefined)material.flatShading=true;

  // Material difuso estilizado, sin brillos PBR que destruyan el aspecto pintado.
  if(material.map!==undefined && texturas[tipo]){
    material.map=texturas[tipo];
    if(material.color)material.color.set(0xffffff);
  }

  if(material.bumpMap!==undefined){
    material.bumpMap=null;
    material.bumpScale=0;
  }
  if(material.normalMap!==undefined)material.normalMap=null;
  if(material.metalness!==undefined)material.metalness=0;
  if(material.roughness!==undefined)material.roughness=.92;
  if(material.shininess!==undefined)material.shininess=4;
  if(material.specular!==undefined && material.specular.set)material.specular.set(0x222222);
  material.needsUpdate=true;
}

function prepararAgua(n){
  if(n.userData.__aguaPoligonal)return;
  const g0=n.geometry;
  if(!g0||!g0.attributes||!g0.attributes.position)return;

  n.geometry=g0.clone();
  const g=n.geometry;
  const pos=g.attributes.position;
  n.userData.__aguaPoligonal=true;
  n.userData.__aguaBase=new Float32Array(pos.array);
  n.userData.__aguaFase=ruido(n.position.x,n.position.z,31)*Math.PI*2;

  n.material=new THREE.MeshLambertMaterial({
    map:texturas.agua,
    transparent:true,
    opacity:.70,
    depthWrite:false,
    side:THREE.DoubleSide,
    flatShading:true
  });
  aguas.push(n);
}

function animarAgua(t){
  for(let i=aguas.length-1;i>=0;i--){
    const n=aguas[i];
    if(!n||!n.parent){aguas.splice(i,1);continue;}
    const pos=n.geometry.attributes.position;
    const base=n.userData.__aguaBase;
    const fase=n.userData.__aguaFase||0;
    for(let j=0;j<pos.count;j++){
      const k=j*3;
      const x=base[k],z=base[k+2];
      pos.array[k+1]=base[k+1]
        +Math.sin(x*.72+t*1.7+fase)*.035
        +Math.cos(z*.58+t*1.25+fase)*.028
        +Math.sin((x+z)*.32+t*.8+fase)*.018;
    }
    pos.needsUpdate=true;
  }
}

function aplicar(){
  const m=window.motor;
  if(!m||!m.escena)return;

  m.escena.traverse(n=>{
    if(!n||!n.isMesh)return;
    const tipo=detectarTipo(n);

    if(!estilizados.has(n)){
      prepararMaterial(n.material,tipo);
      // Todos los modelos reciben flat shading aunque no tengan tipo identificado.
      if(n.material&&n.material.flatShading!==undefined){
        if(Array.isArray(n.material))n.material.forEach(mat=>{if(mat.flatShading!==undefined)mat.flatShading=true;});
        else n.material.flatShading=true;
      }
      estilizados.add(n);
    }

    if(tipo==='agua')prepararAgua(n);
  });
}

// Mantiene el agua animada sin tocar el resto del motor.
const originalRender=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(scene,camera){
  if(window.motor&&window.motor.escena===scene)animarAgua(performance.now()*.001);
  return originalRender.call(this,scene,camera);
};

setInterval(aplicar,500);
window.WordSurvivalPoligonal={aplicar,animarAgua,texturas};
})();

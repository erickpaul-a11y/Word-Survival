/* WORD SURVIVAL ∞ - ESTILO POLIGONAL
   Unifica el aspecto visual: texturas triangulares, geometría flat-shaded,
   piel poligonal y agua animada con pequeñas olas.
*/
(function(){
'use strict';

const PALETAS={
  terreno:['#3f7f35','#4e8d3d','#5b9845','#356b2d','#6aa34f'],
  tierra:['#6b452c','#7a5032','#8a5b38','#5c3b26','#956541'],
  piedra:['#666d73','#777e84','#858b90','#555b60','#92979b'],
  madera:['#70431f','#845128','#965f30','#603919','#a36d3d'],
  palo:['#a86b36','#bd7d42','#8e552a','#cb8c4c','#77451f'],
  arena:['#c2a05b','#d0b16d','#b08e4d','#dec27f','#a8874a'],
  hojas:['#286d30','#347f38','#438c42','#205b28','#57964c'],
  agua:['#1b65a4','#277db8','#3d92c8','#15588f','#61b0d7'],
  humano:['#9a6045','#b97655','#c98662','#8a513d','#d3936c']
};

function ruido(x,y,s){
  const n=Math.sin(x*127.1+y*311.7+s*17.3)*43758.5453;
  return n-Math.floor(n);
}

function crearTexturaPoligonal(tipo){
  const canvas=document.createElement('canvas');
  canvas.width=64; canvas.height=64;
  const ctx=canvas.getContext('2d');
  const pal=PALETAS[tipo]||PALETAS.terreno;
  ctx.fillStyle=pal[0]; ctx.fillRect(0,0,64,64);
  const paso=8;
  for(let y=0;y<64;y+=paso){
    for(let x=0;x<64;x+=paso){
      const i=Math.floor(ruido(x,y,tipo.length)*pal.length);
      ctx.fillStyle=pal[i];
      const j=ruido(x+3,y+11,tipo.length+4)>0.5;
      ctx.beginPath();
      if(j){ctx.moveTo(x,y);ctx.lineTo(x+paso,y);ctx.lineTo(x,y+paso);}
      else{ctx.moveTo(x+paso,y);ctx.lineTo(x+paso,y+paso);ctx.lineTo(x,y+paso);}
      ctx.closePath();ctx.fill();
    }
  }
  const tex=new THREE.CanvasTexture(canvas);
  tex.magFilter=THREE.NearestFilter;
  tex.minFilter=THREE.NearestFilter;
  tex.generateMipmaps=false;
  return tex;
}

const texturas={};
Object.keys(PALETAS).forEach(k=>texturas[k]=crearTexturaPoligonal(k));

function detectarTipo(n){
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
  if(t.includes('mano')||t.includes('piel')||t.includes('humano'))return'humano';
  return null;
}

function hacerPoligonal(material,tipo){
  if(!material)return;
  if(Array.isArray(material)){material.forEach(m=>hacerPoligonal(m,tipo));return;}
  if(material.flatShading!==undefined){material.flatShading=true;material.needsUpdate=true;}
  if(tipo&&texturas[tipo]&&material.map!==undefined){
    material.map=texturas[tipo];
    if(material.color)material.color.set(0xffffff);
    material.needsUpdate=true;
  }
  if(material.shininess!==undefined&&tipo!=='agua')material.shininess=8;
}

function prepararAgua(n){
  if(n.userData.__aguaPoligonal)return;
  const g=n.geometry;
  if(!g||!g.attributes||!g.attributes.position)return;
  const pos=g.attributes.position;
  n.userData.__aguaPoligonal=true;
  n.userData.__aguaBase=new Float32Array(pos.array);
  n.userData.__aguaFase=ruido(n.position.x,n.position.z,31)*Math.PI*2;
  n.material=new THREE.MeshBasicMaterial({map:texturas.agua,transparent:true,opacity:0.68,depthWrite:false,side:THREE.DoubleSide});
}

function animarAgua(t){
  const m=window.motor;
  if(!m||!m.escena)return;
  m.escena.traverse(n=>{
    if(!n.userData||!n.userData.__aguaPoligonal)return;
    const pos=n.geometry.attributes.position;
    const base=n.userData.__aguaBase;
    const fase=n.userData.__aguaFase||0;
    for(let i=0;i<pos.count;i++){
      const k=i*3;
      const x=base[k],z=base[k+2];
      pos.array[k+1]=base[k+1]+Math.sin(x*0.72+t*1.7+fase)*0.035+Math.cos(z*0.58+t*1.25+fase)*0.028;
    }
    pos.needsUpdate=true;
  });
}

function aplicar(){
  const m=window.motor;
  if(!m||!m.escena)return;
  m.escena.traverse(n=>{
    if(!n||!n.isMesh)return;
    const tipo=detectarTipo(n);
    if(tipo)hacerPoligonal(n.material,tipo);
    else if(n.material&&n.material.flatShading!==undefined){n.material.flatShading=true;n.material.needsUpdate=true;}
    if(n.userData&&n.userData.tipo==='agua')prepararAgua(n);
  });
}

const originalRender=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(scene,camera){
  if(window.motor&&window.motor.escena===scene){
    aplicar();
    animarAgua(performance.now()*0.001);
  }
  return originalRender.call(this,scene,camera);
};

setInterval(aplicar,700);
window.WordSurvivalPoligonal={aplicar,animarAgua,texturas};
})();

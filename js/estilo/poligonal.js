/* WORD SURVIVAL ∞ — LOW-POLY REAL + HAND-PAINTED
   Geometría angular real + flat shading.
   Texturas difusas pintadas, sin triángulos dibujados encima.
*/
(function(){
'use strict';
const RUTA='textura/';

const ARCHIVOS={
 terreno:'terreno.svg', tierra:null, piedra:'piedra.svg', madera:'madera.svg',
 palo:null, arena:null, hojas:null, agua:'agua.svg',
 humano:null, vaca:null, oveja:null, pollo:null, pez:null,
 ropa:null, pantalon:null, pelo:null, zapato:null, ojo:null, boca:null
};

const colores={
 terreno:0x5b9140,tierra:0x765033,piedra:0x777b7b,madera:0x7a4b27,palo:0xa96b37,
 arena:0xd0b16d,hojas:0x347d38,agua:0xffffff,humano:0xffffff,
 vaca:0xffffff,oveja:0xffffff,pollo:0xffffff,pez:0xffffff,
 ropa:0xffffff,pantalon:0xffffff,pelo:0xffffff,zapato:0xffffff,ojo:0xffffff,boca:0xffffff
};

const texturas={},aguas=[];
const estilizados=new WeakSet();
const geometriasOptimizadas=new WeakSet();
const loader=new THREE.TextureLoader();

function texturaPintada(tipo){
    if(texturas[tipo]) return texturas[tipo];
    const paletas={
        humano:['#c98662','#d99b78','#a9684d','#e6ad8a'],
        ropa:['#315f8f','#467eae','#274f79','#6d9fc4'],
        pantalon:['#273447','#36485f','#1e2938','#53657b'],
        pelo:['#171717','#28231f','#3b3028','#0d0d0d'],
        zapato:['#17191c','#292c30','#0c0d0f','#45484b'],
        ojo:['#090909','#171717','#2e3337'],
        boca:['#090909','#3a2020','#642f35'],
        tierra:['#765033','#8d6140','#624028','#a7754e'],
        arena:['#d0b16d','#e2c88a','#b99558','#edd7a0'],
        hojas:['#347d38','#4d9347','#28642e','#69a85a'],
        palo:['#a96b37','#c1844a','#875126','#d39a5d'],
        vaca:['#eee9dc','#c9c1b3','#4b4038','#f7f3ea'],
        oveja:['#eee9dc','#ffffff','#d7d0c5','#b7aea2'],
        pollo:['#d9ad43','#f1cb65','#b88727','#f4df9a'],
        pez:['#d47a31','#ef9b4b','#9f4f25','#f1bd68']
    };
    const pal=paletas[tipo];
    if(!pal) return null;
    const c=document.createElement('canvas');c.width=c.height=256;
    const x=c.getContext('2d');x.fillStyle=pal[0];x.fillRect(0,0,256,256);
    for(let i=0;i<48;i++){
        const px=(i*73+19)%256,py=(i*131+37)%256;
        const rx=7+(i*17)%38,ry=4+(i*11)%24;
        x.globalAlpha=.10+(i%7)*.022;x.fillStyle=pal[1+(i%Math.min(3,pal.length-1))];
        x.beginPath();x.ellipse(px,py,rx,ry,(i%11)*.19,0,Math.PI*2);x.fill();
    }
    if(tipo==='vaca'){
        x.globalAlpha=.72;x.fillStyle=pal[2];
        [[48,62,30,21],[166,48,38,27],[116,157,43,30],[216,202,27,19]].forEach(a=>{x.beginPath();x.ellipse(a[0],a[1],a[2],a[3],.18,0,Math.PI*2);x.fill();});
    }else if(tipo==='oveja'){
        x.globalAlpha=.35;x.fillStyle=pal[2];for(let i=0;i<30;i++){x.beginPath();x.arc((i*47)%256,(i*83)%256,10+(i%4)*3,0,Math.PI*2);x.fill();}
    }else if(tipo==='pollo'){
        x.globalAlpha=.42;x.strokeStyle=pal[2];x.lineWidth=7;for(let i=0;i<22;i++){x.beginPath();x.moveTo((i*31)%256,20+(i*17)%236);x.lineTo((i*31+14)%256,28+(i*17)%236);x.stroke();}
    }else if(tipo==='pez'){
        x.globalAlpha=.38;x.strokeStyle=pal[2];x.lineWidth=3;for(let i=0;i<9;i++){x.beginPath();x.arc(30+i*28,128,70,Math.PI*.12,Math.PI*.88);x.stroke();}
    }else if(tipo==='humano'){
        x.globalAlpha=.20;x.fillStyle=pal[3];for(let i=0;i<14;i++){x.beginPath();x.ellipse(20+i*23,(i*41)%256,22,8,.2,0,Math.PI*2);x.fill();}
    }
    x.globalAlpha=1;
    const t=new THREE.CanvasTexture(c);
    t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipMapLinearFilter;t.generateMipmaps=true;
    t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;
    texturas[tipo]=t;return t;
}

function cargarTextura(tipo){
    const archivo=ARCHIVOS[tipo];
    if(archivo===null)return texturaPintada(tipo);
    if(!archivo)return null;
    if(texturas[tipo])return texturas[tipo];
    const t=loader.load(RUTA+archivo,()=>{t.needsUpdate=true;},undefined,()=>{});
    t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipMapLinearFilter;t.generateMipmaps=true;
    t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;texturas[tipo]=t;return t;
}

function tipoLocal(n){
    const u=n.userData||{},id=u.pickup&&u.pickup.id,raw=String(u.tipo||id||n.name||'').toLowerCase();
    if(raw==='agua')return'agua';if(raw==='cesped'||raw==='terreno')return'terreno';if(raw.includes('tierra'))return'tierra';
    if(raw.includes('piedra')||raw.includes('roca'))return'piedra';if(raw.includes('madera')||raw==='tronco'||raw.includes('arbol'))return'madera';
    if(raw==='palo')return'palo';if(raw.includes('arena'))return'arena';if(raw==='hojas')return'hojas';if(raw==='ropa')return'ropa';
    if(raw==='pantalon')return'pantalon';if(raw==='pelo'||raw==='cabello')return'pelo';if(raw==='zapato')return'zapato';
    if(raw==='ojo')return'ojo';if(raw==='boca')return'boca';if(raw==='mano'||raw.includes('piel')||raw.includes('humano'))return'humano';
    if(raw==='vaca'||raw==='oveja'||raw==='pollo'||raw==='pez')return raw;return null;
}
function detectarTipo(n){let a=n;while(a){const t=tipoLocal(a);if(t)return t;a=a.parent;}return null;}

function asegurarUV(g){
    if(!g||!g.attributes||g.attributes.uv)return;
    const p=g.attributes.position;if(!p)return;const uv=[];
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for(let i=0;i<p.count;i++){const k=i*3,px=p.array[k],pz=p.array[k+2];minX=Math.min(minX,px);maxX=Math.max(maxX,px);minZ=Math.min(minZ,pz);maxZ=Math.max(maxZ,pz);}
    const dx=Math.max(.001,maxX-minX),dz=Math.max(.001,maxZ-minZ);
    for(let i=0;i<p.count;i++){const k=i*3;uv.push((p.array[k]-minX)/dx,(p.array[k+2]-minZ)/dz);}
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
}

function optimizarGeometria(n,tipo){
    if(!n.geometry||geometriasOptimizadas.has(n.geometry))return;
    if(tipo==='hojas'&&n.geometry.type==='SphereGeometry'){
        const old=n.geometry,r=old.parameters&&old.parameters.radius?old.parameters.radius:1;
        n.geometry=new THREE.IcosahedronGeometry(r,2);old.dispose();
    }
    // No reducimos geometría. El modelo puede tener la densidad necesaria para que la pintura y la silueta se vean bien.
    asegurarUV(n.geometry);
    if(n.geometry.computeVertexNormals)n.geometry.computeVertexNormals();
    geometriasOptimizadas.add(n.geometry);
}

function materialLowPoly(material,tipo){
    if(!material)return;if(Array.isArray(material)){material.forEach(m=>materialLowPoly(m,tipo));return;}
    if(material.flatShading!==undefined)material.flatShading=true;
    if(tipo&&material.map!==undefined){const tex=cargarTextura(tipo);if(tex){material.map=tex;material.color&&material.color.setHex(colores[tipo]??0xffffff);if(THREE.sRGBEncoding!==undefined)tex.encoding=THREE.sRGBEncoding;}}
    if(material.bumpMap!==undefined){material.bumpMap=null;material.bumpScale=0;}if(material.normalMap!==undefined)material.normalMap=null;
    if(material.metalness!==undefined)material.metalness=0;if(material.roughness!==undefined)material.roughness=.95;if(material.shininess!==undefined)material.shininess=3;
    if(material.specular&&material.specular.set)material.specular.set(0x222222);material.needsUpdate=true;
}

function prepararAgua(n){
    if(n.userData.__aguaPoligonal)return;const g0=n.geometry;if(!g0||!g0.attributes||!g0.attributes.position)return;
    n.geometry=g0.clone();const g=n.geometry,pos=g.attributes.position;asegurarUV(g);n.userData.__aguaPoligonal=true;n.userData.__aguaBase=new Float32Array(pos.array);
    n.userData.__aguaFase=((Math.sin((n.position.x+13)*17.31+(n.position.z-7)*9.17)*43758.5453)%1)*6.283;
    const tex=cargarTextura('agua');n.material=new THREE.MeshLambertMaterial({map:tex,color:0xffffff,transparent:true,opacity:.68,depthWrite:false,side:THREE.DoubleSide,flatShading:true});
    n.castShadow=false;n.receiveShadow=true;aguas.push(n);
}
function animarAgua(t){
    for(let i=aguas.length-1;i>=0;i--){const n=aguas[i];if(!n||!n.parent){aguas.splice(i,1);continue;}const pos=n.geometry.attributes.position,base=n.userData.__aguaBase,fase=n.userData.__aguaFase||0;
        for(let j=0;j<pos.count;j++){const k=j*3,xx=base[k],zz=base[k+2];pos.array[k+1]=base[k+1]+Math.sin(xx*.72+t*1.55+fase)*.035+Math.cos(zz*.58+t*1.2+fase)*.028+Math.sin((xx+zz)*.32+t*.75+fase)*.018;}
        pos.needsUpdate=true;
    }
}

function aplicar(){
    const m=window.motor;if(!m||!m.escena)return;
    m.escena.traverse(n=>{
        if(!n||!n.isMesh)return;
        const tipo=detectarTipo(n);optimizarGeometria(n,tipo);
        // Todo lo que forma parte del mundo puede recibir sombra; las criaturas y objetos también la proyectan.
        if(n!==m.cam){n.castShadow=n.castShadow!==false;n.receiveShadow=true;}
        if(!estilizados.has(n)){materialLowPoly(n.material,tipo);estilizados.add(n);}
        if(tipo==='agua')prepararAgua(n);
    });
    if(m.renderer&&m.renderer.capabilities){
        const aniso=m.renderer.capabilities.getMaxAnisotropy?m.renderer.capabilities.getMaxAnisotropy():1;
        Object.keys(texturas).forEach(k=>{if(texturas[k])texturas[k].anisotropy=Math.min(8,aniso);});
    }
}

const originalRender=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(scene,camera){if(window.motor&&window.motor.escena===scene)animarAgua(performance.now()*.001);return originalRender.call(this,scene,camera);};
setInterval(aplicar,250);
window.WordSurvivalPoligonal={aplicar,animarAgua,texturas};
})();

/* Interaccion fisica definitiva: dos manos, fuerza del golpe, pala y tierra. */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mano=(m,l)=>l==='izquierda'?m.j.leftHand:m.j.rightHand;
const objetoMano=(m,l)=>l==='izquierda'?m.manoIzquierdaObjeto:m.manoDerechaObjeto;
const setObjeto=(m,l,o)=>{
 const h=mano(m,l),viejo=objetoMano(m,l);if(viejo&&viejo.parent)viejo.parent.remove(viejo);
 if(l==='izquierda')m.manoIzquierdaObjeto=o;else m.manoDerechaObjeto=o;
 if(!o)return;
 if(o.parent)o.parent.remove(o);h.add(o);o.position.set(0,-.22,-.18);o.rotation.set(0,0,0);o.scale.setScalar(o.userData.pickup&&o.userData.pickup.id==='pala_madera'?1.35:1.15);o.userData.enMano=true;o.userData.colision=true;
};
function raiz(o,p){while(o){if(p(o))return o;o=o.parent;}return null;}
function hit(m){const r=new THREE.Raycaster();r.setFromCamera(new THREE.Vector2(0,0),m.cam);return r.intersectObjects(m.escena.children,true).find(x=>x.distance<=4)||null;}
function textura(tipo){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const b={tierra:'#704020',piedra:'#777d83',madera:'#8a5528',palo:'#b9793c',arena:'#c5a15b',cesped:'#3f7f35',hojas:'#2f7d35',agua:'#2d82c7'}[tipo]||'#b58a55';g.fillStyle=b;g.fillRect(0,0,64,64);for(let y=0;y<64;y+=4)for(let x=0;x<64;x+=4){const n=Math.abs(Math.sin(x*12.7+y*31.1+tipo.length*17));g.fillStyle=`rgba(255,255,255,${.04+n*.12})`;g.fillRect(x,y,3,3);}const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t;}
function iniciar(m){if(!m||!m.j||m.__interaccion2)return;m.__interaccion2=true;m.manoIzquierdaObjeto=null;m.manoDerechaObjeto=null;m.ultimaMano='izquierda';m.golpe2={izquierda:{activa:false,fuerza:0},derecha:{activa:false,fuerza:0}};m.texturasObjetos={};['tierra','piedra','madera','palo','arena','cesped','hojas','agua'].forEach(k=>m.texturasObjetos[k]=textura(k));
 const aplicar=o=>{if(!o||!o.material)return;const id=o.userData&&o.userData.pickup&&o.userData.pickup.id,t=o.userData&&o.userData.tipo,idt=id||t;if(m.texturasObjetos[idt]){o.material.map=m.texturasObjetos[idt];o.material.color.set(0xffffff);o.material.needsUpdate=true;}};m.escena.traverse(aplicar);const crear=m.crearObjeto.bind(m);m.crearObjeto=function(){const o=crear(...arguments);aplicar(o);return o;};
 m.recogerEnMano=function(l){const h=hit(m);let o=h&&raiz(h.object,x=>x.userData&&x.userData.pickup);if(!o)o=m.objetosCercanos(2.2)[0];if(!o)return false;m.retirarObjeto(o);setObjeto(m,l,o);m.ultimaMano=l;return true;};
 m.dejarMano=function(l){const o=objetoMano(m,l);if(!o)return false;const d=new THREE.Vector3();m.cam.getWorldDirection(d);const p=o.getWorldPosition(new THREE.Vector3()).addScaledVector(d,.8),q=o.userData.pickup;if(o.parent)o.parent.remove(o);if(l==='izquierda')m.manoIzquierdaObjeto=null;else m.manoDerechaObjeto=null;m.crearObjeto(q.id,q.name,p.x,p.z,q.qty||1);return true;};
 const impacto=(l,f)=>{const h=hit(m);if(!h)return;const o=h.object,held=objetoMano(m,l),hid=held&&held.userData.pickup&&held.userData.pickup.id;
  if(held&&hid==='tierra'){
   const colocado=m.mundo.colocarTierraCercana(h.point.x,h.point.z);if(colocado){if(held.parent)held.parent.remove(held);if(l==='izquierda')m.manoIzquierdaObjeto=null;else m.manoDerechaObjeto=null;return true;}
  }
  const arbol=raiz(o,x=>x.userData&&x.userData.arbol);if(arbol){const dano=(hid==='hacha'?2:1)*(.2+f*2.8);arbol.userData.vida=(arbol.userData.vida||3)-dano;arbol.userData.grieta=clamp(1-arbol.userData.vida/3,0,1);arbol.traverse(x=>{if(x.isMesh&&x.material&&x.material.color)x.material.color.multiplyScalar(1-arbol.userData.grieta*.12);});if(arbol.userData.vida<=0)m.mundo.derribarArbol(arbol);return true;}
  const terreno=raiz(o,x=>x.userData&&x.userData.interactivo&&x.userData.pixeles);if(terreno&&hid==='pala_madera'&&f>.15){const p=m.mundo.destruirBloque(h);if(p){const tierra=m.crearObjeto('tierra','tierra',p.x,p.z,1);m.retirarObjeto(tierra);setObjeto(m,l,tierra);}return true;}
  const recurso=raiz(o,x=>x.userData&&x.userData.recurso&&!x.userData.arbol);if(recurso){recurso.userData.vida=(recurso.userData.vida==null?2:recurso.userData.vida)-(.2+f*1.5);if(recurso.userData.vida<=0){const p=recurso.getWorldPosition(new THREE.Vector3());m.soltarRecursos(recurso.userData.recurso,p);if(recurso.parent)recurso.parent.remove(recurso);}return true;}return false;};
 const down=(l,e)=>{if(!m.j)return;m.ultimaMano=l;const g=m.golpe2[l];g.activa=true;g.fuerza=0;try{m.renderer.domElement.requestPointerLock();}catch(_){}m.j.animarMano(l);e.preventDefault();e.stopImmediatePropagation();};
 const up=(l,e)=>{const g=m.golpe2[l];if(!g.activa)return;g.activa=false;impacto(l,clamp(g.fuerza,.03,1));e.preventDefault();e.stopImmediatePropagation();};
 m.renderer.domElement.addEventListener('mousedown',e=>{if(e.button===0)down('izquierda',e);else if(e.button===2)down('derecha',e);},true);
 m.renderer.domElement.addEventListener('mouseup',e=>{if(e.button===0)up('izquierda',e);else if(e.button===2)up('derecha',e);},true);
 document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==m.renderer.domElement)return;const f=clamp((Math.abs(e.movementX||0)+Math.abs(e.movementY||0))/55,0,1);for(const l of ['izquierda','derecha'])if(m.golpe2[l].activa){m.golpe2[l].fuerza=clamp(m.golpe2[l].fuerza+f,0,1);m.j.animarMano(l);}},true);
 m.renderer.domElement.addEventListener('contextmenu',e=>{e.preventDefault();e.stopImmediatePropagation();},true);m.renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();e.stopImmediatePropagation();},{capture:true,passive:false});
 window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='e')m.recogerEnMano(m.ultimaMano);if(k==='q')m.dejarMano(m.ultimaMano);});
}
const esperar=()=>{if(window.motor&&window.motor.j){iniciar(window.motor);return;}requestAnimationFrame(esperar);};esperar();
})();

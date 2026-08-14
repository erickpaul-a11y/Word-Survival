function normalizarPalabra(p){return String(p||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
class GestorLenguaje{
 constructor(motor){this.m=motor;this.letrasConocidas=[];this.diccionario={};this.conceptos=new Set();this.cargarPartida();this.crearPanel();}
 crearPanel(){const p=document.createElement('div');p.style.cssText='position:absolute;bottom:20px;left:20px;z-index:9998;color:#fff;background:rgba(10,20,35,.85);padding:8px;border-radius:7px';p.innerHTML='<label>Palabra <input maxlength="20" placeholder="descubre un concepto"></label><button>Usar</button><small style="display:block">Letras: <span></span></small>';const input=p.querySelector('input'),estado=p.querySelector('span'),actualizar=()=>estado.textContent=this.letrasConocidas.join(' ');p.querySelector('button').onclick=()=>{const palabra=input.value;if(this.usar(palabra)){input.value='';actualizar();}else alert('Aún no puedes usar esa palabra: descubre sus letras primero.');};document.body.appendChild(p);this._actualizarLetras=actualizar;actualizar();}
 async cargarDatos(){try{const r=await fetch('data/diccionario.json');this.diccionario=await r.json();}catch(e){console.warn('No se pudo cargar el diccionario',e);}return this.diccionario;}
 puedeEscribir(palabra){return [...normalizarPalabra(palabra).toUpperCase()].every(l=>this.letrasConocidas.includes(l));}
 desbloquearLetra(l){l=String(l).toUpperCase();if(!this.letrasConocidas.includes(l)){this.letrasConocidas.push(l);this.guardarPartida();if(this._actualizarLetras)this._actualizarLetras();return true;}return false;}
 descubrir(palabra){const id=normalizarPalabra(palabra),dato=this.diccionario[id];if(!dato||!this.puedeEscribir(id)||this.conceptos.has(id))return false;this.conceptos.add(id);this.guardarPartida();return dato;}
 usar(palabra,posicion){const dato=this.descubrir(palabra);if(!dato)return false;const p=posicion||{x:this.m.j.x,z:this.m.j.z};if(dato.tipo==='material'&&this.m.inv)this.m.inv.agregar(normalizarPalabra(palabra),1,palabra);if(dato.tipo==='elemento'&&normalizarPalabra(palabra)==='fuego'){const luz=new THREE.PointLight(0xff8a2a,2.5,7);luz.position.set(p.x,this.m.getGroundHeightAt(p.x,p.z)+1,p.z);this.m.escena.add(luz);setTimeout(()=>this.m.escena.remove(luz),8000);}return true;}
 cargarPartida(){try{const s=JSON.parse(localStorage.getItem('word_survival_language')||'{}');this.letrasConocidas=s.letras||[];this.conceptos=new Set(s.conceptos||[]);}catch(e){this.letrasConocidas=[];}}
 guardarPartida(){localStorage.setItem('word_survival_language',JSON.stringify({letras:this.letrasConocidas,conceptos:[...this.conceptos]}));}
 reiniciar(){this.letrasConocidas=[];this.conceptos.clear();this.guardarPartida();}
}
window.GestorLenguaje=GestorLenguaje;

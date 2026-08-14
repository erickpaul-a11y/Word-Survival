class Motor {
    constructor(){
        this.escena=new THREE.Scene();
        this.cam=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,.03,3000);
        this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
        this.renderer.setSize(window.innerWidth,window.innerHeight);
        this.renderer.domElement.id='canvas-3d'; document.body.appendChild(this.renderer.domElement);
        this.ang={x:0,y:0}; this.teclas={}; this.cameraMode='first';
        this.j=null; this.mundo=null; this.criaturas=null; this.inv=null; this.crafteos=null; this.lenguaje=null; this.ultimoGolpe=0; this.objetosSuelo=[]; this.equipado=null;
        this.velocidadX=0; this.velocidadZ=0; this.velocidadY=0;
        this.aceleracion=.045; this.frenado=.16; this.velocidadCaminar=3.8; this.velocidadCorrer=6.5;
        this.gravedad=18; this.fuerzaSalto=7.2; this.alturaJugador=.82; this.alturaCamara=.72;
        this.enSuelo=false; this.enAgua=false; this.profundidadAgua=0;
        this.tiempo={hora:8,dur:300,avanzar(s){this.hora+=s/this.dur*24;if(this.hora>=24)this.hora-=24;},esNoche(){return this.hora<6||this.hora>19;}};
        this.luzAmbiente=new THREE.HemisphereLight(0xffffff,0x444444,1); this.escena.add(this.luzAmbiente);
        this.luzSol=new THREE.DirectionalLight(0xffffff,.6); this.luzSol.position.set(5,10,7);this.luzSol.castShadow=true; this.escena.add(this.luzSol);
        window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();this.teclas[k]=true;if(['w','a','s','d',' ','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k===' '&&!e.repeat)this.saltar();if(k==='e'&&!e.repeat)this.agarrar();if(k==='c'&&!e.repeat&&this.crafteos)this.crafteos.toggle();if(k==='v'&&!e.repeat)this.toggleCamera();});
        window.addEventListener('keyup',e=>{this.teclas[e.key.toLowerCase()]=false;});
        this.renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
        this.renderer.domElement.addEventListener('click',()=>{if(document.pointerLockElement!==this.renderer.domElement)this.renderer.domElement.requestPointerLock();});
        this.renderer.domElement.addEventListener('mousedown',e=>{
            if(document.pointerLockElement!==this.renderer.domElement)this.renderer.domElement.requestPointerLock();
            if(!this.j)return;
            if(e.button===0){this.j.animarMano('derecha');this.golpearRecurso();}
            if(e.button===2){this.j.animarMano('izquierda');this.moverObjeto(-1);this.atacar();}
        });
        document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==this.renderer.domElement)return;this.ang.y-=e.movementX*.0024;this.ang.x-=e.movementY*.0024;const limite=Math.PI/2-.04;this.ang.x=THREE.MathUtils.clamp(this.ang.x,-limite,limite);if(e.buttons&2&&Math.abs(e.movementY)>1){this.j.animarMano('izquierda');this.atacar();}});
        window.addEventListener('resize',()=>{this.cam.aspect=window.innerWidth/window.innerHeight;this.cam.updateProjectionMatrix();this.renderer.setSize(window.innerWidth,window.innerHeight);});
    }
    getGroundHeightAt(x,z){try{if(this.mundo&&typeof this.mundo.altura==='function')return this.mundo.altura(x,z);}catch(e){}return 0;}
    esAgua(x,z){return !!(this.mundo&&typeof this.mundo.esAgua==='function'&&this.mundo.esAgua(x,z));}
    getWaterHeightAt(x,z){return this.mundo&&typeof this.mundo.getWaterHeightAt==='function'?this.mundo.getWaterHeightAt(x,z):null;}
    actualizarDiaNoche(dt){this.tiempo.avanzar(dt);const h=this.tiempo.hora,ang=h/24*Math.PI*2,noche=this.tiempo.esNoche();this.luzSol.position.set(Math.cos(ang)*10,Math.max(1,Math.sin(ang)*12),Math.sin(ang)*10);this.luzSol.intensity=noche?.08:.65;this.luzAmbiente.intensity=noche?.25:1;this.escena.background=new THREE.Color(noche?0x071126:0x87ceeb);}
    limpiarPartidaAnterior(){if(this.mundo&&this.mundo.chunks){for(const c of this.mundo.chunks.values()){c.objetos.forEach(o=>this.escena.remove(o));this.escena.remove(c.grupo);}this.mundo.chunks.clear();}if(this.j&&this.j.modelo&&this.j.modelo.parent)this.j.modelo.parent.remove(this.j.modelo);if(this.j&&this.j.leftHand&&this.j.leftHand.parent)this.j.leftHand.parent.remove(this.j.leftHand);if(this.j&&this.j.rightHand&&this.j.rightHand.parent)this.j.rightHand.parent.remove(this.j.rightHand);if(this.criaturas&&this.criaturas.lista)this.criaturas.lista.forEach(c=>{if(c.modelo&&c.modelo.parent)c.modelo.parent.remove(c.modelo);});this.j=null;this.mundo=null;this.criaturas=null;this.velocidadX=0;this.velocidadZ=0;this.velocidadY=0;}
    iniciar(){this.limpiarPartidaAnterior();this.tiempo.hora=8;try{if(typeof Jugador!=='undefined'){this.j=new Jugador();this.j.y=this.getGroundHeightAt(0,0)+this.alturaJugador;this.j.agregarAEscena(this.escena);this.j.conectarManosACamara(this.cam);}}catch(e){console.warn('Error creando jugador:',e);}try{if(typeof Mundo!=='undefined')this.mundo=new Mundo(this,window.WORLD_SEED||Math.floor(Math.random()*2147483647));}catch(e){console.warn('Error creando mundo:',e);}try{const datos={vaca:{vida:20,velocidad:.9},oveja:{vida:15,velocidad:.75},pollo:{vida:8,velocidad:1.15},pez:{vida:5,velocidad:1.35}};if(typeof GestorCriaturas!=='undefined')this.criaturas=new GestorCriaturas(this,datos);if(this.criaturas)this.criaturas.generarIniciales();}catch(e){console.warn('Error creando criaturas:',e);}this._actualizarCamara();let anterior=performance.now();const loop=ahora=>{const dt=Math.min(.05,(ahora-anterior)/1000);anterior=ahora;this._updateMovement(dt);this.actualizarDiaNoche(dt);try{if(this.j&&this.mundo)this.mundo.actualizar(this.j.x,this.j.z,dt);}catch(e){}this.actualizarObjetosSuelo(dt);try{if(this.criaturas)this.criaturas.actualizar(dt);}catch(e){}if(this.j){this.j.actualizarManos(dt);this.j.actualizarHUD();}this._actualizarCamara();this.renderer.render(this.escena,this.cam);requestAnimationFrame(loop);};requestAnimationFrame(loop);}
    saltar(){if(!this.j||(!this.enSuelo&&!this.enAgua)||this.profundidadAgua>.75)return;if(this.enAgua)this.velocidadY=this.fuerzaSalto*.72;else this.velocidadY=this.fuerzaSalto;this.enSuelo=false;this.j.saltando=true;}
    _updateMovement(dt){
        if(!this.j||!this.j.vivo)return;
        const f=(this.teclas.w?1:0)-(this.teclas.s?1:0),r=(this.teclas.d?1:0)-(this.teclas.a?1:0);let tx=0,tz=0;
        if(f||r){const l=Math.hypot(f,r),nf=f/l,nr=r/l,y=this.ang.y;
            // La cámara y el movimiento usan exactamente el mismo sistema de ejes.
            // W avanza hacia donde mira la cámara y A/D se mantienen a izquierda/derecha.
            tx=-Math.sin(y)*nf+Math.cos(y)*nr;
            tz=-Math.cos(y)*nf-Math.sin(y)*nr;
        }
        this.enAgua=this.esAgua(this.j.x,this.j.z);const agua=this.enAgua?this.getWaterHeightAt(this.j.x,this.j.z):null;this.profundidadAgua=agua===null?0:Math.max(0,agua-this.j.y);
        const corriendo=!!this.teclas.shift&&!!(f||r)&&!this.enAgua;this.j.corriendo=corriendo;const objetivo=(corriendo?this.velocidadCorrer:this.velocidadCaminar)*(this.enAgua?.55:1);
        const targetX=tx*objetivo,targetZ=tz*objetivo,cambio=Math.min(1,(f||r)?this.aceleracion*60*dt:this.frenado*60*dt);this.velocidadX+=(targetX-this.velocidadX)*cambio;this.velocidadZ+=(targetZ-this.velocidadZ)*cambio;
        if(!f&&!r&&Math.hypot(this.velocidadX,this.velocidadZ)<.03){this.velocidadX=0;this.velocidadZ=0;}
        this.j.x+=this.velocidadX*dt;this.j.z+=this.velocidadZ*dt;this.enAgua=this.esAgua(this.j.x,this.j.z);const water=this.enAgua?this.getWaterHeightAt(this.j.x,this.j.z):null;
        if(this.enAgua&&water!==null){const superficie=water+this.alturaJugador*.35;const controlVertical=(this.teclas[' ']?1:0)-(this.teclas.control?1:0);this.velocidadY+=(superficie-this.j.y)*7*dt+controlVertical*9*dt;this.velocidadY*=Math.pow(.16,dt);this.j.y+=this.velocidadY*dt;this.j.y=Math.max(this.getGroundHeightAt(this.j.x,this.j.z)+.18,Math.min(water+.25,this.j.y));this.enSuelo=false;this.j.saltando=false;}
        else{this.profundidadAgua=0;this.velocidadY-=this.gravedad*dt;this.j.y+=this.velocidadY*dt;const suelo=this.getGroundHeightAt(this.j.x,this.j.z)+this.alturaJugador;if(this.j.y<=suelo){this.j.y=suelo;this.velocidadY=0;this.enSuelo=true;this.j.saltando=false;}else this.enSuelo=false;}
        if(water!==null&&this.enAgua)this.profundidadAgua=Math.max(0,water-this.j.y);this.j.velocidadMovimiento=Math.hypot(this.velocidadX,this.velocidadZ);this.j.actualizarPosicion();
    }
    _actualizarCamara(){if(!this.j)return;this.cam.rotation.order='YXZ';if(this.cameraMode==='first'){this.cam.position.set(this.j.x,this.j.y+this.alturaCamara,this.j.z);this.cam.rotation.y=this.ang.y;this.cam.rotation.x=this.ang.x;}else{const distancia=3.2,alto=1.7;this.cam.position.set(this.j.x+Math.sin(this.ang.y)*distancia,this.j.y+alto-Math.sin(this.ang.x)*.5,this.j.z+Math.cos(this.ang.y)*distancia);this.cam.lookAt(this.j.x,this.j.y+1.0,this.j.z);}}
    toggleCamera(){this.cameraMode=this.cameraMode==='first'?'third':'first';if(this.j&&this.j.setFirstPerson)this.j.setFirstPerson(this.cameraMode==='first');}
    crearObjeto(id,nombre,x,z,qty=1){const colores={madera:0x8b5a2b,palo:0xc48a4a,piedra:0x8d99a6,tierra:0x6e3b1c,pala_madera:0xc48a4a,pico_piedra:0x8d99a6};const geo=id==='palo'?new THREE.CylinderGeometry(.07,.07,.8,6):new THREE.DodecahedronGeometry(.18+(id==='madera'?.12:0),0);const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:colores[id]||0xffd166}));m.castShadow=true;m.receiveShadow=true;m.position.set(x,this.getGroundHeightAt(x,z)+.25,z);m.rotation.set(Math.random()*2,Math.random()*2,0);m.userData.pickup={id,name:nombre||id,qty};m.userData.velY=.8+Math.random()*1.4;m.userData.suelo=true;this.escena.add(m);this.objetosSuelo.push(m);return m;}
    soltarRecursos(recursos,pos){Object.entries(recursos||{}).forEach(([id,qty],i)=>{for(let n=0;n<qty;n++){const a=Math.random()*Math.PI*2,d=.3+Math.random()*1.1;this.crearObjeto(id,id,pos.x+Math.cos(a)*d,pos.z+Math.sin(a)*d,1);}});}
    actualizarObjetosSuelo(dt){for(const o of this.objetosSuelo){if(!o.parent)continue;o.userData.velY-=12*dt;o.position.y+=o.userData.velY*dt;const suelo=this.getGroundHeightAt(o.position.x,o.position.z)+.14;if(o.position.y<suelo){o.position.y=suelo;o.userData.velY*=-.22;if(Math.abs(o.userData.velY)<.12)o.userData.velY=0;}o.rotation.y+=dt*.9;}}
    objetosCercanos(radio=3){if(!this.j)return[];return this.objetosSuelo.filter(o=>o.parent&&Math.hypot(o.position.x-this.j.x,o.position.z-this.j.z)<=radio);}
    retirarObjeto(o){const i=this.objetosSuelo.indexOf(o);if(i>=0)this.objetosSuelo.splice(i,1);if(o.parent)o.parent.remove(o);}
    equiparCercano(){const hit=this.encontrarHit();let o=hit&&hit.object;while(o&&!o.userData.pickup)o=o.parent;if(!o){o=this.objetosCercanos(2.5).sort((a,b)=>a.position.distanceTo(this.cam.position)-b.position.distanceTo(this.cam.position))[0];}if(!o){this.desequipar();return;}this.desequipar();this.retirarObjeto(o);this.equipado=o;this.j.rightHand.add(o);o.position.set(.02,-.24,-.2);o.scale.setScalar(1.6);this.mostrarMensaje(`En mano: ${o.userData.pickup.name}`);}
    desequipar(){if(!this.equipado)return;const o=this.equipado;this.equipado=null;const p=this.j.rightHand.getWorldPosition(new THREE.Vector3());this.crearObjeto(o.userData.pickup.id,o.userData.pickup.name,p.x,p.z,o.userData.pickup.qty);this.j.rightHand.remove(o);}
    moverObjeto(direccion){const hit=this.encontrarHit();let o=hit&&hit.object;while(o&&!o.userData.pickup)o=o.parent;if(!o||!o.userData.suelo)return;const dir=new THREE.Vector3();this.cam.getWorldDirection(dir);o.position.addScaledVector(dir,direccion*.7);o.userData.velY=.7;}
    encontrarHit(){const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),this.cam);return ray.intersectObjects(this.escena.children,true).find(h=>h.distance<=4)||null;}
    encontrarObjetivo(){let o=(this.encontrarHit()||{}).object;while(o){if(o.userData&&o.userData.recurso)return o;o=o.parent;}return null;}
    golpearRecurso(){const ahora=performance.now();if(ahora-this.ultimoGolpe<350)return;this.ultimoGolpe=ahora;const hit=this.encontrarHit();let pickup=hit&&hit.object;while(pickup&&!pickup.userData.pickup)pickup=pickup.parent;if(pickup&&pickup.userData.suelo){this.moverObjeto(1);return;}let o=hit&&hit.object;while(o&&!(o.userData&&o.userData.recurso))o=o.parent;if(o&&o.parent&&o.parent.userData.arbol)o=o.parent;if(o&&o.userData.recurso){if(o.userData.arbol){o.userData.vida-=(this.equipado&&this.equipado.userData.pickup.id==='hacha')?2:1;if(o.userData.vida<=0)this.mundo.derribarArbol(o);return;}this.soltarRecursos(o.userData.recurso,o.getWorldPosition(new THREE.Vector3()));if(o.parent)o.parent.remove(o);return;}if(!this.equipado||this.equipado.userData.pickup.id!=='pala_madera'){this.mostrarMensaje('Equipa una pala de madera con E para excavar.');return;}const bloque=this.mundo&&this.mundo.destruirBloque(hit);if(bloque){this.crearObjeto('tierra','tierra',bloque.x,bloque.z);const veta=this.mundo.ruidoSuave(bloque.x*19.7,bloque.z*31.1);if(veta<.38)this.crearObjeto('piedra','piedra encontrada bajo tierra',bloque.x+.15,bloque.z+.15);}}
    mostrarMensaje(texto){let e=document.getElementById('mensaje-recursos');if(!e){e=document.createElement('div');e.id='mensaje-recursos';e.style.cssText='position:fixed;left:50%;bottom:18%;transform:translateX(-50%);z-index:10001;color:#fff;background:rgba(0,0,0,.7);padding:8px 12px;border-radius:6px';document.body.appendChild(e);}e.textContent=texto;clearTimeout(this._mensajeTimer);this._mensajeTimer=setTimeout(()=>e.remove(),1700);}
    agarrar(){this.equiparCercano();}
    atacar(){if(this.criaturas&&typeof this.criaturas.recibirDaño==='function')this.criaturas.recibirDaño(10);}
}
window.Motor=Motor;

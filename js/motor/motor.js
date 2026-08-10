class Motor {
    constructor() {
        this.escena=new THREE.Scene(); this.cam=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,.1,1000);
        this.renderer=new THREE.WebGLRenderer({antialias:true}); this.renderer.setSize(window.innerWidth,window.innerHeight); this.renderer.domElement.id='canvas-3d'; document.body.appendChild(this.renderer.domElement);
        this.ang={x:0,y:0}; this.teclas={}; this.cameraMode='first'; this.j=null; this.mundo=null; this.criaturas=null; this.inv=null;
        this.velocidadCaminar=.10; this.velocidadCorrer=.20; this.velocidadY=0; this.gravedad=.018; this.fuerzaSalto=.32; this.enSuelo=true; this.alturaJugador=.6;
        this.escena.add(new THREE.HemisphereLight(0xffffff,0x444444,1)); const luz=new THREE.DirectionalLight(0xffffff,.6); luz.position.set(5,10,7); this.escena.add(luz);
        window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();this.teclas[k]=true;if(['w','a','s','d',' ','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k===' '&&!e.repeat)this.saltar();if(k==='e'&&this.inv&&typeof this.inv.toggle==='function')this.inv.toggle();});
        window.addEventListener('keyup',e=>{this.teclas[e.key.toLowerCase()]=false;});
        this.renderer.domElement.addEventListener('click',()=>{if(document.pointerLockElement!==this.renderer.domElement)this.renderer.domElement.requestPointerLock();});
        document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==this.renderer.domElement)return;this.ang.y-=e.movementX*.0025;this.ang.x-=e.movementY*.0025;const l=Math.PI/2-.05;this.ang.x=Math.max(-l,Math.min(l,this.ang.x));});
        window.addEventListener('resize',()=>{this.cam.aspect=window.innerWidth/window.innerHeight;this.cam.updateProjectionMatrix();this.renderer.setSize(window.innerWidth,window.innerHeight);});
    }
    getGroundHeightAt(x,z){try{if(this.mundo&&typeof this.mundo.altura==='function')return this.mundo.altura(x,z);}catch(e){console.warn('Error obteniendo altura:',e);}return 0;}
    iniciar(){
        try{if(typeof Jugador!=='undefined'){this.j=new Jugador();this.j.x=0;this.j.z=0;this.j.y=this.getGroundHeightAt(0,0)+this.alturaJugador;this.j.agregarAEscena(this.escena);this.j.actualizarPosicion();}}catch(e){console.warn('Error creando jugador:',e);}
        try{if(typeof Mundo!=='undefined')this.mundo=new Mundo(this);}catch(e){console.warn('Error creando mundo:',e);}
        try{const criaturaData={vaca:{vida:20,velocidad:.014},oveja:{vida:15,velocidad:.012},pollo:{vida:8,velocidad:.018}};if(typeof GestorCriaturas!=='undefined')this.criaturas=new GestorCriaturas(this,criaturaData);if(this.criaturas)this.criaturas.generarIniciales();}catch(e){console.warn('Error creando criaturas:',e);}
        this._actualizarCamara(); const loop=()=>{this._updateMovement();try{if(this.j&&this.mundo&&typeof this.mundo.actualizar==='function')this.mundo.actualizar(this.j.x,this.j.z);}catch(e){console.warn('Error actualizando mundo:',e);}try{if(this.criaturas&&typeof this.criaturas.actualizar==='function')this.criaturas.actualizar();}catch(e){console.warn('Error actualizando criaturas:',e);}if(this.j&&typeof this.j.actualizarHUD==='function')this.j.actualizarHUD();this._actualizarCamara();this.renderer.render(this.escena,this.cam);requestAnimationFrame(loop);}; requestAnimationFrame(loop);
    }
    saltar(){if(!this.j||!this.enSuelo)return;this.velocidadY=this.fuerzaSalto;this.enSuelo=false;}
    _updateMovement(){if(!this.j)return;const f=(this.teclas.w?1:0)-(this.teclas.s?1:0),r=(this.teclas.d?1:0)-(this.teclas.a?1:0);let dx=0,dz=0;if(f||r){const y=this.ang.y;dx=Math.cos(y)*f-Math.sin(y)*r;dz=Math.sin(y)*f+Math.cos(y)*r;const l=Math.hypot(dx,dz);if(l){dx/=l;dz/=l;}const v=this.teclas.shift?this.velocidadCorrer:this.velocidadCaminar;this.j.x+=dx*v;this.j.z+=dz*v;}this.velocidadY-=this.gravedad;this.j.y+=this.velocidadY;const suelo=this.getGroundHeightAt(this.j.x,this.j.z)+this.alturaJugador;if(this.j.y<=suelo){this.j.y=suelo;this.velocidadY=0;this.enSuelo=true;}else this.enSuelo=false;if(typeof this.j.actualizarPosicion==='function')this.j.actualizarPosicion();}
    _actualizarCamara(){if(!this.j)return;this.cam.rotation.order='YXZ';if(this.cameraMode==='first'){this.cam.position.set(this.j.x,this.j.y+.4,this.j.z);this.cam.rotation.y=this.ang.y;this.cam.rotation.x=this.ang.x;return;}const d=5,h=2.5;this.cam.position.set(this.j.x-Math.sin(this.ang.y)*d,this.j.y+h,this.j.z-Math.cos(this.ang.y)*d);this.cam.lookAt(this.j.x,this.j.y+.7,this.j.z);}
    toggleCamera(){this.cameraMode=this.cameraMode==='first'?'third':'first';}
    atacar(){if(this.criaturas&&typeof this.criaturas.recibirDaño==='function')this.criaturas.recibirDaño(10);}
}
window.Motor=Motor;

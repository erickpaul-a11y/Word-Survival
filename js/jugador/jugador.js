class Jugador {
    constructor(){
        this.x=0; this.y=0; this.z=0;
        this.hp=100; this.maxHp=100; this.mana=100; this.hambre=100;
        this.nivel=1; this.exp=0; this.expSig=120; this.vivo=true;
        this.corriendo=false; this.saltando=false; this.velocidadMovimiento=0;
        const piel=new THREE.MeshLambertMaterial({color:0xc98b62});
        const ropa=new THREE.MeshLambertMaterial({color:0x2563eb});
        const oscuro=new THREE.MeshLambertMaterial({color:0x1f2937});
        this.modelo=new THREE.Group();
        this.modelo.name='JugadorModeloHumano';
        const torso=new THREE.Mesh(new THREE.BoxGeometry(.58,.72,.34),ropa); torso.position.y=1.13;
        const cabeza=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.42),piel); cabeza.position.y=1.70;
        const brazoI=new THREE.Mesh(new THREE.BoxGeometry(.18,.68,.18),piel.clone()), brazoD=new THREE.Mesh(new THREE.BoxGeometry(.18,.68,.18),piel.clone());
        brazoI.position.set(-.39,1.13,0); brazoD.position.set(.39,1.13,0);
        const piernaI=new THREE.Mesh(new THREE.BoxGeometry(.22,.78,.22),oscuro), piernaD=new THREE.Mesh(new THREE.BoxGeometry(.22,.78,.22),oscuro.clone());
        piernaI.position.set(-.17,.39,0); piernaD.position.set(.17,.39,0);
        this.modelo.add(torso,cabeza,brazoI,brazoD,piernaI,piernaD);
        this.modelo.userData.esJugador=true;
        this.leftShoulder=brazoI; this.rightShoulder=brazoD;
        this.leftHand=new THREE.Mesh(new THREE.BoxGeometry(.19,.34,.19),piel.clone());
        this.rightHand=new THREE.Mesh(new THREE.BoxGeometry(.19,.34,.19),piel.clone());
        this.leftHand.name='ManoIzquierda'; this.rightHand.name='ManoDerecha';
        this.leftHand.position.set(-.38,-.24,-.78); this.rightHand.position.set(.38,-.24,-.78);
        this.leftHand.rotation.z=-.18; this.rightHand.rotation.z=.18;
        this.leftHand.renderOrder=20; this.rightHand.renderOrder=20;
        this.leftHand.frustumCulled=false; this.rightHand.frustumCulled=false;
        this._baseL=this.leftHand.position.clone(); this._baseR=this.rightHand.position.clone();
        this._baseRL=this.leftHand.rotation.z; this._baseRR=this.rightHand.rotation.z;
        this._golpeL=0; this._golpeR=0;
    }
    agregarAEscena(e){e.add(this.modelo);this.modelo.visible=true;}
    conectarManosACamara(cam){
        if(this.leftHand.parent)this.leftHand.parent.remove(this.leftHand);
        if(this.rightHand.parent)this.rightHand.parent.remove(this.rightHand);
        cam.add(this.leftHand,this.rightHand);
        this.leftHand.visible=true; this.rightHand.visible=true;
    }
    animarMano(lado){if(lado==='izquierda')this._golpeL=1;else this._golpeR=1;}
    actualizarManos(dt){
        const s=Math.min(1,dt*18); this._golpeL=Math.max(0,this._golpeL-dt*5); this._golpeR=Math.max(0,this._golpeR-dt*5);
        const l=this._golpeL,r=this._golpeR;
        this.leftHand.position.lerp(new THREE.Vector3(this._baseL.x-.16*l,this._baseL.y-.10*l,this._baseL.z+.30*l),s);
        this.rightHand.position.lerp(new THREE.Vector3(this._baseR.x+.16*r,this._baseR.y-.10*r,this._baseR.z+.30*r),s);
        this.leftHand.rotation.z=this._baseRL-.9*l; this.rightHand.rotation.z=this._baseRR+.9*r;
    }
    actualizarPosicion(){
        // j.y representa la base/pies del jugador; el modelo de 1.8 unidades nace desde ahí.
        this.modelo.position.set(this.x,this.y,this.z);
        this.modelo.visible=true;
    }
    animarMovimiento(){}
    setFirstPerson(primera){
        this.modelo.visible=true;
        this.leftHand.visible=true; this.rightHand.visible=true;
    }
    actualizarHUD(){
        const ids=[['lvl',this.nivel],['pos',`X:${Math.round(this.x)} Z:${Math.round(this.z)}`]];
        ids.forEach(([id,value])=>{const e=document.getElementById(id);if(e)e.textContent=value;});
        [['b-hp',this.hp],['b-mana',this.mana],['b-exp',(this.exp/this.expSig)*100],['b-hambre',this.hambre]].forEach(([id,value])=>{const e=document.getElementById(id);if(e)e.style.width=Math.max(0,Math.min(100,value))+'%';});
    }
    recibirDaño(cantidad){if(!this.vivo)return;this.hp=Math.max(0,this.hp-(Number(cantidad)||0));if(this.hp<=0)this.vivo=false;}
    curar(cantidad){this.hp=Math.min(this.maxHp,this.hp+(Number(cantidad)||0));}
    ganarExperiencia(cantidad){this.exp+=Number(cantidad)||0;while(this.exp>=this.expSig){this.exp-=this.expSig;this.nivel++;this.expSig=Math.ceil(this.expSig*1.2);}}
}
window.Jugador=Jugador;

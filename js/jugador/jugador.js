class Jugador {
    constructor(){
        this.x=0; this.y=0; this.z=0;
        this.hp=100; this.maxHp=100; this.mana=100; this.hambre=100;
        this.nivel=1; this.exp=0; this.expSig=120; this.vivo=true;
        this.corriendo=false; this.saltando=false; this.velocidadMovimiento=0;

        // Cuerpo eliminado: en primera persona solo se ven las manos.
        this.modelo=new THREE.Group();
        this.modelo.name='JugadorModeloInvisible';
        this.modelo.userData.esJugador=true;

        const piel=new THREE.MeshLambertMaterial({color:0xc98b62});
        this.leftHand=new THREE.Mesh(new THREE.BoxGeometry(.19,.34,.19),piel.clone());
        this.rightHand=new THREE.Mesh(new THREE.BoxGeometry(.19,.34,.19),piel.clone());
        this.leftHand.name='ManoIzquierda';
        this.rightHand.name='ManoDerecha';
        this.leftHand.position.set(-.38,-.24,-.78);
        this.rightHand.position.set(.38,-.24,-.78);
        this.leftHand.rotation.z=-.18;
        this.rightHand.rotation.z=.18;
        this.leftHand.renderOrder=20;
        this.rightHand.renderOrder=20;
        this.leftHand.frustumCulled=false;
        this.rightHand.frustumCulled=false;
        this._baseL=this.leftHand.position.clone();
        this._baseR=this.rightHand.position.clone();
        this._baseRL=this.leftHand.rotation.z;
        this._baseRR=this.rightHand.rotation.z;
        this._golpeL=0;
        this._golpeR=0;
    }

    agregarAEscena(e){}

    conectarManosACamara(cam){
        if(this.leftHand.parent)this.leftHand.parent.remove(this.leftHand);
        if(this.rightHand.parent)this.rightHand.parent.remove(this.rightHand);
        cam.add(this.leftHand,this.rightHand);
        this.leftHand.visible=true;
        this.rightHand.visible=true;
    }

    animarMano(lado){
        if(lado==='izquierda')this._golpeL=1;
        else this._golpeR=1;
    }

    actualizarManos(dt){
        const s=Math.min(1,dt*18);
        this._golpeL=Math.max(0,this._golpeL-dt*5);
        this._golpeR=Math.max(0,this._golpeR-dt*5);
        const l=this._golpeL,r=this._golpeR;
        this.leftHand.position.lerp(new THREE.Vector3(this._baseL.x-.16*l,this._baseL.y-.10*l,this._baseL.z+.30*l),s);
        this.rightHand.position.lerp(new THREE.Vector3(this._baseR.x+.16*r,this._baseR.y-.10*r,this._baseR.z+.30*r),s);
        this.leftHand.rotation.z=this._baseRL-.9*l;
        this.rightHand.rotation.z=this._baseRR+.9*r;
    }

    actualizarPosicion(){
        this.modelo.position.set(this.x,this.y,this.z);
        this.modelo.visible=false;
    }

    animarMovimiento(){}

    setFirstPerson(primera){
        this.modelo.visible=false;
        this.leftHand.visible=true;
        this.rightHand.visible=true;
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

class Jugador {
    constructor(){
        this.x=0; this.y=0; this.z=0;
        this.hp=100; this.maxHp=100; this.mana=100; this.hambre=100;
        this.nivel=1; this.exp=0; this.expSig=120; this.vivo=true;
        this.corriendo=false; this.saltando=false; this.velocidadMovimiento=0;

        this.modelo=new THREE.Group();
        this.modelo.name='JugadorModelo';
        this.modelo.userData.esJugador=true;

        const piel=new THREE.MeshLambertMaterial({color:0xc98b62,flatShading:true});
        const pelo=new THREE.MeshLambertMaterial({color:0x151515,flatShading:true});
        const ropa=new THREE.MeshLambertMaterial({color:0x315f8f,flatShading:true});
        const pantalon=new THREE.MeshLambertMaterial({color:0x273447,flatShading:true});
        const negro=new THREE.MeshLambertMaterial({color:0x101010,flatShading:true});

        const cuerpo=new THREE.Mesh(new THREE.BoxGeometry(.58,.82,.34),ropa);
        cuerpo.position.y=1.05;this.modelo.add(cuerpo);

        const cabeza=new THREE.Mesh(new THREE.IcosahedronGeometry(.34,1),piel);
        cabeza.position.y=1.72;cabeza.userData.tipo='piel';this.modelo.add(cabeza);

        const cabello=new THREE.Mesh(new THREE.BoxGeometry(.58,.16,.40),pelo);
        cabello.position.set(0,2.00,0);this.modelo.add(cabello);

        const piernas=[];
        [-.17,.17].forEach(x=>{const pierna=new THREE.Mesh(new THREE.BoxGeometry(.22,.72,.25),pantalon);pierna.position.set(x,.28,0);this.modelo.add(pierna);piernas.push(pierna);});

        const brazos=[];
        [-.40,.40].forEach(x=>{const brazo=new THREE.Mesh(new THREE.BoxGeometry(.18,.68,.20),ropa);brazo.position.set(x,1.08,0);this.modelo.add(brazo);brazos.push(brazo);});

        [-.13,.13].forEach(x=>{const ojo=new THREE.Mesh(new THREE.BoxGeometry(.055,.07,.035),negro);ojo.position.set(x,1.76,.315);this.modelo.add(ojo);});

        this.modelo.userData.animacion={piernas,brazos};
        this.modelo.visible=false;

        this.leftHand=new THREE.Mesh(new THREE.BoxGeometry(.12,.20,.12),piel.clone());
        this.rightHand=new THREE.Mesh(new THREE.BoxGeometry(.12,.20,.12),piel.clone());
        this.leftHand.name='ManoIzquierda';this.rightHand.name='ManoDerecha';
        this.leftHand.userData.tipo='piel';this.rightHand.userData.tipo='piel';
        this.leftHand.position.set(-.28,-.20,-.62);this.rightHand.position.set(.28,-.20,-.62);
        this.leftHand.rotation.z=-.18;this.rightHand.rotation.z=.18;
        this.leftHand.renderOrder=20;this.rightHand.renderOrder=20;
        this.leftHand.frustumCulled=false;this.rightHand.frustumCulled=false;
        this._baseL=this.leftHand.position.clone();this._baseR=this.rightHand.position.clone();
        this._baseRL=this.leftHand.rotation.z;this._baseRR=this.rightHand.rotation.z;
        this._golpeL=0;this._golpeR=0;this._tiempoAnimacion=0;
    }

    agregarAEscena(e){if(!e)return;if(this.modelo.parent)this.modelo.parent.remove(this.modelo);e.add(this.modelo);this.actualizarPosicion();}
    conectarManosACamara(cam){if(!cam)return;if(this.leftHand.parent)this.leftHand.parent.remove(this.leftHand);if(this.rightHand.parent)this.rightHand.parent.remove(this.rightHand);cam.add(this.leftHand,this.rightHand);this.leftHand.visible=true;this.rightHand.visible=true;}
    animarMano(lado){if(lado==='izquierda')this._golpeL=1;else this._golpeR=1;}
    actualizarManos(dt){const s=Math.min(1,dt*18);this._golpeL=Math.max(0,this._golpeL-dt*5);this._golpeR=Math.max(0,this._golpeR-dt*5);const l=this._golpeL,r=this._golpeR;this.leftHand.position.lerp(new THREE.Vector3(this._baseL.x-.10*l,this._baseL.y-.06*l,this._baseL.z+.22*l),s);this.rightHand.position.lerp(new THREE.Vector3(this._baseR.x+.10*r,this._baseR.y-.06*r,this._baseR.z+.22*r),s);this.leftHand.rotation.z=this._baseRL-.9*l;this.rightHand.rotation.z=this._baseRR+.9*r;}
    actualizarPosicion(){this.modelo.position.set(this.x,this.y,this.z);}
    animarMovimiento(dt=.016){const a=this.modelo.userData.animacion;if(!a)return;this._tiempoAnimacion+=dt*9;const paso=Math.sin(this._tiempoAnimacion)*.45*(this.corriendo?1.25:1);a.piernas.forEach((p,i)=>p.rotation.x=paso*(i%2?-1:1));a.brazos.forEach((b,i)=>b.rotation.x=paso*(i%2?1:-1));}
    setFirstPerson(primera){this.modelo.visible=!primera;this.leftHand.visible=primera;this.rightHand.visible=primera;}
    actualizarHUD(){const ids=[['lvl',this.nivel],['pos',`X:${Math.round(this.x)} Z:${Math.round(this.z)}`]];ids.forEach(([id,value])=>{const e=document.getElementById(id);if(e)e.textContent=value;});[['b-hp',this.hp],['b-mana',this.mana],['b-exp',(this.exp/this.expSig)*100],['b-hambre',this.hambre]].forEach(([id,value])=>{const e=document.getElementById(id);if(e)e.style.width=Math.max(0,Math.min(100,value))+'%';});}
    recibirDaño(cantidad){if(!this.vivo)return;this.hp=Math.max(0,this.hp-(Number(cantidad)||0));if(this.hp<=0)this.vivo=false;}
    curar(cantidad){this.hp=Math.min(this.maxHp,this.hp+(Number(cantidad)||0));}
    ganarExperiencia(cantidad){this.exp+=Number(cantidad)||0;while(this.exp>=this.expSig){this.exp-=this.expSig;this.nivel++;this.expSig=Math.ceil(this.expSig*1.2);}}
}
window.Jugador=Jugador;

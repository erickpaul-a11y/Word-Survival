class Jugador {
    constructor(){
        this.x=0; this.y=0; this.z=0;
        this.hp=100; this.maxHp=100; this.mana=100; this.hambre=100;
        this.nivel=1; this.exp=0; this.expSig=120; this.vivo=true;
        this.corriendo=false; this.saltando=false; this.velocidadMovimiento=0;
        this.modelo=null;
        this.leftShoulder=null; this.rightShoulder=null;
        this.leftHand=null; this.rightHand=null;
    }
    agregarAEscena(){}
    actualizarPosicion(){}
    animarMovimiento(){}
    setFirstPerson(){}
    actualizarManos(){}
    seguirMouse(){}
    recibirDaño(cantidad){if(!this.vivo)return;this.hp=Math.max(0,this.hp-(Number(cantidad)||0));if(this.hp<=0)this.vivo=false;}
    curar(cantidad){this.hp=Math.min(this.maxHp,this.hp+(Number(cantidad)||0));}
    ganarExperiencia(cantidad){this.exp+=Number(cantidad)||0;while(this.exp>=this.expSig){this.exp-=this.expSig;this.nivel++;this.expSig=Math.ceil(this.expSig*1.2);}}
    actualizarHUD(){
        const ids=[['lvl',this.nivel],['pos',`X:${Math.round(this.x)} Z:${Math.round(this.z)}`]];
        ids.forEach(([id,value])=>{const e=document.getElementById(id);if(e)e.textContent=value;});
        [['b-hp',this.hp],['b-mana',this.mana],['b-exp',(this.exp/this.expSig)*100],['b-hambre',this.hambre]].forEach(([id,value])=>{const e=document.getElementById(id);if(e)e.style.width=Math.max(0,Math.min(100,value))+'%';});
    }
}
window.Jugador=Jugador;

class Crafteos {
    constructor(motor){this.m=motor;this.panel=this.crearPanel();this.iniciar();}
    crearPanel(){const p=document.createElement('div');p.id='crafting-panel';p.style.cssText='position:absolute;left:20px;top:60px;width:330px;background:rgba(20,20,20,.94);color:white;padding:12px;border-radius:8px;z-index:9998;display:none';p.innerHTML='<b>Crafteos</b><small style="display:block;margin:6px 0">Sin inventario: el verificador usa únicamente los objetos que tienes en las dos manos.</small><div id="recipes"></div>';document.body.appendChild(p);return p;}
    receta(nombre,coste,resultado,qty){const row=document.createElement('button');row.style.cssText='display:block;width:100%;margin:7px 0;padding:8px;cursor:pointer';row.textContent=nombre;row.onclick=()=>this.fabricar(coste,resultado,qty);this.panel.querySelector('#recipes').appendChild(row);}
    verificarObjeto(o,id){return !!(o&&o.parent&&o.userData&&o.userData.pickup&&o.userData.pickup.id===id&&o.userData.mano);}
    manos(){return [this.m.manoDerechaObjeto,this.m.manoIzquierdaObjeto].filter(Boolean);}
    fabricar(coste,resultado,qty){
        const manos=this.manos();
        const usados=[];
        for(const [id,n] of Object.entries(coste)){
            const encontrados=manos.filter(o=>!usados.includes(o)&&this.verificarObjeto(o,id));
            if(encontrados.length<n){this.m.mostrarMensaje(`Falta ${id} en las manos.`);return;}
            usados.push(...encontrados.slice(0,n));
        }
        if(!usados.length){this.m.mostrarMensaje('No tienes materiales en las manos.');return;}
        const posiciones=usados.map(o=>o.parent.getWorldPosition(new THREE.Vector3()));
        usados.forEach(o=>{const lado=o.userData.mano;if(lado==='derecha')this.m.manoDerechaObjeto=null;else if(lado==='izquierda')this.m.manoIzquierdaObjeto=null;o.parent.remove(o);});
        // El objeto fabricado no desaparece: aparece físicamente en una mano libre o en el suelo.
        const manoLibre=!this.m.manoDerechaObjeto?'derecha':!this.m.manoIzquierdaObjeto?'izquierda':null;
        const p=posiciones[0]||new THREE.Vector3(this.m.j.x+.7,this.m.j.y,this.m.j.z+.7);
        const creado=this.m.crearObjeto(resultado,resultado,p.x,p.z,qty,p.y);
        if(creado&&manoLibre&&this.m.j){
            this.m.retirarObjeto(creado);
            const mano=manoLibre==='derecha'?this.m.j.rightHand:this.m.j.leftHand;
            mano.add(creado);creado.position.set(0,-.22,-.16);creado.rotation.set(0,0,manoLibre==='izquierda'?.12:-.12);creado.scale.setScalar(1.15);creado.userData.mano=manoLibre;
            if(manoLibre==='derecha')this.m.manoDerechaObjeto=creado;else this.m.manoIzquierdaObjeto=creado;
        }
        this.m.mostrarMensaje(`Creaste: ${resultado}`);
    }
    iniciar(){this.receta('2 madera → 4 palos',{madera:2},'palo',4);this.receta('2 madera + 2 palos → pala de madera',{madera:2,palo:2},'pala_madera',1);this.receta('3 piedra + 2 madera + 2 palos → pico de piedra',{piedra:3,madera:2,palo:2},'pico_piedra',1);this.receta('3 piedra + 3 madera → hacha',{piedra:3,madera:3},'hacha',1);}
    toggle(){this.panel.style.display=this.panel.style.display==='none'?'block':'none';}
}
window.Crafteos=Crafteos;

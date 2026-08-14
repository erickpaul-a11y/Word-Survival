class Crafteos {
    constructor(motor){this.m=motor;this.panel=this.crearPanel();this.iniciar();}
    crearPanel(){const p=document.createElement('div');p.id='crafting-panel';p.style.cssText='position:absolute;left:20px;top:60px;width:300px;background:rgba(20,20,20,.94);color:white;padding:12px;border-radius:8px;z-index:9998;display:none';p.innerHTML='<b>Crafteos cercanos (C)</b><small style="display:block;margin:6px 0">Solo usa objetos que estén a tu alrededor.</small><div id="recipes"></div>';document.body.appendChild(p);return p;}
    receta(nombre,coste,resultado,qty){const row=document.createElement('button');row.style.cssText='display:block;width:100%;margin:7px 0;padding:8px;cursor:pointer';row.textContent=nombre;row.onclick=()=>this.fabricar(coste,resultado,qty);this.panel.querySelector('#recipes').appendChild(row);}
    fabricar(coste,resultado,qty){const cerca=this.m.objetosCercanos(3),usar=[];for(const [id,n] of Object.entries(coste)){const encontrados=cerca.filter(o=>o.userData.pickup.id===id);if(encontrados.length<n){this.m.mostrarMensaje('Faltan materiales cerca de ti.');return;}usar.push(...encontrados.slice(0,n));}usar.forEach(o=>this.m.retirarObjeto(o));this.m.crearObjeto(resultado,resultado,this.m.j.x+.7,this.m.j.z+.7,qty);this.m.mostrarMensaje(`Creaste: ${resultado}`);}
    iniciar(){this.receta('2 madera → 4 palos',{madera:2},'palo',4);this.receta('2 madera + 2 palos → pala de madera',{madera:2,palo:2},'pala_madera',1);this.receta('3 piedra + 2 madera + 2 palos → pico de piedra',{piedra:3,madera:2,palo:2},'pico_piedra',1);this.receta('3 piedra + 3 madera → hacha',{piedra:3,madera:3},'hacha',1);}
    toggle(){this.panel.style.display=this.panel.style.display==='none'?'block':'none';}
}
window.Crafteos=Crafteos;

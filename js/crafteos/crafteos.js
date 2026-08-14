class Crafteos {
    constructor(inventario){this.inv=inventario;this.panel=this.crearPanel();this.iniciar();}
    crearPanel(){const p=document.createElement('div');p.id='crafting-panel';p.style.cssText='position:absolute;left:20px;top:60px;width:280px;background:rgba(20,20,20,.94);color:white;padding:12px;border-radius:8px;z-index:9998;display:none';p.innerHTML='<b>Crafteos (C)</b><div id="recipes"></div>';document.body.appendChild(p);return p;}
    receta(nombre,coste,resultado,qty){const row=document.createElement('button');row.style.cssText='display:block;width:100%;margin:7px 0;padding:8px;cursor:pointer';row.textContent=nombre;row.onclick=()=>{for(const [id,n] of Object.entries(coste)){if(!this.inv.items[id]||this.inv.items[id].qty<n)return alert('Faltan materiales');}for(const [id,n] of Object.entries(coste)){this.inv.items[id].qty-=n;if(this.inv.items[id].qty<=0)delete this.inv.items[id];}this.inv.agregar(resultado,qty,resultado);};this.panel.querySelector('#recipes').appendChild(row);}
    iniciar(){this.receta('2 madera → 4 palos',{madera:2},'palo',4);this.receta('2 madera + 2 palos → pala de madera',{madera:2,palo:2},'pala_madera',1);this.receta('3 piedra + 2 madera + 2 palos → pico de piedra',{piedra:3,madera:2,palo:2},'pico_piedra',1);this.receta('3 piedra + 3 madera → hacha',{piedra:3,madera:3},'hacha',1);}
    toggle(){this.panel.style.display=this.panel.style.display==='none'?'block':'none';}
}
window.Crafteos=Crafteos;

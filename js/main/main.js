const motor = new Motor();

document.getElementById("btn-empezar").onclick = () => {
    document.getElementById("pantalla-inicio").style.display="none";
    document.getElementById("hud-juego").style.display="block";
    document.getElementById("panel-palabras").style.display="flex";
    motor.j.agregarAEscena(motor.escena);
    motor.inv = new Inventario();
    motor.iniciar();
};

document.getElementById("btn-crear").onclick = () => {
    const e = document.getElementById("dict-input").value;
    const p = normalizarPalabra(e);
    if(!motor.len.puedeEscribir(p)){ console.log("❌ No conoces todas las letras"); document.getElementById("dict-input").value=""; return; }
    if(!motor.datos[p]){ console.log("❌ Palabra no existe"); document.getElementById("dict-input").value=""; return; }
    console.log("✅ Creado:",p);
    if(motor.datos[p].tipo==="material") motor.inv.agregar(p,1);
    document.getElementById("dict-input").value="";
};

window.onkeydown = e => {
    if(e.code==="Space") motor.teclas.space=true;
    else motor.teclas[e.key.toLowerCase()]=true;
};
window.onkeyup = e => {
    if(e.code==="Space") motor.teclas.space=false;
    else motor.teclas[e.key.toLowerCase()]=false;
};
window.onmousemove = e => { if(!motor.ang)return; motor.ang.y+=e.movementX*0.002; motor.ang.x-=e.movementY*0.002; };
document.body.onclick = ()=>document.body.requestPointerLock?.();

document.body.onclick = ()=>{
    document.body.requestPointerLock?.();
    // Ataque si tienes espada
    const tieneEspada = motor.inv.items.some(i=>i.tipo==="espada");
    if(tieneEspada) motor.criaturas.recibirDaño(motor.datos["espada"].daño);
    // Recoger recursos si no atacas
    else motor.mundo.recogerCerca(motor.j.x,motor.j.z);
};

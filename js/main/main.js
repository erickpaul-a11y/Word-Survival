const motor = new Motor();

// Asegurar que existen los ángulos usados para la cámara
if(!motor.ang) motor.ang = { x: 0, y: 0 }; // x = pitch, y = yaw

// Punto visual que indica hacia dónde mira la cámara
function actualizarPuntoMirada() {
    if(!motor || !motor.cam || !motor.escena) return;
    if(!motor._puntoMirada) {
        const geo = new THREE.SphereGeometry(0.12, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        motor._puntoMirada = new THREE.Mesh(geo, mat);
        motor._puntoMirada.name = 'punto-mirada';
        motor.escena.add(motor._puntoMirada);
    }
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(motor.cam.quaternion);
    const distancia = 10; // distancia donde se coloca el marcador
    const posicion = motor.cam.position.clone().add(dir.multiplyScalar(distancia));
    motor._puntoMirada.position.copy(posicion);
}

document.getElementById("btn-empezar").onclick = () => {
    document.getElementById("pantalla-inicio").style.display="none";
    document.getElementById("hud-juego").style.display="block";
    document.getElementById("panel-palabras").style.display="flex";
    motor.j.agregarAEscena(motor.escena);
    motor.inv = new Inventario();
    motor.iniciar();

    // Si la cámara ya existe, configurar el orden de rotación y sincronizar ángulos
    if(motor.cam) {
        motor.cam.rotation.order = 'YXZ';
        // Sincronizar los ángulos para evitar saltos al empezar
        motor.ang.x = motor.cam.rotation.x;
        motor.ang.y = motor.cam.rotation.y;
        actualizarPuntoMirada();
    }
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

// Mouse: corregir inversión y limitar pitch; actualizar punto de mirada
window.addEventListener('mousemove', e => {
    if(!motor.ang) return;
    // Asegurar pointer lock activo para evitar saltos cuando no está bloqueado
    if(document.pointerLockElement !== document.body) return;

    const sensitivity = 0.0025; // ajustar sensibilidad si es necesario

    // Yaw (giro horizontal). Cambia el signo si se siente invertido.
    motor.ang.y -= e.movementX * sensitivity;
    // Pitch (giro vertical). Mover el ratón hacia abajo debe mirar hacia abajo.
    motor.ang.x -= e.movementY * sensitivity;

    // Limitar pitch para que la cámara no se dé la vuelta (evita voltear 180°)
    const maxPitch = Math.PI / 2 - 0.01;
    motor.ang.x = Math.max(-maxPitch, Math.min(maxPitch, motor.ang.x));

    // Aplicar rotaciones a la cámara si existe
    if(motor.cam){
        motor.cam.rotation.order = 'YXZ';
        motor.cam.rotation.x = motor.ang.x;
        motor.cam.rotation.y = motor.ang.y;
        motor.cam.updateMatrixWorld();
        actualizarPuntoMirada();
    }
});

// Click en el cuerpo: solicitar pointer lock y realizar acción (atacar o recoger)
document.body.onclick = ()=>{
    document.body.requestPointerLock?.();

    // Si no hay inventario o criaturas inicializadas aún, salir
    if(!motor.inv) return;

    // Ataque si tienes espada
    const tieneEspada = Array.isArray(motor.inv.items) && motor.inv.items.some(i=>i.tipo==="espada");
    if(tieneEspada && motor.criaturas) {
        motor.criaturas.recibirDaño?.(motor.datos["espada"]?.daño);
    } else if(motor.mundo) {
        // Recoger recursos si no atacas
        motor.mundo.recogerCerca?.(motor.j.x,motor.j.z);
    }
};

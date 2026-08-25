const motor=new Motor();window.motor=motor;
// El movimiento original ya detecta el agua y mantiene la flotacion. Solo quitamos
// el limite que mantenia al jugador siempre por encima de la superficie: ahora puede
// bajar dentro del agua usando CTRL y volver a subir con ESPACIO.
try{
    const movimientoOriginal=motor._updateMovement;
    const codigo=movimientoOriginal.toString();
    const codigoAgua=codigo.replace(
        "this.j.y=Math.max(this.getGroundHeightAt(this.j.x,this.j.z)+.18,Math.min(water+.25,this.j.y));",
        "this.j.y=Math.max(this.getGroundHeightAt(this.j.x,this.j.z)+.18,this.j.y);"
    );
    if(codigoAgua!==codigo)motor._updateMovement=eval('('+codigoAgua+')');
}catch(e){console.warn('No se pudo habilitar inmersion:',e);}
const btnEmpezar=document.getElementById('btn-empezar');
const btnOpciones=document.getElementById('btn-opciones');
const btnIdiomas=document.getElementById('btn-idiomas');
const panelOpciones=document.getElementById('panel-opciones');
const panelIdiomas=document.getElementById('panel-idiomas');
if(btnOpciones)btnOpciones.onclick=()=>{if(panelOpciones)panelOpciones.style.display=panelOpciones.style.display==='block'?'none':'block';if(panelIdiomas)panelIdiomas.style.display='none';};
if(btnIdiomas)btnIdiomas.onclick=()=>{if(panelIdiomas)panelIdiomas.style.display=panelIdiomas.style.display==='block'?'none':'block';if(panelOpciones)panelOpciones.style.display='none';};
if(btnEmpezar)btnEmpezar.onclick=()=>{
    const pantallaInicio=document.getElementById('pantalla-inicio'),hudJuego=document.getElementById('hud-juego');
    if(pantallaInicio)pantallaInicio.style.display='none';if(hudJuego)hudJuego.style.display='block';
    window.WORLD_SEED=Math.floor(Math.random()*2147483647);motor.iniciar();
    if(typeof Crafteos!=='undefined')motor.crafteos=new Crafteos(motor);
    if(typeof GestorLenguaje!=='undefined'){motor.lenguaje=new GestorLenguaje(motor);motor.lenguaje.cargarDatos();}
    window.GAME_CONFIG=window.GAME_CONFIG||{};
    window.GAME_CONFIG.fpEnabled=true;
    window.GAME_CONFIG.fpHeight=0.90;
    const btnCamera=document.getElementById('btn-toggle-camera');if(btnCamera){btnCamera.textContent='Cámara: 1ª';btnCamera.onclick=()=>{motor.toggleCamera();btnCamera.textContent=motor.cameraMode==='first'?'Cámara: 1ª':'Cámara: 3ª';};}
    const chk=document.getElementById('chk-crosshair'),cross=document.getElementById('crosshair');
    if(chk&&cross){cross.style.display=chk.checked?'block':'none';chk.onchange=()=>cross.style.display=chk.checked?'block':'none';}
    const fp=document.getElementById('chk-fp');if(fp){fp.checked=true;fp.disabled=false;fp.title='Primera persona muestra las manos; tercera persona muestra el modelo completo.';}
};

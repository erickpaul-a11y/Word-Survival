const motor=new Motor();window.motor=motor;
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
    const activarAgua=()=>{if(typeof AguaUnificada!=='undefined'){motor.aguaUnificada=new AguaUnificada(motor);const original=motor.renderer.render.bind(motor.renderer);motor.renderer.render=(escena,camera)=>{if(motor.aguaUnificada)motor.aguaUnificada.actualizar(0.016);original(escena,camera);};}};
    if(typeof AguaUnificada==='undefined'){const s=document.createElement('script');s.src='js/agua/agua.js';s.onload=activarAgua;document.head.appendChild(s);}else activarAgua();
    if(typeof Crafteos!=='undefined')motor.crafteos=new Crafteos(motor);
    if(typeof GestorLenguaje!=='undefined'){motor.lenguaje=new GestorLenguaje(motor);motor.lenguaje.cargarDatos();}
    window.GAME_CONFIG=window.GAME_CONFIG||{};window.GAME_CONFIG.fpEnabled=true;window.GAME_CONFIG.fpHeight=.72;
    const btnCamera=document.getElementById('btn-toggle-camera');if(btnCamera){btnCamera.textContent='Cámara: 1ª';btnCamera.onclick=()=>{motor.toggleCamera();btnCamera.textContent=motor.cameraMode==='first'?'Cámara: 1ª':'Cámara: 3ª';};}
    const chk=document.getElementById('chk-crosshair'),cross=document.getElementById('crosshair');
    if(chk&&cross){cross.style.display=chk.checked?'block':'none';chk.onchange=()=>cross.style.display=chk.checked?'block':'none';}
    const fp=document.getElementById('chk-fp');if(fp){fp.checked=true;fp.disabled=false;fp.title='Primera persona muestra las manos; tercera persona muestra el modelo completo.';}
};

class Motor {
    constructor() {
        this.escena = new THREE.Scene();
        this.escena.background = new THREE.Color(0x87ceeb);
        this.escena.fog = new THREE.FogExp2(0x87ceeb, 0.007);
        this.cam = new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,1000);
        this.ren = new THREE.WebGLRenderer({antialias:true});
        this.ren.setSize(innerWidth,innerHeight);
        document.body.appendChild(this.ren.domElement);

        this.j = new Jugador();
        this.len = new GestorLenguaje();
        this.tiempo = new Tiempo();
        this.clima = new Clima();
        this.mundo = new Mundo(this);
        this.datos = null;
        this.criaturas = null;
        this.teclas = {};
        this.ang = {y:0,x:0};
        this.grav = -0.022; this.velY=0; this.suelo=false;
        this.salto = 0.38; this.andar=0.15; this.correr=0.28;

        const sol = new THREE.DirectionalLight(0xfffffa,1.2);
        this.escena.add(new THREE.AmbientLight(0xffffff,0.5));
        this.escena.add(sol);
    }

    async cargar() {
        const d1 = await fetch("data/diccionario.json"); this.datos = await d1.json();
        const d2 = await fetch("data/letras.json"); this.confLetras = await d2.json();
        this.len.letrasConocidas = this.confLetras.inicioJugador;
        this.len.configuracionLetras = this.confLetras.letras;
        const d3 = await fetch("data/criaturas.json"); this.datCriat = await d3.json();
        this.criaturas = new GestorCriaturas(this,this.datCriat);
        this.criaturas.generarIniciales();
    }

    iniciar() { this.cargar().then(()=>this.bucle()); }

    bucle() {
        requestAnimationFrame(()=>this.bucle());
        this.tiempo.avanzar(0.016);
        this.mundo.actualizar(this.j.x,this.j.z);
        this.criaturas.actualizar();

        let dx=0,dz=0;
        const v = this.teclas.shift ? this.correr : this.andar;
        if(this.teclas.w)dz-=v; if(this.teclas.s)dz+=v;
        if(this.teclas.a)dx-=v; if(this.teclas.d)dx+=v;
        if(this.teclas.space && this.suelo){ this.velY=this.salto; this.suelo=false; }

        if(dx||dz){ const c=Math.cos(this.ang.y),s=Math.sin(this.ang.y); this.j.x+=dx*c-dz*s; this.j.z+=dx*s+dz*c; }

        this.velY += this.grav; this.j.y += this.velY;
        const suelo = this.mundo.altura(this.j.x,this.j.z)+2;
        if(this.j.y < suelo){ this.j.y=suelo; this.velY=0; this.suelo=true; }else this.suelo=false;

        this.ang.x = Math.max(-1.4,Math.min(1.4,this.ang.x));
        this.j.actualizarPosicion(); this.j.actualizarHUD();

        this.cam.position.set(this.j.x,this.j.y+1.4,this.j.z);
        this.cam.rotation.order="YXZ";
        this.cam.rotation.y=this.ang.y;
        this.cam.rotation.x=this.ang.x;
        this.ren.render(this.escena,this.cam);
    }
}

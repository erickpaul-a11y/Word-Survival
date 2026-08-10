// Carga y normaliza los datos JSON antes de iniciar los sistemas que dependen de ellos.
(function () {
    const archivos = {
        letras: "data/letras.json",
        diccionario: "data/diccionario.json",
        criaturas: "data/criaturas.json",
        biomas: "data/biomas.json",
        objetos: "data/objetos.json",
        recetas: "data/recetas.json"
    };

    window.GAME_DATA = {
        letras: [],
        diccionario: {},
        criaturas: [],
        biomas: [],
        objetos: [],
        recetas: []
    };

    window.GAME_DATA_READY = Promise.all(
        Object.entries(archivos).map(async ([clave, ruta]) => {
            try {
                const respuesta = await fetch(ruta, { cache: "no-store" });
                if (!respuesta.ok) throw new Error(`${respuesta.status} ${respuesta.statusText}`);
                window.GAME_DATA[clave] = await respuesta.json();
            } catch (error) {
                console.warn(`No se pudo cargar ${ruta}:`, error);
            }
        })
    );

    const obtenerCriatura = (tipo, fallback) => {
        const datos = Array.isArray(window.GAME_DATA.criaturas)
            ? window.GAME_DATA.criaturas.find(c => c.tipo === tipo)
            : null;
        return datos || fallback;
    };

    // Mundo no debe insertar criaturas incompletas en GestorCriaturas.lista.
    if (window.Mundo && window.GestorCriaturas) {
        const crearAnimalOriginal = window.Mundo.prototype.crearAnimal;
        window.Mundo.prototype.crearAnimal = function (x, z, tipo, chunk) {
            if (this.m && this.m.criaturas && typeof this.m.criaturas.crear === "function") {
                const criatura = this.m.criaturas.crear(tipo, x, z);
                if (criatura && criatura.modelo && chunk && Array.isArray(chunk.objetos)) {
                    chunk.objetos.push(criatura.modelo);
                }
                return criatura;
            }
            return crearAnimalOriginal.call(this, x, z, tipo, chunk);
        };
    }

    // GestorCriaturas usa criaturas.json como fuente de estadísticas.
    if (window.GestorCriaturas) {
        const crearOriginal = window.GestorCriaturas.prototype.crear;
        window.GestorCriaturas.prototype.crear = function (tipo, x, z) {
            const datosJSON = obtenerCriatura(tipo, this.d ? this.d[tipo] : null);
            if (datosJSON) {
                this.d = this.d || {};
                this.d[tipo] = {
                    ...(this.d[tipo] || {}),
                    ...datosJSON
                };
            }
            return crearOriginal.call(this, tipo, x, z);
        };
    }

    // Se instala inmediatamente para que main.js no pueda iniciar el motor antes de cargar los JSON.
    if (window.Motor && !window.Motor.__datosCompatibles) {
        const iniciarOriginal = window.Motor.prototype.iniciar;
        window.Motor.prototype.iniciar = async function () {
            await window.GAME_DATA_READY;
            return iniciarOriginal.call(this);
        };
        window.Motor.__datosCompatibles = true;
    }
})();

function ruido(x, z) {
    const semilla = 12345;
    const hash = (a, b) => {
        let h = Math.sin(a * 12.9898 + b * 78.233 + semilla) * 43758.5453;
        return h - Math.floor(h);
    };
    const interp = (a, b, t) => a + (b - a) * t * t * (3 - 2 * t);
    const x0 = Math.floor(x), x1 = x0 + 1;
    const z0 = Math.floor(z), z1 = z0 + 1;
    const tx = x - x0, tz = z - z0;
    return interp(interp(hash(x0,z0), hash(x1,z0), tx), interp(hash(x0,z1), hash(x1,z1), tx), tz);
}

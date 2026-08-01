class Inventario {
    constructor() { this.items=[]; }
    agregar(t,c=1) { const e=this.items.find(i=>i.tipo===t); e?e.cantidad+=c:this.items.push({tipo:t,cantidad:c}); }
}

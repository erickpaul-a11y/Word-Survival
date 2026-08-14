/* Persistencia de bloques excavados y colocacion de tierra. */
(function(){
'use strict';
function clave(m,x,z){return m.claveBloque(x,z);}
Mundo.prototype._actualizarIndicesPixel=function(chunk,pixel,activar){
 const n=this.tam*this.pixelsPorUnidad;
 const i=chunk.pixeles.indexOf(pixel);
 if(i<0)return;
 const cellX=Math.floor(i/n),cellZ=i%n;
 const a=cellX*(n+1)+cellZ,b=(cellX+1)*(n+1)+cellZ,c=b+1,d=a+1;
 const old=Array.from(chunk.terreno.geometry.index.array||[]),tri=[a,b,d,b,c,d];
 let next=[];
 for(let k=0;k<old.length;k+=3){const t=[old[k],old[k+1],old[k+2]];if(activar&&t.some(v=>tri.includes(v)))continue;next.push(...t);}
 if(!activar)next.push(...tri);
 chunk.terreno.geometry.setIndex(next);chunk.terreno.geometry.computeVertexNormals();chunk.terreno.geometry.computeBoundingSphere();chunk.terreno.geometry.computeBoundingBox();
};
Mundo.prototype.destruirBloqueOriginal=Mundo.prototype.destruirBloque;
Mundo.prototype.destruirBloque=function(hit){
 const pixel=this.destruirBloqueOriginal(hit);
 if(pixel){pixel.tipo='tierra';pixel.rellenable=true;}
 return pixel;
};
Mundo.prototype.colocarBloque=function(x,z,tipo){
 const res=this.pixelsPorUnidad;
 const gx=(Math.floor(x*res)+.5)/res,gz=(Math.floor(z*res)+.5)/res;
 let encontrado=null,dist=Infinity;
 for(const chunk of this.chunks.values())for(const p of chunk.pixeles){
  if(!p.destruido)continue;
  const d=Math.hypot(p.x-gx,p.z-gz);
  if(d<dist&&d<=1.15){dist=d;encontrado=p;}
 }
 if(!encontrado)return null;
 const cx=Math.floor(encontrado.x/this.tam),cz=Math.floor(encontrado.z/this.tam);
 const chunk=this.chunks.get(`${cx},${cz}`);if(!chunk)return null;
 encontrado.destruido=false;encontrado.tipo=tipo||'tierra';encontrado.rellenable=true;
 this.bloquesEliminados.delete(clave(this,encontrado.x,encontrado.z));
 this._actualizarIndicesPixel(chunk,encontrado,false);
 return encontrado;
};
Mundo.prototype.colocarTierraCercana=function(x,z){return this.colocarBloque(x,z,'tierra');};
})();

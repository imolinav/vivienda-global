// Keeps each page's `sources` list in the order of first citation, which is
// what makes the [n] numbering read naturally, and drops sources that are
// no longer cited after an edit. Run after the agent and before verifying;
// a cited id with no source is left for verificar.ts to report.
//
// Usage: npx tsx automatizacion/src/ordenar-fuentes.ts [--pais espana]
import path from 'node:path'
import { isSeq, type YAMLMap } from 'yaml'
import { argumento, cargarPaises, RAIZ } from './lib/config'
import { escribirPagina, idsCitados, leerPagina } from './lib/documento'

for (const pais of cargarPaises(argumento('pais'))) {
  const ruta = path.join(RAIZ, pais.documento)
  const pagina = leerPagina(ruta)
  const fuentes = pagina.doc.get('sources')
  if (!isSeq(fuentes)) continue
  const orden = idsCitados(pagina.cuerpo)
  const items = fuentes.items as YAMLMap[]
  const id = (m: YAMLMap) => String(m.get('id'))
  const citadas = items.filter((m) => orden.includes(id(m))).sort((a, b) => orden.indexOf(id(a)) - orden.indexOf(id(b)))
  const retiradas = items.filter((m) => !orden.includes(id(m))).map(id)
  if (citadas.map(id).join() === items.map(id).join()) continue
  fuentes.items = citadas
  escribirPagina(ruta, pagina)
  console.log(`${pais.pais}: fuentes reordenadas${retiradas.length ? `; retiradas por no citarse: ${retiradas.join(', ')}` : ''}`)
}

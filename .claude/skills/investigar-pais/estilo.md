# Cómo se redacta

## Registro

- **Formal y preciso, pero comprensible para cualquier lector.** Se usa el término técnico o jurídico correcto, y la primera vez que aparece se explica brevemente o se enlaza al glosario.
- Frases claras y párrafos cortos. Los datos que se comparan entre sí, mejor en una tabla.
- Las secciones relacionadas se pueden mezclar cuando así se explica mejor la situación (por ejemplo, alquiler y turismo en una ciudad concreta).

## Neutralidad

- **Hay que distinguir siempre tres cosas:**
  - **dato:** "el índice subió un 8 %";
  - **evaluación con metodología:** "según el estudio X, la medida redujo…";
  - **posición de parte:** "la patronal Y sostiene que…".

  Nunca se presenta una posición de parte como si fuera un hecho.
- **Se dice siempre quién lo dice.** Portales inmobiliarios, patronales, sindicatos, asociaciones de inquilinos y partidos tienen intereses; se citan identificándolos como tales.
- Sin adjetivos valorativos ("preocupante", "histórico", "abusivo") salvo dentro de una cita atribuida.
- **Sin relaciones causales propias.** Que dos cosas coincidan en el tiempo no se presenta como causa y efecto. La causalidad solo se afirma si una evaluación la sostiene.
- **Partidos:** se dice quién impulsó y quién votó cada norma. La ideología se describe según una clasificación externa citada, nunca con una etiqueta propia.

## Cifras

- Cada cifra lleva su **periodo de referencia** ("en el segundo trimestre de 2026", "según el Censo de 2021"), que no es la fecha en que se publicó.
- Formato español: punto para los miles y coma para los decimales (`1.234.567`, `12,5`). Espacio antes de `%` y de `€` (`12,5 %`, `250.000 €`), como recomienda la RAE.
- Hay que decir si una variación es nominal o real, interanual o acumulada, y si la cifra es una media o una mediana.
- Las cifras se redondean de forma razonable en el texto; el valor exacto queda en las notas.

## Cifras automáticas

Las cifras declaradas en el `.fuentes.yml` del país se escriben con `<Dato id="..." />`, que muestra el valor ya formateado, y su periodo con `<Dato id="..." periodo />`. La cita va después, como con cualquier cifra: `<Dato id="ipv-anual" /><Cite id="ine-ipv" />`. El texto que las rodea no puede depender del valor, porque el valor cambiará solo.

## Fechas

- **Normas:** nombre oficial completo la primera vez (`Ley X/AAAA, de D de mes, <título oficial>`), con la fecha de aprobación y la de entrada en vigor si son distintas. Después se puede usar un nombre corto.
- Fechas en el texto: "24 de mayo de 2023". En el frontmatter: `AAAA-MM-DD`.
- La fecha de nuestra última actualización sale sola en la cabecera, a partir de `last_updated`.

## Citas

- Cada cifra y cada hecho que no sea de conocimiento general lleva `<Cite id="..." />` justo después del dato o al final de la frase, **antes del punto**: `…1,2 millones de viviendas<Cite id="ine-censo-2021" />.`
- Si hay varias fuentes, se ponen seguidas: `<Cite id="a" /><Cite id="b" />`.
- Los `id` siguen el formato `organismo-tema`, en minúsculas y con guiones.
- En `title`, primero el organismo y luego el título: `INE — Índice de Precios de Vivienda`.

## Datos no contrastados

Se marcan con el badge que trae VitePress, justo después de la cita, y se explica en la misma frase por qué no está contrastado:

```md
Se repite a menudo que el 75 % de los caseros tiene una o dos viviendas<Cite id="x" /> <Badge type="warning" text="no contrastado" />, aunque no se ha localizado el estudio original del que procede.
```

## Glosario

- Va en la última sección del documento, `## Glosario`, con los términos por orden alfabético.
- Formato de cada término. El `{#g-...}` del final crea el ancla que se enlaza desde el texto:

  ```md
  **Gran tenedor.** Explicación en lenguaje llano. [Más información](https://...). {#g-gran-tenedor}
  ```

- En el texto, la primera vez que aparece un término se enlaza a su ancla: `[gran tenedor](#g-gran-tenedor)`.
- Los enlaces de "Más información" van en línea y no en `sources`, porque no son fuentes de datos. Siempre que sea posible, se enlaza a la definición oficial: texto legal, glosario del instituto de estadística o del banco central.

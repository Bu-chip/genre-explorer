# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Añadido

- Workflow `Lint`, que corre `npm run lint` en cada pull request contra `main`.
  El lint del deploy solo corre en push a `main`, es decir ya mergeado: si una
  rama vieja reintroduce errores, el aviso llegaba con el deploy ya en rojo.
  Este lo adelanta al pull request.

### Arreglado

- El hash `#genre=` no se actualizaba al terminar un giro de RANDOM. El género
  en pantalla cambiaba y la URL se quedaba en el anterior, así que recargar o
  compartir el enlace devolvía el género equivocado. Afectaba igual al botón y
  al atajo de barra espaciadora.
- El lint reportaba como imports muertos los `motion` de `App`, `GenreCard` y
  `SlotMachine`, que sí se usan como `<motion.div>`. Sin `eslint-plugin-react`,
  `no-unused-vars` no ve los identificadores usados solo dentro de JSX.
  Borrarlos habría roto la app.
- `vite.config.js` corre en Node pero el lint solo conocía globales de
  navegador, de ahí el `process is not defined`.

### Cambiado

- Los hooks `useLastfm`, `useTrack` y `useWikipedia` guardan el dato junto al
  género al que pertenece y descartan el desajuste en render, en vez de
  limpiarlo con un `setState` dentro del efecto. Mismo comportamiento visible
  (no aparece el dato del género anterior mientras carga) con un render menos
  por cambio de género.
- `DeezerPreview` deriva `data` de sus props en render; el efecto queda solo
  para la búsqueda asíncrona.
- `DiscoveryCounter` ya no guarda el contador en estado: la escritura en
  `localStorage` se queda en el efecto y el número se calcula en render.
- En `App`, el slug pasa a ser la fuente de verdad (el deep link se lee en el
  primer render y el objeto género se deriva de él), la frase de contexto pasa
  a `useMemo`, el aviso de scroll se deriva de qué género lo descartó y
  `spinning` deja de leerse de una ref durante el render.
- Todos los colores viven ya solo en `src/styles/tokens.css`, como pide
  `CLAUDE.md`.
- El workflow de deploy ejecuta `npm run lint` además de `build`.
- El bundle se reparte en chunks: `react`, `framer-motion` y `supabase` salen
  del chunk de la app, que baja de 568 kB a 48 kB. Un redeploy ya no invalida
  los vendors en la caché de quien repite visita.

### Eliminado

- Los componentes `SlotMachine` y `SearchBox` (`.jsx` y `.css`), sin ninguna
  referencia en el repo. El buscador que se ve en la app es el que `NavBar`
  lleva dentro. Su CSS nunca llegaba al bundle.
- El segundo `:root` de `src/index.css`, que duplicaba con hex a pelo tokens
  que ya existían (`--text-primary` era exactamente `--accent-mint`,
  `--text-secondary` era `--accent-teal`, `--accent-hover` era `--accent-lime`)
  y definía dos variables que no usaba nadie.

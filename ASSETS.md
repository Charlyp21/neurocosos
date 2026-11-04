# Neurocosos – Lista de assets

Marcar `[x]` cuando el archivo ya esté en su carpeta. Todo va dentro de `public/assets/` (Vite lo sirve tal cual; el código lo carga como `assets/...`).

## Convenciones generales

- **Formato:** PNG con transparencia (sprites/tiles), `.ogg` (audio; opcional `.mp3` de respaldo para Safari).
- **Pixel art:** sin suavizado ni escalado fraccionario. Dibujar al tamaño nativo; el juego escala el canvas completo (960×540).
- **Tamaño de tile:** **32×32 px** (decisión: con 960×540 se ven ~30×17 tiles).
- **Nombres:** `minusculas_con_guiones_bajos`, sin espacios ni acentos.
- **Hojas de sprites (spritesheet):** frames del mismo tamaño en una cuadrícula, sin espacio entre frames (si traen margen, avísame y lo configuro).
- **Licencias:** por cada recurso externo, anotar autor, URL y licencia en `CREDITS.md` (prefiere CC0 / CC-BY). Lo creo en cuanto metas el primer asset.
- **Presupuesto:** Nivel 1 completo < 5 MB.

## Estructura de carpetas

```
public/assets/
  sprites/       # personajes, ítems, obstáculos (spritesheets)
  tilesets/      # tilesets para Tiled
  backgrounds/   # capas de parallax
  maps/          # .json exportados de Tiled
  ui/            # iconos y elementos de HUD
  audio/
    music/
    sfx/
```

---

## Fase 2 – Jugador y mundo (necesarios ahora)

### Sprites (`sprites/`)

| ✔ | Archivo | Tamaño frame | Frames | Notas |
|---|---|---|---|---|
| [ ] | `player.png` | 32×48 | idle (2–4), run (6), jump (1), fall (1) | Un solo spritesheet, filas por animación o una fila continua (dime el orden). Mirando a la derecha; se voltea por código. |
| [ ] | `pill.png` | 16×16 | 1–4 (brillo/flotar) | Pastilla coleccionable. |
| [ ] | `goal.png` | 32×64 (aprox.) | 1–2 | Puerta/entrada de la escuela como meta. |

> Para el Nivel 1 aún no hacen falta frames de crisis o mareo (Fase 4); si el pack los trae, mételos igual.

### Tileset (`tilesets/`)

| ✔ | Archivo | Tamaño tile | Notas |
|---|---|---|---|
| [ ] | `tileset_ciudad.png` | 32×32 | Suelo/acera, calle, bloques de edificio, plataformas, escaleras/rampas simples. Una sola imagen en cuadrícula. |

Tiles recomendados mínimos: acera (superficie + relleno), asfalto, plataforma delgada, bloque sólido, pared de edificio, ventana/puerta decorativa, pasto/vegetación (zona verde).

### Fondos (`backgrounds/`)

Parallax: cada capa se repite en horizontal (tileable), altura 540 px.

| ✔ | Archivo | Tamaño | Notas |
|---|---|---|---|
| [ ] | `bg_cielo.png` | 960×540 (o 480×270 si lo escalas ×2) | Cielo, no se mueve o muy lento. |
| [ ] | `bg_lejos.png` | ancho tileable ×540 | Siluetas de edificios lejanos. |
| [ ] | `bg_cerca.png` | ancho tileable ×540 | Edificios/árboles cercanos. |

### Mapa (`maps/`)

| ✔ | Archivo | Quién | Notas |
|---|---|---|---|
| [ ] | `nivel1.json` | Tú (Tiled) o yo con una versión inicial | Ver especificación de capas abajo. |

**Capas de Tiled para `nivel1.json`:**
1. `fondo` (tiles decorativos, sin colisión)
2. `colision` (tiles sólidos; propiedad `collides = true` en el tileset)
3. `frente` (decoración que se dibuja sobre el jugador, opcional)
4. `objetos` (capa de objetos): puntos con `type`: `spawn`, `pill`, `goal`, `checkpoint`, y rectángulos para zonas (`zona_calle`, `zona_gente`, `zona_vegetacion`…).

> Si no quieres usar Tiled todavía, puedo generar un mapa provisional por código con el mismo formato y lo reemplazas luego.

---

## Fase 3 – Pastillas y obstáculos (más adelante)

| ✔ | Archivo | Carpeta | Tamaño frame | Notas |
|---|---|---|---|---|
| [ ] | `pill_doble.png` | sprites | 16×16 | Dosis doble (otro color). |
| [ ] | `carro.png` | sprites | ~96×48 | 1–2 variantes de color, mirando a la derecha. |
| [ ] | `obstaculo_ruido.png` | sprites | libre | Fuente de ruido (bocina, obra, parlante). Opcional. |
| [ ] | `particula_pastilla.png` | sprites | 8×8 | Destello al recoger. |

## Fase 5 – UI (más adelante)

| ✔ | Archivo | Carpeta | Notas |
|---|---|---|---|
| [ ] | `barra_marco.png` | ui | Marco de la barra de concentración (opcional; hoy se dibuja por código). |
| [ ] | `iconos_estado.png` | ui | 16×16 ×N: pastilla, advertencia, calavera, cerebro. |
| [ ] | `botones_tactiles.png` | ui | Izquierda, derecha, salto (64×64 c/u). |
| [ ] | Fuente pixel (`.ttf`/`.woff2`) | ui | Con soporte de acentos y ñ (ej. "Press Start 2P", "Silkscreen", licencia OFL). |

## Fase 6 – Audio (más adelante)

### Música (`audio/music/`)
- [ ] `musica_nivel1.ogg` – loop, ambiente tranquilo/urbano.
- [ ] `musica_menu.ogg` – opcional.

### SFX (`audio/sfx/`) – cortos, < 100 KB c/u
- [ ] `pastilla.ogg`
- [ ] `salto.ogg`
- [ ] `aterrizaje.ogg` (opcional)
- [ ] `aura.ogg` (advertencia previa a crisis)
- [ ] `crisis.ogg`
- [ ] `golpe.ogg` (choque con obstáculo)
- [ ] `derrota.ogg`
- [ ] `victoria.ogg`

---

## Dónde buscar (gratis / libres)

- **Kenney.nl** (CC0): packs "Pixel Platformer", "Pixel Platformer Industrial/Farm", UI Pack Pixel.
- **itch.io** → Game Assets → Free → tag *pixel art* / *platformer* / *city*.
- **OpenGameArt.org**: filtrar por licencia CC0 / CC-BY.
- **Audio:** freesound.org, pixabay.com/sound-effects, OpenGameArt (música).
- **Mapas:** Tiled (mapeditor.org), gratis.

> Idealmente usar **un solo pack con estilo coherente** para jugador, tiles y objetos; mezclar packs suele verse inconsistente.

## Qué hacer cuando metas assets

1. Copia los archivos a su carpeta y marca `[x]` aquí.
2. Avísame con los **tamaños de frame** y, para el jugador, el **orden de animaciones** (ej. "fila 0: idle 4 frames, fila 1: run 6 frames").
3. Apunta la licencia en `CREDITS.md` (te lo creo si me lo pides).
4. Yo cargo los assets en `PreloadScene` y reemplazo las texturas provisionales.

> Mientras no lleguen los assets, la Fase 2 puede avanzar con las texturas provisionales por código (máquina de estados del jugador, coyote time, cámara, controles táctiles, mapa provisional).


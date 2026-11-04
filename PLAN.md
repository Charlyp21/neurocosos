# Neurocosos – Plan técnico y seguimiento

> Documento vivo. Marcar `[x]` al completar cada tarea. Alcance actual: **Nivel 1 – Epilepsia**.
> Las demás enfermedades (ansiedad, TDAH) y mecánicas extra (Tmax/Cmax, volumen de distribución) quedan en el [Backlog](#backlog-post-nivel-1) hasta cerrar este nivel.

## 1. Visión resumen (del readme)

Plataformero 2D en navegador. El jugador tiene una enfermedad neurológica y debe ir de casa a la escuela manteniendo su **concentración plasmática (C)** dentro de la **ventana terapéutica** (`therapeuticMin ≤ C ≤ therapeuticMax`) sin llegar a `toxicLevel`.

| Concepto ADME | Representación en juego |
|---|---|
| Absorción | Pastillas → dosis; barra de concentración con umbrales |
| Distribución | Ítems que modifican cómo/cuánto llega el fármaco (post Nivel 1) |
| Metabolismo | Ítems aceleradores / enemigos CYP que bajan C de golpe |
| Eliminación | Decaimiento continuo de primer orden `C(t+dt) = C(t)·e^(-ke·dt)` |

**Condiciones de derrota:** C ≥ nivel tóxico máximo, o tiempo acumulado bajo `therapeuticMin` > umbral.
**Condición de victoria:** llegar a la meta (escuela) con vida.

## 2. Stack y restricciones

- **Phaser 4** (`phaser ^4.2.1`) + **Vite** (ES modules), JavaScript sin framework UI.
- Corre 100 % en navegador, sin backend. Build estático (`vite build`) desplegable en cualquier hosting estático.
- Objetivo: 60 FPS en móvil de gama media y laptop con gráficos integrados.
- Arte: recursos libres/gratuitos (ver §8); texturas procedurales como placeholder.

### Presupuesto de rendimiento
- Bundle JS inicial (gzip) < 500 KB (Phaser es el grueso; considerar `manualChunks` para separarlo).
- Assets del nivel < 5 MB totales, usando **texture atlas** (un solo draw call por atlas) y audio `.ogg`/`.mp3` comprimido.
- Cero asignaciones de objetos en el `update()` (sin `new`, sin arrays/closures por frame). Usar **object pooling** para pastillas, partículas y enemigos.
- Dibujo del HUD: no redibujar `Graphics` cada frame si el valor no cambió (o usar sprites/`setScale`/`setCrop`).
- Tilemap con **culling** de cámara y colisiones solo con la capa de colisión.
- Pausar el juego cuando la pestaña pierde foco (`visibilitychange`) y limitar `delta` (clamp ≤ 50 ms) para evitar saltos en la simulación.
- `Phaser.Scale.FIT` + `autoCenter`, `pixelArt`/`roundPixels` según el estilo del arte, `powerPreference: 'high-performance'`.

## 3. Arquitectura

### 3.1 Estructura de carpetas objetivo

```
src/
  main.js                  # bootstrap: crea Phaser.Game con la config
  config/
    gameConfig.js          # tamaño, scale, física, escenas
    balance.js             # TODAS las constantes de balance (ke, dosis, umbrales, tiempos)
  scenes/
    BootScene.js           # config inicial, loader mínimo
    PreloadScene.js        # carga assets con barra de progreso
    MenuScene.js           # título, iniciar, ajustes de accesibilidad
    GameScene.js           # nivel jugable (Nivel 1)
    UIScene.js             # HUD en escena paralela (no se mueve con la cámara)
    GameOverScene.js       # derrota / victoria + datos educativos
  systems/
    Pharmacokinetics.js    # modelo PK (ya existe; se extiende)
    SymptomSystem.js       # traduce estado de C → síntomas de la enfermedad
    ConditionSystem.js     # reglas de victoria/derrota
  entities/
    Player.js              # sprite + controles + máquina de estados
    Pill.js                # coleccionable con pooling
    Hazard.js              # obstáculos (carros, etc.)
  effects/
    SeizureEffect.js       # efectos visuales de crisis (seguros fotosensibilidad)
    ToxicityEffect.js
  data/
    levels/level1.json     # tilemap exportado de Tiled
    epilepsy.js            # definición de la enfermedad (umbrales, síntomas)
  utils/
    events.js              # claves de eventos globales
public/assets/             # atlas, tilemaps, audio
```

### 3.2 Principios

1. **Simulación separada de la presentación.** `Pharmacokinetics` no importa Phaser; es lógica pura, testeable con Node.
2. **Comunicación por eventos** (`Phaser.Events.EventEmitter` / `registry`): GameScene emite `concentration:changed`, `symptom:started`, `game:over`; UIScene y efectos escuchan. Sin referencias cruzadas entre escenas.
3. **Datos sobre código.** Valores de balance y definición de enfermedad en `config/balance.js` y `data/epilepsy.js`, para que añadir ansiedad/TDAH sea agregar un archivo de datos + sus efectos.
4. **Un solo `update` ordenado:** input → física → PK → síntomas → condiciones → HUD.

### 3.3 Modelo farmacocinético

Estado actual: bolo instantáneo + eliminación de primer orden (`update(delta)` en ms, `ke` en 1/s).

Cambios previstos para Nivel 1:
- Normalizar la concentración a **0–100** (unidades de juego) con constantes en `balance.js`.
- Exponer **zona actual** como enum: `SUB` (< min), `THERAPEUTIC`, `HIGH` (> max, < tóxico), `TOXIC` (≥ toxicLevel), `LETHAL` (≥ `lethalLevel`, derrota).
- Acumuladores de tiempo: `timeBelowMin`, `timeAboveMax`; reseteo/decaimiento parcial al volver a rango.
- Emitir eventos solo en **cambio de zona** (no por frame).
- Preparar (sin activar aún) el modelo de absorción con Tmax: `dC/dt = ka·A − ke·C`, `dA/dt = −ka·A` (el bolo pasa a un "depósito" gástrico `A`). Se deja la interfaz `administerDose(amount)` intacta.
- Hacer el paso **determinista y estable**: `exp(-ke·dt)` ya es incondicionalmente estable; mantener el clamp de `delta`.

### 3.4 Sistema de síntomas (epilepsia)

| Zona de C | Efecto |
|---|---|
| THERAPEUTIC | Sin síntomas |
| SUB (tiempo bajo min creciente) | **Aura** (viñeta/distorsión suave, sonido) → riesgo creciente de **crisis** |
| Crisis | Control del jugador alterado/anulado X segundos (sacudida de cámara, caída), luego recuperación |
| HIGH / TOXIC | Toxicidad: mareo (movimiento más lento/inercia), visión borrosa, náusea |
| LETHAL | Game over |

- Crisis disparada por temporizador de riesgo: `p(crisis) = f(timeBelowMin)` evaluada cada N ms (no por frame), con un **grace period** y un **cooldown** para que sea justo y legible.
- Todo configurable en `data/epilepsy.js`.

> [!WARNING]
> **Seguridad fotosensible (crítico en un juego sobre epilepsia).** Los efectos de crisis NO deben usar destellos > 3 por segundo ni grandes áreas de alto contraste parpadeante (WCAG 2.3.1). Preferir sacudida de cámara, viñeta, desaturación y distorsión. Incluir aviso al inicio y opción de "efectos reducidos".

## 4. Hoja de ruta – Nivel 1 (Epilepsia)

Estado actual del código: prototipo en `main.js` con `Pharmacokinetics`, medidor vertical, jugador con flechas, plataformas estáticas y pastillas que llaman `administerDose(30)`.

### Fase 0 – Base y refactor (completada, pendiente validación del usuario)
- [x] Proyecto Vite + Phaser 4 funcionando
- [x] Módulo `Pharmacokinetics` (eliminación 1er orden, `administerDose`, constantes)
- [x] Prototipo: jugador, plataformas, pastillas, medidor
- [x] Crear estructura de carpetas (§3.1) y migrar `main.js` → `gameConfig.js` + `GameScene`
- [x] `config/balance.js` con todas las constantes de balance
- [x] Config de escala responsive (`Scale.FIT`, `autoCenter`), clamp de `delta`, pausa en `visibilitychange`
- [x] Limpiar archivos de plantilla Vite sin uso (`counter.js`, `javascript.svg`, etc.)

### Fase 1 – Núcleo PK y reglas
- [ ] Normalizar C a 0–100 y añadir `lethalLevel`
- [ ] Enum de zonas + eventos en cambio de zona
- [ ] Acumuladores `timeBelowMin` / `timeAboveMax`
- [ ] `ConditionSystem`: derrota por C letal o tiempo bajo mínimo; victoria por meta
- [ ] Tests unitarios del modelo PK con Node (`vitest` o `node --test`): decaimiento, dosis, cruce de umbrales, determinismo
- [ ] Ajustar `ke` y dosis para que el nivel dure ~3–5 min con margen realista (ver §6)

### Fase 2 – Jugador y mundo
- [ ] `Player` con máquina de estados (idle/run/jump/fall/seizure/dizzy)
- [ ] Mejoras de feel: coyote time, jump buffer, salto de altura variable
- [ ] Soporte táctil (botones virtuales en pantalla) además de teclado
- [ ] Tilemap en **Tiled** (JSON) con capas: fondo, colisión, objetos (spawn, pastillas, meta, hazards)
- [ ] Cámara con seguimiento (`startFollow`, lerp, bounds del mapa); parallax de fondo
- [ ] Zonas del mapa del Nivel 1 (casa → calle → cruce de avenida → zona con gente → escuela)

### Fase 3 – Pastillas y obstáculos
- [ ] `Pill` con object pooling; respawn/colocación desde la capa de objetos
- [ ] Dosis variables (pastilla normal vs. doble) definidas en datos
- [ ] Feedback al recoger: sonido, partícula, número flotante, pulso en la barra
- [ ] Obstáculos básicos: carros (movimiento en ruta), zonas ruidosas (efecto ambiental)
- [ ] Colisión con hazard: daño/empujón + penalización definida (sin tocar C en Nivel 1, salvo decisión de diseño)

### Fase 4 – Síntomas de epilepsia
- [ ] `SymptomSystem` leyendo zonas PK y `data/epilepsy.js`
- [ ] Aura (viñeta + audio) con intensidad proporcional al tiempo bajo mínimo
- [ ] Crisis: pérdida de control temporal + sacudida de cámara + recuperación
- [ ] Toxicidad: ralentización/mareo/blur con `postFX` ligero o tint (verificar costo en móvil)
- [ ] Opción "efectos reducidos" y aviso de fotosensibilidad
- [ ] Revisión de seguridad: ningún efecto > 3 destellos/s

### Fase 5 – UI/HUD y flujo de escenas
- [ ] `UIScene` paralela con barra de concentración (zonas verde/amarillo/rojo), marcadores de umbral y valor numérico
- [ ] Indicador de tiempo bajo el mínimo (barra de "riesgo")
- [ ] `BootScene` → `PreloadScene` (barra de carga) → `MenuScene` → `GameScene` + `UIScene` → `GameOverScene`
- [ ] Pantalla final educativa: resumen (tiempo en ventana %, picos, causa de derrota) + explicación breve de ADME
- [ ] Pausa y reinicio de nivel

### Fase 6 – Arte y audio
- [ ] Reemplazar texturas procedurales por sprites/tiles libres (atlas)
- [ ] Animaciones del jugador (idle, correr, saltar, crisis)
- [ ] Música de fondo + SFX (pastilla, salto, aura, crisis, derrota)
- [ ] Registrar licencias/atribuciones en `CREDITS.md`

### Fase 7 – Optimización y entrega
- [ ] Perfilado (Chrome DevTools, Phaser debug FPS) en equipo móvil real
- [ ] Verificar cero GC spikes en `update` (Performance tab)
- [ ] Empaquetado de atlas y compresión de audio
- [ ] `vite build` + análisis de bundle; code-splitting de Phaser si conviene
- [ ] Probar en Chrome, Firefox, Safari (iOS) y Android
- [ ] Despliegue estático (GitHub Pages / Netlify / itch.io)

### Definición de "Nivel 1 terminado"
- Se puede jugar de inicio a fin: menú → nivel → victoria/derrota → reinicio.
- Todas las condiciones de derrota y victoria funcionan.
- Síntomas de epilepsia (aura, crisis) y de toxicidad visibles y legibles.
- ≥ 55 FPS estables en móvil de gama media.
- Pasa revisión de seguridad fotosensible.
- Código organizado según §3 listo para añadir otra enfermedad solo con datos + efectos.

## 5. Decisiones tomadas

- [x] Concentración en **unidades abstractas** (0–100), por ser divulgación.
- [x] Crisis **probabilísticas**, con probabilidad creciente según el tiempo bajo `therapeuticMin`.
- [x] Los obstáculos **sí afectan** la concentración.
- [x] Un nivel por enfermedad → el nivel debe ser **largo** (diseñar el mapa y el balance para ~10+ min, con checkpoints).
- [x] Resolución base **16:9** (960×540, `Scale.FIT`).
- [x] Estilo **pixel art** (`pixelArt: true`, `roundPixels: true`, tiles de 16×16 o 32×32 por definir).
- [x] UI solo en **español** por ahora (centralizar textos para facilitar i18n futuro).

## 6. Parámetros de balance iniciales (propuesta)

| Parámetro | Valor inicial | Nota |
|---|---|---|
| `therapeuticMin` / `therapeuticMax` | 20 / 60 | |
| `toxicLevel` / `lethalLevel` | 80 / 100 | |
| `ke` | 0.03 /s | vida media ≈ 23 s (acelerada para jugabilidad) |
| Dosis pastilla | 30 | |
| Tiempo máx. bajo min antes de derrota | 20 s | |
| Aura empieza tras | 3 s bajo min | |
| Duración de crisis | 2.5 s + 1 s recuperación | |

> Fórmula útil: `t½ = ln(2)/ke`. Con `ke = 0.1` (actual) `t½ ≈ 6.9 s`, probablemente demasiado rápido.

## 7. Backlog post Nivel 1

- Niveles/enfermedades: **ansiedad** y **TDAH** (efectos propios, mismos sistemas).
- **Tmax / Cmax:** modelo de absorción con `ka` y medicamentos/marcas con perfiles distintos.
- **Vida media** variable por medicamento.
- **Distribución:** ítems que alteran Vd / reparto a órganos.
- **Metabolismo:** enemigos CYP (bajan C de golpe), ítems inductores/inhibidores.
- **Volumen de distribución** con personajes de distinta complexión.
- Mapa completo inspirado en el trayecto a la universidad (avenidas, zonas ruidosas, vegetación, multitudes).
- Guardado local (`localStorage`) de progreso y ajustes.

## 8. Recursos de arte (fuentes libres a evaluar)

- itch.io (assets free), OpenGameArt.org, Kenney.nl (CC0), Craftpix free, freesound.org (audio).
- Registrar licencia y autor de cada recurso usado en `CREDITS.md`.

## 9. Bitácora

| Fecha | Cambio |
|---|---|
| 2026-10-21 | Módulo `Pharmacokinetics`, medidor y prototipo jugable (jugador, plataformas, pastillas) |
| 2026-11-04 | Creación de este plan |
| 2026-11-04 | Fase 0: estructura `config/` y `scenes/`, `GameScene`, escala 960×540 pixel art, `balance.js`, limpieza de plantilla |


# Juegos 3D

Las páginas cargan scripts clásicos empaquetados para funcionar tanto por HTTP como abriendo `index.html` directamente (`file://`). No sustituirlos por imports de módulos en los HTML: los navegadores bloquean esos imports desde archivos locales.

Después de modificar `engine.js`, `arcade.js` o Three.js, regenerar desde la raíz del proyecto (Node.js y npm):

```powershell
npx.cmd --yes esbuild@0.28.2 assets/games/arcade.js --bundle --format=iife --minify --outfile=assets/games/arcade.bundle.js
npx.cmd --yes esbuild@0.28.2 assets/vendor/three/three.module.js --bundle --format=iife --global-name=THREE --minify --outfile=assets/vendor/three/three.global.js
```

Los archivos generados se incluyen en el proyecto; para jugar no hace falta instalar Node.js ni descargar dependencias. La licencia de Three.js está en `assets/vendor/three/LICENSE`.

## Fun Race 3D

Entrada: `games/fun_race_3d_orientacion_corregida.html`. Se enlaza desde el índice y utiliza la misma copia local de Three.js mediante `three.global.js`. No necesita empaquetado al editar sus archivos:

- `fun-race-rules.js`: circuitos, ocho obstáculos, cápsulas y cajas orientadas de colisión, rivales, puntos de control y llegada. Las formas devueltas por `hazards()` se utilizan también para dibujar: no mantener una segunda descripción de colisiones.
- `fun-race.js`: escena, cámara, controles, menús, pausa y marcas locales.
- `fun-race.css`: presentación adaptable, incluidos móvil vertical y horizontal.

Controles: mantener Espacio, W o flecha arriba para avanzar; A/D o flechas laterales para moverse; P/Escape para pausar. En pantalla táctil se pueden mantener simultáneamente correr y dirección, o mantener y arrastrar sobre la pista. Soltar detiene el avance, pero los obstáculos siguen moviéndose. Cambiar de pestaña pausa la carrera completa.

Las reglas avanzan a pasos fijos de 1/120 s. Los niveles cambian orden, fases y ritmo con dificultad limitada; los rivales no aumentan de velocidad indefinidamente. Cada obstáculo superado guarda un control. La llegada se resuelve por el instante de cruce, incluyendo cruces en el mismo paso de física. Las mejores marcas y el nivel desbloqueado se guardan bajo `invernot_fun_race_v1`; si el almacenamiento falla, se puede seguir jugando.

Comprobaciones de física: `node --test tests/fun-race.test.cjs`. Para cambios de presentación o controles, revisar también apertura por `file://`, teclado, dos dedos, pausa al perder foco, reinicio, victoria, derrota y siguiente nivel. Las pruebas de transición pueden situar la carrera cerca de la meta; eso no sustituye la comprobación de que un circuito completo es transitable.

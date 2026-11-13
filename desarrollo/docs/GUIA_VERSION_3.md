# Guía práctica — V3: iluminación dinámica

V3 cerrada el 13/11/2026 tras la confirmación del autor de que fue probada y funciona correctamente. Respaldo: `versiones/V3_Iluminacion_Dinamica/`. La documentación de V1 y V2 se conserva.

## Abrir y conducir

Abrí con doble clic el `index.html` de `desarrollo/` para el trabajo activo o el de `versiones/V3_Iluminacion_Dinamica/` para la versión cerrada. Cada carpeta incluye su biblioteca `vendor/three.min.js`, su código en `src/` y los estilos dentro del HTML: no necesitás Internet, servidor ni instalaciones. Para trasladar la versión, copiá la carpeta completa del respaldo.

- W/S: avanzar/retroceder. A/D: dirección izquierda/derecha mientras te desplazás.
- Fuera del panel, las flechas siguen siendo equivalentes a WASD.
- Dentro del panel, **WASD permite conducir y las flechas editan el control enfocado**. Tab recorre controles; Espacio alterna casillas; Enter activa el botón.
- Hacé clic en la escena para volver a conducir con flechas. Al entrar al panel se limpian las flechas que estuvieran presionadas; al cambiar de ventana se limpian todas las teclas.

## Panel de iluminación

El panel de la derecha se puede plegar pulsando «Iluminación» y tiene desplazamiento vertical cuando no entra en pantalla. Cada deslizador muestra su valor y se aplica inmediatamente, sin botón de confirmación.

| Control | Predeterminado | Efecto |
| --- | --- | --- |
| Faro izquierdo / derecho | 85 cada uno | Intensidad independiente, izquierda/derecha desde el conductor |
| Alumbrado público | 23 | Intensidad de los siete postes |
| Luz ambiental | 0.50 | Intensidad de la luz hemisférica |
| Luna | 0.37 | Intensidad de la luz direccional |
| Emisión de ventanas | 1 | Brillo propio de las ventanas que tienen emisión |
| Alcance | 34 | Distancia máxima de ambos faros en unidades de escena |
| Semiángulo | 25.71° mostrado | Apertura desde el eje hasta el borde; el cono completo tiene el doble |

Las casillas encienden/apagan faros, alumbrado, ambiental, luna y emisión de ventanas. Apagar conserva los valores: podés cambiarlos mientras el grupo está apagado y se usarán al volver a encenderlo. Intensidad cero también apaga una fuente aunque su casilla siga marcada.

«Restablecer iluminación» recupera todos los valores y enciende todos los grupos. No reinicia el auto ni la cámara. Los cambios no se guardan al recargar la página.

Las ventanas emisivas no iluminan el suelo. Los faroles visibles de auto/postes cambian a un color oscuro al apagarse; no desaparecen. Solo los dos faros proyectan sombras. El color de las luces permanece fijo; no se incluye selector de color.

## Comprobaciones para repetir en otros equipos

1. Abrir sin conexión y comprobar escenario y panel.
2. Mantener W+A y ajustar un deslizador con el ratón: comprobar conducción y cámara.
3. Enfocar un deslizador con Tab y usar flechas: debe cambiar el valor sin mover el auto. Probar también clic en la escena y volver a conducir con flechas.
4. Poner un faro en cero y aumentar el otro; observar que son independientes y que giran con el vehículo.
5. Apagar luz ambiental, luna y alumbrado para aislar el efecto de los faros. Variar alcance y apertura y revisar sus sombras mientras conducís.
6. Apagar los faros y aumentar la emisión de ventanas: brillan por sí mismas, pero no iluminan la calle.
7. Cambiar valores de un grupo apagado, reactivarlo y comprobar que se conservan. Pulsar restablecer y verificar valores y casillas sin perder la posición del auto.
8. Redimensionar, plegar el panel, recorrerlo con Tab y cambiar de ventana mientras conducís.

Se mantienen los límites y las limitaciones de V2: sin colisiones, lomada, aceleración progresiva ni velocidad crucero; edificios pueden ocultar auto/cámara. Aumentar mucho la iluminación puede hacer menos perceptibles las sombras, sin desactivarlas.

Para las pruebas lógicas del autor: `node desarrollo/pruebas/iluminacion.test.cjs` desde la raíz. También ejecuta las pruebas de movimiento. Node no es necesario para usar el HTML. Estas pruebas simulan DOM y renderizador; la apariencia, el teclado nativo de los sliders y el rendimiento requieren revisión en navegador.

El script de pruebas utiliza V1 para comparar la biblioteca y está pensado para ejecutarse desde `desarrollo` en el repositorio; no participa en la apertura del HTML independiente. Conservá intactos los respaldos cerrados y realizá los próximos cambios en `desarrollo/`. El HTML mantiene su indicación «en desarrollo» de la implementación probada; el cierre oficial se registra en la documentación y el historial.

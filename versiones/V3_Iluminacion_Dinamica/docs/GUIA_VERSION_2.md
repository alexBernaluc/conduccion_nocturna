# Guía práctica — V2: movimiento y cámara

Estado: cerrada el 13/11/2026 tras la confirmación personal del autor sobre el movimiento y la cámara. Respaldo: `versiones/V2_Movimiento/`.

## Abrir

Abrí `index.html` de la carpeta que quieras ejecutar: `desarrollo/` para el trabajo activo o `versiones/V2_Movimiento/` para la versión cerrada. Usá doble clic en un navegador con WebGL. Conservá juntos `index.html`, `src` y `vendor`: Three.js ya está incluido, no necesitás instalar nada ni levantar un servidor. La carpeta completa del respaldo puede trasladarse independientemente. Para repetir la comprobación offline, desconectá Internet antes de abrirlo.

## Conducir

| Teclas equivalentes | Acción |
| --- | --- |
| W / ↑ | Avanzar |
| S / ↓ | Retroceder |
| A / ← | Dirección izquierda |
| D / → | Dirección derecha |

Mantené las teclas presionadas. Combiná W+A, W+D, S+A o S+D. La dirección gira el auto solo mientras avanza o retrocede; en reversa cambia el sentido de rotación de la carrocería. Soltar las teclas detiene la acción, sin inercia. Las órdenes opuestas se cancelan y usar W junto con ↑ no duplica la velocidad.

La cámara sigue al auto con suavidad; no tiene controles propios. Al cambiar de ventana se limpian las teclas: al regresar volvé a presionarlas. Recargar el HTML restablece la posición inicial.

## Comprobaciones para repetir en otros equipos

1. Abrir sin Internet y comprobar que se ve la escena sin mensajes de error.
2. Avanzar, retroceder y girar en ambos sentidos, con letras y flechas. Las flechas no deben desplazar la página.
3. Combinar teclas, soltarlas y verificar que no queda una acción activa.
4. Cambiar a otra ventana mientras se avanza; regresar y comprobar que el auto se detuvo.
5. Observar que la cámara acompaña suavemente y que los faros y sus sombras siguen al vehículo.
6. Recorrer el límite exterior: el centro queda restringido a X entre -51 y 51, Z entre -40 y 40.
7. Cambiar el tamaño de la ventana, incluso a formato vertical, y revisar el encuadre.
8. Revisar la consola con F12: distinguir errores de una posible advertencia de obsolescencia de la biblioteca r158 ya usada en V1.

No hay colisiones con edificios, postes ni árboles. Podés atravesarlos; pueden tapar el auto o la vista de la cámara. No hay lomada, física, animación de ruedas ni controles de intensidad. El límite exterior es una restricción rectangular sencilla.

## Documentación y pruebas

La explicación para estudiar está en [EXPLICACION_TECNICA_V2.md](EXPLICACION_TECNICA_V2.md). La documentación de V1 se conserva.

Para repetir las pruebas lógicas, si el autor tiene Node instalado: `node desarrollo/pruebas/movimiento.test.cjs` desde la raíz organizadora. Node no es necesario para abrir el proyecto. Las pruebas simulan el renderizador; no sustituyen la revisión visual de WebGL.

La prueba automatizada utiliza V1 para comparar la biblioteca y se ejecuta desde la copia activa del repositorio; no es necesaria para usar el respaldo independiente. Conservá intactas las versiones cerradas y realizá los próximos cambios únicamente en `desarrollo/`. El HTML mantiene la indicación «en desarrollo» de la implementación probada; la documentación y el historial registran el cierre oficial sin modificar el HTML.

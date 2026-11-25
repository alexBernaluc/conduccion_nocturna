# Guía práctica — V4: conducción mejorada

V4 cerrada el 24/11/2026 tras la validación personal del autor. Abrí con doble clic `desarrollo/index.html` para el trabajo activo o `versiones/V4_Conduccion_Mejorada/index.html` para la versión cerrada. Cada carpeta incluye Three.js local, código y estilos internos del HTML: no requiere Internet, servidor ni instalaciones. Para trasladar el respaldo, copiá su carpeta completa.

| Tecla | Acción |
| --- | --- |
| W / ↑ | Acelerar hacia adelante; si retrocedés, primero frena |
| S / ↓ | Frenar si avanzás; mantener después de detenerte para retroceder |
| A / ←, D / → | Dirigir mientras se mueve, también por inercia y en crucero |
| C | Fijar/cancelar crucero; se activa avanzando a 3 u/s o más |

La aceleración crece durante tres segundos. Soltar el pedal desacelera gradualmente. W+S frena sin elegir marcha. Máximos: 12 u/s adelante y 5 u/s en reversa. El indicador muestra velocidad con signo (negativa = reversa), máximos y velocidad fijada en crucero. No son km/h.

Para crucero, mantené W unos dos segundos y pulsá C. Podés soltar W y dirigir con A/D. Si mantenías W al activarlo, esa pulsación anterior no cancela: una nueva pulsación de W o S devuelve el control manual. C nuevamente cancela; sin pedales comienza la desaceleración natural. Mantener C no alterna repetidamente.

## Panel, foco y límites

La iluminación V3 se conserva. WASD y C funcionan con foco en el panel; las flechas editan controles. Hacé clic en la escena para conducir con flechas. Entrar al panel limpia las órdenes de flechas anteriores, pero no detiene la inercia ni cancela crucero.

Cambiar de ventana o visibilidad detiene el auto y cancela crucero. Al regresar hay que acelerar de nuevo. El límite exterior también detiene velocidad y cancela crucero. Todavía no hay colisiones con edificios, lomada, suspensión ni derrapes.

## Comprobaciones para repetir en otros equipos

1. Abrir sin Internet, acelerar y comprobar arranque suave y tope 12.
2. Soltar W, comparar desaceleración con frenado mediante S y mantener S hasta retroceder. Comprobar tope de reversa 5.
3. Presionar W mientras retrocedés: primero frena y después avanza. Probar W+S y A+D.
4. Intentar C detenido, lento o en reversa: debe rechazarse. Probar desde 3 u/s.
5. Activar crucero, soltar W y girar. Cancelar con C, nueva W o S; mantener C para verificar que no repite.
6. Cambiar de ventana con crucero activo: debe regresar detenido y desactivado.
7. Conducir en curvas mientras ajustás iluminación: revisar cámara, faros, sombras e indicador.
8. Redimensionar, plegar panel y probar frontera del mapa. Recargar devuelve posición inicial.

Documentación: [EXPLICACION_TECNICA_V4.md](EXPLICACION_TECNICA_V4.md). Pruebas del autor: `node desarrollo/pruebas/iluminacion.test.cjs` desde la raíz (incluye movimiento V4). Simulan DOM/renderizador y no sustituyen la revisión visual. Node no es necesario para usar el HTML. Se conservan las guías V1–V3.

La comparación de biblioteca contra V1 está solo en las pruebas del autor, que se ejecutan desde `desarrollo`; no es una dependencia de ejecución del HTML. Conservá intactos los respaldos y realizá próximos cambios únicamente en `desarrollo/`. El texto «en desarrollo» del HTML probado se conserva: el cierre oficial se registra en la documentación y el historial.

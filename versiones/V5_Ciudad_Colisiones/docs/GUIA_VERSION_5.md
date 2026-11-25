# Guía práctica — V5: ciudad y colisiones

Estado: V5 cerrada el 25/11/2026 tras la confirmación del autor de que fue implementada y probada. Abrí `desarrollo/index.html` para el trabajo activo o `versiones/V5_Ciudad_Colisiones/index.html` para la copia cerrada. Conservá toda la carpeta: incluye Three.js, ambos scripts propios y estilos dentro del HTML; no requiere Internet, servidor ni instalaciones.

## Recorrido y controles

Se mantienen cinco manzanas, con cinco casas, tres comercios, dos edificios medianos, veredas, árboles y muros bajos. Las calles tienen ancho 8 y conservan sus ejes de V4.

- W/↑ acelera hacia adelante; S/↓ frena y, manteniendo después de detenerse, retrocede.
- A/← y D/→ dirigen; **ahora también permiten girar en reposo si la carrocería tiene espacio**.
- C fija/cancela crucero desde 3 u/s. Una nueva W/S, una colisión o perder foco lo cancelan.
- Frente a un obstáculo se detiene la velocidad; soltá avance y mantené S para retroceder. Si el giro está bloqueado, soltá dirección y separá primero el auto del obstáculo.
- Puede haber un pequeño deslizamiento lateral contra paredes; no hay rebote, daños ni física de impacto.

Los sólidos son los cuerpos de casas/edificios/comercios, troncos, soportes de postes y muros. Suelo, calzadas, veredas, ventanas, carteles y luces visuales no bloquean. Las copas están elevadas; se colisiona con el tronco. Las veredas se ven elevadas, pero en V5 el movimiento sigue siendo plano.

Se conserva aceleración progresiva, frenado, reversa, indicador y panel de iluminación. WASD y C permiten conducir con foco en el panel; las flechas editan sus controles. Las ventanas emisivas siguen respondiendo al control de brillo y solo los dos faros proyectan sombras.

La cámara conserva su seguimiento. Cuando un edificio o árbol tapa el centro del auto, su grupo se vuelve temporalmente semitransparente; recupera opacidad al despejarse. Esto no elimina su colisión.

## Tramo reservado para V6

La calle recta de **X = 39**, entre **Z = -34 y Z = 34**, queda libre para aproximación, futura lomada y salida. Su calzada ocupa X entre 35 y 43. No hay lomada todavía: todo el recorrido es plano. Los postes próximos quedan fuera de esa calzada.

## Comprobaciones para repetir en otros equipos

1. Abrir sin conexión y recorrer los ejes X = -39, -13, 13, 39 y los cruces Z = -26, 0, 26.
2. Aproximarse a casas, edificios, troncos, postes y muros: ninguna parte del auto debe atravesar sus volúmenes sólidos.
3. Repetir en avance, reversa y a máxima velocidad. Mantener avance contra una pared: no debe acumular velocidad ni vibrar visiblemente.
4. Detenerse frente a un obstáculo, retroceder y girar en el espacio disponible. Un giro que invada el sólido debe bloquearse.
5. Activar crucero y acercarse a una pared: comprobar velocidad cero, indicador desactivado y ausencia de reactivación automática.
6. Acercarse diagonalmente a un muro y observar el deslizamiento limitado. Probar el borde exterior con distintos ángulos.
7. Girar en esquinas, circular junto a edificios y retroceder observando cámara y transparencia temporal.
8. Cambiar intensidades, emisión, apertura/alcance y grupos; revisar sombras mientras se conduce.
9. Recorrer el tramo reservado completo y revisar interfaz en otros tamaños de ventana.

Pruebas lógicas del autor desde la raíz:

```text
node desarrollo/pruebas/colisiones.test.cjs
node desarrollo/pruebas/iluminacion.test.cjs
```

Usan Three.js local con DOM y renderizador simulados. No prueban imagen WebGL, rendimiento de GPU, sensación de contacto ni orden de transparencias: esas comprobaciones quedan para el navegador. No se necesita Node para ejecutar el HTML. Explicación completa: [EXPLICACION_TECNICA_V5.md](EXPLICACION_TECNICA_V5.md).

La explicación incluye **«Modificaciones prácticas para la defensa»**, con archivos, funciones, valores concretos y errores frecuentes. Esos ejercicios no se aplicaron al código cerrado. Practicar solamente en `desarrollo`, conservando intactos los respaldos. La referencia a V1 usada por las pruebas es solo una comparación del autor dentro del repositorio; la aplicación respaldada no depende de otras versiones. El HTML conserva el texto «en desarrollo» de la implementación probada y el cierre oficial se registra en la documentación.

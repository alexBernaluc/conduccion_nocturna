# Historial de versiones — Conducción Nocturna

## V1 — Escenario fijo

- **Estado:** versión existente respaldada; sin cambios funcionales.
- **Fecha de organización y respaldo:** 13/11/2026 (no implica fecha original de creación).
- **Respaldo independiente:** [versiones/V1_Escenario_Fijo/index.html](versiones/V1_Escenario_Fijo/index.html).
- **Contenido:** terreno y bordes, siete calzadas, cinco manzanas, diez edificios, diez árboles, siete postes con `PointLight`, vehículo estático, dos `SpotLight` con sombras, luz hemisférica y direccional, niebla y cámara fija en tercera persona.
- **Ejecución:** HTML directo con `vendor/three.min.js` local, sin servidor ni instalación.
- **Documentación original:** `README.md`, `docs/GUIA_VERSION_1.md` y `vendor/LEEME.txt`, conservados en cada copia.
- **Documentación añadida fuera del respaldo:** [explicación técnica V1](docs/EXPLICACION_TECNICA_V1.md), organización y plantilla para próximas explicaciones.
- **Desarrollo:** copia inicial idéntica en código y biblioteca, preparada para comenzar V2; no se agregaron funcionalidades.

### Verificación realizada el 13/11/2026

- Comparación SHA-256 de los siete archivos originales: idénticos en raíz, `desarrollo` y `versiones/V1_Escenario_Fijo`, incluida la guía y la biblioteca.
- Rutas locales de scripts del HTML resueltas dentro de cada copia; ninguna depende del código o la biblioteca de otra carpeta.
- Sintaxis de los tres `src/escena.js` comprobada con `node --check`.
- Construcción ejecutada en las tres copias con la biblioteca local real (revisión 158) y DOM/renderizador simulados: 224 mallas, 28 grupos, siete luces puntuales, dos focos, una luz hemisférica y una direccional. Objetivos de faros vinculados al auto y cámara en `(-6.9, 8.84, 25)`.
- Callback del bucle y redimensionamiento comprobados en esa simulación, sin acceso a Internet.
- **Límite de la comprobación:** no se realizó una prueba visual en navegador ni se ejercitó WebGL real. La apertura offline funcional original fue informada por el usuario; las copias conservan exactamente sus archivos. Para confirmar visualmente en el equipo de entrega, desconectar Internet, abrir el HTML propio de cada carpeta, revisar la escena y redimensionar la ventana.

## Versiones pendientes

Las etapas mencionadas en el README original son propuestas: V2 (movimiento y cámara seguidora), V3 (intensidades), V4 (lomada e inclinación), V5 (integración y rendimiento). Ninguna se registra todavía como implementada ni tiene un respaldo terminado.

Para cada cierre futuro registrar: fecha, carpeta independiente, funcionalidades incorporadas, archivos cambiados, enlace a su explicación técnica, verificaciones efectivamente realizadas y limitaciones conocidas.

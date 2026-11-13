# Organización de Conducción Nocturna

Organización realizada el 13/11/2026 sin cambios al código de la V1.

```text
conduccion_nocturna/
├── desarrollo/                    # Única aplicación que se editará desde ahora
│   ├── index.html
│   ├── src/escena.js
│   ├── vendor/                     # Incluye three.min.js
│   ├── docs/                       # Guía original, explicación y plantilla
│   ├── README.md
│   └── PREPARAR_OFFLINE.bat
├── versiones/
│   └── V1_Escenario_Fijo/          # Copia completa e intacta de V1
├── docs/
│   ├── GUIA_VERSION_1.md           # Original conservado
│   └── EXPLICACION_TECNICA_V1.md   # Documento ampliado
├── HISTORIAL_VERSIONES.md
├── ORGANIZACION_PROYECTO.md
└── archivos originales de V1       # Conservados en su ubicación inicial
```

## Abrir y trabajar

- Para ver el respaldo: abrir [versiones/V1_Escenario_Fijo/index.html](versiones/V1_Escenario_Fijo/index.html).
- Para continuar: abrir [desarrollo/index.html](desarrollo/index.html) y editar [desarrollo/src/escena.js](desarrollo/src/escena.js). Cambiar la pestaña del editor que todavía apunta a `src/escena.js` en la raíz.
- Para estudiar: leer [la explicación técnica](docs/EXPLICACION_TECNICA_V1.md) junto con [la guía original](docs/GUIA_VERSION_1.md).

Cada aplicación tiene su propio `src` y `vendor`. Se puede copiar o entregar la carpeta completa de una versión y abrir su HTML sin servidor, instalaciones ni Internet. No entregar solo el HTML. La biblioteca ya está incluida; no hace falta ejecutar el BAT para estas copias.

Los originales de la raíz se conservan por seguridad, pero no son el lugar de desarrollo. No se movieron ni reemplazaron archivos existentes. No se encontró un repositorio Git en esta carpeta ni en sus antecesores; no se inicializó ninguno.

## Cerrar versiones futuras

1. Implementar y documentar únicamente dentro de `desarrollo`.
2. Crear `desarrollo/docs/EXPLICACION_TECNICA_VN.md` usando la plantilla. Conservar la guía original y las explicaciones anteriores.
3. Validar funcionalidad y apertura offline, incluido redimensionamiento y consola. Distinguir pruebas automatizadas de comprobación visual.
4. Copiar todo el contenido de `desarrollo` a una carpeta nueva `versiones/VN_Nombre_Descriptivo`, con su propio HTML, biblioteca, código y documentación. No copiar carpetas organizadoras dentro de sí mismas ni crear repositorios anidados.
5. Comprobar integridad y rutas y abrir el HTML de esa copia. Registrar en el historial cambios, fecha, estado y pruebas.
6. Mantener intacto el respaldo cerrado y continuar la siguiente versión en `desarrollo`.

La copia inicial de V1 conserva exactamente la documentación que existía al respaldarla. La explicación ampliada posterior está en `docs` y en `desarrollo/docs`; no se altera retrospectivamente el respaldo para agregarla.

# PERIODIC3D v2 · Tabla periódica 3D + muestras reales + datos científicos

## Estructura

El paquete incluye la carpeta `periodica/` con HTML, CSS, JavaScript, 118 elementos,
un generador de caché científica opcional y un favicon. El sitio es estático,
no requiere instalar Node, Angular, un backend, una cuenta ni una base de datos.

## Nuevas funcionalidades

- Visualización en 3D de los 118 elementos en distribución periódica, esfera y hélice.
- Buscador de elementos por nombre, símbolo o número atómico; filtros de familia.
- Fotografías documentales de muestras físicas, cuando existen, enlazadas desde
  Wikimedia Commons; autor y tipo de licencia mostrados en la ficha.
- Vista alternativa de átomo **didáctico**, señalada como representación gráfica
  (no son órbitas físicas reales).
- Ficha científica completa por elemento, incluyendo masa atómica, clasificación,
  grupo, período, bloque, estado, configuración electrónica, electronegatividad,
  radio atómico (van der Waals), energías de ionización, afinidad electrónica,
  estados de oxidación, temperaturas de fusión y ebullición, densidad,
  descubrimiento, observaciones de aspecto físico y capas electrónicas.
- Datos ausentes mostrados como «No disponible»; no se inventan fotografías,
  isótopos, neutrones ni mediciones para elementos ultrapesados.
- Diseño responsive, diálogos accesibles, navegación por teclado.

## Fuentes de datos

1. PubChem (Institutos Nacionales de Salud, EE. UU.), servicio PUG REST,
   https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON
2. Bowserinator / Periodic-Table-JSON, con imágenes de Wikimedia Commons,
   créditos y propiedades complementarias:
   https://github.com/Bowserinator/Periodic-Table-JSON
3. IUPAC, referencia para los elementos reconocidos:
   https://iupac.org/what-we-do/periodic-table-of-elements/

Las fuentes son descargadas **por el navegador** cuando se abre la página.
Si PubChem no responde, se usan algunos campos del catálogo complementario
marcándolos expresamente como tal; nunca se indica que son mediciones PubChem.
Los valores pueden cambiar con las revisiones científicas de las fuentes.
Las fotografías muestran condiciones de laboratorio concretas y pueden no
representar el aspecto del elemento a temperatura ambiente; en particular,
tubos de descarga muestran gases que emiten luz al excitarlos.

Para **publicar con datos cacheados** y no depender de las APIs en cada visita:

```bash
cd periodica
python actualizar_fuentes.py
```

Esto genera `periodica/science-cache.json` después de comprobar que ambas
fuentes contienen 118 entradas y símbolos coincidentes. Publica ese archivo
junto con los demás. Esta ejecución requiere Internet; no se incluyó una
captura precargada porque la descarga no estaba disponible durante la creación.

## Ruta solicitada `/periodica/`

Copia **solo** la carpeta `periodica` dentro del directorio público de tu
sitio existente. No sobrescribas su `index.html` principal:

```
wwwroot/
├── index.html           # tu web actual, sin cambios
└── periodica/
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── science.js
    ├── data.js
    ├── favicon.svg
    ├── actualizar_fuentes.py   # solo necesario en desarrollo
    └── science-cache.json      # opcional, generado localmente
```

Prueba local desde la carpeta en la que hayas extraído `periodica/`:

```bash
python -m http.server 8080
```

Abre `http://localhost:8080/periodica/`.

En Nginx con raíz `/var/www/html` no hace falta una aplicación backend:

```nginx
location /periodica/ {
    try_files $uri $uri/ =404;
}
```

**Sites**: este paquete no publica directamente en ChatGPT Sites ni modifica
su sitio conectado. Se integra en un alojamiento que admita archivos estáticos
y la ruta `/periodica/` (o se publica como aplicación externa y se enlaza
/ inserta desde Sites si su editor lo admite).

## Consideraciones científicas y legales

- La masa de elementos radiactivos sin peso atómico estándar suele corresponder
  a un isótopo de referencia; esto se indica en la ficha.
- Las imágenes tienen licencias distintas; conserva siempre créditos y enlaces
  a los archivos originales de Wikimedia Commons.
- Para elementos sintéticos sin muestras macroscópicas no se muestran imágenes
  inventadas como si fueran fotografías reales.
- Un esquema tipo Bohr no describe con exactitud orbitales cuánticos; solo
  representa visualmente el tema atómico.

## Publicación en GitHub Pages

Repositorio: https://github.com/ElGeras90/tablaperiodica

URL prevista cuando GitHub Pages esté habilitado:
https://elgeras90.github.io/tablaperiodica/periodica/

- La raíz `/` redirige a `/periodica/`.
- El contenido estático se almacena bajo `periodica/`.
- El workflow `.github/workflows/pages.yml` despliega automáticamente cada push a `main`.

**Activación inicial (una sola vez):**
1. Abrir https://github.com/ElGeras90/tablaperiodica/settings/pages
2. En *Build and deployment* seleccionar **GitHub Actions** como *Source*.
3. Abrir la pestaña Actions, seleccionar `Publicar tabla periódica en GitHub Pages` y reejecutar el flujo fallido o iniciar *Run workflow*.

GitHub Pages debe estar habilitado para que `actions/configure-pages` y `actions/deploy-pages` funcionen. El archivo YAML por sí solo no lo activa en un repositorio nuevo sin un token de administración de Pages. No agregues tokens privados al repositorio.

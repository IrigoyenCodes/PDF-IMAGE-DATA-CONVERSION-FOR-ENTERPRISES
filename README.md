# Procesador de Documentos Institucionales

## Descripción del Proyecto

Esta es una aplicación web diseñada para automatizar y agilizar el proceso de extracción de datos de documentos PDF, específicamente del formato "Orden de Trabajo". El sistema utiliza la inteligencia artificial de Google (Gemini) para leer los documentos (incluso si son imágenes escaneadas), extraer información clave y consolidarla en un formato estructurado que puede ser exportado a un archivo de Excel.

El objetivo principal es eliminar la entrada manual de datos, reducir errores y ahorrar tiempo en tareas administrativas y de registro.

## Características Principales

- **Carga Múltiple de Archivos:** Permite seleccionar o arrastrar y soltar múltiples archivos PDF a la vez.
- **Clasificación y Extracción Inteligente de Datos:** Utiliza la API de Google Gemini para clasificar automáticamente documentos como "Orden de Trabajo" o "Pedido de Suministros", y luego realizar un Reconocimiento Óptico de Caracteres (OCR) para extraer campos específicos.
- **Dashboard de Análisis:** ¡Nuevo! Visualiza un resumen instantáneo de los documentos procesados. Obtén métricas clave como el total de archivos, el desglose por tipo de documento y un gráfico de las categorías de órdenes de trabajo más comunes.
- **Previsualización de Datos y Edición:** Ofrece una vista previa editable en una ventana modal de todos los datos extraídos antes de la exportación, facilitando la revisión y corrección.
- **Exportación a Excel:** Genera un único archivo `.xlsx` con todos los datos procesados de los documentos cargados, organizado en columnas predefinidas.
- **Renombrado y Descarga en Lote:** Permite descargar un archivo `.zip` con todos los documentos procesados, renombrados automáticamente con su número de `orden` extraído.
- **Miniaturas de Documentos:** Muestra una previsualización de la primera página de cada PDF para una rápida identificación visual. Al hacer clic, se abre el documento original.
- **Manejo de Errores y Reintentos:** Si un archivo falla, la fila se resalta, muestra un mensaje de error detallado y ofrece un botón para reintentar el procesamiento de ese archivo individualmente.
- **Interfaz Intuitiva:** Diseño limpio y fácil de usar que guía al usuario a través del proceso de carga, procesamiento y exportación.

## ¿Cómo Funciona?

El flujo de trabajo de la aplicación es simple y directo:

1.  **Cargar Documentos:** El usuario accede a la aplicación y utiliza el área designada para "hacer clic" o "arrastrar y soltar" los archivos PDF que desea procesar. Se mostrarán miniaturas para una fácil verificación.
2.  **Procesar Archivos:** Una vez seleccionados los archivos, el usuario presiona el botón "Process Documents". La aplicación procesará cada archivo de forma secuencial.
3.  **Extracción con IA:** Cada PDF se convierte a un formato compatible y se envía a la API de Gemini con instrucciones precisas sobre qué datos buscar y cómo extraerlos.
4.  **Visualización de Resultados:** Los datos extraídos de cada documento se muestran en una tabla en la página principal, actualizándose a medida que cada archivo es procesado. Si ocurre un error, la fila afectada lo indicará.
5.  **Revisión y Acciones:** El usuario puede revisar los resultados, ver el dashboard de análisis, editar datos en la ventana de previsualización, reintentar archivos fallidos, exportar a Excel, o descargar los archivos renombrados en un `.zip`.

## Estructura de Columnas en Excel

El archivo de Excel generado contendrá las siguientes columnas:

**Para Órdenes de Trabajo:**
- **ORDEN, ARCHIVOS, SERIE, FECHA REGISTRO, CATEGORIA, DESCRIPCION, FECHA CIERRE**

**Para Pedidos de Suministro:**
- **ORDEN, ARCHIVOS, SERIE, FECHA REGISTRO, CONTADOR, FECHA ENTREGA**


**Formato:** Todas las celdas tendrán la fuente "Aptos Narrow" en tamaño 11, con los encabezados en negrita, para una legibilidad óptima. El texto se ajustará automáticamente dentro de las celdas.

## Tecnologías Utilizadas

- **Frontend:** React 19, TypeScript 5.8
- **Build Tool:** Vite 6.2
- **Inteligencia Artificial:** Google Gemini API (@google/genai)
- **Estilos:** Tailwind CSS (CDN)
- **Utilidades:**
    - **Exportación a Excel:** SheetJS (xlsx)
    - **Generación de ZIP:** JSZip
    - **Renderizado de PDF:** PDF.js

## Instalación y Configuración

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Una API Key de Google Gemini ([Obtener aquí](https://aistudio.google.com/app/apikey))

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd udlap-ti
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   
   Crear un archivo `.env.local` en la raíz del proyecto:
   ```bash
   GEMINI_API_KEY=tu_api_key_aqui
   ```
   
   ⚠️ **IMPORTANTE:** Nunca compartas tu API key públicamente. El archivo `.env.local` está en `.gitignore` para proteger tus credenciales.

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en `http://localhost:3000`

5. **Construir para producción:**
   ```bash
   npm run build
   npm run preview
   ```

## Mejoras Futuras Sugeridas

### 🚀 Funcionalidades
- **Procesamiento por lotes mejorado:** Procesamiento paralelo de múltiples PDFs simultáneamente
- **Historial de procesamiento:** Guardar y consultar documentos procesados anteriormente
- **Exportación a múltiples formatos:** CSV, JSON, Google Sheets
- **Plantillas personalizables:** Permitir al usuario definir campos de extracción personalizados
- **Búsqueda y filtrado:** Buscar documentos por orden, serie, fecha, etc.
- **Validación de datos:** Reglas de validación automática para campos extraídos
- **Notificaciones:** Alertas cuando el procesamiento se complete

### 🎨 UI/UX
- **Modo oscuro:** Tema oscuro para reducir fatiga visual
- **Arrastrar y soltar mejorado:** Indicadores visuales más claros
- **Progreso detallado:** Barra de progreso con tiempo estimado
- **Comparación lado a lado:** Ver PDF original junto a datos extraídos
- **Atajos de teclado:** Navegación rápida con teclado
- **Responsive design:** Optimización para tablets y móviles

### 🔧 Técnicas
- **Base de datos local:** IndexedDB para almacenar historial sin backend
- **Service Workers:** Funcionalidad offline y caché
- **Tests automatizados:** Jest + React Testing Library
- **CI/CD:** GitHub Actions para deploy automático
- **Docker:** Containerización para fácil deployment
- **Autenticación:** Sistema de usuarios con roles (admin, usuario)
- **API REST:** Backend para compartir datos entre usuarios
- **WebSockets:** Actualizaciones en tiempo real del procesamiento

### 🔒 Seguridad
- **Encriptación de archivos:** Proteger PDFs sensibles
- **Rate limiting:** Prevenir abuso de la API
- **Logs de auditoría:** Registro de todas las acciones
- **Validación de archivos:** Verificar que los PDFs no contengan malware

### 📊 Analytics
- **Métricas de uso:** Tracking de documentos procesados, tiempo promedio, etc.
- **Reportes automáticos:** Generación de reportes semanales/mensuales
- **Gráficos avanzados:** Visualizaciones con Chart.js o Recharts

### 🌐 Integraciones
- **Google Drive:** Importar/exportar directamente desde Drive
- **Dropbox/OneDrive:** Soporte para otros servicios de nube
- **Email:** Enviar reportes por correo automáticamente
- **Slack/Teams:** Notificaciones en canales de trabajo
- **Zapier/Make:** Automatizaciones con otras herramientas
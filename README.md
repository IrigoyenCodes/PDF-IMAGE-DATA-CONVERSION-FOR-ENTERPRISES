# Procesador de Documentos Institucionales

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/IrigoyenCodes/PDF-IMAGE-DATA-CONVERSION-FOR-ENTERPRISES)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite)](https://vitejs.dev/)

## Descripción del Proyecto

Esta es una aplicación web diseñada para automatizar y agilizar el proceso de extracción de datos de documentos PDF, específicamente del formato "Orden de Trabajo". El sistema utiliza la inteligencia artificial de Google (Gemini) para leer los documentos (incluso si son imágenes escaneadas), extraer información clave y consolidarla en un formato estructurado que puede ser exportado a un archivo de Excel.

El objetivo principal es eliminar la entrada manual de datos, reducir errores y ahorrar tiempo en tareas administrativas y de registro.

## Características Principales

- **Carga Múltiple de Archivos:** Permite seleccionar o arrastrar y soltar múltiples archivos PDF a la vez.
- **Clasificación y Extracción Inteligente de Datos:** Utiliza la API de Google Gemini para clasificar automáticamente documentos como "Orden de Trabajo", "Pedido de Suministros", "Desinstalación" o "Instalación", y luego realizar un Reconocimiento Óptico de Caracteres (OCR) para extraer campos específicos.
- **Dashboard de Análisis:** ¡Nuevo! Visualiza un resumen instantáneo de los documentos procesados. Obtén métricas clave como el total de archivos, el desglose por tipo de documento y un gráfico de las categorías de órdenes de trabajo más comunes.
- **Previsualización de Datos y Edición:** Ofrece una vista previa editable en una ventana modal de todos los datos extraídos antes de la exportación, facilitando la revisión y corrección.
- **Exportación a Excel:** Genera un único archivo `.xlsx` con todos los datos procesados de los documentos cargados, organizado en columnas predefinidas.
- **Renombrado y Descarga en Lote:** Permite descargar un archivo `.zip` con todos los documentos procesados, renombrados automáticamente con su número de `orden` extraído.
- **Miniaturas de Documentos:** Muestra una previsualización de la primera página de cada PDF para una rápida identificación visual. Al hacer clic, se abre el documento original.
- **Manejo de Errores y Reintentos:** Si un archivo falla, la fila se resalta, muestra un mensaje de error detallado y ofrece un botón para reintentar el procesamiento de ese archivo individualmente.
- **Interfaz Intuitiva:** Diseño limpio y fácil de usar que guía al usuario a través del proceso de carga, procesamiento y exportación.
- **Progreso en Tiempo Real:** Barra de progreso con porcentaje y tiempo estimado restante durante el procesamiento.
- **Notificaciones Toast:** Alertas visuales no intrusivas para acciones del usuario y resultados de procesamiento.
- **Drag & Drop Mejorado:** Indicadores visuales dinámicos al arrastrar archivos sobre el área de carga.

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

**Para Desinstalaciones:**
- **FOLIO, ARCHIVOS, SERIE, FECHA, CONTADOR B/N, CONTADOR COLOR, CONTADOR ESCANER, LINK, COMENTARIOS**

**Para Instalaciones:**
- **FOLIO, ARCHIVOS, SERIE, FECHA, CONTADOR B/N, LINK, COMENTARIOS**

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
   git clone https://github.com/IrigoyenCodes/PDF-IMAGE-DATA-CONVERSION-FOR-ENTERPRISES.git
   cd PDF-IMAGE-DATA-CONVERSION-FOR-ENTERPRISES
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

## Características Implementadas Recientemente

### ✨ Mejoras de UX (v1.1.0)
- ✅ **Barra de progreso detallada** con porcentaje y ETA
- ✅ **Sistema de notificaciones toast** con 3 tipos (success, error, info)
- ✅ **Drag & drop mejorado** con feedback visual dinámico
- ✅ **Animaciones suaves** para transiciones y estados de carga
- ✅ **Mejor manejo de errores** con mensajes descriptivos

## Problemas Conocidos

### ⚠️ Limitaciones Actuales

1. **Procesamiento Secuencial:** Los archivos se procesan uno por uno. Para grandes volúmenes, considerar procesamiento paralelo.
2. **Dependencia de API Externa:** Requiere conexión a internet y API key válida de Google Gemini.
3. **Límites de Rate:** La API de Gemini tiene límites de tasa. Se incluye un delay de 200ms entre archivos.
4. **Tamaño de Archivos:** PDFs muy grandes (>10MB) pueden tardar más en procesarse.
5. **Precisión de OCR:** La exactitud depende de la calidad del escaneo del PDF original.

### 🐛 Bugs Menores

- **Drag Leave Event:** En algunos navegadores, el evento `dragLeave` puede dispararse al pasar sobre elementos hijos.
- **Memory Leaks Potenciales:** Los Object URLs creados para miniaturas no se revocan explícitamente.

## Solución de Problemas

### El procesamiento falla constantemente
- Verifica que tu API key de Gemini sea válida
- Comprueba tu conexión a internet
- Revisa los límites de tu cuenta de Gemini API

### Los PDFs no se cargan
- Asegúrate de que los archivos sean PDFs válidos
- Verifica que el tamaño del archivo no exceda los límites del navegador

### La aplicación no inicia
- Ejecuta `npm install` para asegurar que todas las dependencias estén instaladas
- Verifica que el archivo `.env.local` exista y contenga `GEMINI_API_KEY`

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
- **Comparación lado a lado:** Ver PDF original junto a datos extraídos
- **Atajos de teclado:** Navegación rápida con teclado
- **Responsive design:** Optimización para tablets y móviles
- **Confirmaciones de acciones:** Diálogos de confirmación para acciones destructivas

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

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## Contacto

**Desarrollador:** IrigoyenCodes  
**Repositorio:** [PDF-IMAGE-DATA-CONVERSION-FOR-ENTERPRISES](https://github.com/IrigoyenCodes/PDF-IMAGE-DATA-CONVERSION-FOR-ENTERPRISES)

## Agradecimientos

- Google Gemini AI por la API de procesamiento de documentos
- La comunidad de React y TypeScript
- Todos los contribuidores y testers del proyecto
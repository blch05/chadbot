# Leo - Tu Librero de Confianza 📚

Leo es un asistente virtual especializado en libros, construido con Next.js 15, OpenRouter AI (Claude 3.5 Sonnet), Google Books API y MongoDB. Tu compañero inteligente para descubrir, explorar y gestionar tu próxima lectura.

## 🚀 Características

- **Búsqueda inteligente de libros** integrada con Google Books API
- **Recomendaciones personalizadas** basadas en tus preferencias
- **Lista de lectura personalizada** con prioridades y notas
- **Detalles completos de libros** (portada, descripción, reseñas, categorías)
- **Carrusel interactivo** para explorar múltiples resultados
- **Chat AI en tiempo real** con streaming de respuestas
- **Autenticación completa** con registro y login
- **Base de datos MongoDB** para gestión de usuarios y datos
- **Historial de conversaciones** guardado automáticamente
- **Perfil de usuario** con estadísticas de lectura y recomendaciones
- **Interfaz moderna** con Tailwind CSS
- **Seguridad robusta** con JWT y bcrypt
- **Validación de inputs** y sanitización
- **Suite de tests completa** con Jest y React Testing Library (63 tests)

## 📋 Requisitos Previos

- Node.js 18+ 
- NPM o Yarn
- Cuenta en [OpenRouter](https://openrouter.ai/) (para el modelo de IA)
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (para la base de datos)
- Google Books API habilitada (gratuita, sin API key requerida)

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repo>
cd chadbot
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# OpenRouter API (para el modelo de IA Claude 3.5 Sonnet)
OPENROUTER_API_KEY=tu_api_key_aqui
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# URL del sitio
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://usuario:<password>@cluster.mongodb.net/?appName=leo
MONGODB_DB=leo

# JWT Secret (IMPORTANTE: Cambiar en producción a una cadena aleatoria larga)
JWT_SECRET=tu_jwt_secret_super_seguro_cambialo_en_produccion

# Session
SESSION_COOKIE_NAME=leo-session
```

4. **Reemplazar password en MongoDB URI**

En el archivo `.env.local`, reemplaza `<password>` con tu contraseña real de MongoDB.

5. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🗄️ Configuración de MongoDB

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Crea un usuario de base de datos
4. Whitelist tu IP (o usa 0.0.0.0/0 para desarrollo)
5. Obtén tu connection string y úsalo en `MONGODB_URI`

## 🔐 Sistema de Autenticación

### Registro de Usuario
- **Ruta**: `/auth/register`
- **Validaciones**:
  - Email válido
  - Contraseña mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
  - Nombre mínimo 2 caracteres

### Login
- **Ruta**: `/auth/login`
- **Session**: JWT almacenado en cookie HttpOnly
- **Duración**: 7 días

### Protección de Rutas
- Middleware automático redirige a `/auth/login` si no estás autenticado
- Una vez autenticado, acceso completo al chat

## 🏗️ Estructura del Proyecto

```
chadbot/
├── app/
│   ├── api/
│   │   ├── auth/              # Endpoints de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── logout/
│   │   │   └── me/
│   │   ├── books/             # Endpoints de búsqueda de libros
│   │   │   ├── search/        # Búsqueda de libros (Google Books API)
│   │   │   └── [id]/          # Detalles de un libro específico
│   │   ├── chat/              # Endpoint del chat AI con herramientas
│   │   ├── conversations/     # Endpoints de conversaciones
│   │   │   └── [id]/          # Actualizar/Eliminar conversación
│   │   ├── reading-list/      # Endpoints de lista de lectura
│   │   │   ├── GET, POST      # Obtener y agregar libros
│   │   │   ├── [id]/          # Actualizar/Eliminar libro
│   │   │   └── stats/         # Estadísticas de lectura
│   │   └── recommendations/   # Endpoint para guardar recomendaciones
│   ├── auth/                  # Páginas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── profile/               # Página de perfil de usuario
│   │                          # (estadísticas, lista de lectura, recomendaciones)
│   ├── layout.tsx             # Layout principal con Geist font
│   ├── globals.css            # Estilos globales
│   └── page.tsx               # Chat principal con carrusel de libros (protegido)
├── hooks/
│   ├── useAuth.ts             # Hook de autenticación
│   ├── useConversations.ts    # Hook de gestión de conversaciones
│   └── useReadingList.ts      # Hook de lista de lectura
├── lib/
│   ├── ai/
│   │   └── tools.ts           # Herramientas AI: searchBooks, getBookDetails
│   ├── types/
│   │   ├── auth.ts            # Tipos TypeScript de autenticación
│   │   ├── conversation.ts    # Tipos TypeScript de conversaciones
│   │   └── readingList.ts     # Tipos TypeScript de lista de lectura
│   ├── mongodb.ts             # Configuración MongoDB
│   ├── auth.ts                # Utilidades de autenticación (bcrypt, JWT)
│   └── readingList.ts         # Utilidades de lista de lectura
├── jest.config.js             # Configuración de Jest
├── jest.setup.js              # Setup global de tests
├── TESTS.md                   # Documentación de tests
└── middleware.ts              # Middleware de protección de rutas
```

## 🎨 Colores del Theme

El tema usa colores tierra y naturales:
- **Marrón oscuro**: `#251711`
- **Verde oliva**: `#616f55`
- **Beige**: `#faf8f6`

## 📦 Tecnologías Utilizadas

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Fuentes**: Geist Sans y Geist Mono

### Backend & AI
- **AI**: Vercel AI SDK v5, OpenRouter (Claude 3.5 Sonnet)
- **Base de Datos**: MongoDB con colecciones para usuarios, conversaciones, listas de lectura y recomendaciones
- **API Externa**: Google Books API

### Autenticación & Seguridad
- **JWT**: jsonwebtoken para tokens de sesión
- **Hashing**: bcryptjs para contraseñas
- **Validación**: Zod para schemas

### Visualización de Datos
- **Gráficos**: Chart.js 4 con react-chartjs-2 (estadísticas de lectura)

### Testing
- **Framework**: Jest v29.7.0
- **Testing Library**: React Testing Library v14.3.1
- **Cobertura**: 63 tests en 5 suites
  - Auth utilities (23 tests)
  - AI tools (10 tests)  
  - useAuth hook (10 tests)
  - Books API (9 tests)
  - Reading list utilities (15 tests)

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ JWT con expiración de 7 días
- ✅ Cookies HttpOnly (previene XSS)
- ✅ Validación de inputs en cliente y servidor con Zod
- ✅ Sanitización de mensajes del chat
- ✅ Headers de seguridad configurados
- ✅ Middleware de protección de rutas
- ✅ CORS configurado apropiadamente
- ✅ Rate limiting recomendado para producción

## 🎨 Características de UI

### Carrusel de Libros
- Navegación intuitiva con botones de anterior/siguiente
- Indicadores visuales del libro actual
- Tarjetas con portada, descripción, autores, calificación
- Enlaces directos a Google Books
- Botón para agregar a lista de lectura

### Tarjetas de Libro
- **BookCard**: Vista compacta para múltiples resultados
- **DetailedBookCard**: Vista expandida para libros específicos
  - Portada grande
  - Metadata completa (editorial, fecha, páginas, idioma)
  - Descripción expandible
  - Categorías e ISBN
  - Información de venta si disponible
  - Múltiples botones de acción

### Tema de Colores
- **Primario**: Verde oliva `#616f55` (botones, acentos)
- **Secundario**: Marrón oscuro `#251711` (sidebar, headers)
- **Fondo**: Beige claro `#faf8f6` (fondo principal)
- **Terciario**: Marrón medio `#3d2519` (bordes, divisores)

## 🛠️ Herramientas AI Disponibles

El chat de Leo incluye dos herramientas especializadas:

### 1. searchBooks
Busca libros en Google Books API.

**Parámetros:**
- `query` (string): Término de búsqueda
- `maxResults` (number, opcional): Máximo de resultados (default: 10, max: 40)

**Respuesta:**
```typescript
{
  success: boolean
  books: Array<{
    id: string
    title: string
    authors: string
    thumbnail?: string
    description?: string
    publishedDate?: string
    pageCount?: number
    rating?: string
    previewLink?: string
  }>
  count: number
}
```

### 2. getBookDetails
Obtiene información detallada de un libro específico.

**Parámetros:**
- `bookId` (string): ID del libro en Google Books

**Respuesta:**
```typescript
{
  success: boolean
  book: {
    id: string
    title: string
    subtitle?: string
    authors: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    pageCount?: number
    categories?: string[]
    rating?: { average: number, count: number }
    imageLinks?: { thumbnail: string, medium: string, large: string }
    language?: string
    isbn?: Array<{ type: string, identifier: string }>
    links?: { preview?: string, info?: string }
    saleInfo?: { available: boolean, price?: { amount: number, currencyCode: string } }
  }
}
```

## 🚀 Deploy en Vercel

1. Push tu código a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Configura las variables de entorno en Vercel (todas las de `.env.local`)
4. Deploy automático

**Importante**: 
- Genera un nuevo `JWT_SECRET` seguro para producción (mínimo 32 caracteres aleatorios)
- Usa un modelo de OpenRouter apropiado para producción (considera costos)
- Configura MongoDB Atlas para permitir IPs de Vercel o usa 0.0.0.0/0

## 📝 Uso

### Para Usuarios

1. **Registro**: Crea una cuenta en `/auth/register`
   - Email válido
   - Contraseña segura (mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número)
   - Nombre de usuario

2. **Login**: Inicia sesión en `/auth/login`

3. **Chat con Leo**: 
   - Pregunta por recomendaciones de libros: *"Recomiéndame libros de ciencia ficción"*
   - Busca libros específicos: *"Busca libros de Isaac Asimov"*
   - Pide detalles: *"Dame más información sobre ese libro"* (si hay un carrusel activo)
   - El asistente mostrará un **carrusel interactivo** con portadas, descripciones y enlaces

4. **Explora Libros**:
   - Navega por el carrusel con las flechas "Anterior" y "Siguiente"
   - Haz clic en los puntos indicadores para saltar a un libro específico
   - Click en "Ver más" para abrir la vista previa en Google Books
   - Click en "Agregar a lista" para guardar en tu lista de lectura

5. **Gestiona tu Lista de Lectura** (en `/profile`):
   - Agrega libros desde el chat o el perfil
   - Asigna prioridades (alta, media, baja)
   - Añade notas personales
   - Marca libros como leídos
   - Elimina libros de la lista

6. **Perfil**: 
   - Ve estadísticas de lectura con gráficos interactivos
   - Revisa tu lista de lectura completa
   - Consulta recomendaciones históricas
   - Gestiona tu cuenta

7. **Historial**: 
   - Todas tus conversaciones se guardan automáticamente
   - Accede a conversaciones anteriores desde la barra lateral
   - Elimina conversaciones que ya no necesites

8. **Nuevo Chat**: Haz clic en "Nuevo Chat" para iniciar una conversación fresca

9. **Logout**: Cierra sesión desde el sidebar

### Para Desarrolladores

#### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo (http://localhost:3000)

# Producción
npm run build        # Compilar para producción
npm start            # Iniciar servidor de producción

# Testing
npm test             # Ejecutar tests en modo watch
npm run test:ci      # Ejecutar tests una vez con cobertura (CI/CD)
npm run test:coverage # Generar reporte de cobertura

# Linting
npm run lint         # Verificar código con ESLint
```

#### Testing

El proyecto incluye una suite completa de tests unitarios:

```bash
# Ver todos los tests
npm test

# Ver cobertura
npm run test:coverage
```

**Tests incluidos:**
- ✅ Autenticación (hash, JWT, validación)
- ✅ Herramientas AI (searchBooks, getBookDetails)
- ✅ Hooks React (useAuth)
- ✅ APIs (búsqueda de libros, detalles)
- ✅ Utilidades de lista de lectura

Ver `TESTS.md` para documentación completa de testing.

#### Estructura de Datos

**Colecciones MongoDB:**

1. `users` - Usuarios registrados
   ```typescript
   {
     name: string
     email: string (único)
     password: string (hasheado)
     createdAt: Date
   }
   ```

2. `conversations` - Conversaciones de chat
   ```typescript
   {
     userId: ObjectId
     title: string
     messageCount: number
     preview: string
     createdAt: Date
     updatedAt: Date
   }
   ```

3. `messages` - Mensajes de conversaciones
   ```typescript
   {
     conversationId: ObjectId
     role: 'user' | 'assistant'
     content: string
     books?: Array<BookData>  // Si el mensaje incluye resultados de búsqueda
     createdAt: Date
   }
   ```

4. `readingLists` - Listas de lectura personalizadas
   ```typescript
   {
     userId: ObjectId
     bookId: string
     title: string
     authors: string[]
     thumbnail?: string
     description?: string
     priority: 'high' | 'medium' | 'low'
     notes?: string
     isRead: boolean
     addedAt: Date
     readAt?: Date
   }
   ```

5. `recommendations` - Historial de recomendaciones
   ```typescript
   {
     userId: ObjectId
     bookId: string
     title: string
     authors: string
     thumbnail?: string
     recommendedAt: Date
   }
   ```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

**Antes de contribuir:**
- Asegúrate de que todos los tests pasen (`npm test`)
- Sigue las convenciones de código del proyecto
- Actualiza la documentación si es necesario
- Agrega tests para nuevas funcionalidades

## 📄 Licencia

Este proyecto es de código abierto.

## 📧 Contacto

Para preguntas o soporte, contacta al desarrollador.

# 📚 Sistema de Búsqueda de Libros con Google Books API

## Descripción

IncelBot ahora puede buscar libros en tiempo real usando la Google Books API. La IA puede buscar libros por título, autor, tema o palabras clave cuando el usuario lo solicite.

## 🎯 Características

- **Búsqueda inteligente**: La IA detecta automáticamente cuándo el usuario quiere buscar libros
- **Información completa**: Título, autores, descripción, thumbnail, fecha de publicación, editorial, etc.
- **Ordenamiento flexible**: Por relevancia o por fecha (más recientes)
- **Límite configurable**: Hasta 40 resultados por búsqueda
- **Prioriza español**: Los resultados priorizan libros en español

## 📋 Estructura de Archivos

```
chadbot/
├── lib/
│   ├── types/
│   │   └── book.ts                    # Tipos TypeScript para libros
│   └── ai/
│       └── tools.ts                    # Definición de la tool searchBooks
├── app/
│   └── api/
│       ├── chat/
│       │   └── route.ts                # Endpoint de chat con tools integradas
│       └── books/
│           └── search/
│               └── route.ts            # Endpoint para buscar libros
└── .env.local                          # Variables de entorno
```

## 🔧 Configuración

### 1. Variables de Entorno (Opcional)

Para aumentar el límite de requests a Google Books API, agrega tu API key:

```bash
# .env.local
GOOGLE_BOOKS_API_KEY=tu_api_key_aqui
```

**Cómo obtener la API key:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Activa la "Books API"
4. Ve a "Credenciales" y crea una API key
5. Copia la key en `.env.local`

> ⚠️ **Nota**: Sin API key, la aplicación funciona perfectamente pero con un límite menor de requests diarios.

## 💬 Ejemplos de Uso

El usuario puede preguntar naturalmente:

```
Usuario: "Recomiéndame libros sobre inteligencia artificial"
Usuario: "Busca novelas de Gabriel García Márquez"
Usuario: "Quiero leer sobre historia romana"
Usuario: "¿Qué libros hay sobre psicología?"
Usuario: "Búscame los últimos libros de filosofía"
```

La IA automáticamente:
1. Detecta la intención de buscar libros
2. Llama a la tool `searchBooks` con los parámetros apropiados
3. Presenta los resultados de forma amigable al usuario

## 🛠️ API Endpoints

### POST `/api/chat`

Endpoint principal del chatbot con soporte para tools.

**Tools disponibles:**
- `searchBooks`: Busca libros en Google Books

### GET `/api/books/search`

Endpoint directo para buscar libros (también usado internamente por la tool).

**Query Parameters:**
- `query` (requerido): Término de búsqueda
- `maxResults` (opcional): Número de resultados (1-40, default: 10)
- `orderBy` (opcional): "relevance" | "newest" (default: "relevance")
- `startIndex` (opcional): Índice de inicio para paginación

**Ejemplo:**
```
GET /api/books/search?query=inteligencia%20artificial&maxResults=10&orderBy=relevance
```

**Respuesta:**
```json
{
  "books": [
    {
      "id": "abc123",
      "title": "Inteligencia Artificial Moderna",
      "authors": ["Stuart Russell", "Peter Norvig"],
      "description": "Descripción del libro...",
      "thumbnail": "https://...",
      "publishedDate": "2020",
      "publisher": "Pearson",
      "pageCount": 1152,
      "categories": ["Computers"],
      "averageRating": 4.5,
      "ratingsCount": 123,
      "language": "es",
      "previewLink": "https://...",
      "infoLink": "https://..."
    }
  ],
  "totalItems": 1234
}
```

## 🔍 Cómo Funciona

### 1. **Detección de Intención**

El AI SDK detecta automáticamente cuando el usuario quiere buscar libros basándose en:
- Descripción de la tool
- Ejemplos proporcionados
- Contexto de la conversación

### 2. **Extracción de Parámetros**

La IA extrae automáticamente los parámetros de la pregunta del usuario:
```typescript
{
  query: "inteligencia artificial",
  maxResults: 10,
  orderBy: "relevance"
}
```

### 3. **Llamada a la Tool**

El AI SDK ejecuta la function `searchBooks` que:
1. Llama a `/api/books/search` (endpoint interno)
2. Este endpoint llama a Google Books API
3. Transforma y retorna los resultados

### 4. **Presentación de Resultados**

La IA recibe los resultados y los presenta al usuario de forma conversacional.

## 📊 Esquema de Datos

### Book Type

```typescript
interface Book {
  id: string;                    // ID único del libro
  title: string;                 // Título
  authors: string[];             // Lista de autores
  description?: string;          // Descripción/sinopsis
  thumbnail?: string;            // URL de imagen de portada
  publishedDate?: string;        // Fecha de publicación
  publisher?: string;            // Editorial
  pageCount?: number;            // Número de páginas
  categories?: string[];         // Categorías/géneros
  averageRating?: number;        // Calificación promedio (0-5)
  ratingsCount?: number;         // Número de calificaciones
  language?: string;             // Código de idioma
  previewLink?: string;          // Link a vista previa
  infoLink?: string;             // Link a más información
}
```

## 🚀 Extensiones Futuras

Puedes agregar más tools fácilmente:

### Ejemplo: Tool para guardar libros favoritos

```typescript
// lib/ai/tools.ts

export const saveBookTool = tool({
  description: 'Guarda un libro en la lista de favoritos del usuario',
  parameters: z.object({
    bookId: z.string().describe('ID del libro de Google Books'),
    userId: z.string().describe('ID del usuario'),
  }),
  execute: async ({ bookId, userId }) => {
    // Implementar lógica para guardar en MongoDB
    // ...
  },
});

// Agregar al endpoint de chat:
tools: {
  searchBooks: searchBooksTool,
  saveBook: saveBookTool,  // Nueva tool
},
```

## 📝 Notas Técnicas

- **Runtime**: Edge runtime para mejor performance
- **Validación**: Zod schemas para validación de parámetros
- **Error handling**: Manejo robusto de errores en todos los niveles
- **Seguridad**: Sanitización de inputs, validaciones estrictas
- **Rate limiting**: Respeta los límites de Google Books API
- **Caching**: Considera implementar caché para búsquedas frecuentes

## 🐛 Troubleshooting

### Error: "Error al buscar libros en Google Books"

**Posibles causas:**
1. API de Google Books no disponible temporalmente
2. Límite de requests excedido (solución: agregar API key)
3. Query inválida

**Solución:**
- Verifica tu conexión a internet
- Agrega una API key en `.env.local`
- Intenta con una query más específica

### La IA no llama a la tool

**Posibles causas:**
1. La pregunta del usuario no es clara
2. El modelo de IA no detecta la intención

**Solución:**
- Pide al usuario que sea más específico: "busca libros de..."
- Verifica que el prompt del sistema en `/api/chat/route.ts` menciona las tools

## 📚 Referencias

- [Google Books API Documentation](https://developers.google.com/books)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Zod Documentation](https://zod.dev/)

---

**Desarrollado con ❤️ para IncelBot**

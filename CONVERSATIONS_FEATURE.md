# 📚 Sistema de Historial de Conversaciones

## Descripción General

El sistema de historial de conversaciones permite a los usuarios guardar, visualizar y gestionar sus chats con IncelBot de manera automática.

## ✨ Características

### 1. Guardado Automático
- Las conversaciones se guardan automáticamente cuando envías el primer mensaje
- El título de la conversación se genera del primer mensaje (primeros 30 caracteres)
- Se actualiza automáticamente el contador de mensajes
- Se guarda una vista previa del primer mensaje

### 2. Visualización en Sidebar
- **Historial ordenado**: Las conversaciones más recientes aparecen primero
- **Vista previa**: Muestra título, preview y fecha de última actualización
- **Contador de mensajes**: Cada conversación muestra cuántos mensajes tiene
- **Indicador de carga**: Spinner mientras se cargan las conversaciones

### 3. Gestión de Conversaciones
- **Seleccionar conversación**: Click en cualquier conversación (preparado para cargar mensajes)
- **Eliminar conversación**: Botón de eliminar que aparece al hacer hover
- **Confirmación**: Dialogo de confirmación antes de eliminar
- **Nueva conversación**: Botón destacado en la parte superior

## 🗄️ Base de Datos

### Colección `conversations`

```javascript
{
  _id: ObjectId,
  userId: String,           // ID del usuario propietario
  title: String,            // Título de la conversación
  preview: String,          // Preview del primer mensaje (50 chars)
  messageCount: Number,     // Cantidad total de mensajes
  createdAt: Date,          // Fecha de creación
  updatedAt: Date           // Última actualización
}
```

### Índices Recomendados

```javascript
db.conversations.createIndex({ userId: 1, updatedAt: -1 })
```

## 🔌 API Endpoints

### GET `/api/conversations`
Obtiene las últimas 20 conversaciones del usuario autenticado.

**Respuesta:**
```json
{
  "conversations": [
    {
      "id": "...",
      "userId": "...",
      "title": "Hola, ¿cómo estás?",
      "preview": "Hola, ¿cómo estás? Me gustaría saber sobre...",
      "messageCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:10:00.000Z"
    }
  ]
}
```

### POST `/api/conversations`
Crea una nueva conversación.

**Body:**
```json
{
  "title": "Mi nueva conversación",
  "firstMessage": "Hola bot!"
}
```

### PUT `/api/conversations/[id]`
Actualiza una conversación existente.

**Body:**
```json
{
  "title": "Nuevo título",
  "messageCount": 10,
  "preview": "Nuevo preview..."
}
```

### DELETE `/api/conversations/[id]`
Elimina una conversación.

## 🎣 React Hook: useConversations

### Uso

```typescript
import { useConversations } from '@/hooks/useConversations';

function MyComponent() {
  const {
    conversations,          // Array de conversaciones
    isLoading,             // Estado de carga
    currentConversationId, // ID de conversación activa
    setCurrentConversationId,
    createConversation,    // Crear nueva conversación
    updateConversation,    // Actualizar conversación
    deleteConversation,    // Eliminar conversación
    refreshConversations,  // Recargar lista
  } = useConversations();

  // Tu código...
}
```

### Métodos

#### createConversation(title?, firstMessage?)
Crea una nueva conversación y la establece como activa.

```typescript
const newConv = await createConversation(
  'Mi conversación',
  'Primer mensaje'
);
```

#### updateConversation(id, updates)
Actualiza campos de una conversación.

```typescript
await updateConversation(conversationId, {
  messageCount: messages.length,
  preview: firstMessage,
});
```

#### deleteConversation(id)
Elimina una conversación.

```typescript
await deleteConversation(conversationId);
```

## 🎨 Componentes UI

### Sidebar - Sección de Historial

```tsx
{conversations.map((conv) => (
  <div
    key={conv.id}
    onClick={() => handleSelectConversation(conv.id)}
    className={`group px-3 py-2 rounded-lg cursor-pointer 
      ${currentConversationId === conv.id ? 'bg-[#3d2519]' : ''}`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#faf8f6] truncate">
          {conv.title}
        </p>
        {conv.preview && (
          <p className="text-xs text-[#faf8f6]/60 truncate mt-0.5">
            {conv.preview}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[#faf8f6]/50">
            {conv.messageCount} msgs
          </span>
          <span className="text-xs text-[#faf8f6]/50">•</span>
          <span className="text-xs text-[#faf8f6]/50">
            {new Date(conv.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => handleDeleteConversation(conv.id, e)}
        className="opacity-0 group-hover:opacity-100"
      >
        {/* Icono eliminar */}
      </button>
    </div>
  </div>
))}
```

## 🔄 Flujo de Trabajo

### 1. Usuario envía primer mensaje
```
Usuario escribe → Submit → createConversation() → Guardar en BD → 
Actualizar estado → Mostrar en sidebar
```

### 2. Usuario continúa conversación
```
Usuario escribe → Submit → useEffect detecta cambio → 
updateConversation() → Actualizar messageCount y preview
```

### 3. Usuario selecciona conversación antigua
```
Click en conversación → setCurrentConversationId() → 
(Aquí cargarías los mensajes si los guardas)
```

### 4. Usuario elimina conversación
```
Click eliminar → Confirmación → deleteConversation() → 
Eliminar de BD → Actualizar estado → Si es activa, limpiar chat
```

## 🚀 Mejoras Futuras

### Guardar Mensajes
Actualmente solo se guarda metadata. Podrías extender para guardar mensajes:

```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,
  role: "user" | "assistant",
  content: String,
  createdAt: Date
}
```

### Búsqueda de Conversaciones
Agregar campo de búsqueda:

```typescript
const filteredConversations = conversations.filter(conv =>
  conv.title.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### Etiquetas/Categorías
Permitir organizar conversaciones:

```javascript
{
  ...conversation,
  tags: ["trabajo", "personal"],
  category: "general"
}
```

### Compartir Conversaciones
Generar links públicos:

```javascript
{
  ...conversation,
  isPublic: Boolean,
  shareToken: String
}
```

## 🐛 Troubleshooting

### Las conversaciones no aparecen
1. Verifica la autenticación: `console.log(user)`
2. Revisa MongoDB: ¿Existe la colección `conversations`?
3. Comprueba la consola del navegador
4. Verifica que el token JWT sea válido

### Las conversaciones no se actualizan
1. Verifica el `useEffect` de actualización
2. Asegúrate de que `currentConversationId` esté establecido
3. Revisa los logs del servidor

### Error al eliminar
1. Verifica permisos: Solo el propietario puede eliminar
2. Comprueba que el ID sea válido
3. Revisa la conexión a MongoDB

## 📊 Performance

- **Límite**: Se cargan máximo 20 conversaciones
- **Orden**: Por fecha de actualización (más recientes primero)
- **Cache**: React mantiene el estado en memoria
- **Optimización**: Usa `useMemo` si tienes muchas conversaciones

## 🔐 Seguridad

- ✅ Verificación de JWT en cada request
- ✅ Usuario solo ve sus propias conversaciones
- ✅ Validación de permisos al actualizar/eliminar
- ✅ Sanitización de inputs
- ✅ ObjectId validation

---

¡El sistema de historial está listo para usar! 🎉

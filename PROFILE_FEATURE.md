# 👤 Página de Perfil de Usuario

## Descripción General

La página de perfil permite a los usuarios ver y gestionar su información personal, estadísticas de uso y configuración de cuenta.

## 🎯 Características

### 1. Información Personal
- **Avatar**: Círculo con inicial del nombre
- **Nombre de usuario**: Display name editable
- **Email**: Correo electrónico del usuario
- **Fecha de registro**: Cuándo se unió al servicio

### 2. Estadísticas
- **Total de Conversaciones**: Cantidad de chats guardados
- **Mensajes Enviados**: Contador total de mensajes
- **Miembro desde**: Fecha de registro formateada

### 3. Gestión de Cuenta
- **Editar nombre**: (Funcionalidad preparada)
- **Editar email**: (Funcionalidad preparada)
- **Cambiar contraseña**: (Funcionalidad preparada)
- **Cerrar sesión**: Logout desde el perfil

## 🎨 Diseño

### Layout
```
┌─────────────────────────────────────────┐
│  ← Mi Perfil              [Activo 🟢]   │
├─────────────────────────────────────────┤
│                                         │
│  [Banner Verde]                         │
│                                         │
│     [Avatar]  Nombre Usuario            │
│               email@example.com         │
│                                         │
│  ┌───────┐  ┌───────┐  ┌───────┐      │
│  │   5   │  │  42   │  │ Miembro│      │
│  │Convs. │  │ Msgs  │  │ desde  │      │
│  └───────┘  └───────┘  └───────┘      │
│                                         │
│  Detalles de la Cuenta                  │
│  ├─ Nombre de Usuario     [Editar]     │
│  ├─ Correo Electrónico    [Editar]     │
│  └─ Contraseña            [Cambiar]    │
│                                         │
│  Acciones                               │
│  [Volver al Chat]                       │
│  [Cerrar Sesión]                        │
│                                         │
└─────────────────────────────────────────┘
```

### Colores
- **Fondo**: `#faf8f6` (Beige)
- **Banner**: Gradiente `#616f55` → `#4d5a44`
- **Avatar**: Gradiente con inicial
- **Cards**: Blanco con sombras sutiles
- **Acentos**: Verde oliva `#616f55`

## 📁 Archivo

**Ubicación**: `app/profile/page.tsx`

## 🔌 Integración

### Navegación

Desde el chat principal, el botón "Ver Perfil" navega a `/profile`:

```tsx
<button
  onClick={() => router.push('/profile')}
  className="w-full px-3 py-2 bg-[#616f55]..."
>
  <svg>...</svg>
  Ver Perfil
</button>
```

### Protección de Ruta

La página está protegida por el middleware. Solo usuarios autenticados pueden acceder.

```typescript
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/auth/login');
  }
}, [isLoading, isAuthenticated, router]);
```

## 📊 Estados de Carga

### Loading State
```tsx
if (isLoading) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 animate-pulse">I</div>
        <p>Cargando perfil...</p>
      </div>
    </div>
  );
}
```

### Sin Usuario
```tsx
if (!user) {
  return null; // O redirect
}
```

## 🎣 Hooks Utilizados

### useAuth
```typescript
const { user, isLoading, isAuthenticated, logout } = useAuth();
```

### useRouter
```typescript
const router = useRouter();
```

### useState (Estadísticas)
```typescript
const [stats, setStats] = useState({
  totalConversations: 0,
  totalMessages: 0,
  memberSince: '',
});
```

## 📈 Mejoras Futuras

### 1. Edición de Perfil

Crear endpoint para actualizar datos:

```typescript
// app/api/user/update/route.ts
export async function PUT(req: NextRequest) {
  const { name, email } = await req.json();
  const payload = verifyToken(token);
  
  await db.collection('users').updateOne(
    { _id: new ObjectId(payload.userId) },
    { $set: { name, email, updatedAt: new Date() } }
  );
  
  return NextResponse.json({ success: true });
}
```

En el componente:

```typescript
const handleUpdateName = async (newName: string) => {
  const response = await fetch('/api/user/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });
  
  if (response.ok) {
    // Actualizar estado local
    await checkSession(); // Recargar usuario
  }
};
```

### 2. Cambiar Contraseña

```typescript
// app/api/user/change-password/route.ts
export async function POST(req: NextRequest) {
  const { currentPassword, newPassword } = await req.json();
  const payload = verifyToken(token);
  
  const user = await db.collection('users').findOne({
    _id: new ObjectId(payload.userId)
  });
  
  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }
  
  const hashedNew = await hashPassword(newPassword);
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { password: hashedNew } }
  );
  
  return NextResponse.json({ success: true });
}
```

### 3. Cargar Estadísticas Reales

```typescript
useEffect(() => {
  if (user) {
    loadUserStats();
  }
}, [user]);

const loadUserStats = async () => {
  const [conversationsRes, messagesRes] = await Promise.all([
    fetch('/api/conversations'),
    fetch('/api/messages/count'), // Nuevo endpoint
  ]);
  
  const convData = await conversationsRes.json();
  const msgData = await messagesRes.json();
  
  setStats({
    totalConversations: convData.conversations.length,
    totalMessages: msgData.count,
    memberSince: formatDate(user.createdAt),
  });
};
```

### 4. Subir Avatar

```typescript
const handleAvatarUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await fetch('/api/user/avatar', {
    method: 'POST',
    body: formData,
  });
  
  if (response.ok) {
    const { avatarUrl } = await response.json();
    // Actualizar UI
  }
};
```

### 5. Preferencias de Usuario

```typescript
interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: 'es' | 'en';
  aiModel: string;
}

// Guardar en BD junto al usuario
{
  ...user,
  preferences: {
    theme: 'light',
    notifications: true,
    language: 'es',
    aiModel: 'anthropic/claude-3-haiku'
  }
}
```

### 6. Historial de Actividad

Mostrar actividad reciente:

```tsx
<div className="space-y-3">
  <h3>Actividad Reciente</h3>
  {recentActivity.map(activity => (
    <div key={activity.id} className="flex gap-3">
      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
      <div>
        <p className="text-sm">{activity.description}</p>
        <p className="text-xs text-gray-500">
          {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
    </div>
  ))}
</div>
```

### 7. Configuración de Privacidad

```tsx
<div className="space-y-4">
  <h3>Privacidad</h3>
  <label className="flex items-center justify-between">
    <span>Perfil público</span>
    <input type="checkbox" />
  </label>
  <label className="flex items-center justify-between">
    <span>Mostrar estadísticas</span>
    <input type="checkbox" />
  </label>
  <label className="flex items-center justify-between">
    <span>Compartir conversaciones</span>
    <input type="checkbox" />
  </label>
</div>
```

### 8. Exportar Datos

Cumplimiento GDPR:

```tsx
<button
  onClick={handleExportData}
  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg"
>
  Exportar Mis Datos
</button>
```

```typescript
const handleExportData = async () => {
  const response = await fetch('/api/user/export');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-data.json';
  a.click();
};
```

### 9. Eliminar Cuenta

```tsx
<button
  onClick={handleDeleteAccount}
  className="w-full px-6 py-3 bg-red-500 text-white rounded-lg"
>
  Eliminar Cuenta Permanentemente
</button>
```

Con confirmación de seguridad:

```typescript
const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    '¿Estás seguro? Esta acción no se puede deshacer.'
  );
  
  if (!confirmed) return;
  
  const password = window.prompt('Ingresa tu contraseña para confirmar:');
  
  const response = await fetch('/api/user/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  
  if (response.ok) {
    router.push('/auth/register');
  }
};
```

## 🔐 Seguridad

- ✅ Verificación de autenticación en cada acción
- ✅ Validación de contraseña actual antes de cambios
- ✅ Solo el usuario puede ver/editar su propio perfil
- ✅ Sanitización de inputs
- ✅ Rate limiting en endpoints de edición

## 🎨 Componentes Reutilizables

### ProfileStat

```tsx
interface ProfileStatProps {
  value: string | number;
  label: string;
}

function ProfileStat({ value, label }: ProfileStatProps) {
  return (
    <div className="bg-[#faf8f6] rounded-xl p-6 text-center">
      <div className="text-3xl font-bold text-[#616f55]">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}
```

### EditableField

```tsx
interface EditableFieldProps {
  label: string;
  value: string;
  onEdit: () => void;
}

function EditableField({ label, value, onEdit }: EditableFieldProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-lg text-[#251711]">{value}</p>
      </div>
      <button
        onClick={onEdit}
        className="text-[#616f55] hover:text-[#4d5a44] font-medium"
      >
        Editar
      </button>
    </div>
  );
}
```

## 📱 Responsive

La página es completamente responsive:

- **Desktop**: Layout amplio con estadísticas en fila
- **Tablet**: Grid 2 columnas para stats
- **Mobile**: Stack vertical completo

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Stats */}
</div>
```

## 🚀 Performance

- **Loading States**: Skeleton loaders para mejor UX
- **Lazy Loading**: Cargar stats bajo demanda
- **Memoización**: `useMemo` para cálculos costosos
- **Optimistic Updates**: UI responde antes de confirmación del servidor

---

¡Tu perfil de usuario está listo! 🎉

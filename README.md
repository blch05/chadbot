# IncelBot - AI Assistant with Authentication

IncelBot es un asistente virtual inteligente construido con Next.js 15, OpenRouter AI, y MongoDB para autenticación de usuarios.

## 🚀 Características

- **Chat AI en tiempo real** con streaming de respuestas
- **Autenticación completa** con registro y login
- **Base de datos MongoDB** para gestión de usuarios
- **Historial de conversaciones** guardado automáticamente
- **Perfil de usuario** con estadísticas y gestión de cuenta
- **Interfaz moderna** con Tailwind CSS
- **Seguridad robusta** con JWT y bcrypt
- **Validación de inputs** y sanitización

## 📋 Requisitos Previos

- Node.js 18+ 
- NPM o Yarn
- Cuenta en [OpenRouter](https://openrouter.ai/)
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

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
# OpenRouter API
OPENROUTER_API_KEY=tu_api_key_aqui
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3-haiku
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://usuario:<password>@cluster.mongodb.net/?appName=incelbot
MONGODB_DB=incelbot

# JWT Secret (Cambiar en producción)
JWT_SECRET=tu_jwt_secret_super_seguro_cambialo_en_produccion

# Session
SESSION_COOKIE_NAME=incelbot-session
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
│   │   ├── auth/          # Endpoints de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── logout/
│   │   │   └── me/
│   │   ├── chat/          # Endpoint del chat AI
│   │   └── conversations/ # Endpoints de conversaciones
│   │       └── [id]/      # Actualizar/Eliminar conversación
│   ├── auth/              # Páginas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── profile/           # Página de perfil de usuario
│   └── page.tsx           # Chat principal (protegido)
├── hooks/
│   ├── useAuth.ts         # Hook de autenticación
│   └── useConversations.ts # Hook de gestión de conversaciones
├── lib/
│   ├── mongodb.ts         # Configuración MongoDB
│   ├── auth.ts            # Utilidades de autenticación
│   └── types/
│       ├── auth.ts        # Tipos TypeScript de autenticación
│       └── conversation.ts # Tipos TypeScript de conversaciones
└── middleware.ts          # Middleware de protección de rutas
```

## 🎨 Colores del Theme

El tema usa colores tierra y naturales:
- **Marrón oscuro**: `#251711`
- **Verde oliva**: `#616f55`
- **Beige**: `#faf8f6`

## 📦 Tecnologías Utilizadas

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **AI**: Vercel AI SDK v5, OpenRouter
- **Base de Datos**: MongoDB
- **Autenticación**: JWT, bcryptjs
- **TypeScript**: Para type safety completo

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ JWT con expiración de 7 días
- ✅ Cookies HttpOnly
- ✅ Validación de inputs en cliente y servidor
- ✅ Sanitización de mensajes del chat
- ✅ Headers de seguridad configurados
- ✅ Middleware de protección de rutas

## 🚀 Deploy en Vercel

1. Push tu código a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Configura las variables de entorno en Vercel
4. Deploy automático

**Importante**: Genera un nuevo `JWT_SECRET` seguro para producción.

## 📝 Uso

1. **Registro**: Crea una cuenta en `/auth/register`
2. **Login**: Inicia sesión en `/auth/login`
3. **Chat**: Una vez autenticado, usa el chat normalmente
4. **Nuevo Chat**: Haz clic en "Nuevo Chat" para iniciar una conversación
5. **Historial**: Ve tus conversaciones anteriores en la barra lateral
6. **Perfil**: Accede a tu perfil haciendo clic en "Ver Perfil"
7. **Logout**: Cierra sesión desde el sidebar

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto.

## 📧 Contacto

Para preguntas o soporte, contacta al desarrollador.

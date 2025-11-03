# Configuración de MongoDB

## ⚠️ IMPORTANTE: Configurar Password

Para que la aplicación funcione correctamente, necesitas reemplazar `<db_password>` en el archivo `.env.local` con tu contraseña real de MongoDB.

## Pasos para obtener tu password:

1. Ve a [MongoDB Atlas](https://cloud.mongodb.com/)
2. Selecciona tu cluster "chadbot"
3. Ve a "Database Access" en el menú lateral
4. Encuentra el usuario `chris_db_user`
5. Si no recuerdas la contraseña:
   - Click en "Edit"
   - Click en "Edit Password"
   - Genera una nueva contraseña o ingresa una personalizada
   - Guarda los cambios

## Configuración en .env.local

Reemplaza esta línea:
```bash
MONGODB_URI=mongodb+srv://chris_db_user:<db_password>@chadbot.xy0dxon.mongodb.net/?appName=chadbot
```

Con tu contraseña real (ejemplo):
```bash
MONGODB_URI=mongodb+srv://chris_db_user:MiPasswordSeguro123@chadbot.xy0dxon.mongodb.net/?appName=chadbot
```

## Verificar Conexión

Una vez configurado, puedes verificar la conexión ejecutando:

```bash
npm run dev
```

Deberías ver en la consola:
```
✅ Successfully connected to MongoDB!
```

## Problemas Comunes

### Error: Authentication failed
- Verifica que el password esté correcto
- Asegúrate de no tener caracteres especiales sin encodear

### Error: IP not whitelisted
- Ve a "Network Access" en MongoDB Atlas
- Añade tu IP actual o usa `0.0.0.0/0` (solo desarrollo)

### Error: Cannot find module 'mongodb'
- Ejecuta: `npm install`

## Seguridad

⚠️ **NUNCA** commitees el archivo `.env.local` a git
- Ya está en `.gitignore`
- Usa variables de entorno en producción (Vercel)
- Genera un `JWT_SECRET` fuerte para producción

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyPassword, generateToken, isValidEmail } from '@/lib/auth';
import { LoginCredentials, AuthResponse, User } from '@/lib/types/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body: LoginCredentials = await req.json();
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Email y contraseña son requeridos',
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Email inválido',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    // Buscar usuario
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // Actualizar último login
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Generar token
    const userSession = {
      userId: user._id!.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
    const token = generateToken(userSession);

    // Crear respuesta con cookie
    const response = NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Login exitoso',
        user: userSession,
        token,
      },
      { status: 200 }
    );

    // Establecer cookie HttpOnly
    response.cookies.set({
      name: process.env.SESSION_COOKIE_NAME || 'incelbot-session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: 'Error en el servidor',
      },
      { status: 500 }
    );
  }
}

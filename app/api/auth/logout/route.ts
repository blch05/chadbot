import { NextResponse } from 'next/server';
import { AuthResponse } from '@/lib/types/auth';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const response = NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Logout exitoso',
      },
      { status: 200 }
    );

    // Eliminar cookie de sesión
    response.cookies.set({
      name: process.env.SESSION_COOKIE_NAME || 'incelbot-session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: 'Error en el servidor',
      },
      { status: 500 }
    );
  }
}

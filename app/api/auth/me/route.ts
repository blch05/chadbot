import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { AuthResponse } from '@/lib/types/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(process.env.SESSION_COOKIE_NAME || 'incelbot-session')?.value;

    if (!token) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'No autenticado',
        },
        { status: 401 }
      );
    }

    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Token inválido',
        },
        { status: 401 }
      );
    }

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Autenticado',
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: 'Error en el servidor',
      },
      { status: 500 }
    );
  }
}

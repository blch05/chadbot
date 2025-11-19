import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { hashPassword, isValidEmail, isValidPassword, isValidName } from '@/lib/auth';
import { RegisterData, AuthResponse } from '@/lib/types/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body: RegisterData = await req.json();
    const { email, password, name } = body;

    // Validaciones
    if (!email || !password || !name) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Todos los campos son requeridos',
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

    if (!isValidPassword(password)) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        },
        { status: 400 }
      );
    }

    if (!isValidName(name)) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'El nombre debe tener al menos 2 caracteres',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Verificar si el usuario ya existe
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'El email ya está registrado',
        },
        { status: 409 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const result = await usersCollection.insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Usuario registrado exitosamente',
        user: {
          userId: result.insertedId.toString(),
          email: email.toLowerCase(),
          name: name.trim(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: 'Error en el servidor',
      },
      { status: 500 }
    );
  }
}

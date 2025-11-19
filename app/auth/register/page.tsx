'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({ name, email, password });

      if (result.success) {
        setSuccess('Cuenta creada exitosamente. Redirigiendo al login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f6] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">I</span>
            </div>
            <h1 className="text-3xl font-bold text-[#251711] mb-2">LeoBot</h1>
            <p className="text-gray-600">Crea tu cuenta</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#616f55] focus:border-transparent bg-white text-gray-700"
                placeholder="Tu nombre"
                required
                disabled={isLoading}
                minLength={2}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#616f55] focus:border-transparent bg-white text-gray-700"
                placeholder="tu@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#616f55] focus:border-transparent bg-white text-gray-700"
                placeholder="••••••••"
                required
                disabled={isLoading}
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#616f55] focus:border-transparent bg-white text-gray-700"
                placeholder="••••••••"
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-[#616f55] to-[#4d5a44] text-white rounded-lg font-semibold hover:from-[#4d5a44] hover:to-[#616f55] focus:outline-none focus:ring-2 focus:ring-[#616f55] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/auth/login"
                className="text-[#616f55] hover:text-[#4d5a44] font-semibold"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

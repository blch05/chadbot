'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserSession, LoginCredentials, RegisterData, AuthResponse } from '@/lib/types/auth';

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar sesión actual
  const checkSession = useCallback(async () => {
    console.log('🔍 Verificando sesión...');
    try {
      const res = await fetch('/api/auth/me');
      const data: AuthResponse = await res.json();

      console.log('📥 Respuesta de /api/auth/me:', data);

      if (data.success && data.user) {
        console.log('✅ Usuario autenticado:', data.user.name);
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        console.log('❌ Usuario no autenticado');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error verificando sesión:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('🏁 Verificación de sesión completada');
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Login
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      }

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error de conexión',
      };
    }
  };

  // Register
  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await res.json();

      return data;
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: 'Error de conexión',
      };
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkSession,
  };
}

import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserSession;
  token?: string;
}

export type DeviceType = 'pc' | 'playstation' | 'billiard' | 'other';

export type DeviceStatus = 'available' | 'occupied' | 'maintenance';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  hourlyRate: number;
  currentSession?: Session;
}

export interface Session {
  id: string;
  deviceId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  pausedAt?: Date;
  totalPausedTime: number;
  isPaused: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  deviceId?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'staff' | 'customer';
  isActive: boolean;
  createdAt: Date;
}

export interface DeviceTypeConfig {
  id: string;
  name: string;
  type: DeviceType;
  icon: string;
  defaultHourlyRate: number;
}

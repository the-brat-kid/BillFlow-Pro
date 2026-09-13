"use client";

import { useState, useEffect } from 'react';
import { Notification } from '@/types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(`${wsBaseUrl}/ws?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(prev => [data, ...prev]);
    };

    return () => {
      ws.close();
    };
  }, []);

  return { notifications };
}

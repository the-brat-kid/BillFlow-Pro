import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IncomingMessage } from 'http';
import { redisSubscriber } from '../services/redis';

const clients = new Map<string, Set<WebSocket>>();

export const initWebSocket = (wss: WebSocketServer) => {
  redisSubscriber.subscribe('notifications', (err, count) => {
    if (err) console.error('Redis subscribe error', err);
  });

  redisSubscriber.on('message', (channel, message) => {
    if (channel === 'notifications') {
      try {
        const data = JSON.parse(message);
        const { business_profile_id, notification } = data;
        pushToBusiness(business_profile_id, { type: 'notification', data: notification });
      } catch (e) {
        console.error('Error parsing redis message', e);
      }
    }
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Unauthorized: Token missing');
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      const businessId = decoded.business_profile_id;

      if (!businessId) {
        ws.close(4001, 'Unauthorized: Business ID missing in token');
        return;
      }

      if (!clients.has(businessId)) {
        clients.set(businessId, new Set());
      }
      clients.get(businessId)!.add(ws);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (e) {
          // ignore parse error
        }
      });

      ws.on('close', () => {
        clients.get(businessId)?.delete(ws);
        if (clients.get(businessId)?.size === 0) {
          clients.delete(businessId);
        }
      });
    } catch (err) {
      ws.close(4001, 'Unauthorized: Invalid token');
    }
  });
};

export const pushToBusiness = (businessId: string, data: any) => {
  const businessClients = clients.get(businessId);
  if (businessClients) {
    const payload = JSON.stringify(data);
    for (const client of businessClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
};

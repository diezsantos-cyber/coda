'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = process.env['NEXT_PUBLIC_WS_URL'] ?? 'ws://localhost:4000/ws';

interface WebSocketMessage {
  type: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  addMessageHandler: (handler: MessageHandler) => void;
  removeMessageHandler: (handler: MessageHandler) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(String(event.data)) as WebSocketMessage;
          handlersRef.current.forEach((handler) => handler(message));
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      // Connection failed, will retry
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const addMessageHandler = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);
  }, []);

  const removeMessageHandler = useCallback((handler: MessageHandler) => {
    handlersRef.current.delete(handler);
  }, []);

  return {
    isConnected,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
  };
}

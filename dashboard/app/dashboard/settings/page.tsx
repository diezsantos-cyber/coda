'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'integrations';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [telegramBotToken, setTelegramBotToken] = useState('');

  const handleSaveTelegramToken = async () => {
    // TODO: Implement API call to save token
    alert('Telegram bot token guardado. Implementar llamada al backend.');
  };

  const handleConnectGoogleCalendar = () => {
    // TODO: Implement OAuth flow
    alert('Implementar flujo OAuth de Google Calendar');
  };

  const handleConnectGoogleSheets = () => {
    // TODO: Implement OAuth flow
    alert('Implementar flujo OAuth de Google Sheets');
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-600">
          Administra las integraciones y configuración de CODA
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium ${
              activeTab === 'integrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Integraciones
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            General
          </button>
        </nav>
      </div>

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Google Calendar */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Google Calendar</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Sincroniza tus reuniones automáticamente desde Google Calendar
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleConnectGoogleCalendar}
                className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Conectar
              </button>
            </div>
          </div>

          {/* Google Sheets */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Google Sheets</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Exporta acuerdos automáticamente a una hoja de cálculo compartida
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleConnectGoogleSheets}
                className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Conectar
              </button>
            </div>
          </div>

          {/* Telegram Bot */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                <svg className="h-6 w-6 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-.99.53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.48 1.05-.74 4.11-1.79 6.86-2.97 8.24-3.54 3.92-1.63 4.74-1.92 5.27-1.93.12 0 .38.03.55.17.14.12.18.28.2.44.02.07.04.23.02.36z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Bot de Telegram</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configura el bot para notificaciones. Primero crea un bot con @BotFather
                </p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Bot Token
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSaveTelegramToken}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Guardar
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Instrucciones: 1) Abre Telegram 2) Busca @BotFather 3) Envía /newbot 4) Sigue las instrucciones 5) Copia el token aquí
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-gray-500">Configuración general próximamente...</p>
        </div>
      )}
    </div>
  );
}

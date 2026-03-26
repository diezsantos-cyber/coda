'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl?: string;
  completed: boolean;
}

export function OnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: '¡Bienvenido a CODA!',
      description: 'CODA te ayuda a hacer tus reuniones más efectivas y dar mejor seguimiento a los acuerdos. Integra Google Calendar para sincronizar reuniones, crea minutas, extrae acuerdos, asígnalos a tu equipo y exporta todo automáticamente a Google Sheets.',
      actionLabel: 'Comenzar',
      completed: false,
    },
    {
      id: 'google_calendar',
      title: 'Conectar Google Calendar',
      description: 'CODA sincroniza tus reuniones automáticamente desde Google Calendar. No tienes que crear reuniones manualmente.',
      actionLabel: 'Conectar Calendar',
      actionUrl: '/dashboard/settings?tab=integrations',
      completed: false,
    },
    {
      id: 'google_sheets',
      title: 'Conectar Google Sheets',
      description: 'Los acuerdos se exportan automáticamente a una hoja de cálculo compartida para que todo el equipo tenga visibilidad.',
      actionLabel: 'Conectar Sheets',
      actionUrl: '/dashboard/settings?tab=integrations',
      completed: false,
    },
    {
      id: 'telegram_bot',
      title: 'Configurar Bot de Telegram',
      description: 'Tu equipo recibe notificaciones de nuevas tareas y acuerdos directamente en Telegram. Primero crea un bot con @BotFather y copia el token.',
      actionLabel: 'Configurar Bot',
      actionUrl: '/dashboard/settings?tab=integrations',
      completed: false,
    },
    {
      id: 'invite_team',
      title: 'Invitar a tu equipo',
      description: 'Agrega miembros del equipo con su Telegram ID para que puedan recibir notificaciones de tareas asignadas.',
      actionLabel: 'Invitar equipo',
      actionUrl: '/dashboard/team',
      completed: false,
    },
    {
      id: 'workflow',
      title: '¿Cómo funciona el flujo?',
      description: '1️⃣ Tus reuniones se sincronizan desde Calendar\n2️⃣ Después de la reunión, creas una minuta\n3️⃣ Extraes acuerdos y asignas responsables\n4️⃣ Al publicar → se exporta a Sheets + notifica por Telegram\n5️⃣ Haz seguimiento del progreso en el dashboard',
      actionLabel: 'Ver reuniones',
      actionUrl: '/dashboard/meetings',
      completed: false,
    },
  ]);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('coda_onboarding_completed');
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    const newSteps = [...steps];
    newSteps[currentStep].completed = true;
    setSteps(newSteps);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('coda_onboarding_completed', 'true');
    setIsOpen(false);
  };

  const handleComplete = () => {
    localStorage.setItem('coda_onboarding_completed', 'true');
    setIsOpen(false);
  };

  const handleAction = () => {
    const step = steps[currentStep];
    if (step.actionUrl) {
      window.location.href = step.actionUrl;
    } else {
      handleNext();
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>Paso {currentStep + 1} de {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          {step.completed ? (
            <CheckCircleIcon className="h-16 w-16 text-green-500" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl font-bold text-blue-600">{currentStep + 1}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">{step.title}</h2>
          <p className="whitespace-pre-line text-gray-600">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            Saltar tour
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Anterior
              </button>
            )}
            <button
              onClick={handleAction}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              {step.actionLabel}
            </button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="mt-6 flex justify-center gap-2">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 w-2 rounded-full transition-all ${
                idx === currentStep
                  ? 'w-8 bg-blue-600'
                  : s.completed
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

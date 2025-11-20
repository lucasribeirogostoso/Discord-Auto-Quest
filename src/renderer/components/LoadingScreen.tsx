import React, { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

interface LoadingStep {
  name: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [userData, setUserData] = useState<{
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
  } | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Carregando...');
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { name: 'Inicializando armazenamento...', status: 'pending' },
    { name: 'Carregando configurações...', status: 'pending' },
    { name: 'Verificando contas...', status: 'pending' },
    { name: 'Inicializando Discord Injector...', status: 'pending' },
    { name: 'Inicializando WebSocket Server...', status: 'pending' },
    { name: 'Verificando processo do Discord...', status: 'pending' },
    { name: 'Sistema pronto!', status: 'pending' },
  ]);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initializeSystem = async () => {
      try {
        // Carregar dados do usuário primeiro (não bloqueante)
        const loadUserData = async () => {
          try {
            if (window.electronAPI?.getSavedUser) {
              const savedUser = await Promise.race([
                window.electronAPI.getSavedUser(),
                new Promise((resolve) => setTimeout(() => resolve(null), 500)),
              ]);

              if (isMounted && savedUser) {
                const displayName =
                  (savedUser as any)?.displayName || (savedUser as any)?.username || 'Usuário';
                const avatarUrl = (savedUser as any)?.avatarUrl || null;
                const bannerUrl = (savedUser as any)?.bannerUrl || null;
                setUserData({
                  displayName,
                  avatarUrl,
                  bannerUrl,
                });
                setLoadingText(`Olá, ${displayName}`);
              }
            }

            if (window.electronAPI?.getDiscordUser) {
              const result = await Promise.race([
                window.electronAPI.getDiscordUser(),
                new Promise((resolve) => setTimeout(() => resolve(null), 800)),
              ]);

              if (isMounted && result && (result as any).success && (result as any).user) {
                const user = (result as any).user;
                const displayName = user.displayName || user.username || 'Usuário';
                const avatarUrl = user.avatarUrl || null;
                const bannerUrl = user.bannerUrl || null;
                setUserData({
                  displayName,
                  avatarUrl,
                  bannerUrl,
                });
                setLoadingText(`Olá, ${displayName}`);
              }
            }
          } catch (error) {
            // Silently fail
          }
        };

        loadUserData();

        // Configurar listener de progresso antes de iniciar
        let progressUnsubscribe: (() => void) | null = null;
        if (window.electronAPI?.onSystemInitProgress) {
          progressUnsubscribe = window.electronAPI.onSystemInitProgress((progress) => {
            if (!isMounted) return;

            const { stepIndex, stepName, progress: progressValue, status } = progress;

            // Atualizar step específico
            setLoadingSteps((prev) =>
              prev.map((step, idx) =>
                idx === stepIndex
                  ? { name: stepName, status: status as 'loading' | 'complete' | 'error' }
                  : step
              )
            );

            // Atualizar progresso geral
            setLoadingProgress(progressValue);

            // Atualizar texto
            if (status === 'complete' && stepIndex === 6) {
              setLoadingText('Sistema pronto!');
            } else if (status === 'loading') {
              setLoadingText(stepName);
            }
          });
        }

        // Inicializar sistema (vai enviar eventos de progresso via IPC)
        if (window.electronAPI?.initializeSystem) {
          const result = await window.electronAPI.initializeSystem();

          // Remover listener
          if (progressUnsubscribe) {
            progressUnsubscribe();
          }

          if (result && result.success) {
            // Aguardar um pouco antes de completar para mostrar "Sistema pronto!"
            await new Promise((resolve) => setTimeout(resolve, 300));

            if (isMounted && !hasCompletedRef.current) {
              hasCompletedRef.current = true;
              onComplete();
            }
          } else {
            throw new Error(result?.error || 'Falha ao inicializar sistema');
          }
        } else {
          // Fallback: se não tiver o método, usar timeout
          if (progressUnsubscribe) {
            progressUnsubscribe();
          }
          setTimeout(() => {
            if (isMounted && !hasCompletedRef.current) {
              hasCompletedRef.current = true;
              setLoadingProgress(100);
              onComplete();
            }
          }, 2000);
        }
      } catch (error: any) {
        console.error('[LoadingScreen] Error initializing:', error);
        setLoadingText(`Erro: ${error.message || 'Falha ao carregar'}`);
        setLoadingSteps((prev) =>
          prev.map((step) =>
            step.status === 'loading' ? { ...step, status: 'error' as const } : step
          )
        );

        // Ainda completar após 2 segundos mesmo com erro
        setTimeout(() => {
          if (isMounted && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onComplete();
          }
        }, 2000);
      }
    };

    // Iniciar inicialização real
    initializeSystem();

    // Fallback de segurança: forçar conclusão após 5 segundos
    const fallbackTimeout = setTimeout(() => {
      if (isMounted && !hasCompletedRef.current) {
        console.log('[LoadingScreen] Fallback: forcing completion');
        hasCompletedRef.current = true;
        setLoadingProgress(100);
        setLoadingSteps((prev) => prev.map((step) => ({ ...step, status: 'complete' as const })));
        onComplete();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
    };
  }, [onComplete]);

  const backgroundStyle = userData?.bannerUrl
    ? {
        backgroundImage: `linear-gradient(125deg, rgba(0,0,0,0.85), rgba(0,0,0,0.65)), url(${userData.bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-[#0078D4] via-[#106EBE] to-[#005A9E] flex items-center justify-center z-50 overflow-hidden"
      style={backgroundStyle}
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center space-y-8 w-full max-w-2xl px-8">
        {/* User Avatar */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-500 hover:scale-110">
            {userData?.avatarUrl ? (
              <img
                src={userData.avatarUrl}
                alt={userData.displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {userData?.displayName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-white/20 blur-xl animate-pulse" />
          {/* Rotating ring */}
          <div
            className="absolute -inset-2 rounded-full border-4 border-white/10 animate-spin"
            style={{ animationDuration: '3s' }}
          />
        </div>

        {/* Greeting Text */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-light text-white drop-shadow-lg animate-fade-in">
            {loadingText}
          </h1>
          <p className="text-white/80 text-sm md:text-base font-light">
            Preparando tudo para você...
          </p>
        </div>

        {/* Loading Steps */}
        <div className="w-full max-w-md space-y-2 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          {loadingSteps.slice(0, -1).map((step, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 text-sm text-white/90 transition-all duration-300"
              style={{
                opacity: step.status === 'pending' ? 0.5 : 1,
              }}
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {step.status === 'complete' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-300 animate-fade-in" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-300 animate-fade-in" />
                ) : step.status === 'loading' ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/30" />
                )}
              </div>
              <span className="flex-1 text-left">{step.name}</span>
            </div>
          ))}
        </div>

        {/* Loading Bar */}
        <div className="w-full max-w-md space-y-2">
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-white/80 via-white to-white/80 rounded-full transition-all duration-500 ease-out shadow-lg relative overflow-hidden"
              style={{ width: `${loadingProgress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="text-center text-white/70 text-xs font-light">
            {Math.round(loadingProgress)}%
          </div>
        </div>

        {/* Spinning Icon */}
        {loadingProgress < 100 && (
          <div className="mt-2 animate-fade-in">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Windows-style dots animation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.5s',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;

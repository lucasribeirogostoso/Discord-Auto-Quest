import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Target,
  BookOpen,
  BarChart3,
  History,
  Settings,
  LayoutDashboard,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Monitor,
  Zap,
  Palette,
  Bell,
  Globe,
  Circle,
  Terminal,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

interface TutorialStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  highlight?: string; // View to highlight
}

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const { setCurrentView, settings } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const isHighContrast = settings.highContrast ?? true;
  const accentColor = settings.accentColor || '#5865F2';

  if (!isOpen) return null;

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Discord Auto Quest!',
      icon: <Sparkles className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Este tutorial vai te ajudar a entender como usar todas as funcionalidades do programa.
          </p>
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <p className="font-semibold">O que este programa faz?</p>
            <p className="text-sm text-gray-300">
              O Discord Auto Quest automatiza a conclusão de quests do Discord Gaming, economizando
              seu tempo e permitindo que você ganhe recompensas automaticamente.
            </p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <p className="text-sm text-yellow-200">
                <strong>Importante:</strong> Este software pode violar os Termos de Serviço do
                Discord. Use por sua própria conta e risco.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'discord',
      title: 'Conectando ao Discord',
      icon: <Monitor className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            O programa precisa detectar o Discord em execução para funcionar.
          </p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">1. Abra o Discord</p>
              <p className="text-sm text-gray-300">
                Certifique-se de que o Discord Desktop está aberto e você está logado.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">2. Verifique o Status</p>
              <p className="text-sm text-gray-300">
                No Dashboard, você verá um indicador mostrando se o Discord está online ou offline.
                O programa detecta automaticamente quando o Discord está rodando.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">3. Aguarde a Conexão</p>
              <p className="text-sm text-gray-300">
                Quando o Discord estiver detectado, o status mudará para verde e você poderá começar
                a usar as funcionalidades.
              </p>
            </div>
          </div>
        </div>
      ),
      highlight: 'dashboard',
    },
    {
      id: 'dashboard',
      title: 'Dashboard - Visão Geral',
      icon: <LayoutDashboard className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            O Dashboard é sua tela principal, mostrando todas as informações importantes.
          </p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Circle className="w-5 h-5" />
                <p className="font-semibold">Status do Discord</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Mostra se o Discord está online (verde) ou offline (vermelho).
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-5 h-5" />
                <p className="font-semibold">Estatísticas</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Visualize quantas quests foram completadas, tempo economizado e taxa de sucesso.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Terminal className="w-5 h-5" />
                <p className="font-semibold">Logs em Tempo Real</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Acompanhe todas as ações do programa em tempo real através dos logs.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Play className="w-5 h-5" />
                <p className="font-semibold">Executar Todas as Quests</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Clique no botão "Executar Automação" para completar todas as quests disponíveis
                automaticamente.
              </p>
            </div>
          </div>
        </div>
      ),
      highlight: 'dashboard',
    },
    {
      id: 'quests',
      title: 'Quests - Ver e Executar',
      icon: <Target className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Na aba Quests, você pode ver todas as quests disponíveis e executá-las individualmente.
          </p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">Visualizar Quests Disponíveis</p>
              <p className="text-sm text-gray-300">
                Todas as quests do Discord Gaming aparecem como cards com imagens dos jogos, nomes e
                tipos de tarefa.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">Executar Quest Específica</p>
              <p className="text-sm text-gray-300">
                Clique no botão "Execute Now" em qualquer quest para executar apenas aquela quest
                específica. Isso é útil quando você quer completar apenas uma quest em particular.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">Filtros e Busca</p>
              <p className="text-sm text-gray-300">
                Use a barra de busca para encontrar quests específicas ou filtre por tipo de tarefa.
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                <strong>Dica:</strong> Você pode executar múltiplas quests uma após a outra clicando
                em "Execute Now" em cada uma delas.
              </p>
            </div>
          </div>
        </div>
      ),
      highlight: 'quests',
    },
    {
      id: 'library',
      title: 'Biblioteca - Quests Completadas',
      icon: <BookOpen className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            A Biblioteca mostra todas as quests que você já completou com sucesso.
          </p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">Histórico Visual</p>
              <p className="text-sm text-gray-300">
                Veja todas as quests completadas com suas imagens, nomes e informações detalhadas.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">Informações Detalhadas</p>
              <p className="text-sm text-gray-300">
                Cada entrada mostra quando foi completada, quanto tempo levou e qual jogo estava
                relacionado.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">Organização</p>
              <p className="text-sm text-gray-300">
                Use a busca para encontrar quests específicas na sua biblioteca ou filtre por data.
              </p>
            </div>
          </div>
        </div>
      ),
      highlight: 'library',
    },
    {
      id: 'stats',
      title: 'Estatísticas - Seu Progresso',
      icon: <BarChart3 className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Acompanhe seu progresso e desempenho através das estatísticas detalhadas.
          </p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <p className="font-semibold">Quests Completadas</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Total de quests que você completou com sucesso.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <p className="font-semibold">Tempo Economizado</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Quantidade total de tempo que você economizou usando a automação.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <p className="font-semibold">Taxa de Sucesso</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Percentual de quests completadas com sucesso.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-yellow-500" />
                <p className="font-semibold">Última Quest</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">Nome da última quest que você completou.</p>
            </div>
          </div>
        </div>
      ),
      highlight: 'stats',
    },
    {
      id: 'history',
      title: 'Histórico - Registro Completo',
      icon: <History className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            O Histórico mostra um registro completo de todas as execuções de quests.
          </p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">Registro Detalhado</p>
              <p className="text-sm text-gray-300">
                Cada entrada no histórico mostra data, hora, nome da quest, status (sucesso/falha) e
                duração da execução.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">Filtros</p>
              <p className="text-sm text-gray-300">
                Filtre por status (sucesso/falha), data ou busque por nome específico.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold mb-2">Limpar Histórico</p>
              <p className="text-sm text-gray-300">
                Você pode limpar todo o histórico a qualquer momento usando o botão "Limpar
                Histórico".
              </p>
            </div>
          </div>
        </div>
      ),
      highlight: 'history',
    },
    {
      id: 'settings',
      title: 'Configurações - Personalize',
      icon: <Settings className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">Personalize o programa de acordo com suas preferências.</p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5" />
                <p className="font-semibold">Execução Automática</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Ative para executar quests automaticamente quando o Discord for detectado.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Bell className="w-5 h-5" />
                <p className="font-semibold">Notificações</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Receba notificações quando quests forem completadas com sucesso.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Palette className="w-5 h-5" />
                <p className="font-semibold">Tema e Cores</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Escolha entre tema claro/escuro, ative high contrast e escolha uma cor de destaque
                personalizada.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="w-5 h-5" />
                <p className="font-semibold">Idioma</p>
              </div>
              <p className="text-sm text-gray-300 ml-7">
                Selecione o idioma da interface (Português ou Inglês).
              </p>
            </div>
          </div>
        </div>
      ),
      highlight: 'settings',
    },
    {
      id: 'tips',
      title: 'Dicas e Truques',
      icon: <Sparkles className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">Algumas dicas para aproveitar ao máximo o programa:</p>
          <div className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="font-semibold text-green-300 mb-2">✓ Dica 1: Execute Quest por Quest</p>
              <p className="text-sm text-gray-300">
                Para maior controle, execute quests individuais pela aba Quests ao invés de executar
                todas de uma vez.
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="font-semibold text-blue-300 mb-2">✓ Dica 2: Monitore os Logs</p>
              <p className="text-sm text-gray-300">
                Sempre verifique os logs no Dashboard para garantir que tudo está funcionando
                corretamente.
              </p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="font-semibold text-purple-300 mb-2">
                ✓ Dica 3: Mantenha o Discord Aberto
              </p>
              <p className="text-sm text-gray-300">
                O programa precisa que o Discord Desktop esteja aberto e você esteja logado para
                funcionar.
              </p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="font-semibold text-yellow-300 mb-2">⚠ Atenção</p>
              <p className="text-sm text-gray-300">
                Use este programa com responsabilidade. Não abuse da automação e esteja ciente dos
                riscos.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStepIndex = currentStep + 1;
      const nextStep = tutorialSteps[nextStepIndex];

      // Update step first
      setCurrentStep(nextStepIndex);

      // Navigate to highlighted view if specified (after updating step)
      if (nextStep?.highlight) {
        // Use setTimeout to ensure navigation happens after state update
        setTimeout(() => {
          setCurrentView(nextStep.highlight as any);
        }, 50);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      const prevStep = tutorialSteps[prevStepIndex];

      // Update step first
      setCurrentStep(prevStepIndex);

      // Navigate to highlighted view if specified (after updating step)
      if (prevStep?.highlight) {
        // Use setTimeout to ensure navigation happens after state update
        setTimeout(() => {
          setCurrentView(prevStep.highlight as any);
        }, 50);
      }
    }
  };

  const handleGoToStep = (stepIndex: number) => {
    const step = tutorialSteps[stepIndex];

    // Update step first
    setCurrentStep(stepIndex);

    // Navigate to highlighted view if specified (after updating step)
    if (step?.highlight) {
      // Use setTimeout to ensure navigation happens after state update
      setTimeout(() => {
        setCurrentView(step.highlight as any);
      }, 0);
    }
  };

  const currentStepData = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
      <div
        className={`relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden ${
          isHighContrast
            ? 'bg-hc-primary border-2 border-hc'
            : 'glass-card bg-gray-900/95 border border-white/10'
        } shadow-2xl`}
        style={
          !isHighContrast
            ? {
                boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)`,
              }
            : {}
        }
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${
            isHighContrast ? 'border-hc' : 'border-white/10'
          } flex items-center justify-between`}
        >
          <div className="flex items-center space-x-4">
            <div
              className="p-3 rounded-xl"
              style={{
                background: isHighContrast
                  ? accentColor
                  : `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                boxShadow: `0 4px 20px ${accentColor}40`,
              }}
            >
              {currentStepData.icon}
            </div>
            <div>
              <h2
                className={`text-2xl font-bold ${
                  isHighContrast ? 'text-hc-primary' : 'text-white'
                }`}
              >
                {currentStepData.title}
              </h2>
              <p className={`text-sm ${isHighContrast ? 'text-hc-secondary' : 'text-gray-400'}`}>
                Passo {currentStep + 1} de {tutorialSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isHighContrast
                ? 'hover:bg-hc-secondary text-hc-primary'
                : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className={`h-1 ${isHighContrast ? 'bg-hc-secondary' : 'bg-white/10'}`}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
            }}
          />
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className={`${isHighContrast ? 'text-hc-primary' : 'text-white'}`}>
            {currentStepData.content}
          </div>
        </div>

        {/* Navigation */}
        <div
          className={`p-6 border-t ${
            isHighContrast ? 'border-hc' : 'border-white/10'
          } flex items-center justify-between`}
        >
          {/* Step Indicators */}
          <div className="flex items-center space-x-2">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleGoToStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8'
                    : isHighContrast
                    ? 'bg-hc-secondary hover:bg-hc'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                style={
                  index === currentStep
                    ? {
                        background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                      }
                    : {}
                }
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                currentStep === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : isHighContrast
                  ? 'bg-hc-secondary text-hc-primary hover:bg-hc border-2 border-hc'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <ChevronLeft size={20} />
              <span>Anterior</span>
            </button>

            {currentStep < tutorialSteps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all flex items-center space-x-2"
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                  boxShadow: `0 4px 20px ${accentColor}40`,
                }}
              >
                <span>Próximo</span>
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                  boxShadow: `0 4px 20px ${accentColor}40`,
                }}
              >
                Finalizar Tutorial
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;

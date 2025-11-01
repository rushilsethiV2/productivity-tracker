import { Dumbbell, CheckSquare, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentApp: string;
  onNavigateApp: (app: string) => void;
}

export default function Sidebar({ currentApp, onNavigateApp }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const apps = [
    { id: 'exercise', name: 'Exercise Tracker', icon: Dumbbell, color: 'blue' },
    { id: 'todos', name: 'Todo List', icon: CheckSquare, color: 'yellow' },
    { id: 'habits', name: 'Habit Tracker', icon: Calendar, color: 'green' },
  ];

  const getActiveColor = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-cyan-500',
      yellow: 'from-yellow-500 to-orange-500',
      green: 'from-green-500 to-emerald-500',
    };
    return colors[color as keyof typeof colors];
  };

  const getHoverColor = (color: string) => {
    const colors = {
      blue: 'hover:border-blue-500',
      yellow: 'hover:border-yellow-500',
      green: 'hover:border-green-500',
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <>
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-full bg-[rgb(var(--card))] border-r border-[rgb(var(--border))] z-40 transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="flex flex-col h-full p-4 w-full">
          <div className="mb-8 mt-4 overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-yellow-500 flex items-center justify-center font-bold text-white">
                PS
              </div>
              {isExpanded && (
                <div className="animate-fadeIn">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent whitespace-nowrap">
                    Productivity Suite
                  </h2>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-3">
            {apps.map(app => {
              const Icon = app.icon;
              const isActive = currentApp === app.id;

              return (
                <button
                  key={app.id}
                  onClick={() => onNavigateApp(app.id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group ${
                    isActive
                      ? `bg-gradient-to-r ${getActiveColor(app.color)} text-white shadow-lg`
                      : `bg-[rgb(var(--background))] border border-[rgb(var(--border))] ${getHoverColor(app.color)}`
                  }`}
                  title={!isExpanded ? app.name : ''}
                >
                  <div
                    className={`flex-shrink-0 ${
                      isActive ? '' : 'group-hover:scale-110'
                    } transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  {isExpanded && (
                    <div className="text-left overflow-hidden animate-fadeIn">
                      <h3 className="font-semibold text-sm whitespace-nowrap">{app.name}</h3>
                    </div>
                  )}
                  {isActive && !isExpanded && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-[rgb(var(--border))]">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center p-3 rounded-xl bg-[rgb(var(--background))] border border-[rgb(var(--border))] hover:border-blue-500 transition-all"
            >
              {isExpanded ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[rgb(var(--card))] border-t border-[rgb(var(--border))] z-40 px-2 py-3">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {apps.map(app => {
            const Icon = app.icon;
            const isActive = currentApp === app.id;

            return (
              <button
                key={app.id}
                onClick={() => onNavigateApp(app.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${getActiveColor(app.color)} text-white shadow-lg`
                    : `text-gray-400 hover:text-white`
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{app.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

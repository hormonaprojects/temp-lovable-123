
import { cn } from "@/lib/utils";
import { ChefHat, Calendar, CalendarDays } from "lucide-react";

interface FunctionSelectorProps {
  selectedFunction: 'single' | 'daily' | 'multi';
  onFunctionSelect: (func: 'single' | 'daily' | 'multi') => void;
}

const functionOptions = [
  {
    id: 'single' as const,
    title: 'Egy recept',
    subtitle: 'Generálj egy receptet alapanyagok alapján',
    icon: ChefHat,
    gradient: 'from-purple-500 to-pink-500',
    hoverGradient: 'hover:from-purple-600 hover:to-pink-600',
    emoji: '🍽️'
  },
  {
    id: 'daily' as const,
    title: 'Napi étrendtervező',
    subtitle: 'Tervezz egy teljes napot étkezésekkel',
    icon: Calendar,
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'hover:from-blue-600 hover:to-cyan-600',
    emoji: '📅'
  },
  {
    id: 'multi' as const,
    title: 'Többnapos tervező',
    subtitle: 'Készíts több napra szóló étrendet',
    icon: CalendarDays,
    gradient: 'from-green-500 to-emerald-500',
    hoverGradient: 'hover:from-green-600 hover:to-emerald-600',
    emoji: '📊'
  }
];

export function FunctionSelector({ selectedFunction, onFunctionSelect }: FunctionSelectorProps) {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Mobile Tab Style */}
      <div className="sm:hidden">
        <div className="flex bg-black/20 backdrop-blur-lg rounded-xl p-1 border border-white/20">
          {functionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onFunctionSelect(option.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-all duration-300 text-xs",
                selectedFunction === option.id
                  ? `bg-gradient-to-r ${option.gradient} text-white shadow-lg`
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <span className="text-lg">{option.emoji}</span>
              <span className="font-medium leading-tight text-center">{option.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Card Style */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-4 lg:gap-6">
        {functionOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => onFunctionSelect(option.id)}
              className={cn(
                "group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105",
                selectedFunction === option.id
                  ? "ring-4 ring-white/30 shadow-2xl"
                  : "hover:shadow-xl"
              )}
            >
              <div className={cn(
                "p-6 h-40 flex flex-col items-center justify-center text-center transition-all duration-300 border border-white/20",
                selectedFunction === option.id
                  ? `bg-gradient-to-br ${option.gradient} shadow-2xl`
                  : `bg-white/10 backdrop-blur-sm ${option.hoverGradient} hover:bg-gradient-to-br`
              )}>
                <IconComponent className="h-12 w-12 text-white mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">{option.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{option.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

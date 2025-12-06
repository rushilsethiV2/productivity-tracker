import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'yellow' | 'orange' | 'red';
  subtitle?: string;
}

export default function StatCard({ icon: Icon, label, value, color, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500 text-blue-400',
    green: 'from-green-500 to-emerald-500 text-green-400',
    yellow: 'from-yellow-500 to-orange-500 text-yellow-400',
    orange: 'from-orange-500 to-red-500 text-orange-400',
    red: 'from-red-500 to-pink-500 text-red-400',
  };

  const iconBgClasses = {
    blue: 'bg-blue-500/20',
    green: 'bg-green-500/20',
    yellow: 'bg-yellow-500/20',
    orange: 'bg-orange-500/20',
    red: 'bg-red-500/20',
  };

  return (
    <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6 hover:border-opacity-50 transition-all hover:scale-105">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
          <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[2]}`} />
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold bg-gradient-to-r ${colorClasses[color].split(' ').slice(0, 2).join(' ')} bg-clip-text text-transparent mb-1`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

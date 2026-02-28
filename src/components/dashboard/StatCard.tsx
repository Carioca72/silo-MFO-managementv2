import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  isRisk?: boolean;
}

export function StatCard({ title, value, trend, isRisk }: StatCardProps) {
  const isPositive = trend.startsWith('+');
  const isNegative = trend.startsWith('-');
  
  // Logic for color: 
  // If it's a risk metric (like VaR), positive trend (increase) is BAD (red).
  // If it's a normal metric (like AuM), positive trend is GOOD (green).
  
  let trendColor = 'text-gray-500';
  let bgColor = 'bg-gray-100';
  
  if (isRisk) {
    if (isPositive) { trendColor = 'text-red-600'; bgColor = 'bg-red-100'; }
    if (isNegative) { trendColor = 'text-green-600'; bgColor = 'bg-green-100'; }
  } else {
    if (isPositive) { trendColor = 'text-green-600'; bgColor = 'bg-green-100'; }
    if (isNegative) { trendColor = 'text-red-600'; bgColor = 'bg-red-100'; }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-bold text-[#1A1A2E]">{value}</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${bgColor} ${trendColor}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </span>
      </div>
    </div>
  );
}

import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface Alert {
  id: string;
  message: string;
  time: string;
  severity: 'high' | 'medium' | 'low' | 'success';
}

interface AlertFeedProps {
  alerts: Alert[];
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-[#1A1A2E]">Alertas Recentes</h3>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
          {alerts.filter(a => a.severity === 'high').length} Críticos
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {alerts.map((alert) => (
          <div key={alert.id} className={`p-3 rounded-lg border-l-4 flex gap-3 items-start ${getSeverityStyles(alert.severity)}`}>
            <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 leading-tight">{alert.message}</p>
              <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'high': return 'border-red-500 bg-red-50';
    case 'medium': return 'border-yellow-500 bg-yellow-50';
    case 'success': return 'border-green-500 bg-green-50';
    default: return 'border-blue-500 bg-blue-50';
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'high': return <XCircle size={16} className="text-red-600" />;
    case 'medium': return <AlertTriangle size={16} className="text-yellow-600" />;
    case 'success': return <CheckCircle size={16} className="text-green-600" />;
    default: return <Info size={16} className="text-blue-600" />;
  }
}

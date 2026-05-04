import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp?: Date;
}

interface AlertNotificationProps {
  alert: Alert;
  onClose: (id: string) => void;
}

export function AlertNotification({ alert, onClose }: AlertNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(alert.id);
    }, 8000);

    return () => clearTimeout(timer);
  }, [alert.id, onClose]);

  const getAlertStyles = () => {
    switch (alert.type) {
      case 'critical':
        return {
          bgColor: 'bg-red-900/90',
          borderColor: 'border-red-500',
          iconColor: 'text-red-500',
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          bgColor: 'bg-amber-900/90',
          borderColor: 'border-amber-500',
          iconColor: 'text-amber-500',
          Icon: AlertTriangle,
        };
      case 'success':
        return {
          bgColor: 'bg-green-900/90',
          borderColor: 'border-green-500',
          iconColor: 'text-green-500',
          Icon: CheckCircle,
        };
      default:
        return {
          bgColor: 'bg-blue-900/90',
          borderColor: 'border-blue-500',
          iconColor: 'text-blue-500',
          Icon: Info,
        };
    }
  };

  const { bgColor, borderColor, iconColor, Icon } = getAlertStyles();

  return (
    <div
      className={`${bgColor} border-l-4 ${borderColor} rounded-lg p-4 shadow-2xl backdrop-blur-sm animate-slide-in-right min-w-[320px] max-w-md`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-1">{alert.title}</h4>
          <p className="text-sm text-gray-300 leading-relaxed">{alert.message}</p>
          {alert.timestamp && (
            <p className="text-xs text-gray-500 mt-2">
              {alert.timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(alert.id)}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

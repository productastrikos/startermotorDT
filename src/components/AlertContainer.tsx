import { AlertNotification, Alert } from './AlertNotification';

interface AlertContainerProps {
  alerts: Alert[];
  onClose: (id: string) => void;
}

export function AlertContainer({ alerts, onClose }: AlertContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-h-screen overflow-y-auto pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {alerts.map((alert) => (
          <AlertNotification key={alert.id} alert={alert} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

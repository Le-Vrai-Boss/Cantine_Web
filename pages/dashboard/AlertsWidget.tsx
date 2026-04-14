import React from 'react';
import type { Alert } from '../../types';
import { AlertTriangleIcon, InfoIcon, CheckIcon } from '../../components/Icons';

const iconMap: Record<Alert['type'], React.ReactNode> = {
  warning: <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />,
  info: <InfoIcon className="h-6 w-6 text-blue-500" />,
};

const AlertsWidget: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
    if (alerts.length === 0) {
        return (
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] h-full">
                <div className="flex items-center">
                    <CheckIcon className="h-6 w-6 text-green-500 mr-3" />
                     <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">Tout est en ordre !</h3>
                </div>
                <p className="text-[var(--color-text-muted)] mt-1 ml-9">Aucune alerte ou notification importante pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] h-full flex flex-col">
            <h3 className="text-lg font-semibold text-[var(--color-text-heading)] mb-4">Alertes et Notifications</h3>
            <div className="space-y-4 overflow-y-auto pr-2 max-h-72">
                {alerts.map(alert => (
                    <div key={alert.id} className={`flex items-start p-4 rounded-md ${alert.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-blue-50 border-l-4 border-blue-400'}`}>
                        <div className="flex-shrink-0 mt-0.5">
                            {iconMap[alert.type]}
                        </div>
                        <div className="ml-3">
                            <h4 className="text-md font-semibold text-slate-800">{alert.title}</h4>
                            <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertsWidget;

import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
    <div className="bg-[var(--color-bg-card)] p-5 rounded-lg [box-shadow:var(--shadow-md)] flex items-center space-x-4">
        <div className={`p-4 rounded-full ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{title}</p>
            <p className="text-2xl font-bold text-[var(--color-text-heading)]">{value}</p>
        </div>
    </div>
);

export default StatCard;

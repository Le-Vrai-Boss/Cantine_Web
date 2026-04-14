import React from 'react';
import { BookOpenIcon } from '../components/Icons';

interface PlaceholderPageProps {
    title?: string;
    description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
    title = "En Cours de Développement",
    description = "Cette fonctionnalité est en cours de construction et sera bientôt disponible. Merci pour votre patience !"
}) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center bg-[var(--color-bg-card)] p-8 rounded-lg [box-shadow:var(--shadow-md)]">
            <div className="p-4 bg-[var(--color-primary-light)] rounded-full mb-4">
                <BookOpenIcon className="h-12 w-12 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-heading)]">{title}</h3>
            <p className="mt-2 text-[var(--color-text-muted)] max-w-md">{description}</p>
        </div>
    );
};

export default PlaceholderPage;

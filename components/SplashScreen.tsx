import React from 'react';

// v1.0.1
export const SplashScreen: React.FC = () => {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white flex-col font-sans">
            <div className="relative">
                <img src="/logo.svg" alt="Logo" className="w-24 h-24 [filter:drop-shadow(0_0_15px_rgba(59,130,246,0.5))]" referrerPolicy="no-referrer" />
            </div>
            
            <h1 className="text-2xl font-bold mt-6 tracking-wide">Gestion des Cantines Scolaires</h1>
            
            <div className="mt-12 text-center">
                <svg className="animate-spin h-8 w-8 text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-3 text-slate-300 animate-pulse">Chargement des données...</p>
            </div>

            <p className="absolute bottom-5 text-xs text-slate-500">&copy; 2024 Conçu par M. ADOUKO</p>
        </div>
    );
};

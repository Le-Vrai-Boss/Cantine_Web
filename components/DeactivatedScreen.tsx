import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { LockIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { License } from '../types';

interface DeactivatedScreenProps {
    onActivateClick?: () => void;
}

export const DeactivatedScreen: React.FC<DeactivatedScreenProps> = () => {
    const { licenses, setLicenses, setAppSettings, logAction } = useAppContext();
    const [activationCode, setActivationCode] = useState('');
    const [error, setError] = useState('');
    const [currentDeviceIp, setCurrentDeviceIp] = useState('Chargement...');

    useEffect(() => {
        const getIp = async () => {
            try {
                const res = await fetch('https://api.ipify.org?format=json');
                const data = await res.json();
                setCurrentDeviceIp(data.ip);
            } catch (e) {
                let deviceId = localStorage.getItem('canteen_device_id');
                if (!deviceId) {
                    deviceId = 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                    localStorage.setItem('canteen_device_id', deviceId);
                }
                setCurrentDeviceIp(deviceId);
            }
        };
        getIp();
    }, []);

    const handleActivate = () => {
        const license = licenses.find((l: License) => l.code === activationCode.trim().toUpperCase());
        
        if (!license) {
            setError("Code d'activation invalide.");
            return;
        }

        if (license.status === 'activated' && license.deviceIp !== currentDeviceIp) {
            setError("Ce code est déjà utilisé par un autre appareil.");
            return;
        }

        const activationDate = new Date();
        let expiryDate: Date | null = new Date();
        switch(license.duration) {
            case '6m': expiryDate.setMonth(expiryDate.getMonth() + 6); break;
            case '9m': expiryDate.setMonth(expiryDate.getMonth() + 9); break;
            case '1y': expiryDate.setFullYear(expiryDate.getFullYear() + 1); break;
            case '2y': expiryDate.setFullYear(expiryDate.getFullYear() + 2); break;
            case 'unlimited': expiryDate = null; break;
        }

        const updatedLicenses = licenses.map((l: License) => 
            l.id === license.id 
                ? { ...l, deviceIp: currentDeviceIp, status: 'activated', activationDate: activationDate.toISOString(), expiryDate: expiryDate?.toISOString() } 
                : l
        );

        setLicenses(updatedLicenses);
        setAppSettings((prev) => ({
            ...prev,
            activationStatus: expiryDate === null ? 'unlimited' : 'activated',
            activationDate: activationDate.toISOString(),
            expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
            validityPeriod: license.duration
        }));

        logAction(`Appareil ${currentDeviceIp} activé avec le code ${license.code}.`, 1);
        window.location.reload(); // Reload to refresh app state
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-base)] p-4">
            <div className="w-full max-w-md mx-auto text-center">
                <div className="bg-[var(--color-bg-card)] p-8 rounded-2xl [box-shadow:var(--shadow-lg)] border border-[var(--color-border-base)]">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <LockIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-heading)]">Application Désactivée</h2>
                    <p className="mt-2 text-md text-[var(--color-text-muted)]">
                        Votre période d'essai ou votre licence a expiré. Veuillez entrer votre code d'activation pour continuer.
                    </p>
                    
                    <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">ID de votre appareil</p>
                        <p className="text-sm font-mono font-bold text-slate-700">{currentDeviceIp}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="text-left">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Code d'activation</label>
                            <input 
                                type="text"
                                value={activationCode}
                                onChange={(e) => {setActivationCode(e.target.value); setError('');}}
                                placeholder="XXXX-XXXX-XXXX"
                                className="w-full p-3 border rounded-lg text-center font-mono text-lg uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
                        </div>
                        
                        <Button
                            onClick={handleActivate}
                            variant="primary"
                            className="w-full py-3 text-base"
                            disabled={!activationCode}
                        >
                            Activer l'application
                        </Button>
                    </div>
                    
                    <p className="mt-6 text-xs text-slate-400">
                        Contactez votre administrateur pour obtenir un code d'activation pour cet appareil.
                    </p>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { AppSettings, QRCodeChunk } from '../types';
import { Button } from '../components/Button';
import { SaveIcon, EyeIcon, EyeOffIcon, ImportIcon, QrCodeIcon, CameraIcon, AlertTriangleIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon } from '../components/Icons';
import { MainMenuId, SubMenuId } from '../constants';
import { useToast } from '../context/ToastContext';
import { QRScanner } from '../components/QRScanner';
import QRCode from 'qrcode';
import { PasswordConfirmModal } from '../components/PasswordConfirmModal';
import { GoogleGenAI } from '@google/genai';

const optionalModuleConfig = [
    { id: MainMenuId.AssistantAI, label: 'Assistant AI' },
    { id: MainMenuId.Messagerie, label: 'Messagerie' },
    { id: MainMenuId.Informations, label: 'Informations' },
    { id: MainMenuId.SanteHygiene, label: 'Santé & Hygiène' },
    { id: MainMenuId.Fournisseurs, label: 'Fournisseurs' },
    { id: MainMenuId.GestionDons, label: 'Gestion des Dons' },
    { id: MainMenuId.MenusPlanification, label: 'Menus & Planification' },
    { id: MainMenuId.BilanEcole, label: 'Analyse Comparative' },
    { id: MainMenuId.CFCBilan, label: 'CFC Bilan' },
    { id: MainMenuId.BilanVivres, label: 'Bilan Consommation Planifiée' },
    { id: MainMenuId.Liste, label: 'Liste' },
    { id: MainMenuId.VerificationRapport, label: 'Vérification Rapport' },
    { id: MainMenuId.Historique, label: 'Historique' },
    { id: MainMenuId.APropos, label: 'À Propos' },
];

const alertConfig = [
    { id: 'stock', label: 'Alertes de stock faible' },
    { id: 'verify', label: 'Rapports de vérification en attente' },
    { id: 'event', label: 'Événements du calendrier à venir' },
];

const themes = [
    { id: 'default', name: 'Défaut (Bleu)', colors: ['bg-blue-600', 'bg-slate-900', 'bg-slate-100', 'bg-white'] },
    { id: 'forest', name: 'Forêt (Vert)', colors: ['bg-green-600', 'bg-[#142517]', 'bg-green-50', 'bg-white'] },
    { id: 'ocean', name: 'Océan (Turquoise)', colors: ['bg-teal-600', 'bg-[#0e3333]', 'bg-cyan-50', 'bg-white'] },
    { id: 'sunset', name: 'Coucher de Soleil (Orange)', colors: ['bg-orange-600', 'bg-[#441c00]', 'bg-amber-50', 'bg-white'] },
    { id: 'dark', name: 'Nuit (Sombre)', colors: ['bg-blue-500', 'bg-slate-950', 'bg-slate-900', 'bg-slate-800'] },
];

const GeneralSettings: React.FC<{
    localAppSettings: AppSettings;
    handleSettingsChange: (field: keyof AppSettings, value: unknown) => void;
    isReadOnly?: boolean;
}> = ({ localAppSettings, handleSettingsChange, isReadOnly }) => (
    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
        <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Paramètres Généraux</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
                <label htmlFor="org-name" className="block text-sm font-medium text-[var(--color-text-muted)]">Nom de l'Organisation</label>
                <input type="text" id="org-name" value={localAppSettings.organizationName || ''} onChange={e => handleSettingsChange('organizationName', e.target.value)} disabled={isReadOnly} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
            </div>
            <div>
                <label htmlFor="currency-symbol" className="block text-sm font-medium text-[var(--color-text-muted)]">Symbole Monétaire</label>
                <input type="text" id="currency-symbol" value={localAppSettings.currencySymbol || ''} onChange={e => handleSettingsChange('currencySymbol', e.target.value)} disabled={isReadOnly} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
            </div>
            <div>
                <label htmlFor="default-meal-price" className="block text-sm font-medium text-[var(--color-text-muted)]">Prix du repas par défaut</label>
                <input type="number" id="default-meal-price" value={localAppSettings.defaultMealPrice || 0} onChange={e => handleSettingsChange('defaultMealPrice', Number(e.target.value))} disabled={isReadOnly} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
            </div>
            <div>
                <label htmlFor="inspection-percentage" className="block text-sm font-medium text-[var(--color-text-muted)]">Pourcentage de l'inspection (%)</label>
                <input type="number" id="inspection-percentage" value={localAppSettings.inspectionPercentage || 0} onChange={e => handleSettingsChange('inspectionPercentage', Number(e.target.value))} disabled={isReadOnly} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
            </div>
        </div>
    </div>
);

const AISettings: React.FC<{
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    isReadOnly?: boolean;
    logAction: (action: string, userLevel: number | null) => void;
    currentUserLevel: number | null;
}> = ({ appSettings, setAppSettings, isReadOnly, logAction, currentUserLevel }) => {
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [isVerifyingKey, setIsVerifyingKey] = useState(false);
    const { addToast } = useToast();

    const handleVerifyAndSaveApiKey = async () => {
        if (!apiKeyInput.trim()) {
            addToast('Veuillez entrer une clé API.', 'warning');
            return;
        }
        setIsVerifyingKey(true);
        try {
            const ai = new GoogleGenAI({ apiKey: apiKeyInput });
            await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'test',
                config: { thinkingConfig: { thinkingBudget: 0 } }
            });
            setAppSettings(prev => ({ ...prev, apiKey: apiKeyInput }));
            addToast('Clé IA vérifiée et sauvegardée avec succès !', 'success');
            setApiKeyInput('');
            logAction("Clé API Gemini configurée.", currentUserLevel);
        } catch (error) {
            console.error("Erreur de vérification de la clé API:", error);
            addToast('La clé IA est invalide ou une erreur est survenue.', 'error');
        } finally {
            setIsVerifyingKey(false);
        }
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Configuration de l'Assistant IA</h3>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                {appSettings.apiKey ? (
                    <p className="text-xs text-blue-700 mt-1">
                        Une clé API est déjà configurée. Pour la modifier, entrez une nouvelle clé et cliquez sur "Mettre à jour".
                    </p>
                ) : (
                    <p className="text-xs text-blue-700 mt-1">
                        Pour utiliser l'Assistant IA, veuillez entrer votre clé API Google Gemini.
                    </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                    <input
                        type="password"
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        className="flex-grow p-2 border rounded-md bg-white border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={appSettings.apiKey ? "Entrez la nouvelle clé API ici" : "Entrez votre clé API Gemini ici"}
                        disabled={isVerifyingKey || isReadOnly}
                    />
                    <Button onClick={handleVerifyAndSaveApiKey} disabled={isVerifyingKey || !apiKeyInput || isReadOnly}>
                        {isVerifyingKey ? 'Vérification...' : (appSettings.apiKey ? 'Mettre à jour' : 'Vérifier et Sauvegarder')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ThemeSettings: React.FC<{
    localAppSettings: AppSettings;
    handleSettingsChange: (field: keyof AppSettings, value: unknown) => void;
    isReadOnly?: boolean;
}> = ({ localAppSettings, handleSettingsChange, isReadOnly }) => (
    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
        <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Apparence et Thème Visuel</h3>
        <div className="flex flex-wrap gap-4">
            {themes.map(theme => (
                <div key={theme.id} onClick={() => !isReadOnly && handleSettingsChange('theme', theme.id)} className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${localAppSettings.theme === theme.id ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]' : 'border-transparent hover:border-[var(--color-border-input)]'}`}>
                    <div className="flex items-center space-x-2">
                        {theme.colors.map((color, i) => <div key={i} className={`h-6 w-6 rounded-full ${color}`}></div>)}
                    </div>
                    <p className="text-xs text-center mt-2 font-medium">{theme.name}</p>
                </div>
            ))}
        </div>
    </div>
);

const ModulesAlertsSettings: React.FC<{
    appSettings: AppSettings;
    handleModuleChange: (moduleId: string, checked: boolean) => void;
    localAppSettings: AppSettings;
    handleAlertChange: (alertId: string, checked: boolean) => void;
    isReadOnly?: boolean;
}> = ({ appSettings, handleModuleChange, localAppSettings, handleAlertChange, isReadOnly }) => (
    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
        <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Modules et Notifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 className="font-semibold text-[var(--color-text-base)] mb-3">Modules Optionnels</h4>
                <div className="space-y-2">
                    {optionalModuleConfig.map(module => (
                        <label key={module.id} className={`flex items-center space-x-2 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input type="checkbox" checked={appSettings.optionalModules?.[module.id] === true} onChange={e => handleModuleChange(module.id, e.target.checked)} disabled={isReadOnly} className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-[var(--color-border-input)]"/>
                            <span className="text-sm">{module.label}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-[var(--color-text-base)] mb-3">Alertes du Tableau de Bord</h4>
                <div className="space-y-2">
                    {alertConfig.map(alert => (
                        <label key={alert.id} className={`flex items-center space-x-2 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input type="checkbox" checked={localAppSettings.dashboardAlerts?.[alert.id] === true} onChange={e => handleAlertChange(alert.id, e.target.checked)} disabled={isReadOnly} className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-[var(--color-border-input)]"/>
                            <span className="text-sm">{alert.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const SecuritySettings: React.FC<{
    isReadOnly?: boolean;
    localAppSettings: AppSettings;
    handleSettingsChange: (field: keyof AppSettings, value: unknown) => void;
    currentPassword: string; setCurrentPassword: React.Dispatch<React.SetStateAction<string>>;
    newPassword: string; setNewPassword: React.Dispatch<React.SetStateAction<string>>;
    confirmPassword: string; setConfirmPassword: React.Dispatch<React.SetStateAction<string>>;
    level2Password: string; setLevel2Password: React.Dispatch<React.SetStateAction<string>>;
    level3Password: string; setLevel3Password: React.Dispatch<React.SetStateAction<string>>;
    level4Password: string; setLevel4Password: React.Dispatch<React.SetStateAction<string>>;
}> = ({ isReadOnly, localAppSettings, handleSettingsChange, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showL2Password, setShowL2Password] = useState(false);
    const [showL3Password, setShowL3Password] = useState(false);
    const [showL4Password, setShowL4Password] = useState(false);

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Sécurité et Mots de Passe</h3>
            <div className="space-y-4">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400">
                    <h4 className="font-bold text-blue-800">Modification du Mot de Passe Principal (Niveau 1)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                            <label className="text-xs text-slate-600 block mb-1">Mot de passe actuel</label>
                            <input type="password" value={props.currentPassword} onChange={e => props.setCurrentPassword(e.target.value)} disabled={isReadOnly} className="w-full p-2 border rounded-md" />
                        </div>
                         <div>
                            <label className="text-xs text-slate-600 block mb-1">Nouveau mot de passe</label>
                            <div className="relative"><input type={showPassword ? 'text' : 'password'} value={props.newPassword} onChange={e => props.setNewPassword(e.target.value)} disabled={isReadOnly} className="w-full p-2 border rounded-md" /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 text-slate-500">{showPassword ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button></div>
                        </div>
                         <div>
                            <label className="text-xs text-slate-600 block mb-1">Confirmer le nouveau</label>
                            <input type="password" value={props.confirmPassword} onChange={e => props.setConfirmPassword(e.target.value)} disabled={isReadOnly} className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-slate-700">Mots de passes des autres niveaux</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                            <label className="text-xs text-slate-600 block mb-1">Mot de passe Niveau 2</label>
                             <div className="relative"><input type={showL2Password ? 'text' : 'password'} value={props.level2Password} onChange={e => props.setLevel2Password(e.target.value)} disabled={isReadOnly} className="w-full p-2 border rounded-md" /><button type="button" onClick={()=>setShowL2Password(!showL2Password)} className="absolute inset-y-0 right-0 px-3 text-slate-500">{showL2Password ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button></div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 block mb-1">Mot de passe Niveau 3</label>
                            <div className="relative"><input type={showL3Password ? 'text' : 'password'} value={props.level3Password} onChange={e => props.setLevel3Password(e.target.value)} disabled={isReadOnly} className="w-full p-2 border rounded-md" /><button type="button" onClick={()=>setShowL3Password(!showL3Password)} className="absolute inset-y-0 right-0 px-3 text-slate-500">{showL3Password ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button></div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 block mb-1">Mot de passe Niveau 4</label>
                             <div className="relative"><input type={showL4Password ? 'text' : 'password'} value={props.level4Password} onChange={e => props.setLevel4Password(e.target.value)} disabled={isReadOnly} className="w-full p-2 border rounded-md" /><button type="button" onClick={()=>setShowL4Password(!showL4Password)} className="absolute inset-y-0 right-0 px-3 text-slate-500">{showL4Password ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button></div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400">
                    <h4 className="font-bold text-blue-800">Indice de récupération (facultatif)</h4>
                    <p className="text-xs text-blue-700 mt-1">Un mot ou une phrase simple pour déverrouiller votre compte si vous oubliez le mot de passe principal. Vous serez invité à en créer un nouveau.</p>
                    <div className="mt-2">
                        <label className="text-xs text-slate-600 block mb-1">Votre indice</label>
                        <input
                            type="text"
                            value={localAppSettings.passwordHint || ''}
                            onChange={e => handleSettingsChange('passwordHint', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full md:w-1/2 p-2 border rounded-md bg-[var(--color-bg-card)] border-[var(--color-border-input)]"
                            placeholder="Ex: nom de mon premier chien"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const LicenseSettings: React.FC<{
    isReadOnly?: boolean;
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    logAction: (action: string, userLevel: number | null) => void;
    currentUserLevel: number | null;
}> = ({ setAppSettings, logAction, currentUserLevel }) => {
    const { licenses, setLicenses, addToast } = useAppContext();
    const [selectedDuration, setSelectedDuration] = useState<'6m' | '9m' | '1y' | '2y' | 'unlimited'>('6m');
    const [currentDeviceIp, setCurrentDeviceIp] = useState('Chargement...');
    const [activationCodeInput, setActivationCodeInput] = useState('');

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

    const generateLicense = () => {
        const newCode = Math.random().toString(36).substr(2, 10).toUpperCase();
        const newLicense: License = {
            id: Date.now().toString(),
            code: newCode,
            deviceIp: 'En attente...',
            duration: selectedDuration,
            status: 'pending'
        };
        setLicenses([...licenses, newLicense]);
        addToast(`Nouveau code de licence généré : ${newCode}`, 'success');
        logAction(`Nouveau code de licence généré (${selectedDuration}).`, currentUserLevel);
    };

    const handleActivateCurrentDevice = () => {
        const license = licenses.find((l: License) => l.code === activationCodeInput.trim().toUpperCase());
        if (!license) {
            addToast("Code d'activation invalide.", 'error');
            return;
        }

        if (license.status === 'activated' && license.deviceIp !== currentDeviceIp) {
            addToast("Ce code est déjà utilisé par un autre appareil.", 'error');
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

        addToast("Application activée avec succès !", "success");
        logAction(`Appareil ${currentDeviceIp} activé avec le code ${license.code}.`, currentUserLevel);
        setActivationCodeInput('');
    };

    const handleDeleteLicense = (id: string) => {
        if (window.confirm("Supprimer cette licence ?")) {
            setLicenses(licenses.filter((l: License) => l.id !== id));
            addToast("Licence supprimée.", "info");
        }
    };

    const updateLicenseDuration = (id: string, newDuration: License['duration']) => {
        setLicenses(licenses.map((l: License) => {
            if (l.id === id) {
                let expiryDate: Date | null = l.activationDate ? new Date(l.activationDate) : null;
                if (expiryDate) {
                    switch(newDuration) {
                        case '6m': expiryDate.setMonth(expiryDate.getMonth() + 6); break;
                        case '9m': expiryDate.setMonth(expiryDate.getMonth() + 9); break;
                        case '1y': expiryDate.setFullYear(expiryDate.getFullYear() + 1); break;
                        case '2y': expiryDate.setFullYear(expiryDate.getFullYear() + 2); break;
                        case 'unlimited': expiryDate = null; break;
                    }
                }
                return { ...l, duration: newDuration, expiryDate: expiryDate?.toISOString() };
            }
            return l;
        }));
        addToast("Durée de la licence mise à jour.", "success");
    };

    return (
        <div className="space-y-6">
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Licence et Activation</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                            <p className="text-sm text-blue-800 font-medium">Votre Appareil : <span className="font-mono">{currentDeviceIp}</span></p>
                            <p className="text-xs text-blue-600 mt-1">Cet identifiant est unique à votre appareil et nécessaire pour l'activation.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--color-text-muted)]">Activer cet appareil</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Entrez votre code d'activation"
                                    value={activationCodeInput}
                                    onChange={(e) => setActivationCodeInput(e.target.value)}
                                    className="flex-grow p-2 border rounded-md uppercase font-mono"
                                />
                                <Button onClick={handleActivateCurrentDevice} disabled={!activationCodeInput}>Activer</Button>
                            </div>
                        </div>
                    </div>

                    {currentUserLevel === 0 && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-[var(--color-text-base)]">Générer une nouvelle licence</h4>
                            <div className="flex items-end gap-3">
                                <div className="flex-grow">
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Durée de validité</label>
                                    <select 
                                        value={selectedDuration} 
                                        onChange={e => setSelectedDuration(e.target.value as License['duration'])}
                                        className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md"
                                    >
                                        <option value="6m">6 Mois</option>
                                        <option value="9m">9 Mois</option>
                                        <option value="1y">1 An</option>
                                        <option value="2y">2 Ans</option>
                                        <option value="unlimited">Illimitée</option>
                                    </select>
                                </div>
                                <Button onClick={generateLicense} variant="primary">Générer Code</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {currentUserLevel === 0 && (
                <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
                    <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Liste des Licences et Appareils</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--color-border-base)]">
                                    <th className="py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">Appareil (IP/ID)</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">Code d'Activation</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">Durée</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">Statut</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">Expiration</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {licenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-[var(--color-text-muted)] italic">Aucune licence générée pour le moment.</td>
                                    </tr>
                                ) : (
                                    licenses.map((license: License) => (
                                        <tr key={license.id} className="border-b border-[var(--color-border-base)] hover:bg-[var(--color-bg-muted)] transition-colors">
                                            <td className="py-3 px-4 font-mono text-sm">{license.deviceIp}</td>
                                            <td className="py-3 px-4 font-bold text-[var(--color-primary)]">{license.code}</td>
                                            <td className="py-3 px-4">
                                                <select 
                                                    value={license.duration}
                                                    onChange={(e) => updateLicenseDuration(license.id, e.target.value)}
                                                    className="text-xs p-1 border rounded bg-transparent"
                                                >
                                                    <option value="6m">6 Mois</option>
                                                    <option value="9m">9 Mois</option>
                                                    <option value="1y">1 An</option>
                                                    <option value="2y">2 Ans</option>
                                                    <option value="unlimited">Illimitée</option>
                                                </select>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    license.status === 'activated' ? 'bg-green-100 text-green-700' : 
                                                    license.status === 'expired' ? 'bg-red-100 text-red-700' : 
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {license.status === 'activated' ? 'Activé' : license.status === 'expired' ? 'Expiré' : 'En attente'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString('fr-FR') : (license.duration === 'unlimited' ? 'Jamais' : '-')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <button onClick={() => handleDeleteLicense(license.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const DataManagementSettings: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const context = useAppContext();
    const { addToast } = useToast();
    const { restoreAllData } = context;

    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState<{ expected: number; total: number; chunks: string[] }>({ expected: 1, total: 0, chunks: [] });
    
    const [qrChunks, setQrChunks] = useState<string[]>([]);
    const [currentQrIndex, setCurrentQrIndex] = useState(0);

    const getFullState = () => {
        return {
            appSettings: context.appSettings, ieppData: context.ieppData, schools: context.schools, foodItems: context.foodItems, directors: context.directors, gerants: context.gerants, cantinieres: context.cantinieres, cogesMembers: context.cogesMembers,
            classEnrollments: context.classEnrollments, cesacMembers: context.cesacMembers, infrastructures: context.infrastructures, schoolFoodSupplies: context.schoolFoodSupplies, depenses: context.depenses, activites: context.activites,
            calendarEvents: context.calendarEvents, preparationWeekdays: context.preparationWeekdays, schoolPreparationDays: context.schoolPreparationDays, preparationValidationStatus: context.preparationValidationStatus,
            verificationData: context.verificationData, cepeResults: context.cepeResults, historicalEnrollments: context.historicalEnrollments, attendanceData: context.attendanceData,
            suivisMedicaux: context.suivisMedicaux, formationsHygiene: context.formationsHygiene, inspectionsLocaux: context.inspectionsLocaux, incidentsSante: context.incidentsSante,
            fournisseurs: context.fournisseurs, commandes: context.commandes, evaluationsFournisseurs: context.evaluationsFournisseurs, donateurs: context.donateurs, dons: context.dons, letterTemplates: context.letterTemplates,
            firstPreparationDateDons: context.firstPreparationDateDons, foodItemsDons: context.foodItemsDons, schoolFoodSuppliesDons: context.schoolFoodSuppliesDons, schoolPreparationDaysDons: context.schoolPreparationDaysDons, verificationDataDons: context.verificationDataDons,
            menus: context.menus, weeklyPlannings: context.weeklyPlannings, planActionData: context.planActionData, rapportMensuelData: context.rapportMensuelData, history: context.history, 
            messageTemplates: context.messageTemplates, 
            messageHistory: context.messageHistory, 
            globalSchoolId: context.globalSchoolId, 
            globalMonth: context.globalMonth,
        };
    };

    const handleSaveToFile = () => {
        try {
            const fullState = getFullState();
            const jsonString = JSON.stringify(fullState, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `cantine_data_backup_${date}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Sauvegarde des données réussie.', 'success');
        } catch (error) { console.error(error); addToast('Erreur lors de la sauvegarde des données.', 'error'); }
    };

    const handleRestoreFromFile = () => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (window.confirm("Êtes-vous sûr de vouloir remplacer toutes les données actuelles par celles du fichier ? Cette action est irréversible.")) {
                        if (restoreAllData(data)) {
                            addToast('Données restaurées avec succès. Rechargement de l\'application...', 'success');
                            setTimeout(() => window.location.reload(), 1500);
                        } else { addToast('Fichier de sauvegarde invalide.', 'error'); }
                    }
                } catch (error) { console.error(error); addToast('Erreur lors de la lecture du fichier.', 'error'); }
            };
            reader.readAsText(file);
        };
        input.click();
    };
    
    const handleGenerateQR = async () => {
        try {
            const jsonString = JSON.stringify(getFullState());
            const CHUNK_SIZE = 2000; const totalParts = Math.ceil(jsonString.length / CHUNK_SIZE);
            const generatedChunks = [];
            for (let i = 0; i < totalParts; i++) {
                const chunkData = jsonString.substr(i * CHUNK_SIZE, CHUNK_SIZE);
                const chunkObject: QRCodeChunk = { p: i + 1, t: totalParts, d: chunkData };
                const dataUrl = await QRCode.toDataURL(JSON.stringify(chunkObject), { errorCorrectionLevel: 'L' });
                generatedChunks.push(dataUrl);
            }
            setQrChunks(generatedChunks); setCurrentQrIndex(0);
        } catch (error) { console.error(error); addToast('Erreur lors de la génération des QR Codes.', 'error'); }
    };
    
    const startScanning = () => { setScanProgress({ expected: 1, total: 0, chunks: [] }); setIsScanning(true); };

    const handleScanSuccess = (data: string) => {
        try {
            const parsedData: QRCodeChunk = JSON.parse(data);
            if (typeof parsedData.p !== 'number' || typeof parsedData.t !== 'number' || typeof parsedData.d !== 'string') { addToast("Format de QR Code invalide.", 'error'); return; }
            if (scanProgress.total > 0 && parsedData.t !== scanProgress.total) { addToast("Ce QR Code ne semble pas appartenir à la séquence actuelle.", 'error'); return; }
            if (parsedData.p !== scanProgress.expected) { addToast(`Mauvais ordre. Veuillez scanner le QR Code n°${scanProgress.expected}.`, 'warning'); return; }
            addToast(`QR Code ${parsedData.p}/${parsedData.t} scanné avec succès !`, 'success');
            const newChunks = [...scanProgress.chunks, parsedData.d];
            if (parsedData.p === parsedData.t) {
                const fullJson = newChunks.join(''); setIsScanning(false);
                if (window.confirm("Tous les QR Codes ont été scannés. Voulez-vous restaurer les données ?")) {
                     if (restoreAllData(JSON.parse(fullJson))) {
                        addToast('Données synchronisées avec succès. Rechargement...', 'success');
                         setTimeout(() => window.location.reload(), 1500);
                    } else { addToast('Données du QR Code invalides ou corrompues.', 'error'); }
                }
            } else { setScanProgress({ expected: parsedData.p + 1, total: parsedData.t, chunks: newChunks }); }
        } catch (error) { addToast('Erreur : Le QR Code ne contient pas de données valides.', 'error'); }
    };

    return (
        <>
            {isScanning && <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScanning(false)} progress={scanProgress} />}
            {qrChunks.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-[var(--color-bg-card)] rounded-lg p-6 text-center relative max-w-md w-full">
                        <button onClick={() => setQrChunks([])} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600"><CloseIcon className="h-6 w-6" /></button>
                        <h4 className="text-lg font-bold text-[var(--color-text-heading)] mb-2">QR Code de Synchronisation</h4>
                        <p className="font-bold text-xl text-[var(--color-primary)] mb-4">{currentQrIndex + 1} / {qrChunks.length}</p>
                        <img src={qrChunks[currentQrIndex]} alt={`QR Code partie ${currentQrIndex+1}`} className="mx-auto border-4 border-white shadow-lg" />
                        <div className="flex justify-between mt-4">
                             <Button onClick={() => setCurrentQrIndex(i => i - 1)} disabled={currentQrIndex === 0} variant="secondary" icon={<ChevronLeftIcon className="h-5 w-5"/>}>Précédent</Button>
                             <Button onClick={() => setCurrentQrIndex(i => i + 1)} disabled={currentQrIndex === qrChunks.length - 1} variant="secondary" icon={<ChevronRightIcon className="h-5 w-5"/>}>Suivant</Button>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)] mt-4">Scannez tous les codes dans l'ordre pour transférer les données.</p>
                    </div>
                </div>
            )}
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Synchronisation et Sauvegarde des Données</h3>
                <div className="p-4 rounded-md bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0"><AlertTriangleIcon className="h-5 w-5 text-yellow-500" /></div>
                        <div className="ml-3"><p className="text-sm"><b>Attention :</b> La restauration remplacera toutes les données existantes. Cette action est irréversible.</p></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-lg text-[var(--color-text-base)] mb-3">Sauvegarde par Fichier</h4>
                        <div className="space-y-3">
                            <Button onClick={handleSaveToFile} variant="secondary" className="w-full" icon={<SaveIcon className="h-5 w-5"/>}>Sauvegarder les données</Button>
                            <Button onClick={handleRestoreFromFile} variant="secondary" className="w-full" icon={<ImportIcon className="h-5 w-5"/>} disabled={isReadOnly}>Restaurer à partir d'un fichier</Button>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg text-[var(--color-text-base)] mb-3">Synchronisation par QR Code</h4>
                        <div className="space-y-3">
                            <Button onClick={handleGenerateQR} variant="primary" className="w-full" icon={<QrCodeIcon className="h-5 w-5"/>}>Générer les QR Codes</Button>
                            <Button onClick={startScanning} variant="primary" className="w-full" icon={<CameraIcon className="h-5 w-5"/>} disabled={isReadOnly}>Scanner les QR Codes</Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const DangerZone: React.FC<{
    handleResetClick: () => void;
    isReadOnly?: boolean;
}> = ({ handleResetClick, isReadOnly }) => (
    <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg">
        <h3 className="text-xl font-bold mb-2">Zone de Danger</h3>
        <p className="text-sm mb-4">
            L'action ci-dessous est irréversible. Elle effacera toutes les données de l'application (y compris les exemples) et la remettra à son état initial. Si un mot de passe est configuré, il vous sera demandé.
        </p>
        <Button
            variant="danger"
            onClick={handleResetClick}
            icon={<TrashIcon className="h-5 w-5" />}
            disabled={isReadOnly}
        >
            Réinitialiser Complètement l'Application
        </Button>
    </div>
);

interface ParametresPageProps {
    activeSubMenu: SubMenuId | null;
    currentUserLevel: number | null;
    isReadOnly?: boolean;
    onSaveSuccess: () => void;
}

const ParametresPage: React.FC<ParametresPageProps> = ({ activeSubMenu, currentUserLevel, isReadOnly = false, onSaveSuccess }) => {
    const { appSettings, setAppSettings, logAction, resetAllData } = useAppContext();
    const { addToast } = useToast();
    const [localAppSettings, setLocalAppSettings] = useState<AppSettings>(appSettings);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [level2Password, setLevel2Password] = useState(appSettings.level2Password || '');
    const [level3Password, setLevel3Password] = useState(appSettings.level3Password || '');
    const [level4Password, setLevel4Password] = useState(appSettings.level4Password || '');
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    useEffect(() => { setLocalAppSettings(appSettings); }, [appSettings]);

    const handleSettingsChange = (field: keyof AppSettings, value: unknown) => {
        setLocalAppSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleModuleChange = (moduleId: string, checked: boolean) => {
        setAppSettings(prev => ({
            ...prev, optionalModules: { ...prev.optionalModules, [moduleId]: checked }
        }));
        const moduleLabel = optionalModuleConfig.find(m => m.id === moduleId)?.label;
        if (moduleLabel) addToast(`Module '${moduleLabel}' ${checked ? 'activé' : 'désactivé'}.`, 'success');
    };

    const handleAlertChange = (alertId: string, checked: boolean) => {
        setLocalAppSettings(prev => ({ ...prev, dashboardAlerts: { ...prev.dashboardAlerts, [alertId]: checked } }));
    };

    const handleSave = () => {
        const settingsToSave = { ...localAppSettings };
        if (currentUserLevel === 1 || currentUserLevel === 0) {
            if (newPassword) {
                if (newPassword !== confirmPassword) { addToast('Les nouveaux mots de passe ne correspondent pas.', 'error'); return; }
                if (appSettings.password && currentPassword !== appSettings.password) { addToast('Le mot de passe actuel est incorrect.', 'error'); return; }
                settingsToSave.password = newPassword;
                settingsToSave.mustChangePassword = false;
            }
            settingsToSave.level2Password = level2Password;
            settingsToSave.level3Password = level3Password;
            settingsToSave.level4Password = level4Password;
        }
        setAppSettings(settingsToSave);
        logAction("Paramètres mis à jour.", currentUserLevel);
        addToast('Paramètres sauvegardés avec succès.', 'success');
        onSaveSuccess();
    };

    const handleResetApp = () => {
        if (resetAllData()) {
            addToast('Application réinitialisée avec succès. Rechargement...', 'success');
            logAction("Réinitialisation totale de l'application.", 1);
            setTimeout(() => window.location.reload(), 1500);
        } else {
            addToast("Une erreur est survenue lors de la réinitialisation.", 'error');
        }
    };

    const handleResetClick = () => {
        if (isReadOnly) return;
        if (appSettings.password) setIsResetConfirmOpen(true);
        else if (window.confirm("Aucun mot de passe principal n'est défini. Êtes-vous sûr de vouloir vider l'historique ? Cette action est irréversible.")) handleResetApp();
    };

    const renderContent = () => {
        switch (activeSubMenu) {
            case SubMenuId.ParametresGeneraux:
                return <GeneralSettings localAppSettings={localAppSettings} handleSettingsChange={handleSettingsChange} isReadOnly={isReadOnly} />;
            case SubMenuId.ParametresAssistant:
                return <AISettings appSettings={appSettings} setAppSettings={setAppSettings} isReadOnly={isReadOnly} logAction={logAction} currentUserLevel={currentUserLevel} />;
            case SubMenuId.ParametresApparence:
                return <ThemeSettings localAppSettings={localAppSettings} handleSettingsChange={handleSettingsChange} isReadOnly={isReadOnly} />;
            case SubMenuId.ParametresModules:
                return <ModulesAlertsSettings appSettings={appSettings} handleModuleChange={handleModuleChange} localAppSettings={localAppSettings} handleAlertChange={handleAlertChange} isReadOnly={isReadOnly} />;
            case SubMenuId.ParametresSecurite:
                return (currentUserLevel === 1 || currentUserLevel === 0) ? <SecuritySettings isReadOnly={isReadOnly} localAppSettings={localAppSettings} handleSettingsChange={handleSettingsChange} currentPassword={currentPassword} setCurrentPassword={setCurrentPassword} newPassword={newPassword} setNewPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} level2Password={level2Password} setLevel2Password={setLevel2Password} level3Password={level3Password} setLevel3Password={setLevel3Password} level4Password={level4Password} setLevel4Password={setLevel4Password} /> : null;
            case SubMenuId.ParametresLicence:
                return <LicenseSettings isReadOnly={isReadOnly} appSettings={appSettings} setAppSettings={setAppSettings} logAction={logAction} currentUserLevel={currentUserLevel} />;
            case SubMenuId.ParametresDonnees:
                return <DataManagementSettings isReadOnly={isReadOnly} />;
            case SubMenuId.ParametresDanger:
                return (currentUserLevel === 1 || currentUserLevel === 0) ? <DangerZone handleResetClick={handleResetClick} isReadOnly={isReadOnly} /> : null;
            default:
                return <GeneralSettings localAppSettings={localAppSettings} handleSettingsChange={handleSettingsChange} isReadOnly={isReadOnly} />;
        }
    };
    
    const showSaveButton = ![SubMenuId.ParametresDonnees, SubMenuId.ParametresDanger, SubMenuId.ParametresLicence, SubMenuId.ParametresAssistant].includes(activeSubMenu || SubMenuId.ParametresGeneraux);

    return (
        <div className="space-y-6 max-w-5xl mx-auto enter-nav-container">
            <PasswordConfirmModal isOpen={isResetConfirmOpen} onClose={() => setIsResetConfirmOpen(false)} onConfirm={handleResetApp} title="Réinitialisation Totale de l'Application" description="Cette action est définitive et effacera TOUTES les données. Pour confirmer, veuillez entrer le mot de passe Principal (Niveau 1)." />
            
            {renderContent()}

            {showSaveButton && (
                <div className="flex justify-end pt-6 border-t border-[var(--color-border-base)]">
                    <Button onClick={handleSave} variant="primary" icon={<SaveIcon className="h-5 w-5" />} disabled={isReadOnly}>
                        Sauvegarder Tous les Paramètres
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ParametresPage;
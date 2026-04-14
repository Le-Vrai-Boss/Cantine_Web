import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import type { Depense, Activite, CalendarEvent, EventType } from '../types';
import { Button } from '../components/Button';
import { SparklesIcon, AlertTriangleIcon } from '../components/Icons';
import { useToast } from '../context/ToastContext';

// --- Function Declarations for Gemini ---
const addDepenseDeclaration: FunctionDeclaration = {
    name: 'addDepense',
    description: "Enregistre une nouvelle dépense financière. Utilise la date d'aujourd'hui si non spécifiée.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            date: { type: Type.STRING, description: 'La date de la dépense au format AAAA-MM-JJ.' },
            designation: { type: Type.STRING, description: 'La description ou le motif de la dépense.' },
            montant: { type: Type.NUMBER, description: 'Le montant de la dépense en chiffres.' },
        },
        required: ['designation', 'montant'],
    },
};

const addActiviteDeclaration: FunctionDeclaration = {
    name: 'addActivite',
    description: "Enregistre une nouvelle activité dans le journal des activités. Utilise la date d'aujourd'hui si non spécifiée.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            date: { type: Type.STRING, description: 'La date de l\'activité au format AAAA-MM-JJ.' },
            designation: { type: Type.STRING, description: 'La description de l\'activité.' },
        },
        required: ['designation'],
    },
};

const createCalendarEventDeclaration: FunctionDeclaration = {
    name: 'createCalendarEvent',
    description: "Crée un nouvel événement dans le calendrier, comme un jour férié, des vacances ou une activité. Peut s'appliquer à un seul jour ou à une plage de dates.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Le nom ou le titre de l'événement." },
            startDate: { type: Type.STRING, description: "La date de début de l'événement au format AAAA-MM-JJ." },
            endDate: { type: Type.STRING, description: "Optionnel. La date de fin de l'événement au format AAAA-MM-JJ. Si l'événement ne dure qu'un jour, cette date est la même que la date de début." },
            type: { type: Type.STRING, description: "Le type d'événement. Doit être l'un des suivants : 'holiday' (Férié), 'vacation' (Congé), 'activity' (Activité), 'special' (Spécial)." },
        },
        required: ['title', 'startDate', 'type'],
    },
};

const addSchoolDeclaration: FunctionDeclaration = {
  name: 'addSchool',
  description: "Ajoute une nouvelle école à la liste des écoles de l'IEPP.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Le nom complet de la nouvelle école." },
      rationnaireGirls: { type: Type.NUMBER, description: "Le nombre de filles rationnaires." },
      rationnaireBoys: { type: Type.NUMBER, description: "Le nombre de garçons rationnaires." },
      studentsGirls: { type: Type.NUMBER, description: "Optionnel. Le nombre total de filles dans l'école." },
      studentsBoys: { type: Type.NUMBER, description: "Optionnel. Le nombre total de garçons dans l'école." },
    },
    required: ['name', 'rationnaireGirls', 'rationnaireBoys'],
  },
};

const tools = [{
    functionDeclarations: [
        addDepenseDeclaration,
        addActiviteDeclaration,
        createCalendarEventDeclaration,
        addSchoolDeclaration
        // On peut ajouter d'autres déclarations de fonctions ici
    ]
}];

const AIResponse: React.FC<{ text: string }> = ({ text }) => {
    // Simple markdown-to-HTML
    const formatText = (inputText: string) => {
        return inputText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>'); // List items
    };

    return (
        <div className="bg-slate-50 p-4 rounded-lg mt-4 text-slate-800 text-sm border">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatText(text) }} />
        </div>
    );
};

const AssistantPage: React.FC = () => {
    const context = useAppContext();
    const { addToast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Génération en cours...');
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const quickActions = [
        "Ajoute une dépense de 5000 FCFA pour l'achat de sel le 15 octobre.",
        "Crée un événement 'Réunion COGES' pour le 22 novembre.",
        "Marque la semaine du 23 au 27 décembre comme 'Congés de Noël'.",
        "Ajoute une nouvelle école 'EPP Le Triomphe' avec 75 filles et 80 garçons rationnaires.",
    ];
    
    const performAction = useCallback((name: string, args: Record<string, unknown>): { result: boolean; confirmation: string } => {
        switch (name) {
            case 'addDepense': {
                const newDepense: Depense = {
                    id: `${Date.now()}`,
                    date: (args.date as string) || new Date().toISOString().split('T')[0],
                    designation: args.designation as string,
                    montant: args.montant as number,
                };
                context.setDepenses(prev => [...prev, newDepense]);
                return { result: true, confirmation: `La dépense pour '${args.designation}' de ${args.montant} a bien été enregistrée.` };
            }
            case 'addActivite': {
                const newActivite: Activite = {
                    id: `${Date.now()}`,
                    date: (args.date as string) || new Date().toISOString().split('T')[0],
                    designation: args.designation as string,
                };
                context.setActivites(prev => [...prev, newActivite]);
                return { result: true, confirmation: `L'activité '${args.designation}' a été ajoutée au journal.` };
            }
            case 'createCalendarEvent': {
                const { title, startDate, endDate, type } = args as { title: string; startDate: string; endDate?: string; type: string };
                const start = new Date(`${startDate}T00:00:00`);
                const end = endDate ? new Date(`${endDate}T00:00:00`) : new Date(start);
                
                const newEvents: CalendarEvent[] = [];
                const affectedDates = new Set<string>();

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    affectedDates.add(dateStr);
                    newEvents.push({ id: `${Date.now()}-${dateStr}`, date: dateStr, title, type: type as EventType });
                }

                context.setCalendarEvents(prev => [...prev.filter(e => !affectedDates.has(e.date)), ...newEvents]);
                const dateConfirmation = endDate && startDate !== endDate ? `du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}` : `le ${start.toLocaleDateString('fr-FR')}`;
                return { result: true, confirmation: `L'événement '${title}' a bien été créé ${dateConfirmation}.` };
            }
            case 'addSchool': {
                const { name, rationnaireGirls, rationnaireBoys, studentsGirls, studentsBoys } = args as { name: string; rationnaireGirls: number; rationnaireBoys: number; studentsGirls?: number; studentsBoys?: number };
                 const newSchool = {
                    id: `${Date.now()}`, name, code: '', openingYear: new Date().getFullYear(), canteenOpeningYear: new Date().getFullYear(),
                    studentsGirls: studentsGirls || rationnaireGirls, studentsBoys: studentsBoys || rationnaireBoys,
                    rationnaireGirls, rationnaireBoys,
                };
                context.setSchools(prev => [...prev, newSchool]);
                return { result: true, confirmation: `L'école '${name}' a été ajoutée avec succès.` };
            }
            default:
                return { result: false, confirmation: `Désolé, l'action '${name}' n'est pas reconnue.` };
        }
    }, [context]);

    const handleGenerate = useCallback(async (currentPrompt: string) => {
        if (!currentPrompt || isLoading) return;

        if (!context.appSettings.apiKey) {
            const errorMessage = "La clé API Google Gemini n'est pas configurée. Veuillez l'ajouter dans les Paramètres.";
            setError(errorMessage);
            addToast(errorMessage, 'error');
            return;
        }
        
        setIsLoading(true);
        setResult('');
        setError('');
        setLoadingMessage("L'assistant réfléchit...");
        
        try {
            const ai = new GoogleGenAI({apiKey: context.appSettings.apiKey});

            const dataContext = JSON.stringify({
                schools: context.schools.map(s => s.name),
                foodItems: context.foodItems.map(f => f.name),
                donateurs: context.donateurs.map(d => d.name),
                fournisseurs: context.fournisseurs.map(f => f.nom),
            }, null, 2);

            const systemInstruction = `Tu es CantineAI, un assistant personnel expert en gestion de cantines scolaires. Ton rôle est d'aider l'utilisateur à effectuer des actions dans l'application ou à analyser des données. 
            - Si l'utilisateur demande une action (ajouter, créer, marquer, etc.), utilise la fonction appropriée.
            - Si l'utilisateur pose une question d'analyse, réponds en te basant sur les données fournies. Sois concis et clair.
            - Confirme toujours l'action effectuée en langage naturel.
            - Réponds toujours en français.
            - La date d'aujourd'hui est ${new Date().toLocaleDateString('fr-FR')}.`;

            const firstResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `${systemInstruction}\n\nDONNÉES DE CONTEXTE: \n\`\`\`json\n${dataContext}\n\`\`\`\n\nREQUETE UTILISATEUR: ${currentPrompt}`,
                tools
            });
            
            const functionCalls = firstResponse.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                setLoadingMessage("Action en cours...");
                
                const call = functionCalls[0];
                const { confirmation } = performAction(call.name, call.args);

                const functionResponse = {
                    id : call.id,
                    name: call.name,
                    response: { result: confirmation },
                };
                
                const secondResponse = await ai.models.generateContent({
                   model: 'gemini-2.5-flash',
                   contents: [
                       { role: 'user', parts: [{ text: currentPrompt }] },
                       { role: 'model', parts: [{ functionCall: call }] },
                       { role: 'function', parts: [{ functionResponse }] }
                   ],
                   tools
                });
                setResult(secondResponse.text);

            } else {
                setLoadingMessage("Analyse des données...");
                const analysisResponse = await ai.models.generateContent({
                     model: 'gemini-2.5-flash',
                     contents: `En tant qu'expert des cantines, analyse ces données: ${JSON.stringify(context, null, 2)} et réponds à cette question: ${currentPrompt}`
                });
                setResult(analysisResponse.text);
            }

        } catch (e: unknown) {
            console.error("Erreur lors de l'interaction avec l'IA:", e);
            const errorMessage = e instanceof Error ? e.message : "Une erreur inattendue est survenue.";
            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [context, isLoading, addToast, performAction]);
    
    const handleQuickAction = (question: string) => {
        setPrompt(question);
        handleGenerate(question);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] max-w-4xl mx-auto">
            <div className="text-center border-b border-[var(--color-border-base)] pb-4 mb-6">
                <SparklesIcon className="h-12 w-12 text-[var(--color-primary)] mx-auto" />
                <h3 className="text-2xl font-bold text-[var(--color-text-heading)] mt-2">Assistant Personnel IA</h3>
                <p className="text-[var(--color-text-muted)] mt-1">Effectuez des actions et obtenez des analyses en langage naturel.</p>
            </div>

            <div className="mb-6">
                <h4 className="text-md font-semibold text-[var(--color-text-base)] mb-3">Suggestions d'actions</h4>
                <div className="flex flex-wrap gap-2">
                    {quickActions.map((q, i) => (
                        <button 
                            key={i}
                            onClick={() => handleQuickAction(q)}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] hover:bg-opacity-80 disabled:opacity-50"
                        >
                           {q}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                 <div>
                    <label htmlFor="ai-prompt" className="block text-sm font-medium text-[var(--color-text-muted)]">Votre commande</label>
                    <textarea
                        id="ai-prompt"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm disabled:bg-[var(--color-bg-muted)]"
                        placeholder="Ex: 'Marque le 1er janvier comme férié' ou 'Quelles sont les écoles avec le plus de rationnaires ?'"
                    />
                </div>
                <div>
                     <Button
                        onClick={() => handleGenerate(prompt)}
                        disabled={isLoading || !prompt}
                        variant="primary"
                        className="w-full"
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                           <SparklesIcon className="h-5 w-5 -ml-1 mr-2" />
                        )}
                        {isLoading ? loadingMessage : "Exécuter"}
                    </Button>
                </div>
            </div>
            
            {(result || error) && (
                 <div className="mt-8 pt-6 border-t border-[var(--color-border-base)]">
                    <h4 className="text-lg font-semibold text-[var(--color-text-heading)] mb-2">Réponse de l'Assistant</h4>
                    {error && (
                         <div className="flex items-start p-4 rounded-md bg-red-50 border-l-4 border-red-400">
                            <div className="flex-shrink-0 mt-0.5">
                                <AlertTriangleIcon className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="ml-3">
                                <h4 className="text-md font-semibold text-slate-800">Erreur de l'Assistant IA</h4>
                                <p className="text-sm text-slate-600 mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                    {result && <AIResponse text={result} />}
                </div>
            )}
        </div>
    );
};

export default AssistantPage;
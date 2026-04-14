import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { ExportIcon } from '../components/Icons';
import * as XLSX from 'xlsx';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

const metrics = [
    { id: 'total_rationnaires', label: 'Total des Rationnaires', unit: '' },
    { id: 'taux_reussite_cepe', label: 'Taux de Réussite CEPE (dernière année)', unit: '%' },
    { id: 'cfc_a_verser', label: 'CFC Planifié (mois sélectionné)', unit: 'FCFA' },
    { id: 'consommation_totale', label: 'Consommation de Vivres (mois sélectionné)', unit: 'kg' },
    { id: 'taux_de_presence', label: 'Taux de Présence Moyen (mois sélectionné)', unit: '%' },
];

const getThemeColor = (varName: string) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

const BilanEcolePage: React.FC = () => {
    const {
        appSettings,
        schools,
        foodItems,
        verificationData,
        schoolPreparationDays,
        cepeResults,
        attendanceData,
        globalMonth,
    } = useAppContext();

    const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<string>(metrics[0].id);
    const [chartColors, setChartColors] = useState({ primary: '#3b82f6' });

    useEffect(() => {
        setChartColors({
            primary: getThemeColor('--color-primary'),
        });
    }, [appSettings.theme]);

    useEffect(() => {
        if (schools.length > 0) {
            setSelectedSchoolIds(schools.map(s => s.id));
        }
    }, [schools]);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        Object.values(verificationData).forEach(schoolData => Object.keys(schoolData).forEach(month => months.add(month)));
        Object.values(schoolPreparationDays).forEach(schoolData => Object.keys(schoolData).forEach(month => months.add(month)));
        return Array.from(months).sort().reverse();
    }, [verificationData, schoolPreparationDays]);
    
    const [selectedMonth, setSelectedMonth] = useState(globalMonth);

    useEffect(() => {
        setSelectedMonth(globalMonth);
    }, [globalMonth]);

    const handleSchoolSelection = (schoolId: string) => {
        setSelectedSchoolIds(prev =>
            prev.includes(schoolId)
                ? prev.filter(id => id !== schoolId)
                : [...prev, schoolId]
        );
    };

    const toggleAllSchools = () => {
        if (selectedSchoolIds.length === schools.length) {
            setSelectedSchoolIds([]);
        } else {
            setSelectedSchoolIds(schools.map(s => s.id));
        }
    };

    const calculationData = useMemo(() => {
        const getMetricForSchool = (metricId: string, school: (typeof schools)[0]) => {
            switch (metricId) {
                case 'total_rationnaires':
                    return school.rationnaireGirls + school.rationnaireBoys;

                case 'taux_reussite_cepe': {
                    const latestYear = cepeResults.reduce((latest, r) => (r.schoolYear > latest ? r.schoolYear : latest), '');
                    if (!latestYear) return 0;
                    const result = cepeResults.find(r => r.schoolId === school.id && r.schoolYear === latestYear);
                    return result && result.candidates > 0 ? (result.admitted / result.candidates) * 100 : 0;
                }

                case 'cfc_a_verser': {
                    if (!selectedMonth) return 0;
                    const prepDaysThisMonth = schoolPreparationDays[school.id]?.[selectedMonth] || {};
                    const maxPrepDaysThisMonth = Object.values(prepDaysThisMonth).length > 0 ? Math.max(0, ...Object.values(prepDaysThisMonth).map(Number)) : 0;
                    const mealPrice = appSettings.defaultMealPrice;
                    const inspectionPart = appSettings.inspectionPercentage / 100;
                    const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
                    return rationnaires * mealPrice * maxPrepDaysThisMonth * inspectionPart;
                }
                
                case 'consommation_totale': {
                    if (!selectedMonth) return 0;
                    let totalConsumption = 0;
                    const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
                    foodItems.forEach(food => {
                        const realisedDays = verificationData[school.id]?.[selectedMonth]?.prepDays[food.id] || 0;
                        totalConsumption += rationnaires * realisedDays * food.rationPerChild;
                    });
                    return totalConsumption;
                }
                
                 case 'taux_de_presence': {
                    if (!selectedMonth || !attendanceData[school.id]?.[selectedMonth]) return 0;
                    const monthData = attendanceData[school.id][selectedMonth];
                    const dailyRates: number[] = [];
                    const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
                    if (rationnaires === 0) return 0;

                    for (const day in monthData) {
                        dailyRates.push((monthData[day] / rationnaires) * 100);
                    }
                    if (dailyRates.length === 0) return 0;
                    return dailyRates.reduce((sum, rate) => sum + rate, 0) / dailyRates.length;
                }

                default:
                    return 0;
            }
        };

        return selectedSchoolIds
            .map(id => schools.find(s => s.id === id))
            .filter((s): s is (typeof schools)[0] => !!s)
            .map(school => ({
                name: school.name,
                value: getMetricForSchool(selectedMetric, school)
            }));
    }, [selectedSchoolIds, selectedMetric, selectedMonth, schools, cepeResults, schoolPreparationDays, verificationData, foodItems, attendanceData, appSettings]);
    
    const formatMonth = (monthKey: string) => {
        if (!monthKey) return 'Tous les mois';
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const formatted = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };
    
     const handleExport = () => {
        const metricInfo = metrics.find(m => m.id === selectedMetric);
        const dataToExport = calculationData.map(item => ({
            'École': item.name,
            [metricInfo?.label || 'Valeur']: item.value.toFixed(2),
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Analyse Comparative');
        XLSX.writeFile(wb, `analyse_${selectedMetric}_${selectedMonth || 'global'}.xlsx`);
    };

    const metricInfo = metrics.find(m => m.id === selectedMetric);
    const requiresMonth = ['cfc_a_verser', 'consommation_totale', 'taux_de_presence'].includes(selectedMetric);

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--color-border-base)] pb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)]">Outil d'Analyse Comparative</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-baseline gap-2 bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] px-4 py-2 rounded-lg">
                        <span className="text-sm font-medium text-[var(--color-text-muted)]">ÉCOLES CHOISIES:</span>
                        <span className="text-xl font-bold text-[var(--color-primary)]">
                            {selectedSchoolIds.length}
                        </span>
                    </div>
                    <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />} disabled={calculationData.length === 0}>
                        Exporter (Excel)
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <label htmlFor="metric-select" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Indicateur à comparer</label>
                        <select id="metric-select" value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)} className="w-full p-2 border rounded-md bg-[var(--color-bg-card)] border-[var(--color-border-input)]">
                            {metrics.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                    </div>
                     {requiresMonth && (
                        <div>
                            <label htmlFor="month-select" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Mois</label>
                            <select id="month-select" value={selectedMonth || ''} onChange={e => setSelectedMonth(e.target.value)} className="w-full p-2 border rounded-md bg-[var(--color-bg-card)] border-[var(--color-border-input)]">
                                <option value="">-- Sélectionnez un mois --</option>
                                {availableMonths.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-[var(--color-text-muted)]">Écoles à inclure</label>
                            <button onClick={toggleAllSchools} className="text-xs text-[var(--color-primary)] hover:underline">
                                {selectedSchoolIds.length === schools.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                            </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto border border-[var(--color-border-base)] rounded-md p-2 space-y-1">
                            {schools.map(school => (
                                <label key={school.id} className="flex items-center space-x-2 p-1.5 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedSchoolIds.includes(school.id)}
                                        onChange={() => handleSchoolSelection(school.id)}
                                        className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-[var(--color-border-input)]"
                                    />
                                    <span className="text-sm text-[var(--color-text-base)]">{school.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3 min-h-[400px]">
                     {(requiresMonth && !selectedMonth) ? (
                         <div className="h-full flex items-center justify-center bg-[var(--color-bg-muted)] rounded-lg">
                            <p className="text-[var(--color-text-muted)] text-center">Veuillez sélectionner un mois pour afficher les données.</p>
                        </div>
                     ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={calculationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" unit={metricInfo?.unit || ''} />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: number) => [value.toFixed(2) + (metricInfo?.unit || ''), metricInfo?.label]}
                                    cursor={{ fill: 'rgba(var(--color-primary-hue), var(--color-primary-saturation), var(--color-primary-lightness), 0.1)' }}
                                />
                                <Bar dataKey="value" name={metricInfo?.label} fill={chartColors.primary} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                     )}
                </div>
            </div>

            <div>
                 <h4 className="text-lg font-semibold text-[var(--color-text-base)] mb-2">Tableau des Données</h4>
                 <div className="overflow-x-auto border border-[var(--color-border-base)] rounded-lg">
                    <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                        <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                            <tr>
                                <th className="px-6 py-3">École</th>
                                <th className="px-6 py-3 text-right">{metricInfo?.label}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculationData.map(item => (
                                <tr key={item.name} className="border-b border-[var(--color-border-base)] last:border-0 even:bg-[var(--color-bg-muted)]">
                                    <td className="px-6 py-4 font-medium text-[var(--color-text-base)]">{item.name}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{item.value.toLocaleString('fr-FR', {maximumFractionDigits: 2})} {metricInfo?.unit}</td>
                                </tr>
                            ))}
                            {calculationData.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="text-center py-8 text-[var(--color-text-muted)]">Aucune donnée à afficher pour la sélection actuelle.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BilanEcolePage;
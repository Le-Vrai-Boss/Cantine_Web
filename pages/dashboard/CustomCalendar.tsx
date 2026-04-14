import React, { useState, useMemo, useCallback } from 'react';
import { MainMenuId, SubMenuId } from '../../constants';
import type { CalendarEvent, EventType } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../../components/Button';
import EventModal from './EventModal';

const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const daysOfWeekFull = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const eventTypes: { id: EventType; label: string; color: string; dotColor: string; borderColor: string; }[] = [
    { id: 'holiday', label: 'Férié', color: 'bg-green-500', dotColor: 'bg-green-500', borderColor: 'border-green-500' },
    { id: 'vacation', label: 'Congé', color: 'bg-orange-500', dotColor: 'bg-orange-500', borderColor: 'border-orange-500' },
    { id: 'activity', label: 'Activité', color: 'bg-purple-500', dotColor: 'bg-purple-500', borderColor: 'border-purple-500' },
    { id: 'special', label: 'Spécial', color: 'bg-yellow-500', dotColor: 'bg-yellow-500', borderColor: 'border-yellow-500' },
    { id: 'preparation', label: 'Préparation', color: 'bg-blue-500', dotColor: 'bg-blue-500', borderColor: 'border-blue-500' },
];
const eventColorMap = new Map(eventTypes.map(e => [e.id, {color: e.color, dotColor: e.dotColor, borderColor: e.borderColor}]));


interface CustomCalendarProps {
    readOnly?: boolean;
    returnTo: { mainMenu: MainMenuId; subMenu: SubMenuId | null } | null;
    onReturn: () => void;
}
const CustomCalendar: React.FC<CustomCalendarProps> = ({ readOnly = false, returnTo, onReturn }) => {
    const { calendarEvents, setCalendarEvents, preparationWeekdays, setPreparationWeekdays } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // New states for range selection and tooltips
    const [selectionStart, setSelectionStart] = useState<Date | null>(null);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [selectionRange, setSelectionRange] = useState<{ start: Date; end: Date } | null>(null);
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const calendarGrid = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid: (number | null)[] = [];
        const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth -1; // Adjust to start week on Monday
        for (let i = 0; i < startDay; i++) grid.push(null);
        for (let day = 1; day <= daysInMonth; day++) grid.push(day);
        return grid;
    }, [year, month]);

    const changeMonth = (offset: number) => {
        setSelectionStart(null);
        setHoverDate(null);
        setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + offset, 1));
    };

    const totalPreparationDays = useMemo(() => {
        let count = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const holidays = new Set(
            calendarEvents
                .filter(e => e.date.startsWith(`${year}-${(month + 1).toString().padStart(2, '0')}`) && (e.type === 'holiday' || e.type === 'vacation'))
                .map(e => e.date)
        );

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            const dateStr = date.toISOString().split('T')[0];

            if (preparationWeekdays.includes(dayOfWeek) && !holidays.has(dateStr)) {
                count++;
            }
        }
        return count;
    }, [year, month, preparationWeekdays, calendarEvents]);

    const handleDayMouseEnter = useCallback((day: number | null, e: React.MouseEvent) => {
        if (!day) {
            setTooltip(null);
            return;
        }
        const date = new Date(year, month, day);
        if (selectionStart) {
            setHoverDate(date);
        }
        const dateStr = date.toISOString().split('T')[0];
        const event = calendarEvents.find(ev => ev.date === dateStr);
        if (event) {
            setTooltip({
                content: event.title,
                x: e.clientX,
                y: e.clientY
            });
        } else {
            setTooltip(null);
        }
    }, [year, month, selectionStart, calendarEvents]);

    const handleGridMouseLeave = useCallback(() => {
        setHoverDate(null);
        setTooltip(null);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectionRange(null);
        setSelectedEvent(null);
    }, []);

    const handleDayClick = useCallback((day: number | null) => {
        if (!day || readOnly) return;
        
        const clickedDate = new Date(year, month, day);
        clickedDate.setHours(0, 0, 0, 0);
        const dateStr = clickedDate.toISOString().split('T')[0];
        const existingEvent = calendarEvents.find(e => e.date === dateStr);

        if (existingEvent) {
            setSelectionStart(null);
            setHoverDate(null);
            setSelectionRange(null);
            setSelectedDate(clickedDate);
            setSelectedEvent(existingEvent);
            setIsModalOpen(true);
            return;
        }

        if (!selectionStart) {
            setSelectionStart(clickedDate);
            setHoverDate(clickedDate);
            return;
        }

        const start = selectionStart < clickedDate ? selectionStart : clickedDate;
        const end = selectionStart > clickedDate ? selectionStart : clickedDate;

        setSelectionRange({ start, end });
        setSelectedDate(start);
        setSelectedEvent({ date: start.toISOString().split('T')[0] });
        setIsModalOpen(true);
        setSelectionStart(null);
        setHoverDate(null);
    }, [readOnly, year, month, calendarEvents, selectionStart]);

     const handleSaveEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
        if (readOnly) return;

        // Case 1: Saving a new event for a selected date range
        if (selectionRange) {
            const { start, end } = selectionRange;
            const newEvents: CalendarEvent[] = [];
            const affectedDates = new Set<string>();

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                affectedDates.add(dateStr);
                 const dayOfWeek = d.getDay();
                 // Allow creating holidays/vacations on any day
                 if (preparationWeekdays.includes(dayOfWeek) || ['holiday', 'vacation'].includes(eventData.type)) {
                    newEvents.push({
                        ...eventData,
                        id: `${Date.now()}-${dateStr}`,
                        date: dateStr,
                    });
                }
            }
            
            const remainingEvents = calendarEvents.filter(e => !affectedDates.has(e.date));
            setCalendarEvents([...remainingEvents, ...newEvents]);
        } 
        // Case 2: Editing an existing single event
        else if (selectedEvent?.id) {
            setCalendarEvents(calendarEvents.map(e => e.id === selectedEvent.id ? { ...e, ...eventData } : e));
        } 
        // Case 3: Adding a new single event (from "Add Event" button)
        else if (selectedEvent) { 
             setCalendarEvents([...calendarEvents, { ...selectedEvent, ...eventData, id: `${Date.now()}` }]);
        }
        
        handleModalClose();
    }, [readOnly, selectionRange, calendarEvents, setCalendarEvents, selectedEvent, handleModalClose, preparationWeekdays]);

    const handleDeleteEvent = () => {
        if (readOnly || !selectedEvent?.id) return;
        setCalendarEvents(calendarEvents.filter(e => e.id !== selectedEvent.id));
        handleModalClose();
    };
    
    const handleTogglePreparationDay = (dayIndex: number) => {
        if (readOnly) return;
        setPreparationWeekdays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dayIndex)) {
                newSet.delete(dayIndex);
            } else {
                newSet.add(dayIndex);
            }
            return Array.from(newSet);
        });
    };
    
    const monthlyEvents = useMemo(() => {
        return calendarEvents
            .filter(e => e.date.startsWith(`${year}-${(month + 1).toString().padStart(2, '0')}`))
            .sort((a,b) => new Date(a.date).getDate() - new Date(b.date).getDate());
    }, [calendarEvents, year, month]);

    const currentRange = useMemo(() => {
        if (!selectionStart || !hoverDate) return null;
        const start = selectionStart < hoverDate ? selectionStart : hoverDate;
        const end = selectionStart > hoverDate ? selectionStart : hoverDate;
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        return { start, end };
    }, [selectionStart, hoverDate]);
    
    const handleAddEventForToday = () => {
        if (readOnly) return;
        const today = new Date();
        setSelectedDate(today);
        setSelectedEvent({ date: today.toISOString().split('T')[0] });
        setSelectionRange(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 relative">
             {tooltip && (
                <div 
                    className="absolute z-50 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg shadow-lg pointer-events-none -translate-y-full transform"
                    style={{ top: tooltip.y - 10, left: tooltip.x + 10 }}
                >
                    {tooltip.content}
                </div>
            )}
            {returnTo && (
                <div className="mb-4">
                    <Button onClick={onReturn} variant="secondary" icon={<ChevronLeftIcon className="h-5 w-5" />}>
                        Retour à la page précédente
                    </Button>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]" onMouseLeave={handleGridMouseLeave}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">{months[month]} {year}</h3>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-[var(--color-bg-muted)] transition-colors"><ChevronLeftIcon className="h-5 w-5" /></button>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-[var(--color-bg-muted)] transition-colors"><ChevronRightIcon className="h-5 w-5" /></button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-[var(--color-text-muted)] mb-2">
                        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map(day => <div key={day}>{day}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {calendarGrid.map((day, index) => {
                            if (!day) return <div key={`empty-${index}`} onMouseEnter={(e) => handleDayMouseEnter(null, e)} className="rounded-md border border-transparent"></div>;
                            
                            const date = new Date(year, month, day);
                            date.setHours(0,0,0,0);
                            const dayOfWeek = date.getDay();
                            const isPreparationDay = preparationWeekdays.includes(dayOfWeek);
                            const dateStr = date.toISOString().split('T')[0];
                            const event = calendarEvents.find(e => e.date === dateStr);

                            const isSelectionStartDay = selectionStart && date.getTime() === selectionStart.getTime();
                            const isInRange = currentRange && date >= currentRange.start && date <= currentRange.end;
                            
                            let dayClasses = `h-16 rounded-md flex items-center justify-center transition-colors text-[var(--color-text-base)] relative`;
                            
                            if (!isPreparationDay) {
                                dayClasses += ' bg-slate-100 dark:bg-slate-700 text-[var(--color-text-muted)]';
                            } else {
                                dayClasses += ' bg-transparent cursor-pointer';
                            }
                            
                            if (event) {
                                const borderColorClass = eventColorMap.get(event.type)?.borderColor || 'border-[var(--color-border-base)]';
                                dayClasses += ` border-4 ${borderColorClass}`;
                            } else {
                                dayClasses += ' border border-[var(--color-border-base)]';
                            }
                            
                            if (!readOnly) {
                                if (isSelectionStartDay) {
                                    dayClasses += ' ring-2 ring-blue-500 z-10';
                                } else if (isInRange) {
                                    dayClasses += ' bg-blue-100 dark:bg-blue-900/50';
                                } else if (isPreparationDay && !event) {
                                    dayClasses += ' hover:bg-[var(--color-primary-light)]';
                                }
                            }
                            
                            return (
                                <div key={day} className={dayClasses} onClick={() => handleDayClick(day)} onMouseEnter={(e) => handleDayMouseEnter(day, e)}>
                                    <span>{day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
                         <h4 className="font-semibold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Jours de préparation</h4>
                         <div className="space-y-2">
                            {daysOfWeekFull.slice(1).concat(daysOfWeekFull.slice(0,1)).map((dayName, i) => {
                                const dayIndex = (i + 1) % 7;
                                return (
                                    <label key={dayIndex} className={`flex items-center space-x-2 ${readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                        <input
                                            type="checkbox"
                                            checked={preparationWeekdays.includes(dayIndex)}
                                            onChange={() => handleTogglePreparationDay(dayIndex)}
                                            disabled={readOnly}
                                            className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-[var(--color-border-input)]"
                                        />
                                        <span className="text-sm text-[var(--color-text-base)]">{dayName}</span>
                                    </label>
                                );
                            })}
                        </div>
                         <div className="mt-4 border-t border-[var(--color-border-base)] pt-4 text-center">
                            <p className="font-semibold text-[var(--color-text-heading)]">Jours de préparation du mois:</p>
                            <p className="text-3xl font-bold text-[var(--color-primary)]">{totalPreparationDays}</p>
                        </div>
                    </div>

                    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
                        <h4 className="font-semibold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Événements du mois</h4>
                         <Button onClick={handleAddEventForToday} variant="primary" className="w-full mb-4" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={readOnly}>
                            Ajouter un événement
                        </Button>
                        <div className="space-y-2 max-h-48 overflow-y-auto" onMouseLeave={handleGridMouseLeave}>
                            {monthlyEvents.length === 0 && <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Aucun événement ce mois-ci.</p>}
                            {monthlyEvents.map(event => (
                                <div key={event.id} onClick={() => handleDayClick(new Date(event.date + 'T00:00:00').getDate())} onMouseEnter={(e) => handleDayMouseEnter(new Date(event.date + 'T00:00:00').getDate(), e)} className="flex items-center space-x-2 p-2 rounded-md hover:bg-[var(--color-bg-muted)] cursor-pointer">
                                    <div className={`w-2 h-2 rounded-full ${eventColorMap.get(event.type)?.dotColor} flex-shrink-0`}></div>
                                    <div className="text-sm">
                                        <span className="font-semibold">{new Date(event.date + 'T00:00:00').getDate()} {months[month]}:</span>
                                        <span className="text-[var(--color-text-base)] ml-1">{event.title}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <EventModal 
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSave={handleSaveEvent}
                    onDelete={selectedEvent?.id ? handleDeleteEvent : undefined}
                    event={selectedEvent}
                    date={selectedDate}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
};

export default CustomCalendar;
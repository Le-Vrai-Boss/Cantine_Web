import React from 'react';

export const handleEnterNavigation = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && e.currentTarget.nodeName !== 'BUTTON') {
        e.preventDefault();
        const container = e.currentTarget.closest('.enter-nav-container');
        if (!container) return;
        
        const focusable = Array.from(
            container.querySelectorAll<HTMLElement>(
                'input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])'
            )
        ).filter(el => (el as HTMLElement).offsetParent !== null);

        const index = focusable.indexOf(e.currentTarget as HTMLElement);
        
        if (index > -1 && index < focusable.length - 1) {
            (focusable[index + 1] as HTMLElement).focus();
        }
    }
};

export const openImportDialog = (onImport: (file: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".xlsx, .xls";
    input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            onImport(target.files[0]);
        }
    };
    input.click();
};
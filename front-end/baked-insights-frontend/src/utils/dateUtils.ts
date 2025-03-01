import { format as dateFnsFormat } from 'date-fns';

export function formatDate(dateValue: string | Date | null | undefined): string {
    if (!dateValue) return 'Not set';
    
    try {
        // If it's already a Date object, use it directly
        // Otherwise, create a new Date from the string or timestamp
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        
        // Check if the date is valid before formatting
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        
        return dateFnsFormat(date, 'MMM d, yyyy');
    } catch (error) {
        console.error('Error formatting date:', error, dateValue);
        return 'Invalid date';
    }
}

export function formatDateTime(dateValue: string | Date | null | undefined): string {
    if (!dateValue) return 'Not set';
    
    try {
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        
        return dateFnsFormat(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
        console.error('Error formatting date:', error, dateValue);
        return 'Invalid date';
    }
}
/**
 * Zustand store that acts as a publish-subscribe system for data change events. 
 * Components can:
 * - Subscribe to data change events using addListener
 * - Trigger events using triggerRefresh
 */
import { create } from 'zustand';

// Define types for events that can trigger data refreshes
export type RefreshEvent = 
  | 'sku-created'
  | 'lot-number-created'
  | 'table-created'
  | 'checklist-created'
  | 'checklist-submitted'
  | 'table-data-updated';

// Define event listener type
type Listener = (event: RefreshEvent) => void;

interface DataRefreshState {
  // Add listener for data change events
  addListener: (listener: Listener) => () => void;
  
  // Trigger an event to notify listeners about data changes
  triggerRefresh: (event: RefreshEvent) => void;
  
  // Internal state
  listeners: Listener[];
}

/**
 * Store for handling data refresh events across the app
 * This allows components to be notified when data changes elsewhere
 * in the application so they can update their state accordingly
 */
export const useDataRefreshStore = create<DataRefreshState>((set, get) => ({
  listeners: [],
  
  // Add a listener and return a function to remove it
  addListener: (listener: Listener) => {
    set(state => ({
      listeners: [...state.listeners, listener]
    }));
    
    // Return a cleanup function
    return () => {
      set(state => ({
        listeners: state.listeners.filter(l => l !== listener)
      }));
    };
  },
  
  // Trigger a refresh event
  triggerRefresh: (event: RefreshEvent) => {
    // Notify all listeners about the event
    get().listeners.forEach(listener => listener(event));
  }
}));
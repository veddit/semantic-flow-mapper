
import { create } from 'zustand';

interface LogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'warn';
}

interface TraceLoggerState {
  logs: LogEntry[];
  addLog: (message: string, level?: 'info' | 'error' | 'warn') => void;
  clearLogs: () => void;
}

const useTraceLoggerStore = create<TraceLoggerState>((set) => ({
  logs: [],
  addLog: (message, level = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    set((state) => ({
      logs: [...state.logs, { timestamp, message, level }].slice(-100) // Keep last 100 logs
    }));
  },
  clearLogs: () => set({ logs: [] }),
}));

export const useTraceLogger = () => {
  const { logs, addLog, clearLogs } = useTraceLoggerStore();

  // Create a trace function that both logs to console and our store
  const trace = (message: string, level: 'info' | 'error' | 'warn' = 'info') => {
    console.log(`[TRACE] ${message}`);
    addLog(message, level);
  };

  return { logs, trace, clearLogs };
};

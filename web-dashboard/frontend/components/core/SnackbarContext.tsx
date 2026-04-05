'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarContextProps {
  showMessage: (message: string, type?: SnackbarType, duration?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextProps>({
  showMessage: () => {},
});

export const useSnackbar = () => useContext(SnackbarContext);

interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('info');
  const [visible, setVisible] = useState(false);

  const showMessage = (msg: string, t: SnackbarType = 'info', duration: number = 5000) => {
    setMessage(msg);
    setType(t);
    setVisible(true);

    setTimeout(() => {
      setVisible(false);
    }, duration);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper để lấy Icon tương ứng
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <SnackbarContext.Provider value={{ showMessage }}>
      {children}
      {isMounted && (
        <div
          className={`fixed top-6 right-6 z-[1000] transition-all duration-500 ease-out transform 
                    ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
        >
          <div
            className={`flex items-center px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold min-w-[280px]
                        ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
                        ${type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : ''}
                        ${type === 'info' ? 'bg-sky-50 border-sky-200 text-sky-800' : ''}
                    `}
          >
            <span className={`p-1 rounded-full bg-white/50`}>{getIcon()}</span>
            <p className="ml-2">{message}</p>
          </div>
        </div>
      )}
    </SnackbarContext.Provider>
  );
};

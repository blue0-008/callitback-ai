import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface FocusContextType {
  focusMode: boolean;
  toggleFocus: () => void;
}

const FocusContext = createContext<FocusContextType>({ focusMode: false, toggleFocus: () => {} });

export const useFocusMode = () => useContext(FocusContext);

export const FocusProvider = ({ children }: { children: ReactNode }) => {
  const [focusMode, setFocusMode] = useState(false);

  const toggleFocus = useCallback(() => setFocusMode((f) => !f), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        toggleFocus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFocus]);

  return (
    <FocusContext.Provider value={{ focusMode, toggleFocus }}>
      {children}
    </FocusContext.Provider>
  );
};

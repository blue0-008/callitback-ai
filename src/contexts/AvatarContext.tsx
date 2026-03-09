import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const AVATAR_KEY = "studysprint_avatar";

interface AvatarContextType {
  avatarUrl: string | null;
  setAvatar: (url: string) => void;
  clearAvatar: () => void;
}

const AvatarContext = createContext<AvatarContextType>({
  avatarUrl: null,
  setAvatar: () => {},
  clearAvatar: () => {},
});

export const useAvatar = () => useContext(AvatarContext);

export const AvatarProvider = ({ children }: { children: ReactNode }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => localStorage.getItem(AVATAR_KEY)
  );

  const setAvatar = useCallback((url: string) => {
    localStorage.setItem(AVATAR_KEY, url);
    setAvatarUrl(url);
  }, []);

  const clearAvatar = useCallback(() => {
    localStorage.removeItem(AVATAR_KEY);
    setAvatarUrl(null);
  }, []);

  return (
    <AvatarContext.Provider value={{ avatarUrl, setAvatar, clearAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
};

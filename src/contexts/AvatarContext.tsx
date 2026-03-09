import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const AVATAR_KEY = "studysprint_avatar";
const NAME_KEY = "studysprint_userName";

interface UserContextType {
  avatarUrl: string | null;
  username: string;
  setAvatar: (url: string) => void;
  clearAvatar: () => void;
  setUsername: (name: string) => void;
}

const UserContext = createContext<UserContextType>({
  avatarUrl: null,
  username: "",
  setAvatar: () => {},
  clearAvatar: () => {},
  setUsername: () => {},
});

export const useUser = () => useContext(UserContext);

// Keep backward-compat alias
export const useAvatar = useUser;

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => localStorage.getItem(AVATAR_KEY)
  );
  const [username, setUsernameState] = useState<string>(
    () => localStorage.getItem(NAME_KEY) || ""
  );

  const setAvatar = useCallback((url: string) => {
    localStorage.setItem(AVATAR_KEY, url);
    setAvatarUrl(url);
  }, []);

  const clearAvatar = useCallback(() => {
    localStorage.removeItem(AVATAR_KEY);
    setAvatarUrl(null);
  }, []);

  const setUsername = useCallback((name: string) => {
    localStorage.setItem(NAME_KEY, name);
    setUsernameState(name);
  }, []);

  return (
    <UserContext.Provider value={{ avatarUrl, username, setAvatar, clearAvatar, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};

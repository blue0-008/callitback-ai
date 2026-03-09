import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import i18n from "@/lib/i18n";

const AVATAR_KEY = "callitback_avatar";
const NAME_KEY = "callitback_userName";
const LANG_KEY = "callitback_language";

export type AppLanguage = "en" | "ar" | "fr" | "es";

interface UserContextType {
  avatarUrl: string | null;
  username: string;
  language: AppLanguage;
  setAvatar: (url: string) => void;
  clearAvatar: () => void;
  setUsername: (name: string) => void;
  setLanguage: (lang: AppLanguage) => void;
}

const UserContext = createContext<UserContextType>({
  avatarUrl: null,
  username: "",
  language: "en",
  setAvatar: () => {},
  clearAvatar: () => {},
  setUsername: () => {},
  setLanguage: () => {},
});

export const useUser = () => useContext(UserContext);
export const useAvatar = useUser;

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => localStorage.getItem(AVATAR_KEY)
  );
  const [username, setUsernameState] = useState<string>(
    () => localStorage.getItem(NAME_KEY) || ""
  );
  const [language, setLanguageState] = useState<AppLanguage>(
    () => (localStorage.getItem(LANG_KEY) as AppLanguage) || "en"
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

  const setLanguage = useCallback((lang: AppLanguage) => {
    localStorage.setItem(LANG_KEY, lang);
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    // RTL support
    const isRtl = lang === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    if (isRtl) {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
  }, []);

  // Initialize dir/lang on mount
  useEffect(() => {
    const isRtl = language === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = language;
    if (isRtl) {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
  }, [language]);

  return (
    <UserContext.Provider value={{ avatarUrl, username, language, setAvatar, clearAvatar, setUsername, setLanguage }}>
      {children}
    </UserContext.Provider>
  );
};
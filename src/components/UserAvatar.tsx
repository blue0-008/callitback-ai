import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserName } from "@/lib/userPrefs";

const AVATAR_KEY = "studysprint_avatar";

export function getAvatarUrl(): string | null {
  return localStorage.getItem(AVATAR_KEY);
}

export function setAvatarUrl(url: string) {
  localStorage.setItem(AVATAR_KEY, url);
}

export function clearAvatarUrl() {
  localStorage.removeItem(AVATAR_KEY);
}

interface UserAvatarProps {
  size?: number;
  className?: string;
}

const UserAvatar = ({ size = 36, className }: UserAvatarProps) => {
  const savedAvatar = getAvatarUrl();
  const name = getUserName();
  const style = { width: size, height: size, minWidth: size, minHeight: size };

  // Priority 1 & 2: user has explicitly set an avatar (uploaded photo or DiceBear selection)
  if (savedAvatar) {
    return (
      <img
        src={savedAvatar}
        alt="Avatar"
        className={cn("rounded-full object-cover bg-secondary", className)}
        style={style}
      />
    );
  }

  // Priority 3: show user's first initial
  if (name) {
    const initial = name.charAt(0).toUpperCase();
    const fontSize = Math.round(size * 0.42);
    return (
      <div
        className={cn("rounded-full flex items-center justify-center font-bold", className)}
        style={{ ...style, backgroundColor: "#F59E0B", color: "#0F1117", fontSize }}
      >
        {initial}
      </div>
    );
  }

  // Priority 4: no name, no avatar — show ⚡
  return (
    <div
      className={cn("rounded-full bg-primary/20 flex items-center justify-center", className)}
      style={style}
    >
      <Zap className="text-primary" style={{ width: size * 0.45, height: size * 0.45 }} />
    </div>
  );
};

export default UserAvatar;

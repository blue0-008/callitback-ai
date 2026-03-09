import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserName } from "@/lib/userPrefs";

const AVATAR_KEY = "studysprint_avatar";

export function getAvatarUrl(): string | null {
  return localStorage.getItem(AVATAR_KEY);
}

export function setAvatarUrl(base64: string) {
  localStorage.setItem(AVATAR_KEY, base64);
}

export function clearAvatarUrl() {
  localStorage.removeItem(AVATAR_KEY);
}

function getDiceBearUrl(name: string) {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
}

interface UserAvatarProps {
  size?: number; // px
  className?: string;
}

const UserAvatar = ({ size = 36, className }: UserAvatarProps) => {
  const customAvatar = getAvatarUrl();
  const name = getUserName();

  const sizeClass = `h-[${size}px] w-[${size}px]`;
  const style = { width: size, height: size, minWidth: size, minHeight: size };

  // Priority 1: uploaded photo
  if (customAvatar) {
    return (
      <img
        src={customAvatar}
        alt="Avatar"
        className={cn("rounded-full object-cover", className)}
        style={style}
      />
    );
  }

  // Priority 2: DiceBear based on name
  if (name) {
    return (
      <img
        src={getDiceBearUrl(name)}
        alt="Avatar"
        className={cn("rounded-full object-cover bg-secondary", className)}
        style={style}
      />
    );
  }

  // Priority 3: default ⚡ icon
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

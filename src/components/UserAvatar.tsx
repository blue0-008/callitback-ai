import { User } from "lucide-react";

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
  const avatar = localStorage.getItem(AVATAR_KEY);
  const iconSize = Math.max(Math.round(size * 0.55), 14);

  if (avatar) {
    return (
      <img
        src={avatar}
        alt="avatar"
        className={className}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: "#F59E0B",
        color: "#0F1117",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <User size={iconSize} strokeWidth={2.5} />
    </div>
  );
};

export default UserAvatar;

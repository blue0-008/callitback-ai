import { User } from "lucide-react";
import { useAvatar } from "@/contexts/AvatarContext";

interface UserAvatarProps {
  size?: number;
  className?: string;
}

const UserAvatar = ({ size = 36, className }: UserAvatarProps) => {
  const { avatarUrl } = useAvatar();
  const iconSize = Math.max(Math.round(size * 0.55), 14);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
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

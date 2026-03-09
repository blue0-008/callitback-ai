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

function getStoredName(): string {
  // Check both possible keys
  return localStorage.getItem("studysprint_userName")
    || localStorage.getItem("studysprint_username")
    || "";
}

interface UserAvatarProps {
  size?: number;
  className?: string;
}

const UserAvatar = ({ size = 36, className }: UserAvatarProps) => {
  const avatar = localStorage.getItem(AVATAR_KEY);
  const name = getStoredName();
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const fontSize = Math.max(Math.round(size * 0.44), 12);

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
        fontWeight: 700,
        fontSize,
        lineHeight: 1,
      }}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;

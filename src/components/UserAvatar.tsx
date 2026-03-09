const AVATAR_KEY = "studysprint_avatar";
const NAME_KEY = "studysprint_userName";

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
  const name = localStorage.getItem(NAME_KEY);
  const initial = name ? name.charAt(0).toUpperCase() : "⚡";
  const fontSize = Math.max(Math.round(size * 0.42), 12);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
  };

  if (avatar) {
    return (
      <div style={containerStyle} className={className}>
        <img
          src={avatar}
          alt="avatar"
          className="rounded-full w-full h-full object-cover"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...containerStyle,
        backgroundColor: "#F59E0B",
        color: "#0F1117",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize,
      }}
      className={className}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;

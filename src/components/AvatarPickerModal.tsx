import { useState, useRef, useCallback } from "react";
import { Check, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUserName } from "@/lib/userPrefs";

const AVATAR_ROWS = [
  {
    label: "Illustrated",
    style: "adventurer",
    seeds: ["Luna", "Zara", "Nova", "Kai"],
  },
  {
    label: "Minimal",
    style: "thumbs",
    seeds: ["Storm", "Blaze", "Echo", "Pixel"],
  },
  {
    label: "Fun & Bold",
    style: "bottts",
    seeds: ["Comet", "Spark", "Orbit", "Flux"],
  },
];

const INITIAL_COLORS = ["F59E0B", "10B981", "3B82F6", "EF4444"];

function diceBearUrl(style: string, seed: string, bg?: string) {
  const base = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
  return bg ? `${base}&backgroundColor=${bg}` : base;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (avatarUrl: string) => void;
}

const AvatarPickerModal = ({ open, onClose, onSave }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const userName = getUserName() || "User";
  const initials = userName.split(" ").map(w => w[0]).join("").slice(0, 2);

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return;
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSave = () => {
    const value = uploadPreview || selected;
    if (value) {
      onSave(value);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelected(null);
    setUploadPreview(null);
    onClose();
  };

  const handleUsePhoto = () => {
    if (uploadPreview) {
      setSelected(null); // clear dicebear selection
    }
  };

  const selectDicebear = (url: string) => {
    setSelected(url);
    setUploadPreview(null); // clear upload
  };

  const currentChoice = uploadPreview || selected;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Upload section */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Upload your own</p>
            {uploadPreview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img
                    src={uploadPreview}
                    alt="Upload preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-lg"
                  />
                  <button
                    onClick={() => setUploadPreview(null)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <Button size="sm" variant="outline" onClick={handleUsePhoto}>
                  Use this photo
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/30"
                )}
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop your photo here or <span className="text-primary font-medium">click to upload</span>
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG, or WebP</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border/50" />
            <span className="text-xs text-muted-foreground">Or choose an avatar</span>
            <div className="flex-1 border-t border-border/50" />
          </div>

          {/* DiceBear rows */}
          {AVATAR_ROWS.map((row) => (
            <div key={row.style}>
              <p className="text-xs font-medium text-muted-foreground mb-2">{row.label}</p>
              <div className="flex gap-3">
                {row.seeds.map((seed) => {
                  const url = diceBearUrl(row.style, seed);
                  const isSelected = selected === url && !uploadPreview;
                  return (
                    <button
                      key={seed}
                      onClick={() => selectDicebear(url)}
                      className={cn(
                        "relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-200 bg-secondary",
                        isSelected
                          ? "border-primary shadow-[0_0_12px_hsl(38_92%_50%/0.4)] scale-105"
                          : "border-transparent hover:border-primary/40 hover:shadow-[0_0_8px_hsl(38_92%_50%/0.2)]"
                      )}
                    >
                      <img src={url} alt={seed} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-5 w-5 text-primary drop-shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Initials row */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Initials</p>
            <div className="flex gap-3">
              {INITIAL_COLORS.map((color) => {
                const url = diceBearUrl("initials", initials, color);
                const isSelected = selected === url && !uploadPreview;
                return (
                  <button
                    key={color}
                    onClick={() => selectDicebear(url)}
                    className={cn(
                      "relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary shadow-[0_0_12px_hsl(38_92%_50%/0.4)] scale-105"
                        : "border-transparent hover:border-primary/40 hover:shadow-[0_0_8px_hsl(38_92%_50%/0.2)]"
                    )}
                  >
                    <img src={url} alt={`Initials ${color}`} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-primary drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={!currentChoice}
            className="w-full"
          >
            Save Avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarPickerModal;

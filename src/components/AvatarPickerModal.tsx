import { useState, useRef, useCallback } from "react";
import { Check, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BASE = "https://api.dicebear.com/7.x/adventurer/svg?backgroundColor=ffffff&seed=";

const SEEDS = [
  "Luna", "Zara", "Nova", "Mia", "Aria", "Stella",
  "Amara", "Zuri", "Imani", "Nadia", "Layla", "Sana",
  "Kai", "Leo", "Max", "Finn", "Jake", "Ryan",
  "Kofi", "Malik", "Andre", "Omar", "Jalen", "Theo",
];

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

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadPreview(reader.result as string);
      setSelected(null);
    };
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

  const selectAvatar = (url: string) => {
    setSelected(url);
    setUploadPreview(null);
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

  const currentChoice = uploadPreview || selected;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-5">
          {/* Upload section */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Upload your own</p>
            {uploadPreview ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={uploadPreview}
                    alt="Upload preview"
                    className="w-[72px] h-[72px] rounded-full object-cover border-2 border-primary shadow-lg"
                  />
                  <button
                    onClick={() => setUploadPreview(null)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Your uploaded photo is selected</p>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all",
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/30"
                )}
              >
                <Upload className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
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
            <span className="text-xs text-muted-foreground">Or pick an avatar</span>
            <div className="flex-1 border-t border-border/50" />
          </div>

          {/* Avatar rows */}
          {ROWS.map((row) => (
            <div key={row.label}>
              <p className="text-xs font-medium text-muted-foreground mb-2">{row.label}</p>
              <div className="grid grid-cols-6 gap-2">
                {row.seeds.map((seed) => {
                  const url = BASE + seed;
                  const isSelected = selected === url && !uploadPreview;
                  return (
                    <button
                      key={seed}
                      onClick={() => selectAvatar(url)}
                      className={cn(
                        "relative rounded-full overflow-hidden border-2 transition-all duration-200 bg-secondary aspect-square",
                        isSelected
                          ? "border-primary shadow-[0_0_12px_hsl(38_92%_50%/0.4)] scale-105"
                          : "border-transparent hover:border-primary/40 hover:shadow-[0_0_8px_hsl(38_92%_50%/0.2)]"
                      )}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
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
        </div>

        {/* Sticky save button */}
        <div className="px-5 py-4 border-t border-border/40">
          <Button onClick={handleSave} disabled={!currentChoice} className="w-full">
            Save Avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarPickerModal;

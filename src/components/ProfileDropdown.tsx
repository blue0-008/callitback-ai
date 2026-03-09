import { useState } from "react";
import { User, Pencil, Palette, Trash2, RotateCcw } from "lucide-react";
import { getUserName, setUserName } from "@/lib/userPrefs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProfileDropdown = () => {
  const [editOpen, setEditOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [nameValue, setNameValue] = useState(getUserName());

  const displayName = getUserName() || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const isDark = () => document.documentElement.classList.contains("dark");

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark() ? "dark" : "light");
  };

  const handleSaveName = () => {
    setUserName(nameValue.trim());
    setEditOpen(false);
  };

  const handleClearAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem("hasCompletedOnboarding");
    window.location.reload();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary hover:bg-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Profile menu"
          >
            {initial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 animate-fade-in">
          <DropdownMenuLabel className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {displayName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setNameValue(getUserName()); setEditOpen(true); }}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleTheme}>
            <Palette className="h-3.5 w-3.5 mr-2" /> Toggle Theme
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setClearOpen(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Clear All Data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetOnboarding}>
            <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reset Onboarding
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Name Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
          </DialogHeader>
          <Input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder="Your name"
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your summaries, quizzes and flashcards. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, clear everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileDropdown;

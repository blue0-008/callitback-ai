import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FocusProvider } from "@/hooks/useFocusMode";
import { hasCompletedOnboarding } from "@/lib/userPrefs";
import AppLayout from "./components/AppLayout";
import OnboardingFlow from "./components/OnboardingFlow";
import Dashboard from "./pages/Dashboard";
import Study from "./pages/Study";
import Quiz from "./pages/Quiz";
import Flashcards from "./pages/Flashcards";
import Progress from "./pages/Progress";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FocusProvider>
          <Toaster />
          <Sonner />
          {showOnboarding && (
            <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
          )}
          {!showOnboarding && (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/study" element={<Study />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/flashcards" element={<Flashcards />} />
                  <Route path="/progress" element={<Progress />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          )}
        </FocusProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

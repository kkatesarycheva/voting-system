import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ElectionProvider } from "@/lib/electionContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Candidates from "./pages/Candidates";
import VotePage from "./pages/VotePage";
import Confirmation from "./pages/Confirmation";
import AdminDashboard from "./pages/AdminDashboard";
import ITAdminDashboard from "./pages/ITAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ElectionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/vote" element={<VotePage />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/it-admin" element={<ITAdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ElectionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

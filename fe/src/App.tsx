import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Module1Setup from "./pages/Module1Setup";
import Module1Interview from "./pages/Module1Interview";
import Module1Report from "./pages/Module1Report";
import Module2Setup from "./pages/Module2Setup";
import Module2Interview from "./pages/Module2Interview";
import Module2Review from "./pages/Module2Review";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/module1/setup" element={<Module1Setup />} />
          <Route path="/module1/interview" element={<Module1Interview />} />
          <Route path="/module1/report" element={<Module1Report />} />
          <Route path="/module2/setup" element={<Module2Setup />} />
          <Route path="/module2/interview" element={<Module2Interview />} />
          <Route path="/module2/review" element={<Module2Review />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

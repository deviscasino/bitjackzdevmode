import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import CrashGame from "@/pages/CrashGame";
import CoinFlipGame from "@/pages/CoinFlipGame";
import LimboGame from "@/pages/LimboGame";
import DiceGame from "@/pages/DiceGame";
import MinesGame from "@/pages/MinesGame";
import RouletteGame from "@/pages/RouletteGame";
import WalletPage from "@/pages/WalletPage";
import TopNavbar from "@/components/TopNavbar";
import BottomNavbar from "@/components/BottomNavbar";
import TelegramAuth from "@/components/TelegramAuth";
import NotFound from "@/pages/not-found";

function Router() {
  const [telegramUser, setTelegramUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const handleAuthSuccess = (user: any) => {
    setTelegramUser(user);
    setIsAuthenticating(false);
  };

  if (isAuthenticating) {
    return <TelegramAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen casino-bg pb-16">
      <TopNavbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/crash" component={CrashGame} />
        <Route path="/coinflip" component={CoinFlipGame} />
        <Route path="/limbo" component={LimboGame} />
        <Route path="/dice" component={DiceGame} />
        <Route path="/mines" component={MinesGame} />
        <Route path="/roulette" component={RouletteGame} />
        <Route path="/wallet" component={WalletPage} />
        <Route component={NotFound} />
      </Switch>
      <BottomNavbar />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

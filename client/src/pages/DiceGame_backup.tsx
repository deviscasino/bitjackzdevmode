import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DiceResult {
  result: string;
  roll: number;
  target: number;
  isOver: boolean;
  multiplier: number;
  payout: number;
  newBalance: number;
}

export default function DiceGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("0.00000000");
  const [profitOnWin, setProfitOnWin] = useState("0.00000000");
  const [rollTarget, setRollTarget] = useState([50]);

  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [betType, setBetType] = useState<"over" | "under">("over");

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const playGameMutation = useMutation({
    mutationFn: async (gameData: { betAmount: number; target: number; isOver: boolean }) => {
      const response = await apiRequest("POST", "/api/games/dice", gameData);
      return response.json() as Promise<DiceResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      setLastRoll(data.roll);
      
      if (data.result === "win") {
        toast({
          title: "Winner!",
          description: `Rolled ${data.roll} - You won $${data.payout.toFixed(2)} with ${data.multiplier.toFixed(2)}x!`,
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: `Rolled ${data.roll} - Target was ${data.isOver ? "over" : "under"} ${data.target}`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to play game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlay = () => {
    const bet = parseFloat(betAmount);
    const targetValue = rollTarget[0];
    
    if (bet < 0 || targetValue < 2 || targetValue > 98) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid bet amount and target (2-98)",
        variant: "destructive",
      });
      return;
    }

    // Use the selected bet type (over or under)
    const isOver = betType === "over";
    playGameMutation.mutate({ betAmount: bet, target: targetValue, isOver });
  };

  const target = rollTarget[0];
  // Calculate win chance based on bet type
  const winChance = betType === "over" ? 100 - target : target - 1;
  const multiplier = (100 / winChance);
  const calculatedProfit = parseFloat(betAmount) * (multiplier - 1);

  // Update profit when bet amount or target changes
  const updateProfit = () => {
    setProfitOnWin(calculatedProfit.toFixed(8));
  };

  return (
    <div className="min-h-screen casino-bg-blue">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-white hover:text-yellow-400"
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Games
        </Button>
        <h2 className="text-2xl font-bold text-white">DICE</h2>
        <div className="text-sm text-gray-400">Roll Over/Under</div>
      </div>

      {/* Test Section */}
      <div className="p-4">
        <div className="text-white">Test Content</div>
      </div>
    </div>
  );
}
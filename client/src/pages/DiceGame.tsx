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
  // Apply 93% RTP to the displayed multiplier so users see the actual payout multiplier
  const multiplier = (100 / winChance) * 0.93;
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

      {/* Slider Section */}
      <div className="p-4 lg:p-6 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {/* Numbers */}
          <div className="flex justify-between text-white mb-4 text-lg font-bold">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>

          {/* Roll Result Display */}
          {lastRoll !== null && (
            <div className="relative mb-2 h-14">
              <div 
                className="absolute transition-all duration-1000 ease-out"
                style={{ 
                  left: `${lastRoll}%`,
                  transform: 'translateX(-50%)',
                  top: '0'
                }}
              >
                <div className={`border-2 rounded-lg w-14 h-12 flex items-center justify-center shadow-lg transform transition-all duration-500 ease-out scale-110 ${
                  (betType === "over" && lastRoll > target) || (betType === "under" && lastRoll < target)
                    ? 'bg-green-500 border-green-400 text-white' 
                    : 'bg-red-500 border-red-400 text-white'
                }`}>
                  <span className="font-bold text-sm animate-pulse">{lastRoll.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Slider Container */}
          <div className="relative mb-12">
            <div className="h-8 bg-gray-700 rounded-full border-2 border-gray-600 overflow-hidden relative">
              {betType === "over" ? (
                <>
                  <div 
                    className="h-full bg-red-500 absolute left-0 top-0"
                    style={{ width: `${target}%` }}
                  />
                  <div 
                    className="h-full bg-green-500 absolute right-0 top-0"
                    style={{ width: `${100 - target}%` }}
                  />
                </>
              ) : (
                <>
                  <div 
                    className="h-full bg-green-500 absolute left-0 top-0"
                    style={{ width: `${target}%` }}
                  />
                  <div 
                    className="h-full bg-red-500 absolute right-0 top-0"
                    style={{ width: `${100 - target}%` }}
                  />
                </>
              )}
            </div>
            
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-12 h-8 bg-blue-500 rounded cursor-pointer flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-blue-400"
              style={{ left: `calc(${target}% - 24px)` }}
            >
              {target}
            </div>
            
            <input
              type="range"
              min="2"
              max="98"
              value={target}
              onChange={(e) => {
                setRollTarget([parseInt(e.target.value)]);
                updateProfit();
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-white text-2xl font-bold">{multiplier.toFixed(4)}</div>
              <div className="text-gray-400 text-sm flex items-center justify-center">
                <span className="mr-1">Multiplier</span>
                <span className="text-xs">×</span>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-white text-2xl font-bold">{target}.50</div>
              <div className="text-gray-400 text-sm">Roll {betType === "over" ? "Over" : "Under"}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-white text-2xl font-bold">{winChance.toFixed(4)}</div>
              <div className="text-gray-400 text-sm flex items-center justify-center">
                <span className="mr-1">Win Chance</span>
                <span className="text-xs">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Betting Controls Section */}
      <div className="p-4 lg:p-6 bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Over/Under Toggle */}
            <div className="flex-1">
              <Label className="text-gray-300 text-sm mb-3 block">Bet Type</Label>
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setBetType("over")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    betType === "over" 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Roll Over
                </button>
                <button
                  onClick={() => setBetType("under")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    betType === "under" 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Roll Under
                </button>
              </div>
            </div>

            {/* Bet Amount */}
            <div className="flex-1">
              <Label className="text-gray-300 text-sm mb-3 block">Bet Amount</Label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => {
                  setBetAmount(e.target.value);
                  updateProfit();
                }}
                placeholder="0.00000000"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Play Button */}
            <div className="flex-1 flex items-end">
              <Button
                onClick={handlePlay}
                disabled={playGameMutation.isPending}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-bold"
              >
                {playGameMutation.isPending ? "Rolling..." : "Bet"}
              </Button>
            </div>
          </div>
          
          {/* Game Stats - Mobile friendly */}
          <div className="grid grid-cols-3 gap-4 text-center mt-6">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-white text-xl font-bold">{multiplier.toFixed(2)}</div>
              <div className="text-gray-400 text-xs">Multiplier</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-white text-xl font-bold">{target}</div>
              <div className="text-gray-400 text-xs">Roll {betType === "over" ? "Over" : "Under"}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-white text-xl font-bold">{winChance.toFixed(1)}%</div>
              <div className="text-gray-400 text-xs">Win Chance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
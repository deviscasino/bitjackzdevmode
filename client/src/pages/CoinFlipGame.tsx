import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Circle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CoinFlipResult {
  result: string;
  flipResult: string;
  payout: number;
  newBalance: number;
}

export default function CoinFlipGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("10.00");
  const [selectedSide, setSelectedSide] = useState<"heads" | "tails" | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastFlipResult, setLastFlipResult] = useState<"heads" | "tails" | null>(null);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const { data: recentFlips } = useQuery<any[]>({
    queryKey: ["/api/games/recent", "coinflip"],
  });

  const playGameMutation = useMutation({
    mutationFn: async (gameData: { betAmount: number; choice: "heads" | "tails" }) => {
      setIsFlipping(true);
      setLastFlipResult(null);
      
      // Simulate flip animation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await apiRequest("POST", "/api/games/coinflip", gameData);
      return response.json() as Promise<CoinFlipResult>;
    },
    onSuccess: (data) => {
      setIsFlipping(false);
      setLastFlipResult(data.flipResult as "heads" | "tails");
      
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      
      if (data.result === "win") {
        toast({
          title: "Winner!",
          description: `The coin landed on ${data.flipResult}! You won $${data.payout.toFixed(2)}`,
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: `The coin landed on ${data.flipResult}`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setIsFlipping(false);
      toast({
        title: "Error",
        description: "Failed to process game",
        variant: "destructive",
      });
    },
  });

  const handlePlay = (choice: "heads" | "tails") => {
    const bet = parseFloat(betAmount);
    
    if (bet <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    setSelectedSide(choice);
    playGameMutation.mutate({ betAmount: bet, choice });
  };

  return (
    <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="casino-pink hover:text-white"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Games
          </Button>
          <h2 className="text-3xl font-bold casino-neon-purple">COIN FLIP</h2>
          <div className="text-sm text-gray-400">89 players online</div>
        </div>

        {/* Game Display */}
        <Card className="casino-bg-blue border-purple-500/20 mb-6">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-6 relative coin-3d">
                <div className={`
                  w-full h-full rounded-full flex items-center justify-center text-4xl
                  ${isFlipping ? 'coin-spinning' : ''}
                  ${lastFlipResult === 'heads' ? 'bg-pink-400 text-white' : 
                    lastFlipResult === 'tails' ? 'bg-purple-500 text-white' : 
                    'bg-gradient-to-r from-pink-400 to-purple-500'}
                  transition-all duration-500
                  shadow-2xl border-4 border-pink-500/50
                `}>
                  {isFlipping ? (
                    <div className="relative w-full h-full flex items-center justify-center rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-pink-400 rounded-full flex items-center justify-center">
                        <Circle className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-purple-500 rounded-full flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}>
                        <Star className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : lastFlipResult === 'heads' ? (
                    <Circle className="w-12 h-12" />
                  ) : lastFlipResult === 'tails' ? (
                    <Star className="w-12 h-12" />
                  ) : (
                    <div className="text-2xl font-bold text-white">COIN</div>
                  )}
                </div>
                {isFlipping && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/30 to-purple-500/30 animate-ping"></div>
                )}
              </div>
              <div className="text-2xl font-bold casino-neon-purple mb-2">
                {isFlipping ? 'Flipping...' : 'Choose Your Side'}
              </div>
              <div className="text-gray-300">
                {isFlipping ? 'The coin is spinning!' : '50% chance to win 1.86x your bet'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Betting Controls */}
        <Card className="casino-bg-blue/50 border-purple-500/20 mb-6">
          <CardContent className="p-6">
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">Bet Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 casino-neon-purple">$</span>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="pl-8 casino-bg border-purple-500/20 text-white"
                  placeholder="0.00"
                />
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                  className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                >
                  1/2
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                  className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                >
                  2x
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount((balance?.balance || 0).toFixed(2))}
                  className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                >
                  Max
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handlePlay("heads")}
                disabled={playGameMutation.isPending || isFlipping}
                className={`
                  py-8 text-xl font-bold transition-all duration-300
                  ${selectedSide === 'heads' || lastFlipResult === 'heads' ? 
                    'bg-pink-400 hover:bg-pink-500 text-white' : 
                    'bg-pink-400/20 hover:bg-pink-400/30 text-pink-400 border border-pink-400/50'}
                  ${(playGameMutation.isPending || isFlipping) ? 'opacity-50 cursor-not-allowed' : ''}
                  flex flex-col items-center
                `}
              >
                <Circle className="mb-2" size={32} />
                HEADS (Circle)
              </Button>
              <Button
                onClick={() => handlePlay("tails")}
                disabled={playGameMutation.isPending || isFlipping}
                className={`
                  py-8 text-xl font-bold transition-all duration-300
                  ${selectedSide === 'tails' || lastFlipResult === 'tails' ? 
                    'bg-purple-500 hover:bg-purple-600 text-white' : 
                    'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-400/50'}
                  ${(playGameMutation.isPending || isFlipping) ? 'opacity-50 cursor-not-allowed' : ''}
                  flex flex-col items-center
                `}
              >
                <Star className="mb-2" size={32} />
                TAILS (Star)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game History */}
        <Card className="casino-bg-blue/50 border-purple-500/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 casino-neon-purple">Recent Flips</h3>
            <div className="flex flex-wrap gap-2">
              {recentFlips?.map((flip, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded text-sm ${
                    flip.result === "win" 
                      ? "bg-casino-neon-purple/20 casino-neon-purple" 
                      : "bg-casino-purple/20 casino-purple"
                  }`}
                >
                  {flip.result === "win" ? "H" : "T"}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

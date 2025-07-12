import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LimboResult {
  result: string;
  randomMultiplier: number;
  target: number;
  payout: number;
  newBalance: number;
}

export default function LimboGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("10.00");
  const [targetMultiplier, setTargetMultiplier] = useState("2.00");
  const [lastResult, setLastResult] = useState<LimboResult | null>(null);
  const [animatingMultiplier, setAnimatingMultiplier] = useState<number>(1.00);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  // Animation effect for multiplier counting up
  useEffect(() => {
    if (isAnimating && lastResult) {
      let startTime = Date.now();
      const duration = 2000; // 2 seconds animation
      const startValue = 1.00;
      const endValue = lastResult.randomMultiplier;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOut;
        
        setAnimatingMultiplier(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      
      animate();
    }
  }, [isAnimating, lastResult]);

  const playGameMutation = useMutation({
    mutationFn: async (gameData: { betAmount: number; target: number }) => {
      const response = await apiRequest("POST", "/api/games/limbo", gameData);
      return response.json() as Promise<LimboResult>;
    },
    onSuccess: (data) => {
      setLastResult(data);
      setAnimatingMultiplier(1.00);
      setIsAnimating(true);
      
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      
      setTimeout(() => {
        if (data.result === "win") {
          toast({
            title: "Winner!",
            description: `Random multiplier: ${data.randomMultiplier.toFixed(2)}x - You won $${data.payout.toFixed(2)}`,
          });
        } else {
          toast({
            title: "Too low!",
            description: `Random multiplier: ${data.randomMultiplier.toFixed(2)}x was below your target`,
            variant: "destructive",
          });
        }
      }, 2000); // Show toast after animation completes
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process game",
        variant: "destructive",
      });
    },
  });

  const handlePlay = () => {
    const bet = parseFloat(betAmount);
    const target = parseFloat(targetMultiplier);
    
    if (bet <= 0 || target <= 1) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid bet amount and target multiplier",
        variant: "destructive",
      });
      return;
    }

    playGameMutation.mutate({ betAmount: bet, target });
  };

  const winChance = (100 / parseFloat(targetMultiplier)).toFixed(2);
  const potentialPayout = (parseFloat(betAmount) * parseFloat(targetMultiplier)).toFixed(2);

  return (
    <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="casino-neon-purple hover:text-white"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Games
          </Button>
          <h2 className="text-3xl font-bold casino-neon-purple">LIMBO</h2>
          <div className="text-sm text-gray-400">67 players online</div>
        </div>

        {/* Game Display */}
        <Card className="casino-bg-blue border-purple-500/20 mb-6">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-casino-purple/20 rounded-full flex items-center justify-center text-6xl casino-purple animate-bounce">
                <TrendingUp size={64} />
              </div>
              <div className="text-2xl font-bold casino-neon-purple mb-2">How Low Can You Go?</div>
              <div className="text-gray-300">Beat the random multiplier</div>
            </div>

            {/* Animated Multiplier Display */}
            {(isAnimating || lastResult) && (
              <div className="text-center mb-8 p-6 rounded-lg bg-gray-900/50 border border-purple-500/20">
                <div className="text-sm text-gray-400 mb-2">Random Multiplier</div>
                <div 
                  className={`text-6xl font-bold transition-all duration-300 ${
                    lastResult ? 
                      (lastResult.result === 'win' ? 'text-green-400' : 'text-red-400')
                      : 'casino-neon-purple'
                  } ${isAnimating ? 'animate-pulse' : ''}`}
                >
                  {animatingMultiplier.toFixed(2)}x
                </div>
                {lastResult && !isAnimating && (
                  <div className={`text-lg mt-2 ${lastResult.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                    {lastResult.result === 'win' ? 'WIN!' : 'LOSE!'}
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold casino-purple">{winChance}%</div>
                <div className="text-sm text-gray-400">Win Chance</div>
              </div>
              <div>
                <div className="text-2xl font-bold casino-neon-purple">{targetMultiplier}x</div>
                <div className="text-sm text-gray-400">Target</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">${potentialPayout}</div>
                <div className="text-sm text-gray-400">Win Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Betting Controls */}
        <Card className="casino-bg-blue/50 border-purple-500/20 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
              <div>
                <Label className="text-sm font-medium mb-2 block">Target Multiplier</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={targetMultiplier}
                    onChange={(e) => setTargetMultiplier(e.target.value)}
                    className="pr-8 casino-bg border-purple-500/20 text-white"
                    placeholder="2.00"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 casino-neon-purple">x</span>
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTargetMultiplier("2.00")}
                    className="flex-1 bg-casino-purple/20 border-casino-purple/20 casino-purple hover:bg-casino-purple/30"
                  >
                    2x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTargetMultiplier("5.00")}
                    className="flex-1 bg-casino-purple/20 border-casino-purple/20 casino-purple hover:bg-casino-purple/30"
                  >
                    5x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTargetMultiplier("10.00")}
                    className="flex-1 bg-casino-purple/20 border-casino-purple/20 casino-purple hover:bg-casino-purple/30"
                  >
                    10x
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Play Button */}
        <Button
          onClick={handlePlay}
          disabled={playGameMutation.isPending}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-6 text-lg font-bold mb-8"
        >
          {playGameMutation.isPending ? "Processing..." : "Play Limbo"}
        </Button>
      </div>
    </div>
  );
}

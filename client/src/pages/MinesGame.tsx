import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Bomb, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MinesResult {
  result: string;
  minePositions: number[];
  multiplier: number;
  payout: number;
  newBalance: number;
}

export default function MinesGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("10.00");
  const [minesCount, setMinesCount] = useState("3");
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [revealedMines, setRevealedMines] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const playGameMutation = useMutation({
    mutationFn: async (gameData: { betAmount: number; minesCount: number; selectedTiles: number[] }) => {
      const response = await apiRequest("POST", "/api/games/mines", gameData);
      return response.json() as Promise<MinesResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      
      setGameActive(false);
      
      if (data.result === "win") {
        toast({
          title: "Winner!",
          description: `You avoided all mines! Won $${data.payout.toFixed(2)} with ${data.multiplier.toFixed(2)}x!`,
        });
      }
      // Don't show notifications for losses - handled by immediate mine hit
    },
    onError: () => {
      setGameActive(false);
      toast({
        title: "Error",
        description: "Failed to process game",
        variant: "destructive",
      });
    },
  });

  const handleTileClick = (tileIndex: number) => {
    if (!gameActive || selectedTiles.includes(tileIndex)) return;
    
    const newSelectedTiles = [...selectedTiles, tileIndex];
    setSelectedTiles(newSelectedTiles);
    
    // Check if this tile is a mine
    if (minePositions.includes(tileIndex)) {
      // Hit a mine - end game immediately
      setRevealedMines(minePositions);
      setGameActive(false);
      
      // Call backend to handle mine hit loss
      const bet = parseFloat(betAmount);
      apiRequest("POST", "/api/games/mines/loss", { betAmount: bet })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
          queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
        });
      
      return;
    }
    
    // Add tile opening animation
    const tile = document.querySelector(`[data-tile="${tileIndex}"]`);
    if (tile) {
      tile.classList.add('animate-ping');
      setTimeout(() => {
        tile.classList.remove('animate-ping');
      }, 200);
    }
  };

  const handleStartGame = () => {
    const bet = parseFloat(betAmount);
    const mines = parseInt(minesCount);
    
    if (bet <= 0 || mines < 1 || mines > 24) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid bet amount and mines count (1-24)",
        variant: "destructive",
      });
      return;
    }

    // Generate mine positions on client side for immediate feedback
    const newMinePositions = [];
    const shuffledPositions = Array.from({ length: 25 }, (_, i) => i).sort(() => Math.random() - 0.5);
    for (let i = 0; i < mines; i++) {
      newMinePositions.push(shuffledPositions[i]);
    }
    setMinePositions(newMinePositions);

    setGameActive(true);
    setSelectedTiles([]);
    setRevealedMines([]);
  };

  const handleCashOut = () => {
    if (selectedTiles.length === 0) {
      toast({
        title: "No tiles selected",
        description: "Select at least one tile before cashing out",
        variant: "destructive",
      });
      return;
    }

    const bet = parseFloat(betAmount);
    const mines = parseInt(minesCount);
    
    // Only cash out if no mines were hit
    const hitMine = selectedTiles.some(tile => minePositions.includes(tile));
    if (!hitMine) {
      playGameMutation.mutate({ betAmount: bet, minesCount: mines, selectedTiles });
    }
  };

  const currentMultiplier = selectedTiles.length > 0 ? 
    Math.pow((25 - parseInt(minesCount)) / (25 - parseInt(minesCount) - selectedTiles.length + 1), selectedTiles.length) * 0.93 : 1;

  return (
    <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="casino-gold hover:text-white"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Games
          </Button>
          <h2 className="text-3xl font-bold casino-gold">MINES</h2>
          <div className="text-sm text-gray-400">123 players online</div>
        </div>

        {/* Game Display */}
        <Card className="casino-bg-blue border-casino-gold/20 mb-6">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold casino-gold mb-2">
                {gameActive ? `${currentMultiplier.toFixed(2)}x` : "MINES"}
              </div>
              {gameActive && (
                <div className="text-xl text-gray-300">
                  {selectedTiles.length} tiles revealed - {parseInt(minesCount)} mines hidden
                </div>
              )}
              {gameActive && (
                <div className="text-green-400 text-lg mt-2">
                  Potential win: ${(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
                </div>
              )}
            </div>
            
            {/* Mines Grid */}
            <div className="grid grid-cols-5 gap-1 mb-6 mx-auto max-w-3xl">
              {Array.from({ length: 25 }, (_, i) => (
                <button
                  key={i}
                  data-tile={i}
                  onClick={() => handleTileClick(i)}
                  disabled={!gameActive || selectedTiles.includes(i)}
                  className={`aspect-square rounded-lg border-2 transition-all duration-500 flex items-center justify-center text-4xl font-bold transform hover:scale-105 shadow-lg min-h-16 sm:min-h-20 md:min-h-24 ${
                    selectedTiles.includes(i)
                      ? revealedMines.includes(i)
                        ? "bg-red-900 border-red-600 shadow-red-500/50"
                        : "bg-blue-900 border-blue-600 shadow-blue-500/50"
                      : revealedMines.includes(i)
                      ? "bg-red-900 border-red-600 shadow-red-500/50"
                      : gameActive 
                      ? "bg-gray-700 border-casino-gold/30 hover:border-casino-gold hover:bg-gray-600 cursor-pointer"
                      : "bg-gray-800 border-gray-600 cursor-not-allowed"
                  }`}
                >
                  {selectedTiles.includes(i) ? (
                    minePositions.includes(i) ? (
                      <img 
                        src="/bomb.png" 
                        alt="Bomb" 
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <img 
                        src="/gem.png" 
                        alt="Gem" 
                        className="w-16 h-16 object-contain"
                      />
                    )
                  ) : revealedMines.includes(i) ? (
                    <img 
                      src="/bomb.png" 
                      alt="Bomb" 
                      className="w-16 h-16 object-contain"
                    />
                  ) : null}
                </button>
              ))}
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
                    disabled={gameActive}
                    className="pl-8 casino-bg border-purple-500/20 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={gameActive}
                    onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                    className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                  >
                    1/2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={gameActive}
                    onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                    className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                  >
                    2x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={gameActive}
                    onClick={() => setBetAmount((balance?.balance || 0).toFixed(2))}
                    className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                  >
                    Max
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Number of Mines</Label>
                <Select value={minesCount} onValueChange={setMinesCount} disabled={gameActive}>
                  <SelectTrigger className="casino-bg border-purple-500/20 text-white">
                    <SelectValue placeholder="Select mines count" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} mines
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Statistics */}
        {gameActive && (
          <Card className="casino-bg-blue/30 border-purple-500/20 mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold casino-neon-purple">{selectedTiles.length}</div>
                  <div className="text-sm text-gray-400">Tiles Revealed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{parseInt(minesCount)}</div>
                  <div className="text-sm text-gray-400">Mines Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{25 - parseInt(minesCount) - selectedTiles.length}</div>
                  <div className="text-sm text-gray-400">Safe Tiles Left</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleStartGame}
            disabled={gameActive || playGameMutation.isPending}
            className="bg-purple-500 hover:bg-purple-600 text-white py-6 text-lg font-bold transition-all duration-200 transform hover:scale-105"
          >
            {gameActive ? "Game Active" : "Start Game"}
          </Button>
          <Button
            onClick={handleCashOut}
            disabled={!gameActive || playGameMutation.isPending || selectedTiles.length === 0}
            className="bg-green-500 hover:bg-green-600 text-white py-6 text-lg font-bold transition-all duration-200 transform hover:scale-105"
          >
            {playGameMutation.isPending ? "Processing..." : selectedTiles.length === 0 ? `Cash Out $${parseFloat(betAmount).toFixed(2)}` : `Cash Out $${(parseFloat(betAmount) * currentMultiplier).toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

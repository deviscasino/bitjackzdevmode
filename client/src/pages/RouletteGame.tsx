import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RouletteResult {
  result: string;
  winningNumber: number | string;
  multiplier: number;
  payout: number;
  newBalance: number;
}

// American roulette sequence: 00, 0, 1-36 in order
const rouletteNumbers = [
  { number: '00', color: 'green' }, { number: 0, color: 'green' },
  { number: 1, color: 'red' }, { number: 2, color: 'black' }, { number: 3, color: 'red' }, { number: 4, color: 'black' },
  { number: 5, color: 'red' }, { number: 6, color: 'black' }, { number: 7, color: 'red' }, { number: 8, color: 'black' },
  { number: 9, color: 'red' }, { number: 10, color: 'black' }, { number: 11, color: 'black' }, { number: 12, color: 'red' },
  { number: 13, color: 'black' }, { number: 14, color: 'red' }, { number: 15, color: 'black' }, { number: 16, color: 'red' },
  { number: 17, color: 'black' }, { number: 18, color: 'red' }, { number: 19, color: 'red' }, { number: 20, color: 'black' },
  { number: 21, color: 'red' }, { number: 22, color: 'black' }, { number: 23, color: 'red' }, { number: 24, color: 'black' },
  { number: 25, color: 'red' }, { number: 26, color: 'black' }, { number: 27, color: 'red' }, { number: 28, color: 'black' },
  { number: 29, color: 'black' }, { number: 30, color: 'red' }, { number: 31, color: 'black' }, { number: 32, color: 'red' },
  { number: 33, color: 'black' }, { number: 34, color: 'red' }, { number: 35, color: 'black' }, { number: 36, color: 'red' }
];

export default function RouletteGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedChip, setSelectedChip] = useState(10);
  const [selectedBets, setSelectedBets] = useState<{[key: string]: number}>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<number | string | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);
  const [isAnimationStopped, setIsAnimationStopped] = useState(false);


  const chipValues = [1, 2, 5, 10, 20, 50, 100];

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const playGameMutation = useMutation({
    mutationFn: async (gameData: { betAmount: number; betType: string; betValue?: number | string }) => {
      const response = await apiRequest("POST", "/api/games/roulette", gameData);
      return response.json() as Promise<RouletteResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      
      // Wait for spinning, then calculate stopping position
      setTimeout(() => {
        // Find the winning number's position in the slider
        const winningIndex = rouletteNumbers.findIndex(num => num.number === data.winningNumber);
        if (winningIndex !== -1) {
          // Calculate exact position to center the winning number under the indicator
          const tileWidth = 64;
          // The indicator is at the center of the container (left-1/2)
          // Container width is approximately 800px after padding, so center is at ~400px
          const containerWidth = 800;
          const containerCenter = containerWidth / 2;
          
          // Calculate how many complete cycles we've spun
          const cycleLength = rouletteNumbers.length * tileWidth;
          const currentCycle = Math.floor(wheelRotation / cycleLength);
          
          // Add 3 more full cycles for dramatic effect, then stop at winning number
          const targetCycle = currentCycle + 3;
          const basePosition = targetCycle * cycleLength;
          const winningTilePosition = winningIndex * tileWidth;
          // Position so the CENTER of the winning tile aligns with the center indicator
          const targetPosition = basePosition + winningTilePosition - containerCenter + (tileWidth / 2);
          
          // Stop the spinning animation and move to target
          stopSpinningAnimation(targetPosition);
        }
        
        // Show result after stopping
        setTimeout(() => {
          // Stop all animations immediately
          setIsAnimationStopped(true);
          setIsSpinning(false);
          setLastResult(data.winningNumber);
          
          // Cancel any remaining animation frames
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            setAnimationFrame(null);
          }
          
          if (data.result === "win") {
            toast({
              title: "Winner!",
              description: `Number ${data.winningNumber} - You won $${data.payout.toFixed(2)}!`,
            });
          } else {
            toast({
              title: "Better luck next time!",
              description: `Number ${data.winningNumber} - Your bet didn't win this time`,
              variant: "destructive",
            });
          }
          
          // Clear all bets after result is shown
          setTimeout(() => {
            setSelectedBets({});
          }, 3000);
        }, 1500); // Wait for deceleration
      }, 2000); // Spin for 2 seconds
    },
    onError: () => {
      setIsSpinning(false);
      toast({
        title: "Error",
        description: "Failed to process game",
        variant: "destructive",
      });
    },
  });

  const addBet = (betType: string, betValue?: number) => {
    const key = betValue !== undefined ? `${betType}-${betValue}` : betType;
    setSelectedBets(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + selectedChip
    }));
  };

  const clearBets = () => {
    setSelectedBets({});
  };

  const startSpinningAnimation = () => {
    let spinSpeed = 12; // pixels per frame for faster spinning
    const spin = () => {
      // Stop if game has ended
      if (isAnimationStopped) {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          setAnimationFrame(null);
        }
        return;
      }
      
      setWheelRotation(prev => {
        const newPos = prev + spinSpeed;
        // Keep position within reasonable bounds to prevent overflow
        const tileWidth = 64;
        const cycleLength = rouletteNumbers.length * tileWidth;
        return newPos % (cycleLength * 10); // Reset every 10 cycles
      });
      const frame = requestAnimationFrame(spin);
      setAnimationFrame(frame);
    };
    spin();
  };

  const stopSpinningAnimation = (targetPosition: number) => {
    // First stop the spinning animation
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      setAnimationFrame(null);
    }
    
    // Get current position and smoothly decelerate to target
    let currentPos = wheelRotation;
    let animationId: number;
    
    const decelerate = () => {
      const distance = targetPosition - currentPos;
      const speed = Math.max(Math.abs(distance) * 0.1, 1);
      
      // If we're close enough, snap to target and stop
      if (Math.abs(distance) < 2) {
        setWheelRotation(targetPosition);
        return;
      }
      
      // Move towards target
      currentPos += distance > 0 ? speed : -speed;
      setWheelRotation(currentPos);
      
      // Continue deceleration
      animationId = requestAnimationFrame(decelerate);
    };
    
    decelerate();
  };

  const handleSpin = () => {
    if (Object.keys(selectedBets).length === 0) {
      toast({
        title: "No bets placed",
        description: "Please place at least one bet before spinning",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    setIsAnimationStopped(false);
    startSpinningAnimation();
    
    // Pick the first bet for now (simplified)
    const firstBetKey = Object.keys(selectedBets)[0];
    const [betType, betValue] = firstBetKey.split('-');
    
    // Make the API call to get the winning number
    playGameMutation.mutate({
      betAmount: selectedBets[firstBetKey],
      betType,
      betValue: betValue ? (betValue === "00" ? "00" : parseInt(betValue)) : undefined
    });
  };

  const getTotalBets = () => {
    return Object.values(selectedBets).reduce((sum, bet) => sum + bet, 0);
  };

  const getNumberColor = (num: number | string) => {
    if (num === 0 || num === '00') return 'green';
    if (typeof num === 'string') return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  const getChipColor = (value: number) => {
    switch(value) {
      case 1: return 'bg-white text-black border-gray-400';
      case 2: return 'bg-pink-500 text-white border-pink-600';
      case 5: return 'bg-red-600 text-white border-red-700';
      case 10: return 'bg-blue-600 text-white border-blue-700';
      case 20: return 'bg-yellow-500 text-black border-yellow-600';
      case 50: return 'bg-green-600 text-white border-green-700';
      case 100: return 'bg-purple-600 text-white border-purple-700';
      default: return 'bg-gray-600 text-white border-gray-700';
    }
  };

  const renderChipOnBet = (betKey: string, amount: number) => {
    const chipValue = amount >= 100 ? 100 : amount >= 50 ? 50 : amount >= 20 ? 20 : amount >= 10 ? 10 : amount >= 5 ? 5 : amount >= 2 ? 2 : 1;
    const chipColor = getChipColor(chipValue);
    
    return (
      <div className={`absolute top-1 right-1 w-6 h-6 rounded-full border-2 ${chipColor} flex items-center justify-center text-xs font-bold z-10`}>
        ${chipValue}
      </div>
    );
  };

  return (
    <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-white hover:text-casino-gold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="text-white text-lg">
            Balance: ${balance?.balance?.toFixed(2) || "0.00"}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Roulette</h1>
          <p className="text-gray-400">Place your bets and spin the wheel!</p>
        </div>

        {/* Roulette Number Slider */}
        <div className="mb-6">
          <div className="relative overflow-hidden bg-gray-900 rounded-lg p-4 h-20">
            <div 
              className="flex"
              style={{ 
                transform: `translateX(-${wheelRotation}px)`,
                willChange: 'transform'
              }}
            >
              {/* Create extended sequence for smooth infinite scrolling */}
              {Array.from({ length: 50 }, (_, repetition) => 
                rouletteNumbers.map((item, index) => (
                  <div
                    key={`${repetition}-${index}`}
                    className={`flex-shrink-0 w-16 h-16 flex items-center justify-center text-white font-bold text-lg border-2 ${
                      item.color === 'red' ? 'bg-red-600 border-red-500' : 
                      item.color === 'black' ? 'bg-gray-800 border-gray-700' : 'bg-green-600 border-green-500'
                    }`}
                  >
                    {item.number}
                  </div>
                ))
              ).flat()}
            </div>
            
            {/* Winning indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
              <div className="w-1 h-16 bg-yellow-400 rounded-full shadow-lg"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400"></div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400"></div>
              </div>
            </div>
            
            {/* Result display */}
            {lastResult !== null && (
              <div className="absolute top-2 left-2 bg-black bg-opacity-75 rounded px-3 py-1 z-10">
                <span className="text-white text-sm font-bold">
                  Winner: <span className={`${getNumberColor(lastResult) === 'red' ? 'text-red-400' : getNumberColor(lastResult) === 'green' ? 'text-green-400' : 'text-white'}`}>{lastResult}</span>
                </span>
              </div>
            )}
            
            {/* Spinning indicator */}
            {isSpinning && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 rounded px-3 py-1 z-10">
                <span className="text-white text-sm font-bold animate-pulse">Spinning...</span>
              </div>
            )}
          </div>
        </div>

        {/* Betting Layout - Mobile Responsive */}
        <div className="bg-gray-800 rounded-lg p-2 sm:p-4 mb-4">
          {/* Mobile Layout */}
          <div className="block lg:hidden">
            {/* Zero section - Mobile */}
            <div className="flex justify-center gap-2 mb-3">
              <button
                onClick={() => addBet("number", 0)}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded text-sm font-bold min-h-[48px] min-w-[48px] relative touch-manipulation"
              >
                0
                {selectedBets["number-0"] && renderChipOnBet("number-0", selectedBets["number-0"])}
              </button>
              <button
                onClick={() => addBet("number", "00")}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded text-sm font-bold min-h-[48px] min-w-[48px] relative touch-manipulation"
              >
                00
                {selectedBets["number-00"] && renderChipOnBet("number-00", selectedBets["number-00"])}
              </button>
            </div>

            {/* Numbers Grid - Mobile Scrollable */}
            <div className="overflow-x-auto mb-3">
              <div className="min-w-[600px]">
                {/* Numbers 1-36 in proper roulette layout */}
                <div className="grid grid-cols-12 gap-1 mb-2">
                  {/* Row 1: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 */}
                  {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((num) => {
                    const color = getNumberColor(num);
                    return (
                      <button
                        key={num}
                        onClick={() => addBet("number", num)}
                        className={`${
                          color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                        } text-white p-2 rounded text-sm font-bold min-h-[48px] relative touch-manipulation`}
                      >
                        {num}
                        {selectedBets[`number-${num}`] && renderChipOnBet(`number-${num}`, selectedBets[`number-${num}`])}
                      </button>
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-12 gap-1 mb-2">
                  {/* Row 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 */}
                  {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map((num) => {
                    const color = getNumberColor(num);
                    return (
                      <button
                        key={num}
                        onClick={() => addBet("number", num)}
                        className={`${
                          color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                        } text-white p-2 rounded text-sm font-bold min-h-[48px] relative touch-manipulation`}
                      >
                        {num}
                        {selectedBets[`number-${num}`] && renderChipOnBet(`number-${num}`, selectedBets[`number-${num}`])}
                      </button>
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-12 gap-1 mb-3">
                  {/* Row 3: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 */}
                  {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map((num) => {
                    const color = getNumberColor(num);
                    return (
                      <button
                        key={num}
                        onClick={() => addBet("number", num)}
                        className={`${
                          color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                        } text-white p-2 rounded text-sm font-bold min-h-[48px] relative touch-manipulation`}
                      >
                        {num}
                        {selectedBets[`number-${num}`] && renderChipOnBet(`number-${num}`, selectedBets[`number-${num}`])}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Outside Bets - Mobile */}
            <div className="space-y-2">
              {/* Dozens */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addBet("column", 1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded text-sm font-bold min-h-[48px] relative touch-manipulation"
                >
                  1-12
                  {selectedBets["column-1"] && renderChipOnBet("column-1", selectedBets["column-1"])}
                </button>
                <button
                  onClick={() => addBet("column", 2)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded text-sm font-bold min-h-[48px] relative touch-manipulation"
                >
                  13-24
                  {selectedBets["column-2"] && renderChipOnBet("column-2", selectedBets["column-2"])}
                </button>
                <button
                  onClick={() => addBet("column", 3)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded text-sm font-bold min-h-[48px] relative touch-manipulation"
                >
                  25-36
                  {selectedBets["column-3"] && renderChipOnBet("column-3", selectedBets["column-3"])}
                </button>
              </div>

              {/* Even Money Bets - Two Rows */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addBet("low")}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-sm font-bold min-h-[48px] relative touch-manipulation"
                >
                  1-18
                  {selectedBets["low"] && renderChipOnBet("low", selectedBets["low"])}
                </button>
                <button
                  onClick={() => addBet("even")}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-sm font-bold min-h-[48px] relative touch-manipulation"
                >
                  EVEN
                  {selectedBets["even"] && renderChipOnBet("even", selectedBets["even"])}
                </button>
                <button
                  onClick={() => addBet("red")}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded text-sm font-bold min-h-[48px] relative touch-manipulation"
                >
                  RED
                  {selectedBets["red"] && renderChipOnBet("red", selectedBets["red"])}
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addBet("black")}
                  className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded text-sm font-bold min-h-[48px] relative touch-manipulation"
                >
                  BLACK
                  {selectedBets["black"] && renderChipOnBet("black", selectedBets["black"])}
                </button>
                <button
                  onClick={() => addBet("odd")}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-sm font-bold min-h-[48px] relative touch-manipulation"
                >
                  ODD
                  {selectedBets["odd"] && renderChipOnBet("odd", selectedBets["odd"])}
                </button>
                <button
                  onClick={() => addBet("high")}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded text-sm font-bold min-h-[48px] relative touch-manipulation"
                >
                  19-36
                  {selectedBets["high"] && renderChipOnBet("high", selectedBets["high"])}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex gap-2">
            {/* Zero Column */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => addBet("number", 0)}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded text-sm font-bold h-8 w-12 relative"
              >
                0
                {selectedBets["number-0"] && renderChipOnBet("number-0", selectedBets["number-0"])}
              </button>
              <button
                onClick={() => addBet("number", "00")}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded text-sm font-bold h-8 w-12 relative"
              >
                00
                {selectedBets["number-00"] && renderChipOnBet("number-00", selectedBets["number-00"])}
              </button>
            </div>

            {/* Main Numbers Grid (3 rows x 12 columns) */}
            <div className="flex-1">
              {/* Numbers 1-36 in proper roulette layout */}
              <div className="grid grid-cols-12 gap-1 mb-2">
                {/* Row 1: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 */}
                {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((num) => {
                  const color = getNumberColor(num);
                  return (
                    <button
                      key={num}
                      onClick={() => addBet("number", num)}
                      className={`${
                        color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                      } text-white p-2 rounded text-sm font-bold h-12 relative`}
                    >
                      {num}
                      {selectedBets[`number-${num}`] && renderChipOnBet(`number-${num}`, selectedBets[`number-${num}`])}
                    </button>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-12 gap-1 mb-2">
                {/* Row 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 */}
                {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map((num) => {
                  const color = getNumberColor(num);
                  return (
                    <button
                      key={num}
                      onClick={() => addBet("number", num)}
                      className={`${
                        color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                      } text-white p-2 rounded text-sm font-bold h-12 relative`}
                    >
                      {num}
                      {selectedBets[`number-${num}`] && renderChipOnBet(`number-${num}`, selectedBets[`number-${num}`])}
                    </button>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-12 gap-1 mb-3">
                {/* Row 3: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 */}
                {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map((num) => {
                  const color = getNumberColor(num);
                  return (
                    <button
                      key={num}
                      onClick={() => addBet("number", num)}
                      className={`${
                        color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                      } text-white p-2 rounded text-sm font-bold h-12 relative`}
                    >
                      {num}
                      {selectedBets[`number-${num}`] && renderChipOnBet(`number-${num}`, selectedBets[`number-${num}`])}
                    </button>
                  );
                })}
              </div>

              {/* Column Bets */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                <button
                  onClick={() => addBet("column", 1)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold col-span-1 relative"
                >
                  1 to 12
                  {selectedBets["column-1"] && renderChipOnBet("column-1", selectedBets["column-1"])}
                </button>
                <button
                  onClick={() => addBet("column", 2)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold col-span-1 relative"
                >
                  13 to 24
                  {selectedBets["column-2"] && renderChipOnBet("column-2", selectedBets["column-2"])}
                </button>
                <button
                  onClick={() => addBet("column", 3)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold col-span-1 relative"
                >
                  25 to 36
                  {selectedBets["column-3"] && renderChipOnBet("column-3", selectedBets["column-3"])}
                </button>
                <div className="col-span-1">
                  <button
                    onClick={() => addBet("2to1-top")}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded text-xs font-bold w-full h-8 relative"
                  >
                    2:1
                    {selectedBets["2to1-top"] && renderChipOnBet("2to1-top", selectedBets["2to1-top"])}
                  </button>
                </div>
              </div>

              {/* Outside Bets */}
              <div className="grid grid-cols-6 gap-1">
                <button
                  onClick={() => addBet("low")}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold relative"
                >
                  1-18
                  {selectedBets["low"] && renderChipOnBet("low", selectedBets["low"])}
                </button>
                <button
                  onClick={() => addBet("even")}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold relative"
                >
                  Even
                  {selectedBets["even"] && renderChipOnBet("even", selectedBets["even"])}
                </button>
                <button
                  onClick={() => addBet("red")}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded text-sm font-bold relative"
                >
                  Red
                  {selectedBets["red"] && renderChipOnBet("red", selectedBets["red"])}
                </button>
                <button
                  onClick={() => addBet("black")}
                  className="bg-gray-900 hover:bg-gray-800 text-white p-2 rounded text-sm font-bold relative"
                >
                  Black
                  {selectedBets["black"] && renderChipOnBet("black", selectedBets["black"])}
                </button>
                <button
                  onClick={() => addBet("odd")}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold relative"
                >
                  Odd
                  {selectedBets["odd"] && renderChipOnBet("odd", selectedBets["odd"])}
                </button>
                <button
                  onClick={() => addBet("high")}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold relative"
                >
                  19-36
                  {selectedBets["high"] && renderChipOnBet("high", selectedBets["high"])}
                </button>
              </div>
            </div>

            {/* Right side 2:1 bets */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => addBet("2to1-1")}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold h-12 w-12 relative"
              >
                2:1
                {selectedBets["2to1-1"] && renderChipOnBet("2to1-1", selectedBets["2to1-1"])}
              </button>
              <button
                onClick={() => addBet("2to1-2")}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold h-12 w-12 relative"
              >
                2:1
                {selectedBets["2to1-2"] && renderChipOnBet("2to1-2", selectedBets["2to1-2"])}
              </button>
              <button
                onClick={() => addBet("2to1-3")}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold h-12 w-12 relative"
              >
                2:1
                {selectedBets["2to1-3"] && renderChipOnBet("2to1-3", selectedBets["2to1-3"])}
              </button>
            </div>
          </div>
        </div>

        {/* Betting Controls - Mobile Responsive */}
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-white text-sm sm:text-base font-bold">Select Chip Value</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                {chipValues.map((value) => (
                  <button
                    key={value}
                    onClick={() => setSelectedChip(value)}
                    className={`min-h-[48px] min-w-[48px] rounded-full border-2 font-bold text-xs sm:text-sm flex items-center justify-center transition-all touch-manipulation ${
                      selectedChip === value 
                        ? `${getChipColor(value)} ring-2 ring-white scale-105` 
                        : `${getChipColor(value)} opacity-70 hover:opacity-100`
                    }`}
                  >
                    ${value}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-white text-xs sm:text-sm">
              <div className="bg-gray-700 rounded p-2 text-center">
                <div className="font-bold casino-neon-purple">${selectedChip}</div>
                <div className="text-gray-300">Selected</div>
              </div>
              <div className="bg-gray-700 rounded p-2 text-center">
                <div className="font-bold text-green-400">${getTotalBets().toFixed(2)}</div>
                <div className="text-gray-300">Total Bets</div>
              </div>
              <div className="bg-gray-700 rounded p-2 text-center">
                <div className="font-bold text-blue-400">{Object.keys(selectedBets).length}</div>
                <div className="text-gray-300">Active Bets</div>
              </div>
              {lastResult !== null && (
                <div className="bg-gray-700 rounded p-2 text-center">
                  <div className={`font-bold ${getNumberColor(lastResult) === 'red' ? 'text-red-500' : getNumberColor(lastResult) === 'green' ? 'text-green-500' : 'text-white'}`}>
                    {lastResult}
                  </div>
                  <div className="text-gray-300">Last Result</div>
                </div>
              )}
            </div>

            {/* Current Bets Preview - Mobile */}
            {Object.keys(selectedBets).length > 0 && (
              <div className="text-white text-xs bg-gray-700 rounded p-2">
                <h3 className="font-bold mb-1">Current Bets ({Object.keys(selectedBets).length}):</h3>
                <div className="max-h-16 overflow-y-auto space-y-1">
                  {Object.entries(selectedBets).slice(0, 2).map(([key, amount]) => (
                    <div key={key} className="flex justify-between">
                      <span className="truncate">{key.replace('-', ' ')}</span>
                      <span className="font-bold">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {Object.keys(selectedBets).length > 2 && (
                    <p className="text-gray-400">+{Object.keys(selectedBets).length - 2} more bets...</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleSpin}
              disabled={isSpinning || playGameMutation.isPending}
              className="bg-casino-gold hover:bg-yellow-500 text-black font-bold h-12 sm:h-14 text-base touch-manipulation"
            >
              {isSpinning ? "Spinning..." : "SPIN"}
            </Button>
            
            <Button
              onClick={clearBets}
              className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 sm:h-14 touch-manipulation"
              disabled={isSpinning}
            >
              Clear All ({Object.keys(selectedBets).length})
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
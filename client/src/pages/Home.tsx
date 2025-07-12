import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

import turboBonus from "@assets/banner_1752157869135.jpg";
import bitjackzLogo from "@assets/image_1752084254541.png";
import crashBanner from "@assets/Crash_1752128723457.jpg";
import cointossBanner from "@assets/Coin flip_1752128723456.jpg";
import diceBanner from "@assets/Dice_1752128723456.jpg";
import limboBanner from "@assets/limbo_1752128723455.jpg";
import minesBanner from "@assets/mines_1752128723453.jpg";
import rouletteBanner from "@assets/roulette_1752128723455.jpg";

interface GameResult {
  id: number;
  gameType: string;
  betAmount: number;
  multiplier: number;
  payout: number;
  result: string;
  timestamp: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: recentGames, isLoading } = useQuery<GameResult[]>({
    queryKey: ["/api/games/recent"],
  });





  return (
    <div className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-6">
          <div className="relative overflow-hidden rounded-2xl">
            <img 
              src={turboBonus} 
              alt="Turbo Bonus - 250% On Deposit" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Hot Games Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white">🔥 Hot Games</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/crash')}>
              <img 
                src={crashBanner} 
                alt="Crash Game" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/mines')}>
              <img 
                src={minesBanner} 
                alt="Mines Game" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/roulette')}>
              <img 
                src={rouletteBanner} 
                alt="Roulette Game" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* High RTP Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-purple-400 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white">💎 High RTP</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/limbo')}>
              <img 
                src={limboBanner} 
                alt="Limbo Game" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/roulette')}>
              <img 
                src={rouletteBanner} 
                alt="Roulette Game" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/crash')}>
              <img 
                src={crashBanner} 
                alt="Crash Game" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Games Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white">🎮 Games</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/crash')}>
              <img 
                src={crashBanner} 
                alt="Crash Game" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/coinflip')}>
              <img 
                src={cointossBanner} 
                alt="Coin Toss Game" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/limbo')}>
              <img 
                src={limboBanner} 
                alt="Limbo Game" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/dice')}>
              <img 
                src={diceBanner} 
                alt="Dice Game" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/mines')}>
              <img 
                src={minesBanner} 
                alt="Mines Game" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300 aspect-[3/4]" onClick={() => setLocation('/roulette')}>
              <img 
                src={rouletteBanner} 
                alt="Roulette Game" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}

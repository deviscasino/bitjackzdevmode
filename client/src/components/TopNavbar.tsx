import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Diamond, Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import WalletModal from "./WalletModal";
import bitjackzLogo from "@assets/image_1752084254541.png";

export default function TopNavbar() {
  const [showWallet, setShowWallet] = useState(false);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 casino-bg-blue/95 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={bitjackzLogo} 
                  alt="Casino Logo" 
                  className="h-16 sm:h-20 object-contain"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="balance-glow bg-purple-500/20 px-2 sm:px-4 py-2 rounded-lg flex items-center space-x-1 sm:space-x-2">
                <Wallet className="casino-neon-purple" size={16} />
                <span className="font-semibold text-sm sm:text-base">
                  ${balance?.balance.toFixed(2) || "0.00"}
                </span>
              </div>
              <Button
                onClick={() => setShowWallet(true)}
                className="bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm sm:text-base px-3 py-2"
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <WalletModal 
        isOpen={showWallet} 
        onClose={() => setShowWallet(false)} 
        currentBalance={balance?.balance || 0}
      />
    </>
  );
}

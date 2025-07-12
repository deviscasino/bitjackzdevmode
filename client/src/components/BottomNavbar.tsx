import { Home, Wallet } from "lucide-react";
import { useLocation } from "wouter";

export default function BottomNavbar() {
  const [location, setLocation] = useLocation();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
      isActive: location === "/"
    },
    {
      icon: Wallet,
      label: "Wallet",
      path: "/wallet",
      isActive: location === "/wallet"
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 casino-bg-blue/95 backdrop-blur-md border-t border-purple-500/20 safe-area-pb">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center justify-center space-y-1 py-2 px-4 rounded-lg transition-colors duration-200 min-w-0 flex-1 ${
                  item.isActive
                    ? "casino-neon-purple bg-purple-500/20"
                    : "text-gray-400 hover:text-white hover:bg-purple-500/10"
                }`}
              >
                <IconComponent size={20} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
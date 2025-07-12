import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Minus, Wallet, Copy, Check, CreditCard, Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: number;
  type: "deposit" | "withdraw" | "win" | "loss";
  amount: number;
  description: string;
  timestamp: string;
}

export default function WalletPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/wallet/deposit", { amount });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Deposit Successful",
        description: `Added $${depositAmount} to your wallet`,
      });
      setDepositAmount("");
    },
    onError: (error) => {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; address?: string }) => {
      const response = await apiRequest("POST", "/api/wallet/withdraw", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Withdrawal Successful",
        description: `Withdrew $${withdrawAmount} from your wallet`,
      });
      setWithdrawAmount("");
      setCryptoAddress("");
    },
    onError: (error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }
    depositMutation.mutate(amount);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }
    if (amount > (balance?.balance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds to withdraw this amount",
        variant: "destructive",
      });
      return;
    }
    withdrawMutation.mutate({ amount, address: cryptoAddress });
  };

  const copyAddress = () => {
    const demoAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
    navigator.clipboard.writeText(demoAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Address Copied",
      description: "Crypto address copied to clipboard",
    });
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="casino-neon-purple hover:text-white self-start"
          >
            <ArrowLeft className="mr-2" size={16} />
            <span className="hidden sm:inline">Back to Games</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold casino-neon-purple">WALLET</h2>
          <div className="hidden sm:block w-24"></div>
        </div>

        {/* Balance Display */}
        <Card className="casino-bg-blue border-purple-500/20 mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Current Balance</div>
              <div className="text-4xl sm:text-5xl font-bold casino-neon-purple mb-4 neon-glow">
                ${balance?.balance.toFixed(2) || "0.00"}
              </div>
              <div className="flex justify-center items-center space-x-2 text-gray-400">
                <Wallet size={16} />
                <span className="text-sm">Available for games and withdrawal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit/Withdraw Tabs */}
        <Card className="casino-bg-blue border-purple-500/20 mb-6">
          <CardHeader>
            <CardTitle className="casino-neon-purple">Manage Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-casino-navy/50">
                <TabsTrigger value="deposit" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  <Plus className="mr-2" size={16} />
                  Deposit
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  <Minus className="mr-2" size={16} />
                  Withdraw
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Deposit Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 casino-neon-purple">$</span>
                      <Input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="pl-8 casino-bg border-purple-500/20 text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount("10")}
                        className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                      >
                        $10
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount("50")}
                        className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                      >
                        $50
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount("100")}
                        className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                      >
                        $100
                      </Button>
                    </div>
                  </div>

                  <div className="bg-casino-navy/50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Bitcoin className="casino-neon-purple" size={20} />
                      <span className="font-semibold">Bitcoin Address</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-casino-blue/50 p-2 rounded">
                      <span className="text-sm font-mono flex-1">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyAddress}
                        className="casino-neon-purple hover:text-white"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Send Bitcoin to this address and it will be converted to USD in your wallet
                    </p>
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={depositMutation.isPending}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold"
                  >
                    {depositMutation.isPending ? "Processing..." : "Deposit Funds"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="withdraw" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Withdrawal Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 casino-neon-purple">$</span>
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="pl-8 casino-bg border-purple-500/20 text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount("25")}
                        className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                      >
                        $25
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount("50")}
                        className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                      >
                        $50
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount((balance?.balance || 0).toFixed(2))}
                        className="flex-1 bg-purple-500/20 border-purple-500/20 casino-neon-purple hover:bg-purple-500/30"
                      >
                        All
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Crypto Address (Optional)</Label>
                    <Input
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      className="casino-bg border-purple-500/20 text-white"
                      placeholder="Enter your crypto address for withdrawal"
                    />
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawMutation.isPending}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold"
                  >
                    {withdrawMutation.isPending ? "Processing..." : "Withdraw Funds"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="casino-bg-blue border-purple-500/20">
          <CardHeader>
            <CardTitle className="casino-neon-purple">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-casino-navy/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === "deposit" ? "bg-green-500/20 text-green-400" :
                        transaction.type === "withdraw" ? "bg-red-500/20 text-red-400" :
                        transaction.type === "win" ? "bg-casino-gold/20 text-casino-gold" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {transaction.type === "deposit" && <Plus size={16} />}
                        {transaction.type === "withdraw" && <Minus size={16} />}
                        {transaction.type === "win" && <CreditCard size={16} />}
                        {transaction.type === "loss" && <CreditCard size={16} />}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{transaction.description}</div>
                        <div className="text-sm text-gray-400">{new Date(transaction.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.type === "deposit" || transaction.type === "win" ? "text-green-400" : "text-red-400"
                    }`}>
                      {transaction.type === "deposit" || transaction.type === "win" ? "+" : "-"}
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Wallet size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
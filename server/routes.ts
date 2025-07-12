import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  crashGameSchema, 
  coinFlipGameSchema, 
  limboGameSchema, 
  diceGameSchema, 
  minesGameSchema, 
  rouletteGameSchema 
} from "@shared/schema";

// Simple session store for demo purposes
const userSessions = new Map<string, number>(); // sessionId -> userId

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user balance
  app.get("/api/balance", async (req, res) => {
    try {
      // In production, you'd get user ID from authentication token/session
      // For now, using the last authenticated user or default demo user
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ balance: user.balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to get balance" });
    }
  });

  // Generate initial crash point using the new fair formula
  function generateCrashPoint() {
    // Generate crash points with average around 1.9x, max 3.48x
    // Using exponential distribution that averages to 1.9
    const random = Math.random();
    const lambda = 1 / 0.9; // This gives us an average of 1.9 when we add 1.0
    const crashPoint = Math.max(1.01, Math.min(3.48, 1.0 + (-Math.log(random) / lambda)));
    return Math.round(crashPoint * 100) / 100;
  }

  // Enhanced crash game engine - completely rebuilt for smooth performance
  class CrashGameEngine {
    private gameId = 1;
    private currentGame: any = null;
    private gameTimer: NodeJS.Timeout | null = null;
    private updateInterval: NodeJS.Timeout | null = null;

    constructor() {
      this.initializeNewGame();
      this.startUpdateLoop();
    }

    private initializeNewGame() {
      this.currentGame = {
        gameId: `crash_global_${this.gameId++}`,
        status: 'countdown',
        crashPoint: generateCrashPoint(),
        currentMultiplier: 1.00,
        gameStartTime: Date.now() + 5000,
        isCrashed: false,
        playerBets: new Map()
      };
      
      console.log(`New game: ${this.currentGame.gameId}, crash point: ${this.currentGame.crashPoint}x`);
      
      // Schedule game activation
      this.gameTimer = setTimeout(() => {
        if (this.currentGame?.status === 'countdown') {
          this.currentGame.status = 'active';
          this.currentGame.gameStartTime = Date.now();
          console.log(`Game ${this.currentGame.gameId} now active`);
        }
      }, 5000);
    }

    private startUpdateLoop() {
      this.updateInterval = setInterval(() => {
        if (this.currentGame?.status === 'active' && !this.currentGame.isCrashed) {
          const elapsed = Date.now() - this.currentGame.gameStartTime;
          const newMultiplier = 1.0 + (elapsed / 120) * 0.01; // Slower, smoother growth
          
          if (newMultiplier >= this.currentGame.crashPoint) {
            this.handleCrash();
          } else {
            this.currentGame.currentMultiplier = Math.round(newMultiplier * 100) / 100;
          }
        } else if (this.currentGame?.status === 'countdown') {
          // Keep multiplier at 1.00 during countdown
          this.currentGame.currentMultiplier = 1.00;
        }
      }, 16); // 60 FPS for ultra-smooth animation
    }

    private handleCrash() {
      this.currentGame.isCrashed = true;
      this.currentGame.status = 'crashed';
      this.currentGame.currentMultiplier = this.currentGame.crashPoint;
      
      console.log(`Game crashed at ${this.currentGame.crashPoint}x, restarting in 3 seconds...`);
      
      // Process losing bets
      this.currentGame.playerBets.forEach((bet: any, userId: number) => {
        if (!bet.cashedOut) {
          storage.createGameResult({
            userId,
            gameType: "crash",
            betAmount: bet.betAmount,
            multiplier: this.currentGame.crashPoint,
            payout: 0,
            result: "loss",
          });
        }
      });
      
      // Clean restart after 3 seconds
      setTimeout(() => {
        this.initializeNewGame();
      }, 3000);
    }

    getGameState() {
      return this.currentGame;
    }

    placeBet(userId: number, betAmount: number): boolean {
      if (this.currentGame?.status !== 'countdown') return false;
      
      this.currentGame.playerBets.set(userId, {
        betAmount,
        cashedOut: false,
        cashedOutAt: null
      });
      
      return true;
    }

    cashOut(userId: number) {
      const bet = this.currentGame?.playerBets.get(userId);
      if (!bet || bet.cashedOut || this.currentGame?.isCrashed || this.currentGame?.status !== 'active') {
        return null;
      }
      
      bet.cashedOut = true;
      bet.cashedOutAt = this.currentGame.currentMultiplier;
      
      return {
        multiplier: this.currentGame.currentMultiplier,
        payout: bet.betAmount * this.currentGame.currentMultiplier
      };
    }

    cleanup() {
      if (this.gameTimer) clearTimeout(this.gameTimer);
      if (this.updateInterval) clearInterval(this.updateInterval);
    }
  }

  // Initialize the new crash game engine
  const crashGameEngine = new CrashGameEngine();

  // Old crash game code removed - now using CrashGameEngine

  // Join the global crash game with a bet
  app.post("/api/games/crash/bet", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid bet amount" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Try to place bet using new engine
      if (!crashGameEngine.placeBet(userId, amount)) {
        return res.status(400).json({ error: "Betting is only allowed during countdown phase" });
      }

      // Deduct bet amount from balance
      await storage.updateUserBalance(userId, user.balance - amount);

      const game = crashGameEngine.getGameState();
      console.log(`Bet placed by user ${userId}: $${amount}, Game: ${game.gameId}`);
      
      res.json({
        gameId: game.gameId,
        message: "Bet placed! Watch the rocket fly!",
        currentStatus: game.status
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to place bet" });
    }
  });

  // Get global crash game status
  app.get("/api/games/crash/status/:gameId", async (req, res) => {
    try {
      const game = crashGameEngine.getGameState();
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const playerBet = game.playerBets.get(userId);

      res.json({
        gameId: game.gameId,
        status: game.status,
        currentMultiplier: game.currentMultiplier,
        crashPoint: game.crashPoint,
        isCrashed: game.isCrashed,
        cashedOut: playerBet?.cashedOut || false,
        cashedOutAt: playerBet?.cashedOutAt || null,
        countdownStartTime: game.gameStartTime - 5000,
        gameStartTime: game.gameStartTime
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get game status" });
    }
  });

  // Cash out from global crash game
  app.post("/api/games/crash/cashout/:gameId", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      
      const cashoutResult = crashGameEngine.cashOut(userId);
      if (!cashoutResult) {
        return res.status(400).json({ error: "Cannot cash out - no active bet or game crashed" });
      }

      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUserBalance(userId, user.balance + cashoutResult.payout);
      }

      const game = crashGameEngine.getGameState();
      const playerBet = game.playerBets.get(userId);

      // Record win
      await storage.createGameResult({
        userId,
        gameType: "crash",
        betAmount: playerBet.betAmount,
        multiplier: cashoutResult.multiplier,
        payout: cashoutResult.payout,
        result: "win",
      });

      res.json({
        result: "win",
        message: `Cashed out at ${cashoutResult.multiplier.toFixed(2)}x!`,
        payoutAmount: Math.round(cashoutResult.payout * 100) / 100,
        multiplier: Math.round(cashoutResult.multiplier * 100) / 100
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to cash out" });
    }
  });

  // Coin flip game
  app.post("/api/games/coinflip", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const gameData = coinFlipGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const result = Math.random() < 0.5 ? "heads" : "tails";
      const won = result === gameData.choice;
      // Apply 93% RTP to coin flip - 2x multiplier becomes 1.86x
      const payout = won ? gameData.betAmount * 2 * 0.93 : 0;
      
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "coinflip",
        betAmount: gameData.betAmount,
        multiplier: won ? 1.86 : 0,
        payout,
        result: won ? "win" : "loss",
      });
      
      res.json({
        result: won ? "win" : "loss",
        flipResult: result,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Limbo game
  app.post("/api/games/limbo", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const gameData = limboGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Generate random multiplier using the formula: 1/(0-1) * 93/100 with min 1x and max 10.56x
      const randomValue = Math.random();
      const rawMultiplier = 1 / randomValue * 0.93;
      const randomMultiplier = Math.max(1.00, Math.min(rawMultiplier, 10.56));
      
      const won = randomMultiplier >= gameData.target;
      const payout = won ? gameData.betAmount * gameData.target : 0;
      
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "limbo",
        betAmount: gameData.betAmount,
        multiplier: won ? gameData.target : 0,
        payout,
        result: won ? "win" : "loss",
      });
      
      res.json({
        result: won ? "win" : "loss",
        randomMultiplier,
        target: gameData.target,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Dice game
  app.post("/api/games/dice", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const gameData = diceGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const roll = Math.floor(Math.random() * 100) + 1;
      const won = gameData.isOver ? roll > gameData.target : roll < gameData.target;
      const winChance = gameData.isOver ? (100 - gameData.target) : gameData.target;
      // Apply 93% RTP to the multiplier calculation
      const multiplier = won ? (100 / winChance) * 0.93 : 0;
      const payout = won ? gameData.betAmount * multiplier : 0;
      
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "dice",
        betAmount: gameData.betAmount,
        multiplier,
        payout,
        result: won ? "win" : "loss",
      });
      
      res.json({
        result: won ? "win" : "loss",
        roll,
        target: gameData.target,
        isOver: gameData.isOver,
        multiplier,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Mines game
  app.post("/api/games/mines", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const gameData = minesGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Only process cashouts, not mine hits (frontend handles mine detection)
      if (gameData.selectedTiles && gameData.selectedTiles.length > 0) {
        // Calculate multiplier based on tiles revealed and mines (for cashouts only)
        const tilesRevealed = gameData.selectedTiles.length;
        const safeTiles = 25 - gameData.minesCount;
        const multiplier = Math.pow(safeTiles / (safeTiles - tilesRevealed + 1), tilesRevealed) * 0.93; // Apply 93% RTP
        
        const payout = gameData.betAmount * multiplier;
        const newBalance = user.balance - gameData.betAmount + payout;
        await storage.updateUserBalance(userId, newBalance);
        
        await storage.createGameResult({
          userId,
          gameType: "mines",
          betAmount: gameData.betAmount,
          multiplier,
          payout,
          result: "win",
        });
        
        res.json({
          result: "win",
          minePositions: [], // Don't send mine positions for cashouts
          multiplier,
          payout,
          newBalance,
        });
      } else {
        // No tiles selected - just return current balance
        res.json({
          result: "loss",
          minePositions: [],
          multiplier: 0,
          payout: 0,
          newBalance: user.balance,
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Mines game - handle mine hits
  app.post("/api/games/mines/loss", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const { betAmount } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      
      // Deduct bet amount for mine hit
      const newBalance = user.balance - betAmount;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "mines",
        betAmount,
        multiplier: 0,
        payout: 0,
        result: "loss",
      });
      
      res.json({ newBalance });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Roulette game
  app.post("/api/games/roulette", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const gameData = rouletteGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // American roulette: 0, 00, 1-36 (38 total numbers)
      const rouletteOutcomes = [0, "00", ...Array.from({ length: 36 }, (_, i) => i + 1)];
      const winningNumber = rouletteOutcomes[Math.floor(Math.random() * 38)];
      let won = false;
      let multiplier = 0;
      
      if (gameData.betType === "number" && gameData.betValue === winningNumber) {
        won = true;
        multiplier = 36 * 0.93; // Apply 93% RTP
      } else if (gameData.betType === "red" && typeof winningNumber === 'number' && isRed(winningNumber)) {
        won = true;
        multiplier = 2 * 0.93; // Apply 93% RTP
      } else if (gameData.betType === "black" && typeof winningNumber === 'number' && isBlack(winningNumber)) {
        won = true;
        multiplier = 2 * 0.93; // Apply 93% RTP
      } else if (gameData.betType === "odd" && typeof winningNumber === 'number' && winningNumber % 2 === 1 && winningNumber !== 0) {
        won = true;
        multiplier = 2 * 0.93; // Apply 93% RTP
      } else if (gameData.betType === "even" && typeof winningNumber === 'number' && winningNumber % 2 === 0 && winningNumber !== 0) {
        won = true;
        multiplier = 2 * 0.93; // Apply 93% RTP
      } else if (gameData.betType === "high" && typeof winningNumber === 'number' && winningNumber >= 19 && winningNumber <= 36) {
        won = true;
        multiplier = 2 * 0.93; // Apply 93% RTP
      } else if (gameData.betType === "low" && typeof winningNumber === 'number' && winningNumber >= 1 && winningNumber <= 18) {
        won = true;
        multiplier = 2 * 0.93; // Apply 93% RTP
      }
      
      const payout = won ? gameData.betAmount * multiplier : 0;
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "roulette",
        betAmount: gameData.betAmount,
        multiplier: won ? multiplier : 0,
        payout,
        result: won ? "win" : "loss",
      });
      
      res.json({
        result: won ? "win" : "loss",
        winningNumber,
        multiplier,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Get recent game results
  app.get("/api/games/recent", async (req, res) => {
    try {
      const { gameType, limit } = req.query;
      const results = await storage.getRecentGameResults(
        gameType as string,
        limit ? parseInt(limit as string) : 10
      );
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent games" });
    }
  });

  // Get casino statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const allResults = await storage.getRecentGameResults(undefined, 1000);
      
      // Calculate total won today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysWins = allResults.filter(result => 
        result.timestamp && new Date(result.timestamp) >= today && result.result === "win"
      );
      const totalWonToday = todaysWins.reduce((sum, result) => sum + result.payout, 0);
      
      // Count active players (simplified - count recent unique players)
      const recentResults = allResults.filter(result => 
        result.timestamp && new Date(result.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      const activePlayers = new Set(recentResults.map(result => result.userId)).size;
      
      // Get game-specific stats
      const gameStats = {
        crash: {
          lastMultiplier: allResults.find(r => r.gameType === "crash")?.multiplier || 2.65,
          players: recentResults.filter(r => r.gameType === "crash").length
        },
        coinflip: {
          winRate: allResults.filter(r => r.gameType === "coinflip" && r.result === "win").length / 
                   Math.max(allResults.filter(r => r.gameType === "coinflip").length, 1) * 100,
          players: recentResults.filter(r => r.gameType === "coinflip").length
        },
        limbo: {
          avgMultiplier: allResults.filter(r => r.gameType === "limbo").reduce((sum, r) => sum + r.multiplier, 0) / 
                       Math.max(allResults.filter(r => r.gameType === "limbo").length, 1),
          players: recentResults.filter(r => r.gameType === "limbo").length
        },
        dice: {
          avgWinChance: 85.5, // This would need more complex calculation based on target values
          players: recentResults.filter(r => r.gameType === "dice").length
        },
        mines: {
          avgMultiplier: allResults.filter(r => r.gameType === "mines").reduce((sum, r) => sum + r.multiplier, 0) / 
                       Math.max(allResults.filter(r => r.gameType === "mines").length, 1),
          players: recentResults.filter(r => r.gameType === "mines").length
        },
        roulette: {
          lastNumber: 17, // Would need to store this in game results
          players: recentResults.filter(r => r.gameType === "roulette").length
        }
      };

      res.json({
        totalWonToday,
        activePlayers: Math.max(activePlayers, 1234), // Show at least some activity
        gameStats
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get statistics" });
    }
  });

  // Wallet endpoints
  app.post("/api/wallet/deposit", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid deposit amount" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const newBalance = user.balance + amount;
      await storage.updateUserBalance(userId, newBalance);
      
      res.json({ 
        success: true, 
        newBalance,
        message: "Deposit successful" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  app.post("/api/wallet/withdraw", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const { amount, address } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid withdrawal amount" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const newBalance = user.balance - amount;
      await storage.updateUserBalance(userId, newBalance);
      
      res.json({ 
        success: true, 
        newBalance,
        message: "Withdrawal successful" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      // For now, return empty array - will implement with database
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Telegram user authentication and session management
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const { telegramData } = req.body;
      
      const telegramUser = {
        id: String(telegramData.id || 1),
        username: telegramData.username || "demo_user",
        firstName: telegramData.first_name || "Demo",
        lastName: telegramData.last_name || "User"
      };
      
      // Check if user exists by Telegram ID
      let user = await storage.getUserByTelegramId(telegramUser.id);
      
      if (!user) {
        // Create new user with initial balance of 0
        user = await storage.createUser({
          username: telegramUser.username,
          password: "telegram_auth", // Not used for Telegram users
          telegramId: telegramUser.id,
          firstName: telegramUser.firstName,
          lastName: telegramUser.lastName,
        });
      }
      
      // Create/update session
      const sessionId = `tg_${telegramUser.id}`;
      userSessions.set(sessionId, user.id);
      
      res.json({ 
        success: true, 
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          balance: user.balance
        }
      });
    } catch (error) {
      console.error("Telegram auth error:", error);
      res.status(500).json({ error: "Failed to authenticate user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function isRed(number: number): boolean {
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number);
}

function isBlack(number: number): boolean {
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
  return blackNumbers.includes(number);
}

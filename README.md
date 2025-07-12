# BitJackz Crypto Casino

A full-stack cryptocurrency casino web application featuring six classic casino games with real-time gameplay, mobile-responsive design, and Telegram integration.

## Features

- **6 Casino Games**: Crash, Coin Flip, Limbo, Dice, Mines, and Roulette
- **Real-time Gameplay**: Live multiplier tracking and instant results
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Telegram Integration**: WebApp support with user authentication
- **Secure**: Session-based authentication and encrypted data
- **Modern Stack**: React, TypeScript, Express, PostgreSQL

## Quick Start

### Method 1: Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd bitjackz-casino
```

2. Start with Docker Compose:
```bash
docker-compose up -d
```

3. Access the application at `http://localhost:5000`

### Method 2: Manual Setup

1. **Prerequisites**:
   - Node.js 20+
   - PostgreSQL database
   - npm or yarn

2. **Installation**:
```bash
# Clone repository
git clone <repository-url>
cd bitjackz-casino

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npm run db:push

# Build and start
npm run build
npm start
```

3. **Quick Start Script**:
```bash
chmod +x start.sh
./start.sh
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/bitjackz

# Server
NODE_ENV=production
PORT=5000

# Security
SESSION_SECRET=your-secure-random-session-secret

# Optional: Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook
```

## Game Features

### Crash Game
- Real-time multiplier tracking
- 5-second countdown timer
- Curved rocket trajectory animation
- Instant cash-out mechanics

### Coin Flip
- Simple heads/tails betting
- 50/50 odds with 93% RTP
- Animated coin flip

### Limbo
- Multiplier prediction game
- Custom formula with 93% RTP
- Smooth number counting animation

### Dice
- Over/under number prediction
- Configurable target numbers
- 93% RTP with fair odds

### Mines
- Minesweeper-style gameplay
- Customizable mine count
- Progressive multiplier system

### Roulette
- American roulette (00, 0, 1-36)
- Mobile-friendly betting board
- Multiple bet types and payouts

## Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **TanStack Query** for state management
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** for data storage
- **Session-based authentication**
- **WebSocket support** for real-time features

### Database Schema
- Users table with balance tracking
- Game results for history and statistics
- Session management
- Zod validation for type safety

## Deployment

### Supported Platforms
- **Docker** (recommended)
- **Heroku**
- **Railway**
- **DigitalOcean App Platform**
- **Vercel**
- **Any VPS with Node.js**

### Build Process
```bash
# Frontend build (Vite)
npm run build

# Backend build (esbuild)
# Automatically included in build script

# Start production server
npm start
```

## Development

### Local Development
```bash
# Start development server
npm run dev

# Run type checking
npm run check

# Push database changes
npm run db:push
```

### Adding New Games
1. Create game component in `client/src/pages/`
2. Add game logic to `server/routes.ts`
3. Update database schema in `shared/schema.ts`
4. Add game to navigation in `client/src/App.tsx`

## Security

- All user inputs are validated with Zod schemas
- Session-based authentication
- CORS protection
- SQL injection prevention with Drizzle ORM
- XSS protection with React

## Performance

- Optimized bundle sizes with Vite
- Efficient database queries
- Real-time updates without polling
- Mobile-optimized animations
- Lazy loading for better performance

## License

MIT License - see LICENSE file for details

## Support

For deployment issues or questions:
1. Check the [Deployment Guide](DEPLOYMENT.md)
2. Review the environment configuration
3. Verify database connectivity
4. Check application logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with ❤️ for the crypto casino community"# bitjackzdevmode" 
"# bitjackzdevmode" 
"# bitjackzdevmode" 

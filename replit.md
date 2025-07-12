# BitJackz Crypto Casino Web App

## Overview

This is a full-stack crypto casino web application built to run seamlessly on both desktop and mobile devices, with Telegram WebApp integration in mind. The application features a modern, dark-themed UI inspired by platforms like Jeton, Rubet, and Stake, with six casino games implemented in the first phase. The app is branded as "BitJackz" and includes the official BitJackz logo throughout the interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Custom CSS variables for theming with dark mode support

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: In-memory storage for development (designed for Redis/PostgreSQL in production)
- **API Design**: RESTful JSON endpoints
- **Development Server**: Hot reload with Vite integration

### Monorepo Structure
```
/client          # React frontend
/server          # Express backend
/shared          # Shared types and schemas
/migrations      # Database migrations
```

## Key Components

### Games Implementation
Six casino games are fully implemented:
1. **Crash Game** - Real-time multiplier game with 5-second countdown, live multiplier tracking, and instant cash-out mechanics
2. **Coin Flip** - Simple heads/tails 50/50 game
3. **Limbo** - Multiplier prediction game
4. **Dice** - Over/under number prediction
5. **Mines** - Minesweeper-style tile revealing
6. **Roulette** - Classic roulette with simplified betting

### Database Schema
- **Users Table**: Stores user credentials and balance
- **Game Results Table**: Tracks all game outcomes and payouts
- **Shared Validation**: Zod schemas for type-safe data validation across frontend and backend

### UI Components
- **Game Tiles**: Interactive cards with hover effects and animations
- **Top Navigation**: Balance display, wallet functionality, mobile-optimized
- **Wallet Page**: Full deposit/withdraw functionality with transaction history
- **Responsive Design**: Mobile-first approach with Telegram WebApp compatibility
- **Toast Notifications**: Real-time feedback for game results and transactions
- **Modal System**: Simplified wallet modal that redirects to full wallet page

## Data Flow

1. **User Authentication**: Individual Telegram user verification with session management
2. **Game Play**: Frontend sends bet data to backend, backend processes game logic and returns results
3. **Balance Updates**: Real-time balance updates after each game for specific user
4. **Game History**: Recent games displayed on homepage with live statistics

## External Dependencies

### Frontend Dependencies
- **UI Libraries**: Radix UI primitives, Lucide React icons
- **State Management**: TanStack Query for API calls
- **Styling**: Tailwind CSS, class-variance-authority
- **Forms**: React Hook Form with Zod validation

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Validation**: Zod for schema validation
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Vite**: Development server with HMR
- **TypeScript**: Full type safety across the stack
- **ESLint**: Code quality and consistency
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Development
- Frontend runs on port 5173 (Vite dev server)
- Backend runs on port 3000 (Express server)
- Database: PostgreSQL via Neon or local instance
- Hot reload enabled for both frontend and backend

### Production
- Frontend: Static build served by Express
- Backend: Compiled TypeScript with esbuild
- Database: PostgreSQL with connection pooling
- Environment variables for configuration

### Build Process
1. `npm run build` - Builds frontend and backend
2. `npm run start` - Runs production server
3. `npm run db:push` - Applies database schema changes

## Changelog
- July 03, 2025. Initial setup with 6 casino games and dark theme
- July 03, 2025. Removed statistics display per user request
- July 03, 2025. Added BitJackz branding and logo integration
- July 03, 2025. Started database integration (PostgreSQL setup)
- July 05, 2025. Enhanced mobile compatibility and removed user button
- July 05, 2025. Added Telegram WebApp optimizations and touch interactions
- July 05, 2025. Added wallet page with deposit/withdraw functions and set initial balance to $0
- July 05, 2025. Implemented Telegram user verification system and wallet transaction management
- July 05, 2025. Added individual user account system with session-based authentication across all endpoints
- July 05, 2025. Rebuilt complete Crash Game module with real-time multiplier tracking, 5-second countdown, live status polling, exponential decay crash points, and instant cash-out mechanics - now matches Stake/Rubet style gameplay
- July 06, 2025. Made Crash Game public and always running - anyone can watch without betting, improved rocket size and animations, added rising graph line that follows multiplier, optimized to 30-40 FPS for smooth movement
- July 07, 2025. Enhanced Crash Game with curved rocket trajectory - replaced straight line path with smooth parabolic curve, rocket now follows realistic arc trajectory with dynamic rotation and scaling
- July 07, 2025. Enhanced Limbo Game with custom multiplier formula (1/(0-1) * 93/100, min 1x, max 10.56x), animated number counting up from 1x, green/red color coding for wins/losses, and 2-second smooth animation with pulsing effects
- July 07, 2025. Set Dice Game RTP to 93% by applying 0.93 multiplier to payout calculations, ensuring consistent house edge across all games - RTP is built into multiplier calculations rather than displayed separately
- July 07, 2025. Enhanced Mines Game with improved visuals, animations, live statistics display, better mine distribution algorithm, and consistent 93% RTP across all casino games
- July 07, 2025. Fixed Mines Game notifications and balance issues - mines now show immediately when clicked, removed unwanted win notifications on mine hits, fixed balance deduction logic, and implemented user's exact gem and bomb images with proper 12x12 sizing
- July 07, 2025. Made Roulette Game mobile-friendly with responsive betting board layout - added horizontal scrolling for number grid on mobile, increased touch targets to 48px minimum, reorganized betting controls into mobile-optimized grid layouts, improved chip selection with better mobile spacing, and enhanced overall mobile experience with touch-friendly interactions
- July 08, 2025. Made application accessible to all hosting platforms by creating universal deployment files - added comprehensive Docker setup, deployment guide, environment configuration examples, platform-specific deployment instructions, and generic startup scripts for easy deployment on any hosting service
- July 09, 2025. Organized games into strategic sections for enhanced visual appeal - created Hot Games section (Crash, Mines, Roulette), High RTP section (Limbo, Roulette, Crash), and Games section (Coin Flip, Dice, Limbo) with colorful gradient indicators and responsive layouts to make the game selection appear larger and more comprehensive
- July 09, 2025. Integrated new logo image to replace "BitJackz" text throughout the application - updated TopNavbar to use logo image instead of text branding, removed "BitJackz" references from all game card alt text, and cleaned up code by removing unused GameTile components
- July 10, 2025. Updated all game banner images with new professional designs - replaced all 6 game banners (Crash, Coin Flip, Dice, Limbo, Mines, Roulette) with high-quality branded images featuring consistent styling and game-specific themes
- July 10, 2025. Added auto-scrolling promotional banners - replaced static hero banner with dynamic carousel featuring "250% Turbo Bonus" and "5% Rakeback" promotions, includes smooth transitions, dot indicators, and 4-second auto-scroll timing
- July 10, 2025. Simplified banner to static display - removed auto-scrolling functionality and 5% rakeback card per user request, now displays only the "250% Turbo Bonus" banner as a static image
- July 10, 2025. Updated UI theme from pink to purple neon colors - removed pink colors and replaced with consistent purple theme throughout navigation, buttons, and UI elements while preserving original game-specific colors
- July 10, 2025. Removed welcome notifications from TelegramAuth component - eliminated toast notifications that appeared when users first loaded the app
- July 10, 2025. Updated loading screen to use BitJackz logo instead of text - replaced "BitJackz" text with the actual logo image on the authentication loading screen

## User Preferences

Preferred communication style: Simple, everyday language.
Branding: BitJackz logo and name throughout the app.
Statistics: No statistics display wanted on homepage.
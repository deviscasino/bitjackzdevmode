# BitJackz Casino - Universal Deployment Guide

This guide will help you deploy the BitJackz crypto casino application on any hosting platform.

## Prerequisites

- Node.js 20+ 
- PostgreSQL database
- npm or yarn package manager

## Environment Setup

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# Server Configuration
NODE_ENV=production
PORT=5000

# Session Configuration (generate a secure random string)
SESSION_SECRET=your-secure-random-session-secret-here

# Optional: Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook
```

### 2. Database Setup

The application uses PostgreSQL with Drizzle ORM. After setting up your database:

1. Install dependencies: `npm install`
2. Push the database schema: `npm run db:push`

## Deployment Options

### Option 1: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/bitjackz
      - SESSION_SECRET=your-secure-session-secret
    depends_on:
      - db
    
  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=bitjackz
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Option 2: Traditional Server Deployment

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Build the application: `npm run build`
5. Start the application: `npm start`

### Option 3: Platform-Specific Deployments

#### Heroku
1. Create a `Procfile`:
```
web: npm start
```

2. Add PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### Railway
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically

#### DigitalOcean App Platform
1. Create app from GitHub repository
2. Configure environment variables
3. Set build command: `npm run build`
4. Set run command: `npm start`

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Configure environment variables in Vercel dashboard

## Build Process

The application uses a two-stage build process:

1. **Frontend Build**: Vite builds the React application into static files
2. **Backend Build**: esbuild compiles the TypeScript server code

Build command: `npm run build`
- Frontend output: `dist/public/`
- Backend output: `dist/index.js`

## Production Considerations

### Security
- Use HTTPS in production
- Set secure session cookies
- Configure CORS properly
- Use environment variables for secrets

### Performance
- Enable gzip compression
- Use CDN for static assets
- Configure database connection pooling
- Set up proper logging

### Monitoring
- Set up error tracking (Sentry, Rollbar)
- Configure application monitoring
- Set up database monitoring
- Configure alerts for downtime

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check firewall settings
   - Ensure database is running

2. **Build Failures**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Port Issues**
   - Ensure PORT environment variable is set
   - Check for port conflicts
   - Verify firewall rules

### Logs
Check application logs for detailed error information:
```bash
npm start 2>&1 | tee app.log
```

## File Structure

```
/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── dist/            # Built application (generated)
├── package.json     # Dependencies and scripts
└── .env            # Environment variables (create this)
```

## Support

For deployment issues:
1. Check the logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure database connectivity
4. Check Node.js and npm versions

## License

MIT License - see LICENSE file for details
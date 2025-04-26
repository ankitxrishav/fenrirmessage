# Norse Chat - Hall of Fenrir

A secure, Nordic-themed messaging application with real-time chat functionality, featuring auto-generated warrior names and persistent storage.

## Key Features

- Password-protected chat rooms
- Real-time messaging with WebSockets
- Nordic/Fenrir themed design
- Persistent message storage with PostgreSQL
- Mobile responsive design
- User typing indicators and active user count

## Tech Stack

- React frontend
- Express backend
- PostgreSQL database
- WebSockets for real-time communication
- Tailwind CSS + Shadcn UI
- Drizzle ORM
- Vercel deployment

## Deployment on Vercel

### Prerequisites

1. A PostgreSQL database (recommended: [Neon](https://neon.tech/) for Serverless Postgres)
2. [Vercel](https://vercel.com/) account

### Setup Instructions

1. Fork or clone this repository
2. Create a new project on Vercel and link it to your repository
3. Set up environment variables in Vercel:
   - `NEON_DATABASE_URL`: Your Neon PostgreSQL connection string (should start with `postgres://`)
   - `SESSION_SECRET`: A random string for session encryption
4. Deploy your project on Vercel

### Configuration

Make sure to set the following in your Vercel project:

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Development Command: `npm run dev`
- Environment Variables: 
  - `NEON_DATABASE_URL`
  - `SESSION_SECRET`

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the root directory with:
# NEON_DATABASE_URL=postgres://your-neon-connection-string
# SESSION_SECRET=your-random-string

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## Project Structure

- `client/`: React frontend
- `server/`: Express backend
- `shared/`: Shared types and schemas
- `migrations/`: Database migrations

## Database Schema

The application uses four main tables:
- `users`: User authentication data
- `chat_rooms`: Chat room details
- `messages`: Chat messages
- `active_users`: Currently active users in chat rooms

## License

MIT
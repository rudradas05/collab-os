# CollabOS+ - AI-Powered Collaborative Workspace

Turn productivity into currency with CollabOS+, a full-stack SaaS application that combines document editing, team chat, project management, workflow automation, AI assistants, and a gamified coin-based productivity economy.

## 🚀 Features

- **Multi-tenant Workspaces** - Personal and team workspaces
- **Projects & Tasks** - Complete project management with deadlines
- **Real-time Collaboration** - Live document editing with Liveblocks
- **Team Chat** - Workspace-based messaging
- **AI Assistants** - Document writing, task breakdown, project summaries
- **Automation Engine** - Zapier-like trigger → condition → action workflows
- **Coin Economy** - Earn coins for productivity, reduce subscription costs
- **Subscription System** - Tiered plans with coin-based discounts
- **Notifications** - Email, in-app, and push notifications
- **PWA Support** - Offline mode and installable app

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase/Railway)
- **Realtime**: Liveblocks
- **Auth**: Clerk
- **Payments**: Stripe
- **AI**: OpenAI (with Ollama fallback)
- **Email**: Resend
- **Storage**: Supabase Storage
- **Caching**: Upstash Redis

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collab-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your environment variables (see `.env.example` for required keys)

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application uses Prisma with PostgreSQL. Key models include:

- `User` - User accounts with Clerk integration
- `Workspace` - Multi-tenant workspaces
- `WorkspaceMember` - Workspace membership and roles
- `Project` - Projects within workspaces
- `Task` - Tasks with assignments and deadlines
- `Document` - Real-time collaborative documents
- `Chat` & `ChatMessage` - Team messaging
- `UserPoints` - Coin balance and history
- `CoinTransaction` - Transaction log
- `Subscription` - Subscription management
- `Notification` - In-app notifications
- `Automation` - Workflow automations

## 💰 Coin Economy

### Earning Coins
- Task completed: **+10 coins**
- AI assistant used: **+2 coins**
- Project completed before deadline: **+50 coins**
- Invite teammate: **+20 coins**
- Create automation: **+15 coins**

### Subscription Tiers
- **Free**: 0-499 coins (basic access)
- **Pro**: 500-1499 coins ($9.99/month, unlimited docs, basic AI)
- **Elite**: 1500-2999 coins ($19.99/month, realtime + automations)
- **Legend**: 3000+ coins ($39.99/month, custom AI bots + analytics)

Coins are automatically deducted during billing. If insufficient, the remaining amount is charged via Stripe.

## 📡 API Endpoints

- `POST /api/points/add` - Add coins
- `GET /api/points/stats` - Get coin statistics
- `POST /api/subscription/pay` - Process subscription
- `POST /api/ai/query` - AI queries (document, task breakdown, etc.)
- `GET /api/notifications` - Get notifications
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks` - Update task (triggers coin rewards)
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/automations` - List automations
- `POST /api/automations` - Create automation

## 🔧 Configuration

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `OPENAI_API_KEY` - OpenAI API key (or use Ollama)
- `LIVEBLOCKS_SECRET_KEY` - Liveblocks secret key

### Optional Environment Variables

- `RESEND_API_KEY` - For email notifications
- `STRIPE_SECRET_KEY` - For payment processing
- `UPSTASH_REDIS_REST_URL` - For caching and queues

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Setup

Use Supabase or Railway for PostgreSQL:

1. Create a PostgreSQL database
2. Set `DATABASE_URL` in environment variables
3. Run migrations: `npx prisma migrate deploy`

### Additional Services

- **Clerk**: Set up authentication
- **Liveblocks**: Configure for realtime collaboration
- **Stripe**: Set up webhooks for subscription management
- **Resend**: Configure email domain

## 📝 Development

### Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/         # API routes
│   ├── dashboard/   # Dashboard pages
│   └── ...
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utility functions
│   ├── auth.ts      # Authentication helpers
│   ├── coins.ts     # Coin system
│   ├── subscription.ts # Subscription logic
│   ├── ai.ts        # AI integration
│   └── ...
└── ...
```

### Running Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy
```

### Generating Prisma Client

```bash
npx prisma generate
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Realtime collaboration with [Liveblocks](https://liveblocks.io/)
- Authentication with [Clerk](https://clerk.com/)
- AI powered by [OpenAI](https://openai.com/)

---

**CollabOS+** - Turn productivity into currency 🪙
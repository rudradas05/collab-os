# CollabOS+

A collaboration platform where teams can manage their work together. Built this to help small teams organize projects, track tasks, and stay connected.

## What it does

**Workspaces** — Create separate spaces for different teams or clients. Each workspace has its own projects, members, and settings.

**Projects & Tasks** — Organize work with a simple kanban board. Drag tasks between columns, set priorities, assign to teammates.

**Team Chat** — Real-time messaging within workspaces. No need to switch between apps.

**AI Assistant** — Ask questions, get help with tasks, brainstorm ideas. Powered by Gemini.

**Notifications** — Stay updated on what matters. Get notified about task assignments, mentions, and team activity.

## Roles

- **Owner** — Full control over the workspace
- **Admin** — Can manage members and settings
- **Member** — Can work on projects and tasks

## Plans

| Plan   | Price | What you get                      |
| ------ | ----- | --------------------------------- |
| Free   | ₹0    | 2 workspaces, 5 projects          |
| Pro    | ₹399  | 10 workspaces, 20 projects        |
| Elite  | ₹999  | 20 workspaces, unlimited projects |
| Legend | ₹1999 | Everything unlimited              |

You can also earn coins by using the platform and spend them on upgrades.

## Running locally

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Then open http://localhost:3000

## Deploying

Works great on Vercel. Just connect your repo, add the environment variables, and you're good to go.

Make sure to set up your Stripe webhooks pointing to `/api/subscription/webhook`.

## Built with

Next.js, React, TypeScript, Tailwind, Prisma, PostgreSQL, Stripe, Liveblocks, Gemini

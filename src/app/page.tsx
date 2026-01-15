// Landing page
import Link from "next/link";
import { SignUpButton, SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  Coins, 
  Sparkles,
  Users,
  Workflow
} from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CollabOS+</span>
          </div>
          <div className="flex items-center gap-4">
            {userId ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <SignInButton>
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>
                <SignUpButton>
                  <Button>Start Free</Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4" variant="secondary">
          AI-Powered Productivity Platform
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Turn Productivity Into Currency
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          CollabOS+ combines document editing, team chat, project management, and AI assistants
          with a gamified coin-based economy. Earn coins, reduce costs, unlock premium features.
        </p>
        <div className="flex gap-4 justify-center">
          {userId ? (
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <SignUpButton>
                <Button size="lg" className="text-lg px-8">
                  Start Free
                </Button>
              </SignUpButton>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Collaborate</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Real-time Documents</CardTitle>
              <CardDescription>
                Collaborative document editing with live updates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Team Chat</CardTitle>
              <CardDescription>
                Workspace-based messaging and communication
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Projects, tasks, and deadline tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 text-primary mb-2" />
              <CardTitle>AI Assistants</CardTitle>
              <CardDescription>
                Document writing, task breakdown, and insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Workflow className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Automations</CardTitle>
              <CardDescription>
                Zapier-like workflow automation engine
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Coins className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Coin Economy</CardTitle>
              <CardDescription>
                Earn coins, reduce subscription costs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Coin System Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/50 rounded-lg">
        <div className="max-w-3xl mx-auto text-center">
          <Coins className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">The Coin Economy</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Complete tasks, use AI, finish projects early, and invite teammates to earn coins.
            Coins reduce your subscription costs or unlock premium features.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earn Coins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Task completed: +10 coins</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>AI assistant used: +2 coins</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Project completed early: +50 coins</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Invite teammate: +20 coins</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscription Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Free</span>
                  <Badge>0-499 coins</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pro</span>
                  <Badge variant="secondary">500-1499 coins</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Elite</span>
                  <Badge variant="secondary">1500-2999 coins</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Legend</span>
                  <Badge variant="secondary">3000+ coins</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join thousands of teams already using CollabOS+
        </p>
        {userId ? (
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-8">
              Go to Dashboard
            </Button>
          </Link>
        ) : (
          <SignUpButton>
            <Button size="lg" className="text-lg px-8">
              Start Free Today
            </Button>
          </SignUpButton>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 CollabOS+. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
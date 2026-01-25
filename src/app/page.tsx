import Link from "next/link";
import { ArrowRight, Zap, Shield, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm">
              C+
            </div>
            CollabOS+
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>The future of team collaboration</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Work together,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                achieve more
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              CollabOS+ is the all-in-one platform for teams to collaborate,
              manage projects, and get things done. Simple, powerful, and
              designed for the way you work.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-24">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything you need to succeed
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-xl border bg-background p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Built for speed. Real-time updates and instant sync across all
                  your devices.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Team First</h3>
                <p className="text-muted-foreground">
                  Designed for collaboration. Work together seamlessly with your
                  entire team.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  Secure by Default
                </h3>
                <p className="text-muted-foreground">
                  Enterprise-grade security. Your data is encrypted and
                  protected at all times.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="container mx-auto px-4 py-24 text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of teams already using CollabOS+
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Start for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 CollabOS+. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

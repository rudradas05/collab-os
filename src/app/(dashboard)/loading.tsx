import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-primary/5 -z-10 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            Loading your dashboard...
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Setting things up for you
          </p>
        </div>
      </div>
    </div>
  );
}

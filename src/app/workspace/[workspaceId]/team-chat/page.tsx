"use client";

import { useParams } from "next/navigation";
import { RoomProvider, useStatus } from "@/lib/liveblocks";
import { TeamChatRoom } from "./team-chat-room";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function ChatContent({ workspaceId }: { workspaceId: string }) {
  const status = useStatus();

  if (status === "initial" || status === "connecting") {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <WifiOff className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Disconnected from chat
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Reconnect
          </Button>
        </div>
      </div>
    );
  }

  if (status === "reconnecting") {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          <p className="text-sm text-muted-foreground">Reconnecting...</p>
        </div>
      </div>
    );
  }

  return <TeamChatRoom workspaceId={workspaceId} />;
}

export default function TeamChatPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  return (
    <RoomProvider
      id={`workspace:${workspaceId}`}
      initialPresence={{ cursor: null }}
    >
      <ChatContent workspaceId={workspaceId} />
    </RoomProvider>
  );
}

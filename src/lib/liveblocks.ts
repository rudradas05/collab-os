import { createClient } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Presence type for users in the room
type Presence = {
  cursor: { x: number; y: number } | null;
};

// User meta info
type UserMeta = {
  id: string;
  info: {
    name: string;
    avatar?: string;
  };
};

// Room event for broadcasting messages
type RoomEvent = {
  type: "MESSAGE";
  message: {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
  };
};

// Thread metadata (not used for chat but required by Liveblocks)
type ThreadMetadata = Record<string, never>;

const roomContext = createRoomContext<
  Presence,
  Record<string, never>,
  UserMeta,
  RoomEvent
>(client);

// Export both suspense and non-suspense versions
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useSelf,
  useBroadcastEvent,
  useEventListener,
  useStatus,
} = roomContext;

// Suspense versions for components that need them
export const {
  suspense: {
    RoomProvider: SuspenseRoomProvider,
    useOthers: useSuspenseOthers,
    useSelf: useSuspenseSelf,
  },
} = roomContext;

export const { LiveblocksProvider, useInboxNotifications } =
  createLiveblocksContext(client);

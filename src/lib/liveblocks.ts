// Liveblocks configuration for realtime collaboration
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "",
});

export { liveblocks };

// Authorize user for Liveblocks
export async function authorizeUser(userId: string) {
  const session = liveblocks.prepareSession(userId);

  // Grant access to user's workspaces
  // This would be enhanced to check actual workspace membership
  session.allow(`workspace:*`, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return { status, body };
}
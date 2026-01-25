import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { Role } from "@/generated/prisma";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("collabos_token")?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
    },
  });

  return user;
}

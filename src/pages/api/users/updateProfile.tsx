// pages/api/user/updateProfile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, firstName, middleName, lastName, phone, address } = req.body;

  try {
    const user = await db.user.update({
      where: { id: userId },
      data: { firstName, middleName, lastName, phone, address, isVerified: true },
    });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
}

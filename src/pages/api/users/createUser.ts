// import type { NextApiRequest, NextApiResponse } from "next";
// import { db } from "@/lib/db";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") return res.status(405).end();

//   const { clerkId, email, firstName, middleName, lastName, phone, address, role, workspaceName, isVerified } = req.body;

//   if (!clerkId || !email || !firstName || !lastName) return res.status(400).json({ error: "Missing required fields" });

//   const existingUser = await db.user.findUnique({ where: { email } });
//   if (existingUser) return res.status(200).json(existingUser);

//   const user = await db.user.create({
//     data: {
//       clerkId,
//       email,
//       firstName,
//       middleName,
//       lastName,
//       phone,
//       address,
//       tier: "Free",
//       coins: 0,
//       isVerified,
//       // role/workspace can be linked here
//     },
//   });

//   res.status(201).json(user);
// }



import type { NextApiRequest, NextApiResponse } from "next";
import { db} from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { clerkId, email, firstName, middleName, lastName, phone, address, role, workspaceName, isVerified } = req.body;

  if (!clerkId || !email || !firstName || !lastName || !role) return res.status(400).json({ error: "Missing required fields" });

  const existingUser = await db.ser.findUnique({ where: { email } });
  if (existingUser) return res.status(200).json(existingUser);

  const user = await db.user.create({
    data: {
      clerkId,
      email,
      firstName,
      middleName,
      lastName,
      phone,
      address,
      role,
      tier: "Free",
      coins: 0,
      isVerified,
      workspaces: {
        create: { name: workspaceName },
      },
    },
    include: { workspaces: true },
  });

  res.status(201).json(user);
}

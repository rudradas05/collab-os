import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export async function verifyGoogleToken(
  credential: string,
): Promise<GoogleUserInfo | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return null;
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      avatar: payload.picture,
    };
  } catch {
    return null;
  }
}

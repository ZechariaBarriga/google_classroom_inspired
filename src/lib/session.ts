import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET || ''; // generate using this: openssl rand -hex 32

if (!secretKey) {
   throw new Error("SESSION_SECRET is not set");
}

type SessionPayload = {
   userId: number;
   role: string;
   expiresAt: Date;
};

const encodedKey = new TextEncoder().encode(secretKey);

// Encrypt session payload into a JWT
export async function encrypt(payload: SessionPayload) {
   return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(encodedKey);
}

// Decrypt JWT into session payload
export async function decrypt(session: string | undefined = "") {
   try {
      const { payload } = await jwtVerify(session, encodedKey, {
         algorithms: ["HS256"],
      });

      // Validate payload
      if (!payload.expiresAt) {
         throw new Error("Invalid payload");
      }

      return payload as SessionPayload;
   } catch (error) {
      console.log("Failed to verify session");
   }
}


// ==================================================================

export async function createSession(userId: number, role: string) {
   const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
   const session = await encrypt({ userId, role, expiresAt });

   (await cookies()).set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
   });
}

export async function getSession() {
   const session = (await cookies()).get("session")?.value;
   return session ? decrypt(session) : null;
}

export async function deleteSession() {
   (await cookies()).delete("session");
}

// ===============================================================

// import "dotenv/config";
import { SignJWT } from "jose";

import { AuthInput } from "@/validations/auth";

/*
Cryptographic libraries reject plain text strings because hashing and signing algorithms require **raw binary data** to execute mathematical operations.

* **The Web Crypto Requirement**: Modern JavaScript runtimes use the Web Crypto API, which strictly demands keys to be `Uint8Array` or `ArrayBuffer` binary objects rather than strings.
* **Preventing Runtime Errors**: If you pass a plain string like `process.env.JWT_SECRET` directly into signing functions like `jose`, the runtime throws a type error because it expects bytes.
* **Universal Compatibility**: `TextEncoder` is built into JavaScript natively, ensuring your string key translates safely into the exact byte array required by the cipher without needing external polyfills.
*/

export const ACCESS_TOKEN_SECRET_KEY = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_JWT_SECRET,
);

export const REFRESH_TOKEN_SECRET_KEY = new TextEncoder().encode(
  process.env.REFRESH_TOKEN_JWT_SECRET,
);

export type JWTpayload = AuthInput;

export async function generateAccessToken(userId: string) {
  return new SignJWT({ userId } as JWTpayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m") // 15 minutes
    .sign(ACCESS_TOKEN_SECRET_KEY);
}

export async function generateRefreshToken(userId: string) {
  return new SignJWT({ userId } as JWTpayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7 days
    .sign(REFRESH_TOKEN_SECRET_KEY);
}

import { Router, type IRouter } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { User, WebAuthnCredential } from "@workspace/db";
import { signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ── In-memory challenge store (userId → { challenge, expiresAt }) ─────────────
const challengeStore = new Map<string, { challenge: string; expiresAt: number }>();

function setChallenge(key: string, challenge: string) {
  challengeStore.set(key, { challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
}

function getChallenge(key: string): string | null {
  const entry = challengeStore.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    challengeStore.delete(key);
    return null;
  }
  challengeStore.delete(key);
  return entry.challenge;
}

function getRpId(req: any): string {
  const origin = req.headers.origin as string | undefined;
  if (origin) {
    try {
      return new URL(origin).hostname;
    } catch {}
  }
  return "localhost";
}

function b64ToUint8Array(b64url: string): Uint8Array {
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const raw = Buffer.from(base64, "base64");
  return new Uint8Array(raw);
}

function uint8ToB64(arr: Uint8Array): string {
  return Buffer.from(arr).toString("base64url");
}

// ── REGISTRATION ──────────────────────────────────────────────────────────────

// POST /api/auth/webauthn/register-options  (requires JWT)
router.post("/auth/webauthn/register-options", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const user = await User.findById(authUser.id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const existingCreds = await WebAuthnCredential.find({ userId: user.id });

  const options = await generateRegistrationOptions({
    rpName: "نوى العقارية",
    rpID: getRpId(req),
    userID: Buffer.from(user.id) as unknown as Uint8Array,
    userName: user.email,
    userDisplayName: user.nameAr || user.name,
    attestationType: "none",
    excludeCredentials: existingCreds.map((c) => ({
      id: b64ToUint8Array(c.credentialId),
      transports: c.transports as any,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  setChallenge(`reg:${user.id}`, options.challenge);
  res.json(options);
});

// POST /api/auth/webauthn/register-verify  (requires JWT)
router.post("/auth/webauthn/register-verify", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const { response, deviceName } = req.body;

  const expectedChallenge = getChallenge(`reg:${authUser.id}`);
  if (!expectedChallenge) { res.status(400).json({ error: "Challenge expired" }); return; }

  const origin = req.headers.origin as string;
  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: getRpId(req),
      requireUserVerification: false,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Verification failed" }); return;
  }

  if (!verification.verified || !verification.registrationInfo) {
    res.status(400).json({ error: "Verification failed" }); return;
  }

  const { credential } = verification.registrationInfo;
  await WebAuthnCredential.create({
    userId: authUser.id,
    credentialId: uint8ToB64(credential.id),
    publicKey: uint8ToB64(credential.publicKey),
    counter: credential.counter,
    transports: (response.response?.transports ?? []),
    deviceName: deviceName || "جهازي",
  });

  res.json({ verified: true });
});

// ── AUTHENTICATION ────────────────────────────────────────────────────────────

// GET /api/auth/webauthn/login-options?email=xxx
router.get("/auth/webauthn/login-options", async (req, res): Promise<void> => {
  const email = String(req.query.email || "").toLowerCase().trim();
  if (!email) { res.status(400).json({ error: "Email required" }); return; }

  const user = await User.findOne({ email });
  if (!user || !user.active) { res.status(404).json({ error: "No biometric registered" }); return; }

  const creds = await WebAuthnCredential.find({ userId: user.id });
  if (!creds.length) { res.status(404).json({ error: "No biometric registered" }); return; }

  const options = await generateAuthenticationOptions({
    rpID: getRpId(req),
    allowCredentials: creds.map((c) => ({
      id: b64ToUint8Array(c.credentialId),
      transports: c.transports as any,
    })),
    userVerification: "preferred",
  });

  setChallenge(`auth:${user.id}`, options.challenge);
  res.json({ ...options, userId: user.id });
});

// POST /api/auth/webauthn/login-verify
router.post("/auth/webauthn/login-verify", async (req, res): Promise<void> => {
  const { response, userId } = req.body;
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }

  const expectedChallenge = getChallenge(`auth:${userId}`);
  if (!expectedChallenge) { res.status(400).json({ error: "Challenge expired" }); return; }

  const credId = response.id as string;
  const dbCred = await WebAuthnCredential.findOne({ credentialId: credId.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "") });
  if (!dbCred) { res.status(400).json({ error: "Credential not found" }); return; }

  const origin = req.headers.origin as string;
  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: getRpId(req),
      requireUserVerification: false,
      credential: {
        id: b64ToUint8Array(dbCred.credentialId),
        publicKey: b64ToUint8Array(dbCred.publicKey),
        counter: dbCred.counter,
        transports: dbCred.transports as any,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Verification failed" }); return;
  }

  if (!verification.verified) { res.status(400).json({ error: "Verification failed" }); return; }

  await WebAuthnCredential.updateOne({ _id: dbCred._id }, { counter: verification.authenticationInfo.newCounter });

  const user = await User.findById(dbCred.userId);
  if (!user || !user.active) { res.status(401).json({ error: "User inactive" }); return; }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      nameAr: user.nameAr,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// GET /api/auth/webauthn/credentials  (list my credentials, requires JWT)
router.get("/auth/webauthn/credentials", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  const creds = await WebAuthnCredential.find({ userId: authUser.id }, { credentialId: 1, deviceName: 1, createdAt: 1 });
  res.json(creds.map((c) => ({ id: c.id, deviceName: c.deviceName, createdAt: c.createdAt })));
});

// DELETE /api/auth/webauthn/credentials/:id  (requires JWT)
router.delete("/auth/webauthn/credentials/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as any).user;
  await WebAuthnCredential.deleteOne({ _id: req.params.id, userId: authUser.id });
  res.json({ success: true });
});

export default router;

import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const AUTH_EMULATOR_BASE =
  process.env.FIREBASE_AUTH_EMULATOR_HOST?.startsWith('http')
    ? process.env.FIREBASE_AUTH_EMULATOR_HOST
    : `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'}`;

function getAdminApp(): App {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST?.startsWith('http')) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = new URL(
      process.env.FIREBASE_AUTH_EMULATOR_HOST,
    ).host;
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'burpee-workout',
  });
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function postAuth<RequestBody extends object, ResponseBody>(
  path: string,
  body: RequestBody,
): Promise<ResponseBody> {
  const response = await fetch(`${AUTH_EMULATOR_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as ResponseBody & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(json.error?.message ?? `Auth emulator request failed for ${path}`);
  }

  return json;
}

async function markEmailVerified(idToken: string) {
  const auth = getAuth(getAdminApp());
  const decodedToken = JSON.parse(
    Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8'),
  ) as { user_id: string };
  await auth.updateUser(decodedToken.user_id, { emailVerified: true });
}

async function recreateAuthAccount(email: string, password: string) {
  const auth = getAuth(getAdminApp());
  const existingUser = await auth.getUserByEmail(email);
  await auth.deleteUser(existingUser.uid);

  const recreated = await postAuth<
    { email: string; password: string; returnSecureToken: boolean },
    { localId: string; idToken: string }
  >('/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key', {
    email,
    password,
    returnSecureToken: true,
  });

  await markEmailVerified(recreated.idToken);
  return recreated.localId;
}

export async function ensureAuthAccount(email: string, password: string) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    try {
      const created = await postAuth<
        { email: string; password: string; returnSecureToken: boolean },
        { localId: string; idToken: string }
      >('/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key', {
        email,
        password,
        returnSecureToken: true,
      });

      await markEmailVerified(created.idToken);
      return created.localId;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('EMAIL_EXISTS')) {
        try {
          const existing = await postAuth<
            { email: string; password: string; returnSecureToken: boolean },
            { localId: string; idToken: string }
          >('/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key', {
            email,
            password,
            returnSecureToken: true,
          });

          await markEmailVerified(existing.idToken);
          return existing.localId;
        } catch (signInError) {
          const signInMessage =
            signInError instanceof Error ? signInError.message : String(signInError);

          if (
            signInMessage.includes('INVALID_LOGIN_CREDENTIALS') ||
            signInMessage.includes('INVALID_PASSWORD')
          ) {
            return recreateAuthAccount(email, password);
          }

          throw signInError;
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out creating emulator auth user for ${email}`);
}

export async function seedUserData(options: {
  email: string;
  password: string;
  completedToday?: boolean;
}) {
  const db = getFirestore(getAdminApp());
  const userId = await ensureAuthAccount(options.email, options.password);
  const today = getLocalDateKey();

  await db.collection('users').doc(userId).set(
    {
      userId,
      startDate: '2026-07-01',
      startWeight: 150,
      startPictureUrl: null,
      workoutTier: 'advanced',
      workoutDays: [2, 4, 6],
      currentLevelId: 'F',
      workoutLogs: options.completedToday
        ? [
            {
              date: today,
              completed: true,
              levelCompleted: 'F(N)',
              repsCompleted: 15,
              workoutType: 'with_pushups',
            },
          ]
        : [],
      workoutStats: {
        workoutsCompleted: options.completedToday ? 1 : 0,
        timerVerified: options.completedToday ? 1 : 0,
      },
    },
    { merge: true },
  );
}

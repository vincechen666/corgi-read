import { GoogleAuth } from "google-auth-library";

type TranslationAuthEnv = {
  GOOGLE_TRANSLATE_ACCESS_TOKEN?: string;
  GOOGLE_APPLICATION_CREDENTIALS?: string;
} & Record<string, string | undefined>;

type GetAdcToken = (env: TranslationAuthEnv) => Promise<string>;

async function getAccessTokenFromAdc(env: TranslationAuthEnv) {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-translation"],
    ...(env.GOOGLE_APPLICATION_CREDENTIALS
      ? { keyFilename: env.GOOGLE_APPLICATION_CREDENTIALS }
      : {}),
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  if (!token.token) {
    throw new Error("Google ADC did not return an access token");
  }

  return token.token;
}

export async function resolveGoogleAccessToken(
  env: TranslationAuthEnv,
  getAdcToken: GetAdcToken = getAccessTokenFromAdc,
) {
  if (env.GOOGLE_TRANSLATE_ACCESS_TOKEN) {
    return env.GOOGLE_TRANSLATE_ACCESS_TOKEN;
  }

  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    return getAdcToken(env);
  }

  throw new Error(
    "Google translation credentials are required in real mode",
  );
}

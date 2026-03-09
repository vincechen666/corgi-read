type FetchLike = typeof fetch;

type BaiduTokenParams = {
  apiKey: string;
  secretKey: string;
};

type TokenCache = {
  token: string;
  expiresAt: number;
} | null;

const TOKEN_REFRESH_BUFFER_MS = 60_000;

export function createBaiduTokenClient(
  fetchImpl: FetchLike = fetch,
  now: () => number = Date.now,
) {
  let cache: TokenCache = null;

  return {
    async getToken({ apiKey, secretKey }: BaiduTokenParams) {
      if (cache && cache.expiresAt - TOKEN_REFRESH_BUFFER_MS > now()) {
        return cache.token;
      }

      const url = new URL("https://aip.baidubce.com/oauth/2.0/token");
      url.searchParams.set("grant_type", "client_credentials");
      url.searchParams.set("client_id", apiKey);
      url.searchParams.set("client_secret", secretKey);

      const response = await fetchImpl(url.toString(), {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Baidu token request failed: ${response.status}`);
      }

      const json = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
      };

      if (!json.access_token || !json.expires_in) {
        throw new Error("Baidu token response was missing access_token");
      }

      cache = {
        token: json.access_token,
        expiresAt: now() + json.expires_in * 1000,
      };

      return cache.token;
    },
  };
}

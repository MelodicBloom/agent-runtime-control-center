/**
 * GitHub App installation token helper.
 * Returns a cached installation access token (TTL: 55 minutes).
 * Read-only: fetches tokens only, never modifies repo state.
 */

let _cachedToken: string | null = null;
let _cachedExpiry: number = 0;

export async function getInstallationToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && now < _cachedExpiry) return _cachedToken;

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error(
      'Missing GitHub App credentials. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_INSTALLATION_ID.'
    );
  }

  // Sign a JWT for GitHub App auth
  const { createAppAuth } = await import('@octokit/auth-app');
  const auth = createAppAuth({ appId, privateKey, installationId });
  const { token } = await auth({ type: 'installation' });

  _cachedToken = token;
  _cachedExpiry = now + 55 * 60 * 1000; // 55 min — GitHub tokens last 60 min
  return token;
}

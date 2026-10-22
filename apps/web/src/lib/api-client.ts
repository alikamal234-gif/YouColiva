  const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export async function fetchGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const activeToken =
    token !== undefined && token !== null && token !== ''
      ? token
      : typeof window !== 'undefined'
      ? localStorage.getItem('youcoliva_access_token')
      : null;

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    credentials: 'omit',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur réseau (${response.status}): ${errorText || response.statusText}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    const errMsg = json.errors[0].message;
    const isAuthError =
      errMsg.includes('Authentication required') ||
      errMsg.includes('Access token has expired') ||
      errMsg.includes('jwt expired');

    // Attempt transparent token refresh if client-side
    if (isAuthError && typeof window !== 'undefined') {
      const savedRefreshToken = localStorage.getItem('youcoliva_refresh_token');
      if (savedRefreshToken) {
        try {
          const refreshRes = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                mutation RefreshToken($refreshToken: String!) {
                  refreshToken(refreshToken: $refreshToken) {
                    accessToken
                  }
                }
              `,
              variables: { refreshToken: savedRefreshToken },
            }),
            credentials: 'omit',
          });

          const refreshJson = await refreshRes.json();
          const newAccessToken = refreshJson.data?.refreshToken?.accessToken;
          if (newAccessToken) {
            localStorage.setItem('youcoliva_access_token', newAccessToken);

            // Retry original request with new access token
            headers['Authorization'] = `Bearer ${newAccessToken}`;
            const retryRes = await fetch(API_URL, {
              method: 'POST',
              headers,
              body: JSON.stringify({ query, variables }),
              credentials: 'omit',
            });

            const retryJson: GraphQLResponse<T> = await retryRes.json();
            if (retryJson.data && (!retryJson.errors || retryJson.errors.length === 0)) {
              return retryJson.data;
            }
          }
        } catch {
          // If refresh fails, fall through to throw original error
        }
      }
    }

    throw new Error(errMsg);
  }

  if (!json.data) {
    throw new Error('Réponse invalide du serveur API');
  }

  return json.data;
}

import { Platform } from 'react-native';

// Default endpoint selection for local emulators or production
export const API_URL = Platform.select({
  android: 'http://10.0.2.2:4000/graphql',
  ios: 'http://localhost:4000/graphql',
  default: 'http://localhost:4000/graphql',
});

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export async function fetchGraphQLMobile<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur réseau (${response.status}): ${errorText || response.statusText}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  if (!json.data) {
    throw new Error('Réponse invalide du serveur API');
  }

  return json.data;
}

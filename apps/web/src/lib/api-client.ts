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
    token !== undefined
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
    throw new Error(json.errors[0].message);
  }

  if (!json.data) {
    throw new Error('Réponse invalide du serveur API');
  }

  return json.data;
}

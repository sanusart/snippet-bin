export interface User {
  id: string;
  username: string;
  email?: string;
  name: string | null;
  created_at?: string;
}

export interface GistFile {
  content: string;
  language: string;
}

export interface Gist {
  id: string;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  files: Record<string, GistFile>;
  user?: User;
}

export interface GistWithStats extends Gist {
  stars: number;
  starred_by_me: boolean;
  star_count: number;
  starred: boolean;
  owner?: { id: string; login: string };
}

export interface Token {
  id: string;
  note: string;
  created_at: string;
  last_used_at: string | null;
  scopes: string[];
  token?: string;
}

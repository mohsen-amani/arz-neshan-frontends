export type ApiRecord = Record<string, unknown>;

export interface AdminUser {
  id: string;
  first_name?: string;
  last_name?: string;
  username: string;
  email?: string;
  status?: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  default_locale: "en" | "fa" | "ps";
  status: string;
}

export interface OwnershipScope {
  id: string;
  scope_type: "global" | "branch" | "cash_desk" | "partner" | "own";
  scope_id?: string;
}

export interface AuthContext {
  user: AdminUser;
  workspace: WorkspaceSummary;
  membership_role: "owner" | "member";
  permissions: string[];
  scopes: OwnershipScope[];
}

export interface LoginResponse<TUser = AdminUser> {
  accessToken: string;
  expiresAt: string;
  user: TUser;
}

export interface Paginated<T> {
  data: T[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
}

export interface NavItem {
  label: string;
  route: string;
  hint?: string;
  permission?: string;
  exact?: boolean;
  section?: string;
}

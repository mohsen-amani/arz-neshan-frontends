export type WorkspaceDensity = "balanced" | "compact";

export interface WorkspaceNavItem {
  label: string;
  route: string;
  icon: string;
  permission?: string;
  exact?: boolean;
}

export interface WorkspaceNavGroup {
  label: string;
  icon: string;
  collapsible?: boolean;
  items: WorkspaceNavItem[];
}

export interface WorkspaceCreateAction extends WorkspaceNavItem {
  description: string;
}

import { Injectable, computed, signal } from "@angular/core";
import { AuthContext } from "./models";

@Injectable({ providedIn: "root" })
export class SessionState {
  private readonly accessTokenState = signal<string | null>(null);
  private readonly expiresAtState = signal<Date | null>(null);
  private readonly contextState = signal<AuthContext | null>(null);
  private readonly platformUserState = signal<{
    id: string;
    email: string;
  } | null>(null);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly context = this.contextState.asReadonly();
  readonly platformUser = this.platformUserState.asReadonly();
  readonly authenticated = computed(() => Boolean(this.accessTokenState()));

  setToken(token: string, expiresAt: string): void {
    this.accessTokenState.set(token);
    this.expiresAtState.set(new Date(expiresAt));
  }

  setContext(context: AuthContext): void {
    this.contextState.set(context);
  }

  setPlatformUser(user: { id: string; email: string }): void {
    this.platformUserState.set(user);
  }

  can(permission: string): boolean {
    const context = this.contextState();
    return (
      context?.membership_role === "owner" ||
      Boolean(context?.permissions.includes(permission))
    );
  }

  isExpiringSoon(): boolean {
    const expiresAt = this.expiresAtState();
    return !expiresAt || expiresAt.getTime() < Date.now() + 30_000;
  }

  clear(): void {
    this.accessTokenState.set(null);
    this.expiresAtState.set(null);
    this.contextState.set(null);
    this.platformUserState.set(null);
  }
}

import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AuthContext, LoginResponse } from "./models";
import { SessionState } from "./session.state";

@Injectable({ providedIn: "root" })
export class AuthService {
  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionState,
  ) {}

  async loginWorkspace(
    identifier: string,
    password: string,
    workspaceSlug?: string,
  ): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(
        "/api/auth/login",
        {
          identifier,
          password,
          workspace_slug: workspaceSlug || undefined,
        },
        { withCredentials: true },
      ),
    );
    this.session.setToken(response.accessToken, response.expiresAt);
    await this.loadContext();
  }

  async restoreWorkspace(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(
          "/api/auth/refresh",
          {},
          { withCredentials: true },
        ),
      );
      this.session.setToken(response.accessToken, response.expiresAt);
      await this.loadContext();
      return true;
    } catch {
      this.session.clear();
      return false;
    }
  }

  async exchangeHandoff(code: string, workspaceSlug?: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(
        "/api/signup/handoff/exchange",
        {
          code,
          workspace_slug: workspaceSlug || undefined,
        },
        { withCredentials: true },
      ),
    );
    this.session.setToken(response.accessToken, response.expiresAt);
    await this.loadContext();
  }

  async loginPlatform(
    email: string,
    password: string,
    totp: string,
  ): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse<{ id: string; email: string }>>(
        "/api/platform/auth/login",
        { email, password, totp },
        { withCredentials: true },
      ),
    );
    this.session.setToken(response.accessToken, response.expiresAt);
    this.session.setPlatformUser(response.user);
  }

  async restorePlatform(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse<{ id: string; email: string }>>(
          "/api/platform/auth/refresh",
          {},
          { withCredentials: true },
        ),
      );
      this.session.setToken(response.accessToken, response.expiresAt);
      this.session.setPlatformUser(response.user);
      return true;
    } catch {
      this.session.clear();
      return false;
    }
  }

  async logout(kind: "workspace" | "platform"): Promise<void> {
    const path =
      kind === "platform" ? "/api/platform/auth/logout" : "/api/auth/logout";
    try {
      await firstValueFrom(this.http.post(path, {}, { withCredentials: true }));
    } finally {
      this.session.clear();
    }
  }

  private async loadContext(): Promise<void> {
    const context = await firstValueFrom(
      this.http.get<AuthContext>("/api/auth/context", {
        withCredentials: true,
      }),
    );
    this.session.setContext(context);
  }
}

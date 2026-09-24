import { HttpBackend, HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  Observable,
  catchError,
  finalize,
  map,
  shareReplay,
  throwError,
} from "rxjs";
import { LoginResponse } from "./models";
import { SessionState } from "./session.state";

@Injectable({ providedIn: "root" })
export class SessionRefreshService {
  private readonly http: HttpClient;
  private inFlight?: Observable<string>;

  constructor(
    backend: HttpBackend,
    private readonly session: SessionState,
  ) {
    this.http = new HttpClient(backend);
  }

  refresh(): Observable<string> {
    if (this.inFlight) return this.inFlight;
    const platform = Boolean(this.session.platformUser());
    const path = platform ? "/api/platform/auth/refresh" : "/api/auth/refresh";
    this.inFlight = this.http
      .post<LoginResponse<{ id: string; email: string }>>(
        path,
        {},
        { withCredentials: true },
      )
      .pipe(
        map((response) => {
          this.session.setToken(response.accessToken, response.expiresAt);
          if (platform) this.session.setPlatformUser(response.user);
          return response.accessToken;
        }),
        catchError((error: unknown) => {
          this.session.clear();
          return throwError(() => error);
        }),
        finalize(() => (this.inFlight = undefined)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.inFlight;
  }
}

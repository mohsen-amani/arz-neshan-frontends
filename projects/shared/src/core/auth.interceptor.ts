import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, switchMap, throwError } from "rxjs";
import { SessionState } from "./session.state";
import { SessionRefreshService } from "./session-refresh.service";
import { BranchContextService } from "./branch-context.service";

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionState);
  const refresh = inject(SessionRefreshService);
  const branchContext = inject(BranchContextService);
  const token = session.accessToken();
  const headers: Record<string, string> = { "X-API-VERSION": "1" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (
    token &&
    branchContext.selected() &&
    !request.url.includes("/platform/")
  ) {
    headers["X-Branch-Context"] = branchContext.selected();
  }
  const authenticatedRequest = request.clone({
    setHeaders: headers,
    withCredentials: true,
  });
  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      const isAuthRequest =
        request.url.includes("/auth/login") ||
        request.url.includes("/auth/refresh");
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !token ||
        isAuthRequest
      ) {
        return throwError(() => error);
      }
      return refresh.refresh().pipe(
        switchMap((newToken) =>
          next(
            request.clone({
              setHeaders: {
                "X-API-VERSION": "1",
                Authorization: `Bearer ${newToken}`,
                ...(branchContext.selected()
                  ? { "X-Branch-Context": branchContext.selected() }
                  : {}),
              },
              withCredentials: true,
            }),
          ),
        ),
      );
    }),
  );
};

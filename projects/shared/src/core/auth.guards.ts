import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { SessionState } from "./session.state";

export const workspaceGuard: CanActivateFn = async () => {
  const session = inject(SessionState);
  const auth = inject(AuthService);
  const router = inject(Router);
  if (session.authenticated() && session.context()) return true;
  return (await auth.restoreWorkspace())
    ? true
    : router.createUrlTree(["/auth/login"]);
};

export const platformGuard: CanActivateFn = async () => {
  const session = inject(SessionState);
  const auth = inject(AuthService);
  const router = inject(Router);
  if (session.authenticated() && session.platformUser()) return true;
  return (await auth.restorePlatform())
    ? true
    : router.createUrlTree(["/login"]);
};

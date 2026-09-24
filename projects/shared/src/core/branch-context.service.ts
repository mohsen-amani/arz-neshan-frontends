import { Injectable, signal } from "@angular/core";

const STORAGE_KEY = "arz-neshan.active-branch";

@Injectable({ providedIn: "root" })
export class BranchContextService {
  private readonly selectedState = signal(this.read());
  readonly selected = this.selectedState.asReadonly();

  select(branchId: string): void {
    const value = branchId.trim();
    this.selectedState.set(value);
    if (typeof sessionStorage === "undefined") return;
    if (value) sessionStorage.setItem(STORAGE_KEY, value);
    else sessionStorage.removeItem(STORAGE_KEY);
  }

  private read(): string {
    return typeof sessionStorage === "undefined"
      ? ""
      : (sessionStorage.getItem(STORAGE_KEY) ?? "");
  }
}

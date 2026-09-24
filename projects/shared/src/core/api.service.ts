import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiRecord, Paginated } from "./models";

@Injectable({ providedIn: "root" })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Observable<T> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== "")
        httpParams = httpParams.set(key, String(value));
    }
    return this.http.get<T>(this.url(path), {
      params: httpParams,
      withCredentials: true,
    });
  }

  post<T>(path: string, body: unknown, idempotencyKey?: string): Observable<T> {
    const headers = idempotencyKey
      ? new HttpHeaders({ "Idempotency-Key": idempotencyKey })
      : undefined;
    return this.http.post<T>(this.url(path), body, {
      headers,
      withCredentials: true,
    });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body, { withCredentials: true });
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body, { withCredentials: true });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path), { withCredentials: true });
  }

  download(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Observable<Blob> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== "")
        httpParams = httpParams.set(key, String(value));
    }
    return this.http.get(this.url(path), {
      responseType: "blob",
      params: httpParams,
      withCredentials: true,
    });
  }

  static rows(
    response: ApiRecord[] | Paginated<ApiRecord> | ApiRecord,
  ): ApiRecord[] {
    if (Array.isArray(response)) return response;
    const paginated = response as Paginated<ApiRecord>;
    if (Array.isArray(paginated.data)) return paginated.data;
    return [response as ApiRecord];
  }

  static errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse))
      return "Something went wrong. Please try again.";
    const payload = error.error as
      | { message?: string | Array<{ field?: string; errors?: string[] }> }
      | undefined;
    if (typeof payload?.message === "string") return payload.message;
    if (Array.isArray(payload?.message)) {
      return (
        payload.message.flatMap((item) => item.errors ?? []).join(" ") ||
        error.message
      );
    }
    return error.status === 0 ? "The service is unreachable." : error.message;
  }

  private url(path: string): string {
    return path.startsWith("/api/") ? path : `/api/${path.replace(/^\//, "")}`;
  }
}

// CloudFlare Worker types for Rip City Ticket Dispatch
// These define the CloudFlare runtime environment

declare global {
  interface R2Bucket {
    get(key: string): Promise<R2Object | null>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: R2PutOptions): Promise<R2Object>;
    delete(key: string): Promise<void>;
  }

  interface R2Object {
    body: ReadableStream;
    writeHttpMetadata(headers: Headers): void;
  }

  interface R2PutOptions {
    httpMetadata?: {
      contentType?: string;
      cacheControl?: string;
    };
  }

  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  }

  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }
}

export {};

/**
 * Rip City Ticket Dispatch - CloudFlare Caching Worker
 * Performance enhancement layer for existing DigitalOcean backend
 */

import './types';

export interface Env {
  TICKET_CACHE: R2Bucket;
  STATIC_ASSETS: R2Bucket;
  API_CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  
  // Configuration
  BACKEND_URL: string;
  CACHE_TTL: string;
  ENVIRONMENT: string;
}

// Simple cache key generator
function getCacheKey(url: string, params?: Record<string, string>): string {
  const baseKey = url.replace(/[^a-zA-Z0-9]/g, '_');
  if (params) {
    const paramString = Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `${baseKey}_${btoa(paramString)}`;
  }
  return baseKey;
}

// Rate limiting function
async function isRateLimited(env: Env, clientIP: string): Promise<boolean> {
  const key = `rate_limit:${clientIP}`;
  const current = await env.RATE_LIMIT.get(key);
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;
  
  if (!current) {
    await env.RATE_LIMIT.put(key, JSON.stringify([now]), { expirationTtl: 60 });
    return false;
  }
  
  const requests = JSON.parse(current) as number[];
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return true;
  }
  
  validRequests.push(now);
  await env.RATE_LIMIT.put(key, JSON.stringify(validRequests), { expirationTtl: 60 });
  return false;
}

// Forward request to your DigitalOcean backend
async function forwardToBackend(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const backendUrl = `${env.BACKEND_URL}${url.pathname}${url.search}`;
  
  const backendRequest = new Request(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  const response = await fetch(backendRequest);
  
  // Add cache headers for CloudFlare CDN
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...response.headers,
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'CDN-Cache-Control': 'max-age=600',     // 10 minutes on CloudFlare edge
    }
  });
  
  return newResponse;
}

// Main worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Rate limiting
    if (await isRateLimited(env, clientIP)) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Route 1: Cache expensive API calls
      if (url.pathname.startsWith('/api/cache/')) {
        const cacheKey = getCacheKey(url.pathname, Object.fromEntries(url.searchParams));
        const ttl = parseInt(env.CACHE_TTL);
        
        // Check KV cache first
        const cached = await env.API_CACHE.get(cacheKey);
        if (cached) {
          return new Response(cached, {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Cache': 'HIT'
            }
          });
        }
        
        // Forward to backend if not cached
        const backendResponse = await forwardToBackend(env, request);
        const responseText = await backendResponse.text();
        
        // Cache successful responses
        if (backendResponse.ok) {
          ctx.waitUntil(env.API_CACHE.put(cacheKey, responseText, { expirationTtl: ttl }));
        }
        
        return new Response(responseText, {
          status: backendResponse.status,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'MISS'
          }
        });
      }
      
      // Route 2: Serve static assets from R2
      if (url.pathname.startsWith('/assets/')) {
        const objectKey = url.pathname.replace('/assets/', '');
        const object = await env.STATIC_ASSETS.get(objectKey);
        
        if (!object) {
          return new Response('Asset not found', { status: 404, headers: corsHeaders });
        }
        
        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set('Cache-Control', 'public, max-age=86400'); // 24 hours
        
        return new Response(object.body, { headers });
      }
      
      // Route 3: Health check for this worker
      if (url.pathname === '/api/cache/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          worker: 'ripcity-cache-worker',
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString(),
          cache_ttl: env.CACHE_TTL,
          backend_url: env.BACKEND_URL
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Route 4: Forward everything else to your backend
      return await forwardToBackend(env, request);
      
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: 'Cache worker encountered an error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

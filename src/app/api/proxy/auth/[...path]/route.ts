import { NextRequest } from 'next/server';
import { handleProxyRequest, handleOptions } from '@/lib/proxy-handler';

export const GET = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'GET', { basePath: 'api/v1/platform/auth' });

export const POST = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'POST', { basePath: 'api/v1/platform/auth' });

export const PUT = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'PUT', { basePath: 'api/v1/platform/auth' });

export const PATCH = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'PATCH', { basePath: 'api/v1/platform/auth' });

export const DELETE = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'DELETE', { basePath: 'api/v1/platform/auth' });

export const OPTIONS = handleOptions;

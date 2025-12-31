import { NextRequest } from 'next/server';
import { handleProxyRequest, handleOptions } from '@/lib/proxy-handler';

export const GET = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'GET', { basePath: 'api' });

export const POST = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'POST', { basePath: 'api' });

export const PUT = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'PUT', { basePath: 'api' });

export const PATCH = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'PATCH', { basePath: 'api' });

export const DELETE = (req: NextRequest, ctx: any) =>
  handleProxyRequest(req, ctx.params, 'DELETE', { basePath: 'api' });

export const OPTIONS = handleOptions;

export const runtime = 'nodejs';

export async function GET() {
  const { getBevConfig } = await import('../../../../server/agent/bev.config');
  return new Response(JSON.stringify(getBevConfig()), { status: 200 });
}



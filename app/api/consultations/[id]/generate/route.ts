const PYTHON_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const upstream = await fetch(`${PYTHON_API}/api/consultations/${id}/generate`);

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

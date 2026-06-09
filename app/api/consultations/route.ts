const PYTHON_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${PYTHON_API}/api/consultations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

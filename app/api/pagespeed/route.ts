export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const strategy = searchParams.get('strategy') ?? 'mobile'

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing required query param: url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.PAGESPEED_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'PAGESPEED_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
  const params = new URLSearchParams({
    url,
    key: apiKey,
    strategy,
    category: 'performance',
  })

  try {
    const res = await fetch(`${endpoint}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    })
    const data = await res.json()

    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch PageSpeed data' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
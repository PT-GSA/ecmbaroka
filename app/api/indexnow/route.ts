export async function POST(request: Request) {
  const indexnowKey = process.env.INDEXNOW_KEY
  if (!indexnowKey) {
    return new Response(JSON.stringify({ error: 'INDEXNOW_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    // Fallback to request host if NEXT_PUBLIC_APP_URL not set
    const host = request.headers.get('host')
    baseUrl = host ? `http://${host}` : 'http://localhost:3000'
  }

  const { urlList } = await request.json().catch(() => ({ urlList: [] })) as { urlList: string[] }
  if (!Array.isArray(urlList) || urlList.length === 0) {
    return new Response(JSON.stringify({ error: 'urlList must be a non-empty array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const host = new URL(baseUrl).host
  const keyLocation = `${baseUrl}/${indexnowKey}.txt`

  const payload = {
    host,
    key: indexnowKey,
    keyLocation,
    urlList,
  }

  try {
    const res = await fetch('https://www.bing.com/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    return new Response(text || 'OK', {
      status: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to submit IndexNow', details: (error as Error).message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
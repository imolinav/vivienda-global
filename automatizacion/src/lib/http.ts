// HTTP access for every adapter. Several official sites (Congreso, Interior,
// Hacienda) reject requests without a browser user agent, so one is always
// sent. Requests are retried a couple of times because a single transient
// failure should not turn into a missed day or a spurious issue.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

export async function descargar(url: string, intentos = 3): Promise<Response> {
  let ultimo: unknown
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9', Accept: '*/*' },
        signal: AbortSignal.timeout(90_000),
        redirect: 'follow',
      })
      if (res.ok) return res
      ultimo = new Error(`${res.status} ${res.statusText} en ${url}`)
      if (res.status === 404) break
    } catch (e) {
      ultimo = e
    }
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
  }
  throw ultimo instanceof Error ? ultimo : new Error(String(ultimo))
}

export async function descargarTexto(url: string): Promise<string> {
  return (await descargar(url)).text()
}

export async function descargarJSON<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(90_000),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} en ${url}`)
  return (await res.json()) as T
}

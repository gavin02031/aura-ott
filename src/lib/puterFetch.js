export async function netFetch(url, options = {}) {
  if (typeof window !== 'undefined' && window.puter?.net?.fetch) {
    return window.puter.net.fetch(url, options);
  }

  return fetch(url, options);
}

export async function netJson(url, options = {}) {
  const res = await netFetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}


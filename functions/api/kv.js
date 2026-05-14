const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet({ request, env }) {
  if (!env.LUNA_KV) return new Response(JSON.stringify({ error: 'KV 바인딩 없음' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return new Response(JSON.stringify({ error: 'key 필요' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const value = await env.LUNA_KV.get(key);
    return new Response(JSON.stringify({ key, value }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'KV 읽기 오류', detail: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.LUNA_KV) return new Response(JSON.stringify({ error: 'KV 바인딩 없음' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return new Response(JSON.stringify({ error: 'key 필요' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const body = await request.text();
    await env.LUNA_KV.put(key, body);
    return new Response(JSON.stringify({ success: true, key }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'KV 저장 오류', detail: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

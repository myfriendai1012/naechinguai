/**
 * 내친구AI — Cloudflare Workers API
 * OpenAI GPT-4.1 mini + Cloudflare KV 데이터 저장
 *
 * 기능:
 * - OpenAI API 프록시 (API 키 안전 보관)
 * - Cloudflare KV로 사용자 데이터 영구 저장 (기기 간 공유)
 *   GET  /api/kv?key=xxx   → KV에서 데이터 읽기
 *   POST /api/kv?key=xxx   → KV에 데이터 저장
 *   POST /api/chat         → OpenAI API 호출
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // KV 읽기: GET /api/kv?key=xxx
    if (url.pathname === '/api/kv' && request.method === 'GET') {
      const key = url.searchParams.get('key');
      if (!key) return new Response(JSON.stringify({ error: 'key 필요' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const value = await env.LUNA_KV.get(key);
        return new Response(JSON.stringify({ key, value }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'KV 읽기 오류', detail: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // KV 저장: POST /api/kv?key=xxx
    if (url.pathname === '/api/kv' && request.method === 'POST') {
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

    // OpenAI API 프록시: POST /api/chat
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY 없음' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        const body = await request.json();
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4.1-mini', max_tokens: 300, temperature: 0.85, ...body })
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'OpenAI 오류', detail: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ error: '잘못된 요청' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
};

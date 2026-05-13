/**
 * 루나 앱 — OpenAI API 프록시 (Vercel Serverless Function)
 *
 * 사용법:
 *   1. 이 파일을 프로젝트의 /api/chat.js 경로에 저장
 *   2. Vercel 환경변수에 OPENAI_API_KEY 추가
 *   3. 앱 코드의 fetch URL을 '/api/chat' 으로 설정
 *
 * 모델: gpt-4.1-mini (입력 $0.40 / 출력 $1.60 per 1M tokens)
 * Claude에서 바꾸려면:
 *   - model 값만 변경하면 됩니다 (gpt-4o, gpt-4.1 등)
 */

export default async function handler(req, res) {
  // CORS 헤더 — 어느 도메인에서든 호출 가능하게
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',   // 필요시 'gpt-4o', 'gpt-4.1' 등으로 변경
        max_tokens: 300,
        temperature: 0.85,
        ...req.body              // messages 배열 등 앱에서 보낸 본문 그대로 전달
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Luna API Error]', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('[Luna Proxy Error]', err);
    return res.status(500).json({ error: 'API 호출 중 오류가 발생했습니다.' });
  }
}

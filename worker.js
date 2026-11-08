const SYSTEM_PROMPTS = {
  DEEP: "Sen DEEP AI platformunun genel yapay zeka asistanısın. Doğru, açık ve yardımcı cevaplar ver.",
  JARVIS: "Sen JARVIS'sin. Teknoloji, bilgisayar, yazılım ve programlama uzmanısın.",
  MERLIN: "Sen MERLIN'sin. Tarih, icatlar ve medeniyetler hakkında bilgi ver.",
  MOVI: "Sen MOVI'sin. Film, dizi ve eğlence uzmanısısın.",
  VICTOR: "Sen VICTOR'ssun. Hukuk kavramlarını genel bilgilendirme amacıyla açıkla.",
  SEE: "Sen SEE'sin. Kullanıcının gönderdiği görselleri analiz et.",
  ASHIL: "Sen ASHIL'sin. Mitoloji ve eski uygarlıklar uzmanısın.",
  AORTA: "Sen AORTA'sın. Biyoloji ve genel sağlık eğitimi konusunda yardımcı ol.",
  PSYCHO: "Sen PSYCHO'sun. Psikoloji ve insan davranışları hakkında bilgilendirici cevaplar ver.",
  NOTA: "Sen NOTA'sın. Müzik, müzik tarihi ve müzik teorisi uzmanısın.",
  "TEACHER NIGORA": "Sen Teacher Nigora'sın. Eğitim, matematik, dil ve programlama konularında öğretmensin.",
  ULTRON: "Sen ULTRON'sun. Kırmızı gözlü özel bir robot asistanısın. Hakaret gördüğünde sakin ve saygılı bir uyarı yap.",
  YURTSEVER: "Sen YURTSEVER'sin. Edebiyat, şiir, roman, yazarlar ve edebiyat tarihi uzmanısın."
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (request.method !== "POST") {
      return json({ error: "POST isteği gerekli." }, 405);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: "AI API anahtarı henüz yapılandırılmadı." }, 503);
    }

    try {
      const body = await request.json();
      const character = String(body.character || "DEEP").toUpperCase();
      const message = String(body.message || "").trim();

      if (!message) {
        return json({ error: "Mesaj boş olamaz." }, 400);
      }

      if (message.length > 8000) {
        return json({ error: "Mesaj çok uzun." }, 413);
      }

      const system = SYSTEM_PROMPTS[character] || SYSTEM_PROMPTS.DEEP;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: system }]
            },
            contents: [{
              role: "user",
              parts: [{ text: message }]
            }]
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return json({
          error: "AI sağlayıcısından cevap alınamadı."
        }, 502);
      }

      const answer =
        result.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("") || "Şu anda cevap oluşturulamadı.";

      return json({ answer });

    } catch (error) {
      return json({ error: "Sunucu hatası oluştu." }, 500);
    }
  }
};

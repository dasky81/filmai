export default async function handler(req, res) {
  // 1. Configurazione CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Supporta sia la variabile standard che quella VITE_ configurata prima
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Manca API Key nelle variabili d\'ambiente.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito.' });
  }

  try {
    const body = req.body;
    if (!body || !body.prompt) {
        return res.status(400).json({ error: 'Prompt mancante.' });
    }

    // --- MODELLO ---
    const model = 'gemini-2.5-flash';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: body.prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Errore Google:", data);
      return res.status(response.status).json({ error: data.error?.message || 'Errore Modello' });
    }

    // Restituiamo l'intero oggetto 'data' per mantenere la compatibilità con il frontend
    // che legge data.candidates[0].content...
    return res.status(200).json(data);

  } catch (error) {
    console.error("Errore Server:", error);
    return res.status(500).json({ error: error.message });
  }
}

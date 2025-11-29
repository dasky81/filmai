export default async function handler(req, res) {
  // 1. Configurazione CORS (Fondamentale per far parlare il frontend con questo backend)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // In produzione, metti il tuo dominio vercel al posto di '*'
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Gestione pre-flight request (Browser check)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Accetta solo metodo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
  }

  try {
    const { prompt } = req.body;

    // 4. Recupera la chiave API dalle variabili d'ambiente di Vercel
    // Assicurati di aver impostato VITE_GEMINI_API_KEY su Vercel (Settings -> Environment Variables)
    const apiKey = process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Errore: API Key mancante su Vercel");
      return res.status(500).json({ error: 'Configurazione Server: API Key mancante.' });
    }

    // 5. Chiama Google Gemini (Server-to-Server)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    // Controllo se Google ha restituito un errore (es. 400, 403, 500)
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Errore API Gemini:", response.status, errorText);
      return res.status(response.status).json({ error: `Errore Gemini: ${response.statusText}`, details: errorText });
    }

    const data = await response.json();
    
    // 6. Restituisce il risultato al frontend
    res.status(200).json(data);

  } catch (error) {
    console.error("Errore Server Interno:", error);
    res.status(500).json({ error: 'Errore interno del server durante la richiesta AI.' });
  }
}

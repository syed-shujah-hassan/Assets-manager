function normalizeEmergencyDescription(raw) {
  const text = String(raw || '')
    .replace(/\s+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
  if (!text) return '';
  const sentence = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function inferIncidentType(description = '') {
  const text = String(description).toLowerCase();
  if (['fire', 'smoke', 'burn', 'blast', 'explosion'].some((w) => text.includes(w))) return 'fire';
  if (['accident', 'crash', 'collision', 'road', 'traffic'].some((w) => text.includes(w))) return 'accident';
  if (['unconscious', 'heart', 'breathing', 'medical', 'bleeding', 'seizure'].some((w) => text.includes(w))) return 'medical';
  return 'general';
}

function detectPriorityFromDescription(description) {
  const text = String(description || '').toLowerCase();
  const hasAny = (words) => words.some((w) => text.includes(w));
  if (hasAny(['fire', 'blast', 'explosion', 'unconscious', 'not breathing', 'cardiac', 'heart attack', 'severe bleeding', 'trapped', 'collapse'])) {
    return 'Critical';
  }
  if (hasAny(['accident', 'injury', 'injured', 'burn', 'fracture', 'smoke', 'gas leak', 'faint', 'seizure'])) {
    return 'High';
  }
  if (hasAny(['pain', 'dizzy', 'minor', 'help', 'support'])) {
    return 'Medium';
  }
  return 'Low';
}

function recommendedVehicleForIncident(incidentType) {
  if (incidentType === 'medical' || incidentType === 'accident') return 'Ambulance';
  if (incidentType === 'fire') return 'Fire Unit';
  return 'Ambulance';
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function callGeminiAnalyzer({ description, location }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const prompt = [
    'You are an emergency triage assistant.',
    'Return STRICT JSON with keys: cleanedDescription, priority, incidentType, recommendedVehicle.',
    'priority must be one of: Critical, High, Medium, Low.',
    'incidentType must be one of: fire, accident, medical, general.',
    'recommendedVehicle should be short, e.g. Ambulance, Fire Unit, Rescue Unit.',
    `location: ${location || ''}`,
    `description: ${description || ''}`,
  ].join('\n');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  return safeJsonParse(text);
}

async function analyzeEmergencyInput({ description, location }) {
  const cleaned = normalizeEmergencyDescription(description);
  const ruleIncident = inferIncidentType(cleaned);
  const rulePriority = detectPriorityFromDescription(cleaned);
  const ruleVehicle = recommendedVehicleForIncident(ruleIncident);

  const ai = await callGeminiAnalyzer({ description: cleaned, location }).catch(() => null);
  if (!ai) {
    return {
      cleanedDescription: cleaned,
      priority: rulePriority,
      incidentType: ruleIncident,
      recommendedVehicle: ruleVehicle,
      source: 'rules',
    };
  }

  const allowedPriority = new Set(['Critical', 'High', 'Medium', 'Low']);
  const allowedIncident = new Set(['fire', 'accident', 'medical', 'general']);
  const aiCleaned = normalizeEmergencyDescription(ai.cleanedDescription || cleaned);
  const aiPriority = allowedPriority.has(ai.priority) ? ai.priority : rulePriority;
  const aiIncident = allowedIncident.has(ai.incidentType) ? ai.incidentType : ruleIncident;
  const aiVehicle = String(ai.recommendedVehicle || recommendedVehicleForIncident(aiIncident)).trim() || ruleVehicle;

  return {
    cleanedDescription: aiCleaned,
    priority: aiPriority,
    incidentType: aiIncident,
    recommendedVehicle: aiVehicle,
    source: 'gemini',
  };
}

module.exports = {
  analyzeEmergencyInput,
  inferIncidentType,
};


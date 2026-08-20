function extractAndRepairJson(raw) {
  if (!raw || typeof raw !== 'string') return null;

  let text = raw.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1].trim();

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

  let jsonCandidate = text.slice(firstBrace, lastBrace + 1);

  let repaired = jsonCandidate;

  repaired = repaired.replace(/\/\/.*$/gm, '');
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');

  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$-]*)(\s*:)/g, '$1"$2"$3');

  repaired = repaired.replace(/'/g, '"');

  repaired = repaired.replace(/,\s*}/g, '}');
  repaired = repaired.replace(/,\s*]/g, ']');

  try {
    JSON.parse(repaired);
    return repaired;
  } catch {
    try {
      JSON.parse(jsonCandidate);
      return jsonCandidate;
    } catch {
      return null;
    }
  }
}

export { extractAndRepairJson };
import { analyzeUrlFast } from './backend/services/urlIntelligenceService.js';

async function run() {
  const res = await analyzeUrlFast('https://addus.co.in');
  console.log(JSON.stringify(res, null, 2));
}

run().catch(console.error);

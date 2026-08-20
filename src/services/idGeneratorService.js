import { storage } from '../utils/storage.js';

const COUNTERS_KEY = 'ADDUS_GLOBAL_ID_COUNTERS_DB';

/**
 * Enterprise ADDUS Platform Global Unique ID Standard Generator Service
 * Guarantees permanent, non-reusable, sequential business IDs:
 * - ACA000001 (Customer Account)
 * - ABA000001 (Business Profile)
 * - APD000001 (Product)
 * - APA000001 (Project)
 * - AIA000001 (Invoice)
 * - AYA000001 (Payment)
 */
export const idGeneratorService = {
  getNextId(prefix = 'ACA') {
    const counters = storage.get(COUNTERS_KEY, {
      ACA: 100001,
      ABA: 200001,
      APD: 300001,
      APA: 400001,
      AIA: 500001,
      AYA: 600001
    });

    const currentNum = counters[prefix] || 100001;
    counters[prefix] = currentNum + 1;
    storage.set(COUNTERS_KEY, counters);

    const padded = String(currentNum).padStart(6, '0');
    return `${prefix}${padded}`;
  },

  peekNextId(prefix = 'ACA') {
    const counters = storage.get(COUNTERS_KEY, {
      ACA: 100001,
      ABA: 200001,
      APD: 300001,
      APA: 400001,
      AIA: 500001,
      AYA: 600001
    });
    const currentNum = counters[prefix] || 100001;
    const padded = String(currentNum).padStart(6, '0');
    return `${prefix}${padded}`;
  }
};

export default idGeneratorService;

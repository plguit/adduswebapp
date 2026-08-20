import { storage } from '../../src/utils/storage.js';

const COUNTERS_KEY = 'ADDUS_GLOBAL_ID_COUNTERS_DB';

export const idGeneratorService = {
  getNextId(prefix = 'ACA') {
    const counters = storage.get(COUNTERS_KEY, {
      ACA: 101,
      ACRA: 201,
      ABA: 301,
      APA: 401,
      AQA: 501,
      AIA: 601,
      AYA: 701,
      ATA: 801
    });

    const currentNum = counters[prefix] || 1;
    counters[prefix] = currentNum + 1;
    storage.set(COUNTERS_KEY, counters);

    const padded = String(currentNum).padStart(6, '0');
    return `${prefix}${padded}`;
  },

  peekNextId(prefix = 'ACA') {
    const counters = storage.get(COUNTERS_KEY, {
      ACA: 101,
      ACRA: 201,
      ABA: 301,
      APA: 401,
      AQA: 501,
      AIA: 601,
      AYA: 701,
      ATA: 801
    });
    const currentNum = counters[prefix] || 1;
    const padded = String(currentNum).padStart(6, '0');
    return `${prefix}${padded}`;
  }
};

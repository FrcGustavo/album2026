import { emptyState, migrateV1, sanitizeState } from '../domain/albumState.js';

const STORAGE_V1 = 'panini-world-cup-2026-mx-v1';
const STORAGE_V2 = 'panini-world-cup-2026-mx-v2';

export function createLocalAlbumRepository(storage = localStorage) {
  return {
    load() {
      try {
        const v2 = storage.getItem(STORAGE_V2);
        if (v2) return sanitizeState(JSON.parse(v2));
        const v1 = storage.getItem(STORAGE_V1);
        if (v1) return migrateV1(JSON.parse(v1));
      } catch {
        return emptyState();
      }
      return emptyState();
    },
    save(state) {
      storage.setItem(STORAGE_V2, JSON.stringify(state));
    }
  };
}

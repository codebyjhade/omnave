import localforage from 'localforage';

// Configure localforage instance for Omnave offline storage
if (typeof window !== 'undefined') {
  localforage.config({
    name: 'Omnave',
    storeName: 'omnave_offline_store',
    description: 'Offline storage for Omnave study materials and lessons',
  });
}

export const OFFLINE_KEYS = {
  LIBRARY: 'omnave_library',
  LESSON: (id: string) => `omnave_lesson_${id}`,
};

export async function saveLibraryToOffline(lessons: any[]): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    await localforage.setItem(OFFLINE_KEYS.LIBRARY, lessons);
    console.log('[OfflineStorage] Saved library to IndexedDB:', lessons.length, 'items');
  } catch (err) {
    console.error('[OfflineStorage] Failed to save library to IndexedDB:', err);
  }
}

export async function getLibraryFromOffline<T = any[]>(): Promise<T | null> {
  try {
    if (typeof window === 'undefined') return null;
    const data = await localforage.getItem<T>(OFFLINE_KEYS.LIBRARY);
    if (data) {
      console.log('[OfflineStorage] Retrieved library from IndexedDB');
    }
    return data;
  } catch (err) {
    console.error('[OfflineStorage] Failed to retrieve library from IndexedDB:', err);
    return null;
  }
}

export async function saveLessonToOffline(id: string, lessonData: any): Promise<void> {
  try {
    if (typeof window === 'undefined' || !id) return;
    await localforage.setItem(OFFLINE_KEYS.LESSON(id), lessonData);
    console.log(`[OfflineStorage] Saved lesson ${id} to IndexedDB`);
  } catch (err) {
    console.error(`[OfflineStorage] Failed to save lesson ${id} to IndexedDB:`, err);
  }
}

export async function getLessonFromOffline<T = any>(id: string): Promise<T | null> {
  try {
    if (typeof window === 'undefined' || !id) return null;
    let data = (await localforage.getItem(OFFLINE_KEYS.LESSON(id))) as T | null;
    
    // Fallback: If individual lesson key is missing, check if cached in library array
    if (!data) {
      const cachedLibrary = await getLibraryFromOffline<any[]>();
      if (Array.isArray(cachedLibrary)) {
        const found = cachedLibrary.find((item) => item.id === id);
        if (found) {
          data = (found as unknown) as T;
          console.log(`[OfflineStorage] Retrieved lesson ${id} from cached library`);
        }
      }
    } else {
      console.log(`[OfflineStorage] Retrieved lesson ${id} from IndexedDB`);
    }

    return data;
  } catch (err) {
    console.error(`[OfflineStorage] Failed to retrieve lesson ${id} from IndexedDB:`, err);
    return null;
  }
}

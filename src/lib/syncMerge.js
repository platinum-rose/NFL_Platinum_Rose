/**
 * syncMerge.js — Pure merge helper for Supabase boot hydration.
 *
 * Strategy (applied per-record by id):
 *   - Cloud record not present locally  → added (new on cloud wins)
 *   - Both present, cloud.updatedAt newer → cloud fields overwrite local
 *   - Both present, local.updatedAt newer → local kept (cloud is stale)
 *   - Either timestamp absent            → local kept (can't determine winner)
 *
 * Returns { merged: T[], changed: boolean }
 * Neither input array is mutated.
 */

/**
 * @template {{ id: string | number, updatedAt?: string }} T
 * @param {T[]} local  - Records currently in localStorage
 * @param {T[]} cloud  - Records fetched from Supabase
 * @returns {{ merged: T[], changed: boolean }}
 */
export function mergeByUpdatedAt(local, cloud) {
    const localById = new Map(local.map(r => [String(r.id), r]));
    const merged = [...local];
    let changed = false;

    for (const cloudRecord of cloud) {
        const key = String(cloudRecord.id);
        const localRecord = localById.get(key);

        if (!localRecord) {
            // New on cloud — add locally
            merged.push(cloudRecord);
            changed = true;
        } else if (
            cloudRecord.updatedAt &&
            localRecord.updatedAt &&
            new Date(cloudRecord.updatedAt) > new Date(localRecord.updatedAt)
        ) {
            // Cloud is newer — overwrite; local fields absent from cloud are preserved
            const idx = merged.findIndex(r => String(r.id) === key);
            if (idx !== -1) merged[idx] = { ...localRecord, ...cloudRecord };
            changed = true;
        }
        // else: local is newer, same age, or timestamps absent → keep local, no-op
    }

    return { merged, changed };
}

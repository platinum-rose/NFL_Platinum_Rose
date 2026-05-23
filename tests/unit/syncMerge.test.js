import { describe, it, expect } from 'vitest';
import { mergeByUpdatedAt } from '../../src/lib/syncMerge.js';

// ── helpers ───────────────────────────────────────────────────────────────────
const pick = (id, updatedAt, extra = {}) => ({ id, updatedAt, ...extra });

// ── additive (no matching local record) ──────────────────────────────────────
describe('mergeByUpdatedAt — cloud-only records', () => {
    it('adds a cloud record when local is empty', () => {
        const { merged, changed } = mergeByUpdatedAt([], [pick('p1', '2024-01-02')]);
        expect(merged).toHaveLength(1);
        expect(merged[0].id).toBe('p1');
        expect(changed).toBe(true);
    });

    it('adds a cloud record not present locally', () => {
        const local = [pick('p1', '2024-01-01')];
        const { merged, changed } = mergeByUpdatedAt(local, [pick('p2', '2024-01-02')]);
        expect(merged).toHaveLength(2);
        expect(merged.map(r => r.id)).toContain('p2');
        expect(changed).toBe(true);
    });

    it('adds multiple missing cloud records', () => {
        const { merged, changed } = mergeByUpdatedAt(
            [],
            [pick('a', '2024-01-01'), pick('b', '2024-01-02'), pick('c', '2024-01-03')],
        );
        expect(merged).toHaveLength(3);
        expect(changed).toBe(true);
    });
});

// ── cloud wins (cloud timestamp newer) ───────────────────────────────────────
describe('mergeByUpdatedAt — cloud newer', () => {
    it('overwrites local when cloud.updatedAt is newer', () => {
        const local = [pick('p1', '2024-01-01', { team: 'ARI' })];
        const cloud = [pick('p1', '2024-01-02', { team: 'SF' })];
        const { merged, changed } = mergeByUpdatedAt(local, cloud);
        expect(merged).toHaveLength(1);
        expect(merged[0].team).toBe('SF');
        expect(changed).toBe(true);
    });

    it('preserves local-only fields when cloud overwrites', () => {
        const local = [pick('p1', '2024-01-01', { localOnlyField: 'keep-me', team: 'ARI' })];
        const cloud = [pick('p1', '2024-01-02', { team: 'SF' })];
        const { merged } = mergeByUpdatedAt(local, cloud);
        expect(merged[0].localOnlyField).toBe('keep-me');
        expect(merged[0].team).toBe('SF');
    });

    it('handles ISO timestamp strings with time components', () => {
        const local = [pick('p1', '2024-06-15T08:00:00.000Z')];
        const cloud = [pick('p1', '2024-06-15T09:30:00.000Z')];
        const { merged, changed } = mergeByUpdatedAt(local, cloud);
        expect(changed).toBe(true);
        expect(merged[0].updatedAt).toBe('2024-06-15T09:30:00.000Z');
    });
});

// ── local wins (local timestamp newer or equal) ───────────────────────────────
describe('mergeByUpdatedAt — local newer or equal', () => {
    it('keeps local when local.updatedAt is newer', () => {
        const local = [pick('p1', '2024-01-03', { team: 'ARI' })];
        const cloud = [pick('p1', '2024-01-01', { team: 'SF' })];
        const { merged, changed } = mergeByUpdatedAt(local, cloud);
        expect(merged[0].team).toBe('ARI');
        expect(changed).toBe(false);
    });

    it('keeps local when timestamps are identical', () => {
        const ts = '2024-01-02T12:00:00.000Z';
        const local = [pick('p1', ts, { team: 'ARI' })];
        const cloud = [pick('p1', ts, { team: 'SF' })];
        const { merged, changed } = mergeByUpdatedAt(local, cloud);
        expect(merged[0].team).toBe('ARI');
        expect(changed).toBe(false);
    });
});

// ── timestamp absent → local wins ────────────────────────────────────────────
describe('mergeByUpdatedAt — missing timestamps', () => {
    it('keeps local when cloud record has no updatedAt', () => {
        const local = [pick('p1', '2024-01-01', { team: 'ARI' })];
        const cloud = [{ id: 'p1', team: 'SF' }]; // no updatedAt
        const { merged, changed } = mergeByUpdatedAt(local, cloud);
        expect(merged[0].team).toBe('ARI');
        expect(changed).toBe(false);
    });

    it('keeps local when local record has no updatedAt', () => {
        const local = [{ id: 'p1', team: 'ARI' }]; // no updatedAt
        const cloud = [pick('p1', '2024-01-02', { team: 'SF' })];
        const { merged, changed } = mergeByUpdatedAt(local, cloud);
        expect(merged[0].team).toBe('ARI');
        expect(changed).toBe(false);
    });

    it('keeps local when neither record has updatedAt', () => {
        const local = [{ id: 'p1', team: 'ARI' }];
        const cloud = [{ id: 'p1', team: 'SF' }];
        const { merged, changed } = mergeByUpdatedAt(local, cloud);
        expect(merged[0].team).toBe('ARI');
        expect(changed).toBe(false);
    });
});

// ── id coercion (string vs number) ───────────────────────────────────────────
describe('mergeByUpdatedAt — id type coercion', () => {
    it('matches numeric local id against string cloud id', () => {
        const local = [{ id: 42, updatedAt: '2024-01-01', val: 'local' }];
        const cloud = [{ id: '42', updatedAt: '2024-01-02', val: 'cloud' }];
        const { merged, changed } = mergeByUpdatedAt(local, cloud);
        expect(merged).toHaveLength(1);
        expect(merged[0].val).toBe('cloud');
        expect(changed).toBe(true);
    });

    it('does not add a duplicate when id types differ but values match', () => {
        const local = [pick(1, '2024-01-02')];
        const cloud = [pick('1', '2024-01-01')]; // cloud is older
        const { merged } = mergeByUpdatedAt(local, cloud);
        expect(merged).toHaveLength(1);
    });
});

// ── no-mutation guarantee ─────────────────────────────────────────────────────
describe('mergeByUpdatedAt — immutability', () => {
    it('does not mutate the local input array', () => {
        const local = [pick('p1', '2024-01-01')];
        const cloud = [pick('p2', '2024-01-02')];
        mergeByUpdatedAt(local, cloud);
        expect(local).toHaveLength(1);
    });

    it('does not mutate the cloud input array', () => {
        const local = [pick('p1', '2024-01-01')];
        const cloud = [pick('p1', '2024-01-02', { extra: 1 })];
        mergeByUpdatedAt(local, cloud);
        expect(cloud).toHaveLength(1);
    });
});

// ── edge cases ────────────────────────────────────────────────────────────────
describe('mergeByUpdatedAt — edge cases', () => {
    it('returns changed=false and empty array when both inputs are empty', () => {
        const { merged, changed } = mergeByUpdatedAt([], []);
        expect(merged).toHaveLength(0);
        expect(changed).toBe(false);
    });

    it('returns changed=false when cloud is empty', () => {
        const local = [pick('p1', '2024-01-01')];
        const { merged, changed } = mergeByUpdatedAt(local, []);
        expect(merged).toHaveLength(1);
        expect(changed).toBe(false);
    });

    it('handles mixed add + overwrite + no-op in a single call', () => {
        const local = [
            pick('p1', '2024-01-03', { team: 'ARI' }),   // local newer → keep
            pick('p2', '2024-01-01', { team: 'DAL' }),   // cloud newer → overwrite
        ];
        const cloud = [
            pick('p1', '2024-01-01', { team: 'SF' }),    // stale — no-op
            pick('p2', '2024-01-02', { team: 'NYG' }),   // newer — wins
            pick('p3', '2024-01-01', { team: 'GB' }),    // new — add
        ];
        const { merged, changed } = mergeByUpdatedAt(local, cloud);
        expect(merged).toHaveLength(3);
        expect(merged.find(r => r.id === 'p1').team).toBe('ARI');
        expect(merged.find(r => r.id === 'p2').team).toBe('NYG');
        expect(merged.find(r => r.id === 'p3').team).toBe('GB');
        expect(changed).toBe(true);
    });
});

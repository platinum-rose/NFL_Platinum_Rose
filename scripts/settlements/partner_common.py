"""Shared helpers for partner account statements (Ticket breakdown + Leg analysis tabs).

A partner's tickets are every split that names them (split_partner / split_participants / id)
plus every solo ticket they own that Andy fronted (owner == partner, ownership_type == 'solo').
A solo ticket counts at the full stake (share 1/1)."""
import json, os

def resolve(root, path):
    return path if os.path.isabs(path) else os.path.join(root, path)

def load_wagers(root):
    return json.load(open(os.path.join(root, 'data/official-picks/user-placed-wagers-2026.json'), encoding='utf-8'))

def partner_rows(wagers, partner):
    def match(w):
        split = (w.get('is_split') or w.get('split_partner')) and partner in json.dumps(
            [w.get('split_partner'), w.get('split_participants'), w.get('id')])
        solo = w.get('owner') == partner and w.get('ownership_type') == 'solo'
        return bool(split or solo)
    rows = [w for w in wagers if match(w)]
    rows.sort(key=lambda w: (w['week'], w['date'], w['id']))
    return rows

def share(w):
    """(denominator, partner contribution) for one ticket."""
    if w.get('ownership_type') == 'solo' and not w.get('is_split'):
        return 1, float(w.get('stake_usd') or 0)
    parts = w.get('split_participants')
    den = len(parts) if parts else (w.get('split_count') or 2)
    c = (w.get('split_details') or {}).get('per_person_contribution_usd')
    if c is None:
        c = round((w.get('stake_usd') or 0) / den, 3)
    return den, float(c)

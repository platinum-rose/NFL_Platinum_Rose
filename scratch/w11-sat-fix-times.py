"""Correct timestamps I wrote ahead of the real clock (Windows clock is authoritative)."""
import glob
EDITS = {
    'appended': (sorted(glob.glob('reports/intel/games/2026-w11-game-*-sides.md') + glob.glob('reports/intel/games/2026-w11-game-*-props.md') + ['reports/intel/games/2026-w11-game-RUNLOG.md']),
                 [('2026-11-21T12:30:00-08:00', '2026-11-21T11:50:00-08:00'), ('(Open-Meteo, read Sat 11:50 am PT)', '(Open-Meteo, read Sat ~11:40 am PT)')]),
    'evidence': (['reports/intel/w11-qb-injury-news-check-2026-11-21.md'],
                 [('Sat Nov 21 2026, about 12:30 pm PT', 'Sat Nov 21 2026, about 11:50 am PT'), ('captured Sat ~11:55 am PT', 'captured Sat ~11:46 am PT')]),
    'weather': (['data/research-intel/review/2026-w11-weather-venue.json'], [('"captured_at": "2026-11-21T19:50:00Z"', '"captured_at": "2026-11-21T19:40:00Z"')]),
    'media': (['data/twitter/w11-media-extraction-queue.json'], [('"processed_at": "2026-11-21T20:40:00Z"', '"processed_at": "2026-11-21T19:52:00Z"')]),
}
for name, (files, reps) in EDITS.items():
    for f in files:
        s = open(f, encoding='utf-8').read()
        n = 0
        for a, b in reps:
            n += s.count(a); s = s.replace(a, b)
        open(f, 'w', encoding='utf-8', newline='').write(s)
        print(name, f.split('/')[-1], n)

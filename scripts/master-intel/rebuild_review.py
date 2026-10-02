"""Re-lay out an already-built Master Intel report in the current section order (template v2),
without re-pulling any data. Used to review a format change on a past week's exact content.

  python3 scripts/master-intel/rebuild_review.py dist/nfl_week3_master_packet/nfl_week3_master_betting_intelligence_summary.md dist/nfl_week3_master_packet_v2
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import build, convert_summary

src, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
lines = src.read_text(encoding='utf-8').split('\n')
lines = [x for x in lines if not x.startswith(('<style>.side-toc', '<style>.part-banner', '<div class="side-toc"', '<button class="toc-toggle"'))]
i = next(k for k, x in enumerate(lines) if x.startswith('<div class="global-rollup-bar"'))
g = next(k for k in range(i, len(lines)) if lines[k].startswith('<div class="toc-grid"'))
e = next(k for k in range(g + 1, len(lines)) if lines[k].strip() == '</div>')
lines = lines[:i] + lines[e + 1:]
d = next((k for k, x in enumerate(lines) if x.startswith('<a id="disclaimer"')), len(lines))
lines = lines[:d]
while lines and not lines[-1].strip(): lines.pop()
heads = [k for k, x in enumerate(lines) if x.startswith('## ') and not (k > 0 and lines[k - 1].startswith('# '))]
for n in range(len(heads) - 1, -1, -1):
    h = heads[n]
    nxt = heads[n + 1] if n + 1 < len(heads) else len(lines)
    t = nxt - 1
    if n + 1 < len(heads):
        while t > h and (not lines[t].strip() or lines[t].startswith('<a id=')): t -= 1
    else:
        while t > h and not lines[t].strip(): t -= 1
    o = next(k for k in range(h + 1, min(h + 40, len(lines))) if lines[k].startswith('<details class="rollup-box section-main'))
    assert lines[t] == '</details>' and lines[t - 1] == '</div>', (lines[h], lines[t - 1:t + 1])
    assert lines[o + 2] == '<div class="rollup-content">', lines[o:o + 3]
    del lines[t - 1:t + 1]
    lines[h + 1:o + 3] = ['']
L = build.reorder_sections(lines)
txt = build.finalize_report(L, [])
out_dir.mkdir(parents=True, exist_ok=True)
md = out_dir / src.name
md.write_text(txt + '\n', encoding='utf-8')
convert_summary.generate_html(str(md), str(md.with_suffix('.html')))
convert_summary.generate_docx(str(md), str(md.with_suffix('.docx')))
print('wrote', md, md.with_suffix('.html'), md.with_suffix('.docx'))

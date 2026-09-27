#!/usr/bin/env python3
"""Print the Master Intel html report to PDF with every section expanded.

usage:
  python3 scripts/master-intel/export_pdf.py dist/nfl_week3_master_packet/nfl_week3_master_betting_intelligence_summary.html

Writes the .pdf next to the .html. Needs Playwright + Chromium:
  pip install playwright && python3 -m playwright install chromium
(If Chromium can't be installed on this machine, run it anywhere that has it: the html is self-contained.)
"""
import sys
from pathlib import Path

PRINT_CSS = """
  * { box-shadow: none !important; filter: none !important; text-shadow: none !important; animation: none !important; transition: none !important; }
  .side-toc, .toc-toggle, .side-tip, .rollup-controls, .global-rollup-bar, .table-filter, .back-to-top { display: none !important; }
  .container { margin: 0 auto !important; max-width: none !important; border: 0 !important; filter: none !important; padding: 0 !important; }
  body { padding: 0 !important; background: #fff !important; }
  details.rollup-box { break-inside: auto; }
  details.rollup-box > summary { break-after: avoid; }
  tr, .game-narrative { break-inside: avoid; }
  .term-tooltip .tip-text, .sort-icon { display: none !important; }
  .term-tooltip, .term-tooltip * { border-bottom: 0 !important; text-decoration: none !important; }
  .term-tooltip::after, .term-tooltip::before { content: none !important; display: none !important; }
"""

def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    html = Path(sys.argv[1]).resolve()
    pdf = html.with_suffix('.pdf')
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit('playwright is not installed: pip install playwright && python3 -m playwright install chromium')
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1200, 'height': 900})
        pg.emulate_media(color_scheme='light')
        pg.goto(html.as_uri())
        pg.evaluate("document.querySelectorAll('details').forEach(d => d.open = true); document.querySelectorAll('tr').forEach(r => r.style.display = ''); document.querySelectorAll('.filter-group,.pool-group').forEach(g => g.style.display = '')")
        pg.add_style_tag(content=PRINT_CSS)
        pg.pdf(path=str(pdf), format='Letter', print_background=True, margin=dict(top='0.5in', bottom='0.55in', left='0.45in', right='0.45in'),
               display_header_footer=True, header_template='<span></span>',
               footer_template='<div style="font-size:8px;width:100%;text-align:center;color:#64748b;">Platinum Rose Master Intel — for entertainment purposes only — page <span class="pageNumber"></span> of <span class="totalPages"></span></div>')
        b.close()
    print(f'wrote {pdf}')

if __name__ == '__main__':
    main()

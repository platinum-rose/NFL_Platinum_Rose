from pathlib import Path
import re

txt = Path('dist/nfl_week5_master_packet/Platinum_Rose_NFL_Week5_Intel.html').read_text(encoding='utf-8')

# Find all script blocks
scripts = re.findall(r'<script>(.*?)</script>', txt, re.S)
print(f"Total script blocks: {len(scripts)}")
for i, s in enumerate(scripts):
    print(f"\n--- Script {i} (len {len(s)}) ---")
    # check for common JS syntax issues or missing vars
    for kw in ['initBookmarks', 'renderCardDrawer', 'loadBms', 'renderListInto', 'setup']:
        print(f"  has {kw}: {kw in s}")

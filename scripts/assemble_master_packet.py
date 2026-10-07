#!/usr/bin/env python3
"""
Assemble NFL Week 1 Master Intelligence Packet
Creates a self-contained, multi-page distribution packet in dist/nfl_week1_master_packet/
and packages it into dist/nfl_week1_master_packet.zip.
"""

import os
import sys
import glob
import re
import shutil
import zipfile

BASE_DIR = os.path.abspath("e:/dev/projects/NFL_Dashboard")
SCRATCH_DIR = os.path.join(BASE_DIR, "scratch")
ARTICLES_DIR = os.path.join(SCRATCH_DIR, "article-summaries")
LOGOS_DIR = os.path.join(BASE_DIR, "data", "logos")
DIST_DIR = os.path.join(BASE_DIR, "dist")
PACKET_DIR = os.path.join(DIST_DIR, "nfl_week1_master_packet")
ZIP_PATH = os.path.join(DIST_DIR, "nfl_week1_master_packet.zip")

print("=== NFL Week 1 Master Packet Assembly ===")
print(f"Base Directory: {BASE_DIR}")
print(f"Packet Target: {PACKET_DIR}")

# 1. Clean and initialize directories
if os.path.exists(PACKET_DIR):
    shutil.rmtree(PACKET_DIR)
os.makedirs(os.path.join(PACKET_DIR, "assets", "css"), exist_ok=True)
os.makedirs(os.path.join(PACKET_DIR, "assets", "js"), exist_ok=True)
os.makedirs(os.path.join(PACKET_DIR, "assets", "logos"), exist_ok=True)
os.makedirs(os.path.join(PACKET_DIR, "podcasts"), exist_ok=True)
os.makedirs(os.path.join(PACKET_DIR, "articles"), exist_ok=True)

# 2. Copy all team logos
logo_files = glob.glob(os.path.join(LOGOS_DIR, "*.png"))
print(f"Copying {len(logo_files)} team logos to assets/logos/...")
for lf in logo_files:
    shutil.copy2(lf, os.path.join(PACKET_DIR, "assets", "logos", os.path.basename(lf)))

# 3. Write CSS and JS for persistent navigation
PACKET_NAV_CSS = """/* NFL Week 1 Master Packet - Unified Navigation Bar */
:root {
  --pnav-bg: #0f172a;
  --pnav-card: #1e293b;
  --pnav-border: #334155;
  --pnav-accent: #2563eb;
  --pnav-accent-light: #60a5fa;
  --pnav-text: #f8fafc;
  --pnav-muted: #94a3b8;
}
.packet-nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99990;
  background: var(--pnav-bg);
  color: var(--pnav-text);
  border-bottom: 2px solid var(--pnav-accent);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 13.5px;
}
.packet-nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
}
.packet-nav-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  color: #ffffff;
  font-weight: 800;
  font-size: 14.5px;
  letter-spacing: 0.3px;
}
.packet-nav-brand:hover {
  color: var(--pnav-accent-light);
}
.packet-nav-brand .brand-badge {
  background: var(--pnav-accent);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.packet-nav-menu {
  display: flex;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.packet-nav-item {
  position: relative;
}
.packet-nav-link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  color: var(--pnav-muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.packet-nav-link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}
.packet-nav-link.active {
  color: #ffffff;
  background: rgba(37, 99, 235, 0.25);
  border-bottom: 2px solid var(--pnav-accent-light);
}
.packet-nav-link .dropdown-arrow {
  font-size: 9px;
  opacity: 0.7;
  transition: transform 0.2s ease;
}
.packet-nav-item:hover .packet-nav-link .dropdown-arrow {
  transform: rotate(180deg);
}
.packet-dropdown {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 290px;
  background: var(--pnav-card);
  border: 1px solid var(--pnav-border);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
  padding: 6px 0;
  z-index: 100000;
  max-height: 82vh;
  overflow-y: auto;
}
.packet-dropdown.right-aligned {
  left: auto;
  right: 0;
}
.packet-nav-item:hover .packet-dropdown,
.packet-nav-item:focus-within .packet-dropdown {
  display: block;
}
.packet-dropdown-header {
  padding: 8px 14px 4px 14px;
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.packet-dropdown a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 14px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 12.5px;
  font-weight: 500;
  transition: all 0.15s ease;
}
.packet-dropdown a:hover {
  background: var(--pnav-accent);
  color: #ffffff;
}
.packet-dropdown a.active {
  background: rgba(37, 99, 235, 0.2);
  color: var(--pnav-accent-light);
  font-weight: 700;
}
.packet-dropdown .item-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}
.packet-dropdown a:hover .item-tag {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
.packet-dropdown-divider {
  height: 1px;
  background: var(--pnav-border);
  margin: 5px 0;
}
.packet-nav-toggle {
  display: none;
  background: none;
  border: 1px solid var(--pnav-border);
  color: #ffffff;
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
}
/* Breadcrumb bar for sub-pages */
.packet-breadcrumb-bar {
  background: #0b1329;
  border-bottom: 1px solid #1e293b;
  padding: 7px 20px;
  font-size: 12.5px;
  color: #64748b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.packet-breadcrumb-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.packet-breadcrumb-bar a {
  color: var(--pnav-accent-light);
  text-decoration: none;
  font-weight: 600;
}
.packet-breadcrumb-bar a:hover {
  text-decoration: underline;
}
.packet-breadcrumb-bar .back-btn {
  background: #1e293b;
  color: #93c5fd;
  border: 1px solid #334155;
  padding: 3px 10px;
  border-radius: 5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}
.packet-breadcrumb-bar .back-btn:hover {
  background: var(--pnav-accent);
  color: #ffffff;
  border-color: var(--pnav-accent);
  text-decoration: none;
}
.packet-breadcrumb-bar .sep {
  color: #475569;
}
.packet-breadcrumb-bar .current {
  color: #e2e8f0;
  font-weight: 600;
}
/* Responsive canvas alignment & 100% scale enforcements (fixes 75% display bug) */
html {
  -webkit-text-size-adjust: 100% !important;
  text-size-adjust: 100% !important;
}
body {
  -webkit-text-size-adjust: 100% !important;
  text-size-adjust: 100% !important;
  margin: 0 !important;
  padding-top: 0 !important;
}
.container {
  width: 95% !important;
  max-width: 1200px !important;
  margin: 24px auto !important;
  box-sizing: border-box !important;
}

/* Unified Hub & Subpage Filter Bar Styling */
.hub-filter-bar {
  background: var(--card, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 16px 22px;
  margin: 20px 0 24px 0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.03);
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.filter-row:last-child {
  margin-bottom: 0;
}
.filter-row-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary, #102c57);
  min-width: 125px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex-grow: 1;
}
.filter-pill {
  background: var(--highlight, #f1f5f9);
  color: var(--text, #0f172a);
  border: 1px solid var(--border, #e2e8f0);
  padding: 5px 12px;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.filter-pill:hover {
  background: var(--primary-light, #1e4d8c);
  color: #ffffff;
  border-color: var(--primary-light, #1e4d8c);
}
.filter-pill.active {
  background: var(--primary, #102c57);
  color: #ffffff;
  border-color: var(--primary, #102c57);
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
}
.filter-count {
  background: rgba(0, 0, 0, 0.12);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10.5px;
  font-weight: 700;
}
.filter-pill.active .filter-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
.hub-filter-status {
  font-size: 12.5px;
  color: var(--muted, #64748b);
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border, #e2e8f0);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

/* Strict Team Logo Sizing & Layout Controls */
img.team-logo,
.team-logo {
  width: 22px !important;
  height: 22px !important;
  max-width: 22px !important;
  max-height: 22px !important;
  vertical-align: middle !important;
  margin-right: 6px !important;
  object-fit: contain !important;
  display: inline-block !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
}

img.team-logo-sm,
.team-logo-sm {
  width: 18px !important;
  height: 18px !important;
  max-width: 18px !important;
  max-height: 18px !important;
  vertical-align: middle !important;
  margin: 0 4px !important;
  object-fit: contain !important;
  display: inline-block !important;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
}

/* Table layout constraints: Prevent Column 1 from blowing out table width */
table.sortable-table th:first-child,
table.sortable-table td:first-child,
.table-responsive table th:first-child,
.table-responsive table td:first-child {
  white-space: nowrap !important;
  width: 165px !important;
  min-width: 145px !important;
  max-width: 185px !important;
}

/* Ensure data columns receive ample reading room */
table.sortable-table td,
.table-responsive table td {
  vertical-align: top !important;
  line-height: 1.45 !important;
}

/* Tooltip Layout & Positioning Controls: Opens DOWNWARD so header never obscures it */
.term-tooltip {
  position: relative !important;
  cursor: help !important;
}
.term-tooltip .tip-text {
  visibility: hidden;
  width: 290px;
  background-color: #0f172a;
  color: #f8fafc;
  text-align: left;
  border-radius: 8px;
  padding: 10px 14px;
  position: absolute;
  z-index: 100005;
  top: calc(100% + 8px) !important;
  bottom: auto !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.45;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  border: 1px solid #334155;
  pointer-events: none;
  white-space: normal;
  text-transform: none;
}
.term-tooltip .tip-text strong {
  color: #60a5fa;
  display: block;
  margin-bottom: 4px;
  font-size: 12.5px;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 3px;
}
.term-tooltip .tip-text::after {
  content: "" !important;
  position: absolute !important;
  bottom: 100% !important;
  top: auto !important;
  left: 50% !important;
  margin-left: -6px !important;
  border-width: 6px !important;
  border-style: solid !important;
  border-color: transparent transparent #0f172a transparent !important;
}
.term-tooltip:hover .tip-text {
  visibility: visible;
  opacity: 1;
  transform: translateX(-50%) translateY(3px) !important;
}
th:first-child .term-tooltip .tip-text,
th:nth-child(2) .term-tooltip .tip-text {
  left: 0 !important;
  transform: none !important;
}
th:first-child .term-tooltip .tip-text::after,
th:nth-child(2) .term-tooltip .tip-text::after {
  left: 24px !important;
}
th:first-child .term-tooltip:hover .tip-text,
th:nth-child(2) .term-tooltip:hover .tip-text {
  transform: translateY(3px) !important;
}
th:last-child .term-tooltip .tip-text,
th:nth-last-child(2) .term-tooltip .tip-text {
  left: auto !important;
  right: 0 !important;
  transform: none !important;
}
th:last-child .term-tooltip .tip-text::after,
th:nth-last-child(2) .term-tooltip .tip-text::after {
  left: auto !important;
  right: 24px !important;
}
th:last-child .term-tooltip:hover .tip-text,
th:nth-last-child(2) .term-tooltip:hover .tip-text {
  transform: translateY(3px) !important;
}

/* Mobile navigation */
@media (max-width: 860px) {
  .packet-nav-container {
    height: auto;
    padding: 10px 16px;
    flex-wrap: wrap;
  }
  .packet-nav-toggle {
    display: block;
  }
  .packet-nav-menu {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    padding-top: 10px;
    gap: 4px;
  }
  .packet-nav-menu.mobile-open {
    display: flex;
  }
  .packet-dropdown {
    position: static;
    display: none;
    box-shadow: none;
    border: 1px solid #334155;
    background: rgba(15, 23, 42, 0.85);
    width: 100%;
  }
  .packet-nav-item.open .packet-dropdown {
    display: block;
  }
}
"""

PACKET_NAV_JS = """/* NFL Week 1 Master Packet - Unified Navigation Script */
document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.querySelector('.packet-nav-toggle');
  const menu = document.querySelector('.packet-nav-menu');
  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', function () {
      menu.classList.toggle('mobile-open');
    });
  }

  // Handle dropdown toggles on mobile touch
  const dropdownItems = document.querySelectorAll('.packet-nav-item');
  dropdownItems.forEach(function (item) {
    const link = item.querySelector('.packet-nav-link');
    const dropdown = item.querySelector('.packet-dropdown');
    if (dropdown && link) {
      link.addEventListener('click', function (e) {
        if (window.innerWidth <= 860 && link.getAttribute('href') === '#') {
          e.preventDefault();
          item.classList.toggle('open');
        }
      });
    }
  });
});
"""

with open(os.path.join(PACKET_DIR, "assets", "css", "packet-nav.css"), "w", encoding="utf-8") as f:
    f.write(PACKET_NAV_CSS)

with open(os.path.join(PACKET_DIR, "assets", "js", "packet-nav.js"), "w", encoding="utf-8") as f:
    f.write(PACKET_NAV_JS)

print("Navigation assets written to assets/css/ and assets/js/.")

# 4. Copy Document Formats (PDF, DOCX, MD)
doc_files = [
    "nfl_week1_master_betting_intelligence_summary.pdf",
    "nfl_week1_master_betting_intelligence_summary.docx",
    "nfl_week1_master_betting_intelligence_summary.md",
    "nfl_week1_supercontest_intelligence_summary.pdf",
    "nfl_week1_supercontest_intelligence_summary.docx",
    "nfl_week1_supercontest_intelligence_summary.md",
]
for df in doc_files:
    src_df = os.path.join(SCRATCH_DIR, df)
    if os.path.exists(src_df):
        shutil.copy2(src_df, os.path.join(PACKET_DIR, df))
        print(f"Copied document {df} ({os.path.getsize(src_df)} bytes)")

# Navigation Bar Generator Function
PODCAST_LIST = [
    ("even_money_week1_bets_summary.html", "Even Money Podcast", "Ross Tucker & Steve Fezzik", "4U Consensus"),
    ("sharp_or_square_week1_bets_summary.html", "Sharp or Square", "Chad Millman & Simon Hunter", "Simon Says"),
    ("action_network_week1_bets_summary.html", "Action Network Podcast", "Raybon, Stuckey, Kazarian", "Contest 5"),
    ("the_favorites_week1_bets_summary.html", "The Favorites & Trends", "Brandon Kravitz & Evan Abrams", "Systems"),
    ("bettingpros_week1_bets_summary.html", "BettingPros (Ep. 1051/1052)", "Matt Perrault & Pat Fitzmaurice", "Survivor"),
    ("vsin_t_shoe_week1_bets_summary.html", "VSiN & T-Shoe Index", "Tyler Shoemaker", "Math Models"),
    ("the_hammer_pff_week1_bets_summary.html", "The Hammer & PFF", "Rob Pizzola, ClevTa, Dinsick", "Clusters"),
]

ARTICLE_LIST = [
    ("walter-football-week1-early-picks.html", "Walter Football: Early Picks & SB LX Rematch", "Walter Cherepinsky", "Tier 1"),
    ("vsin-dave-tuley-takes-week1.html", "VSiN: Dave Tuley's Takes & Underdog Strategy", "Dave Tuley", "Tier 2"),
    ("vsin-tyler-shoemaker-t-shoe-index-week1.html", "VSiN: Tyler Shoemaker's T-Shoe Modeling", "Tyler Shoemaker", "Tier 2"),
    ("vsin-zachary-cohen-49ers-rams-predictions.html", "VSiN: Zachary Cohen's 49ers vs. Rams Preview", "Zachary Cohen", "Tier 1"),
    ("vsin-zachary-cohen-opta-ai-player-props.html", "VSiN: Zachary Cohen's OptaAI Player Props", "Zachary Cohen", "Tier 1"),
    ("vsin-adam-burke-first-touchdown-predictions.html", "VSiN: Adam Burke's Opening Drive & 1st TD", "Adam Burke", "Tier 1"),
    ("vsin-john-hansen-guru-pro-picks.html", "VSiN: John Hansen's ('Guru') Pro Picks", "John Hansen", "Tier 1"),
    ("bettingpros-andrew-erickson-betting-primer.html", "BettingPros: Andrew Erickson's Primer", "Andrew Erickson", "Tier 2"),
    ("bettingpros-phil-wood-same-game-parlays.html", "BettingPros: Phil Wood's Same Game Parlays", "Phil Wood", "Tier 2"),
    ("bettingpros-richard-janvrin-touchdown-scorers.html", "BettingPros: Richard Janvrin's Touchdown Props", "Richard Janvrin", "Tier 2"),
    ("bettingpros-steve-krebs-early-parlays.html", "BettingPros: Steve Krebs' Best Early Parlays", "Steve Krebs", "Tier 2"),
    ("sharp-football-curtis-hirsch-prop-targets.html", "Sharp Football: Curtis Hirsch's Prop Targets", "Curtis Hirsch", "Tier 1"),
    ("action-network-anderson-abrams-mvp-trends.html", "Action Network: Anderson & Abrams MVP Trends", "Anderson & Abrams", "Tier 2"),
]

def generate_navbar(active_page, to_root="", active_subfile=""):
    """
    active_page: 'master', 'supercontest', 'podcasts', 'articles'
    to_root: '' for root files, '../' for subfolder files
    """
    master_href = f"{to_root}index.html"
    sc_href = f"{to_root}supercontest.html"
    podcasts_hub_href = f"{to_root}podcasts/index.html"
    articles_hub_href = f"{to_root}articles/index.html"
    
    master_active = " active" if active_page == "master" else ""
    sc_active = " active" if active_page == "supercontest" else ""
    pod_active = " active" if active_page == "podcasts" else ""
    art_active = " active" if active_page == "articles" else ""

    # Podcast dropdown items
    pod_items_html = f'<div class="packet-dropdown-header">🎙️ All 7 Audio Shows</div>\n'
    pod_items_html += f'<a href="{podcasts_hub_href}"><strong>📑 All Podcasts Hub Directory</strong> <span class="item-tag">7 Shows</span></a>\n'
    pod_items_html += '<div class="packet-dropdown-divider"></div>\n'
    for fn, title, hosts, tag in PODCAST_LIST:
        href = f"{to_root}podcasts/{fn}"
        item_act = ' class="active"' if active_subfile == fn else ""
        pod_items_html += f'<a href="{href}"{item_act}><span>{title} <small style="display:block;font-size:11px;color:#94a3b8;">{hosts}</small></span><span class="item-tag">{tag}</span></a>\n'

    # Articles dropdown items
    art_items_html = f'<div class="packet-dropdown-header">📑 All 13 Deep Dives</div>\n'
    art_items_html += f'<a href="{articles_hub_href}"><strong>📑 All Articles Hub Directory</strong> <span class="item-tag">13 Articles</span></a>\n'
    art_items_html += '<div class="packet-dropdown-divider"></div>\n'
    for fn, title, author, tag in ARTICLE_LIST:
        href = f"{to_root}articles/{fn}"
        item_act = ' class="active"' if active_subfile == fn else ""
        art_items_html += f'<a href="{href}"{item_act}><span>{title} <small style="display:block;font-size:11px;color:#94a3b8;">{author}</small></span><span class="item-tag">{tag}</span></a>\n'

    # Download dropdown items
    dl_items_html = f"""<div class="packet-dropdown-header">💾 Standalone Formats</div>
<a href="{to_root}nfl_week1_master_betting_intelligence_summary.pdf" target="_blank"><span>📄 Master Dossier (PDF)</span><span class="item-tag">698 KB</span></a>
<a href="{to_root}nfl_week1_master_betting_intelligence_summary.docx"><span>📝 Master Dossier (Word DOCX)</span><span class="item-tag">75 KB</span></a>
<a href="{to_root}nfl_week1_master_betting_intelligence_summary.md"><span>📋 Master Dossier (Raw MD)</span><span class="item-tag">92 KB</span></a>
<div class="packet-dropdown-divider"></div>
<a href="{to_root}nfl_week1_supercontest_intelligence_summary.pdf" target="_blank"><span>🏆 SuperContest Dossier (PDF)</span><span class="item-tag">494 KB</span></a>
<a href="{to_root}nfl_week1_supercontest_intelligence_summary.docx"><span>🏆 SuperContest Dossier (Word)</span><span class="item-tag">1.6 MB</span></a>
<a href="{to_root}nfl_week1_supercontest_intelligence_summary.md"><span>🏆 SuperContest Dossier (MD)</span><span class="item-tag">59 KB</span></a>
"""

    navbar_html = f"""<nav class="packet-nav">
  <div class="packet-nav-container">
    <a href="{master_href}" class="packet-nav-brand">
      <span>🏈</span>
      <span>NFL WEEK 1 INTEL</span>
      <span class="brand-badge">2026 DOSSIER</span>
    </a>
    <button class="packet-nav-toggle" aria-label="Toggle navigation">☰</button>
    <ul class="packet-nav-menu">
      <li class="packet-nav-item">
        <a href="{master_href}" class="packet-nav-link{master_active}">
          <span>📊 Master Board</span>
        </a>
      </li>
      <li class="packet-nav-item">
        <a href="{sc_href}" class="packet-nav-link{sc_active}">
          <span>🏆 SuperContest</span>
        </a>
      </li>
      <li class="packet-nav-item">
        <a href="#" class="packet-nav-link{pod_active}">
          <span>🎙️ Podcasts (7)</span>
          <span class="dropdown-arrow">▼</span>
        </a>
        <div class="packet-dropdown">
          {pod_items_html}
        </div>
      </li>
      <li class="packet-nav-item">
        <a href="#" class="packet-nav-link{art_active}">
          <span>📑 Articles (13)</span>
          <span class="dropdown-arrow">▼</span>
        </a>
        <div class="packet-dropdown">
          {art_items_html}
        </div>
      </li>
      <li class="packet-nav-item">
        <a href="#" class="packet-nav-link">
          <span>💾 Formats</span>
          <span class="dropdown-arrow">▼</span>
        </a>
        <div class="packet-dropdown right-aligned">
          {dl_items_html}
        </div>
      </li>
    </ul>
  </div>
</nav>
"""
    return navbar_html

def inject_nav_into_html(html, navbar_html, breadcrumb_html="", to_root=""):
    """
    Injects packet-nav.css and packet-nav.js into <head>,
    and injects the navbar and breadcrumb directly after <body>.
    """
    # Head injection
    css_link = f'<link rel="stylesheet" href="{to_root}assets/css/packet-nav.css">\n'
    js_script = f'<script src="{to_root}assets/js/packet-nav.js" defer></script>\n'
    
    if "</head>" in html:
        html = html.replace("</head>", f"{css_link}{js_script}</head>", 1)
    
    # Body injection
    combined_nav = navbar_html + (breadcrumb_html if breadcrumb_html else "")
    if "<body" in html:
        # Find position after <body ...>
        body_match = re.search(r'<body[^>]*>', html, re.IGNORECASE)
        if body_match:
            end_pos = body_match.end()
            html = html[:end_pos] + "\n" + combined_nav + "\n" + html[end_pos:]
    return html

# 5. Build Master Report (index.html)
print("\nProcessing Master Dossier (index.html)...")
master_src = os.path.join(SCRATCH_DIR, "nfl_week1_master_betting_intelligence_summary.html")
master_html = open(master_src, "r", encoding="utf-8").read()

# Update article links from ../docs/article-intel-summaries/ to articles/
master_html = re.sub(r'\.\./docs/article-intel-summaries/', 'articles/', master_html)
master_html = re.sub(r'\.\./docs/player-props-intel/platinum-rose-parlays-and-twitter-audit\.html', '#parlays-twitter-steam', master_html)

# Add team logos in Column 1 for matchups
TEAM_LOGOS = {
    "SF": "sf.png", "LAR": "lar.png", "CHI": "chi.png", "CAR": "car.png",
    "BUF": "buf.png", "HOU": "hou.png", "TB": "tb.png", "CIN": "cin.png",
    "BAL": "bal.png", "IND": "ind.png", "NYJ": "nyj.png", "TEN": "ten.png",
    "WAS": "was.png", "PHI": "phi.png", "CLE": "cle.png", "JAX": "jax.png",
    "NO": "no.png", "DET": "det.png", "ARI": "ari.png", "LAC": "lac.png",
    "MIA": "mia.png", "LV": "lv.png", "GB": "gb.png", "MIN": "min.png",
    "ATL": "atl.png", "PIT": "pit.png", "DAL": "dal.png", "NYG": "nyg.png",
    "DEN": "den.png", "KC": "kc.png", "NE": "ne.png", "SEA": "sea.png"
}

def make_logo_img(abbr, to_root=""):
    fn = TEAM_LOGOS.get(abbr.upper(), f"{abbr.lower()}.png")
    return (
        f'<img src="{to_root}assets/logos/{fn}" '
        f'onerror="this.onerror=null;this.src=\'https://a.espncdn.com/i/teamlogos/nfl/500/{abbr.lower()}.png\';" '
        f'alt="" class="team-logo-sm" width="18" height="18" '
        f'style="width:18px!important;height:18px!important;max-width:18px!important;max-height:18px!important;vertical-align:middle;object-fit:contain;margin:0 3px;display:inline-block;">'
    )

# Link podcast shows in list and tables
master_html = master_html.replace(
    "<strong>Even Money Podcast:</strong>",
    '<a href="podcasts/even_money_week1_bets_summary.html" class="table-link"><strong>Even Money Podcast:</strong></a>'
)
master_html = master_html.replace(
    "<strong>Sharp or Square / Action Network:</strong>",
    '<a href="podcasts/sharp_or_square_week1_bets_summary.html" class="table-link"><strong>Sharp or Square:</strong></a>'
)
master_html = master_html.replace(
    "<strong>Action Network Sports Betting Podcast:</strong>",
    '<a href="podcasts/action_network_week1_bets_summary.html" class="table-link"><strong>Action Network Sports Betting Podcast:</strong></a>'
)
master_html = master_html.replace(
    "<strong>The Favorites & Action Network Trends:</strong>",
    '<a href="podcasts/the_favorites_week1_bets_summary.html" class="table-link"><strong>The Favorites & Action Network Trends:</strong></a>'
)
master_html = master_html.replace(
    "<strong>BettingPros Podcast (Ep. 1051 & Ep. 1052):</strong>",
    '<a href="podcasts/bettingpros_week1_bets_summary.html" class="table-link"><strong>BettingPros Podcast:</strong></a>'
)
master_html = master_html.replace(
    "<strong>VSiN & T-Shoe Index:</strong>",
    '<a href="podcasts/vsin_t_shoe_week1_bets_summary.html" class="table-link"><strong>VSiN & T-Shoe Index:</strong></a>'
)
master_html = master_html.replace(
    "<strong>The Hammer, PFF & Sharp Football:</strong>",
    '<a href="podcasts/the_hammer_pff_week1_bets_summary.html" class="table-link"><strong>The Hammer, PFF & Sharp Football:</strong></a>'
)

# Replace expert table cell attributions with links
expert_replaces = [
    (r'<strong>Tucker & Fezzik</strong>', r'<a href="podcasts/even_money_week1_bets_summary.html" class="table-link"><strong>Tucker & Fezzik</strong></a>'),
    (r'<strong>Ross Tucker</strong>', r'<a href="podcasts/even_money_week1_bets_summary.html" class="table-link"><strong>Ross Tucker</strong></a>'),
    (r'<strong>Simon Hunter</strong>', r'<a href="podcasts/sharp_or_square_week1_bets_summary.html" class="table-link"><strong>Simon Hunter</strong></a>'),
    (r'<strong>Chad Millman</strong>', r'<a href="podcasts/sharp_or_square_week1_bets_summary.html" class="table-link"><strong>Chad Millman</strong></a>'),
    (r'<strong>Stuckey</strong> <em>\(Action\)', r'<a href="podcasts/action_network_week1_bets_summary.html" class="table-link"><strong>Stuckey</strong></a> <em>(Action)</em>'),
    (r'<strong>Doug Kazarian</strong>', r'<a href="podcasts/action_network_week1_bets_summary.html" class="table-link"><strong>Doug Kazarian</strong></a>'),
    (r'<strong>Brandon Kravitz</strong>', r'<a href="podcasts/the_favorites_week1_bets_summary.html" class="table-link"><strong>Brandon Kravitz</strong></a>'),
    (r'<strong>Evan Abrams</strong>', r'<a href="podcasts/the_favorites_week1_bets_summary.html" class="table-link"><strong>Evan Abrams</strong></a>'),
    (r'<strong>Matt Perrault</strong>', r'<a href="podcasts/bettingpros_week1_bets_summary.html" class="table-link"><strong>Matt Perrault</strong></a>'),
    (r'<strong>Pat Fitzmaurice</strong>', r'<a href="podcasts/bettingpros_week1_bets_summary.html" class="table-link"><strong>Pat Fitzmaurice</strong></a>'),
    (r'<strong>Tyler Shoemaker \(TSI\)</strong>', r'<a href="podcasts/vsin_t_shoe_week1_bets_summary.html" class="table-link"><strong>Tyler Shoemaker (TSI)</strong></a>'),
    (r'<strong>The Hammer Panel</strong>', r'<a href="podcasts/the_hammer_pff_week1_bets_summary.html" class="table-link"><strong>The Hammer Panel</strong></a>'),
]
for pattern, replacement in expert_replaces:
    master_html = re.sub(pattern, replacement, master_html)

# Add team logos to Master Board table
master_matchup_replacements = [
    (r'<a href="#game-49ers-rams" class="table-link"><strong>49ers vs\. Rams \(Aus\)</strong></a>',
     f'<a href="#game-49ers-rams" class="table-link">{make_logo_img("sf")} <strong>SF</strong> vs. {make_logo_img("lar")} <strong>LAR</strong></a>'),
    (r'<a href="#consensus-bears-panthers" class="table-link"><strong>Bears @ Panthers</strong></a>',
     f'<a href="#consensus-bears-panthers" class="table-link">{make_logo_img("chi")} <strong>CHI</strong> @ {make_logo_img("car")} <strong>CAR</strong></a>'),
    (r'<a href="#consensus-texans-bills" class="table-link"><strong>Bills @ Texans</strong></a>',
     f'<a href="#consensus-texans-bills" class="table-link">{make_logo_img("buf")} <strong>BUF</strong> @ {make_logo_img("hou")} <strong>HOU</strong></a>'),
    (r'<a href="#consensus-bucs-bengals" class="table-link"><strong>Buccaneers @ Bengals \(Total\)</strong></a>',
     f'<a href="#consensus-bucs-bengals" class="table-link">{make_logo_img("tb")} <strong>TB</strong> @ {make_logo_img("cin")} <strong>CIN (Total)</strong></a>'),
    (r'<a href="#consensus-bucs-bengals" class="table-link"><strong>Buccaneers @ Bengals</strong></a>',
     f'<a href="#consensus-bucs-bengals" class="table-link">{make_logo_img("tb")} <strong>TB</strong> @ {make_logo_img("cin")} <strong>CIN</strong></a>'),
    (r'<a href="#game-ravens-colts" class="table-link"><strong>Ravens @ Colts \(Total\)</strong></a>',
     f'<a href="#game-ravens-colts" class="table-link">{make_logo_img("bal")} <strong>BAL</strong> @ {make_logo_img("ind")} <strong>IND (Total)</strong></a>'),
    (r'<a href="#game-ravens-colts" class="table-link"><strong>Ravens @ Colts \(Props\)</strong></a>',
     f'<a href="#game-ravens-colts" class="table-link">{make_logo_img("bal")} <strong>BAL</strong> @ {make_logo_img("ind")} <strong>IND (Props)</strong></a>'),
    (r'<a href="#game-ravens-colts" class="table-link"><strong>Ravens @ Colts</strong></a>',
     f'<a href="#game-ravens-colts" class="table-link">{make_logo_img("bal")} <strong>BAL</strong> @ {make_logo_img("ind")} <strong>IND</strong></a>'),
    (r'<a href="#consensus-titans-jets" class="table-link"><strong>Jets @ Titans</strong></a>',
     f'<a href="#consensus-titans-jets" class="table-link">{make_logo_img("nyj")} <strong>NYJ</strong> @ {make_logo_img("ten")} <strong>TEN</strong></a>'),
    (r'<a href="#game-eagles-commanders" class="table-link"><strong>Commanders @ Eagles \(Prop\)</strong></a>',
     f'<a href="#game-eagles-commanders" class="table-link">{make_logo_img("was")} <strong>WAS</strong> @ {make_logo_img("phi")} <strong>PHI (Prop)</strong></a>'),
    (r'<a href="#game-eagles-commanders" class="table-link"><strong>Commanders @ Eagles</strong></a>',
     f'<a href="#game-eagles-commanders" class="table-link">{make_logo_img("was")} <strong>WAS</strong> @ {make_logo_img("phi")} <strong>PHI</strong></a>'),
    (r'<a href="#feature-broncos-chiefs-total" class="table-link"><strong>Broncos @ Chiefs</strong></a>',
     f'<a href="#feature-broncos-chiefs-total" class="table-link">{make_logo_img("den")} <strong>DEN</strong> @ {make_logo_img("kc")} <strong>KC</strong></a>'),
    (r'<a href="#game-cowboys-giants" class="table-link"><strong>Cowboys @ Giants \(Total\)</strong></a>',
     f'<a href="#game-cowboys-giants" class="table-link">{make_logo_img("dal")} <strong>DAL</strong> @ {make_logo_img("nyg")} <strong>NYG (Total)</strong></a>'),
    (r'<a href="#game-cowboys-giants" class="table-link"><strong>Cowboys @ Giants</strong></a>',
     f'<a href="#game-cowboys-giants" class="table-link">{make_logo_img("dal")} <strong>DAL</strong> @ {make_logo_img("nyg")} <strong>NYG</strong></a>'),
    (r'<a href="#game-vikings-packers" class="table-link"><strong>Packers @ Vikings</strong></a>',
     f'<a href="#game-vikings-packers" class="table-link">{make_logo_img("gb")} <strong>GB</strong> @ {make_logo_img("min")} <strong>MIN</strong></a>'),
    (r'<a href="#game-raiders-dolphins" class="table-link"><strong>Dolphins @ Raiders \(Total\)</strong></a>',
     f'<a href="#game-raiders-dolphins" class="table-link">{make_logo_img("mia")} <strong>MIA</strong> @ {make_logo_img("lv")} <strong>LV (Total)</strong></a>'),
    (r'<a href="#game-raiders-dolphins" class="table-link"><strong>Dolphins @ Raiders</strong></a>',
     f'<a href="#game-raiders-dolphins" class="table-link">{make_logo_img("mia")} <strong>MIA</strong> @ {make_logo_img("lv")} <strong>LV</strong></a>'),
    (r'<a href="#game-chargers-cardinals" class="table-link"><strong>Cardinals @ Chargers \(Prop\)</strong></a>',
     f'<a href="#game-chargers-cardinals" class="table-link">{make_logo_img("ari")} <strong>ARI</strong> @ {make_logo_img("lac")} <strong>LAC (Prop)</strong></a>'),
    (r'<a href="#game-chargers-cardinals" class="table-link"><strong>Cardinals @ Chargers</strong></a>',
     f'<a href="#game-chargers-cardinals" class="table-link">{make_logo_img("ari")} <strong>ARI</strong> @ {make_logo_img("lac")} <strong>LAC</strong></a>'),
    (r'<a href="#game-lions-saints" class="table-link"><strong>Saints @ Lions</strong></a>',
     f'<a href="#game-lions-saints" class="table-link">{make_logo_img("no")} <strong>NO</strong> @ {make_logo_img("det")} <strong>DET</strong></a>'),
    (r'<a href="#game-browns-jags" class="table-link"><strong>Browns @ Jaguars</strong></a>',
     f'<a href="#game-browns-jags" class="table-link">{make_logo_img("cle")} <strong>CLE</strong> @ {make_logo_img("jax")} <strong>JAX</strong></a>'),
    (r'<a href="#game-patriots-seahawks" class="table-link"><strong>Patriots @ Seahawks \(Spread\)</strong></a>',
     f'<a href="#game-patriots-seahawks" class="table-link">{make_logo_img("ne")} <strong>NE</strong> @ {make_logo_img("sea")} <strong>SEA (Spread)</strong></a>'),
    (r'<a href="#game-patriots-seahawks" class="table-link"><strong>Patriots @ Seahawks \(Total &amp; Props\)</strong></a>',
     f'<a href="#game-patriots-seahawks" class="table-link">{make_logo_img("ne")} <strong>NE</strong> @ {make_logo_img("sea")} <strong>SEA (Total &amp; Props)</strong></a>'),
    (r'<a href="#game-patriots-seahawks" class="table-link"><strong>Patriots @ Seahawks</strong></a>',
     f'<a href="#game-patriots-seahawks" class="table-link">{make_logo_img("ne")} <strong>NE</strong> @ {make_logo_img("sea")} <strong>SEA</strong></a>'),
]
for p, r_str in master_matchup_replacements:
    master_html = re.sub(p, r_str, master_html)

logo_style_block = """
  /* Strict Team Logo Sizing & Layout Controls */
  img.team-logo, .team-logo {
    width: 22px !important;
    height: 22px !important;
    max-width: 22px !important;
    max-height: 22px !important;
    vertical-align: middle !important;
    margin-right: 6px !important;
    object-fit: contain !important;
    display: inline-block !important;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
  }
  img.team-logo-sm, .team-logo-sm {
    width: 18px !important;
    height: 18px !important;
    max-width: 18px !important;
    max-height: 18px !important;
    vertical-align: middle !important;
    margin: 0 4px !important;
    object-fit: contain !important;
    display: inline-block !important;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }
  table.sortable-table th:first-child,
  table.sortable-table td:first-child,
  .table-responsive table th:first-child,
  .table-responsive table td:first-child {
    white-space: nowrap !important;
    width: 165px !important;
    min-width: 145px !important;
    max-width: 185px !important;
  }
  table.sortable-table td,
  .table-responsive table td {
    vertical-align: top !important;
    line-height: 1.45 !important;
  }
  /* Bet Filter Bar Styling */
  .bet-filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    background: var(--highlight);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 18px;
    margin: 16px 0 20px 0;
  }
  .filter-label {
    font-weight: 700;
    font-size: 13.5px;
    color: var(--primary);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .filter-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .filter-btn {
    background: var(--card);
    color: var(--text);
    border: 1px solid var(--border);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  }
  .filter-btn:hover {
    background: var(--primary-light);
    color: #ffffff;
    border-color: var(--primary-light);
  }
  .filter-btn.active {
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
  }
  .filter-count {
    background: rgba(0, 0, 0, 0.12);
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
  }
  .filter-btn.active .filter-count {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }
  .filter-status {
    font-size: 12px;
    color: var(--muted);
    margin-left: auto;
    font-weight: 500;
  }
  details#slate-operational-status summary::after {
    color: #93c5fd !important;
  }
</style>"""
master_html = master_html.replace("</style>", logo_style_block, 1)

# Ensure Top Intelligence Channels and Slate Status are rolled up for visual cleanliness
if 'id="unified-intel-channels"' not in master_html:
    old_top_pattern = re.compile(
        r'<h3>Unified Intelligence from 8 Premier Analytical Channels.*?</div></div>',
        re.DOTALL
    )
    new_top_rollups = """<details class="rollup-box section-intel-channels" id="unified-intel-channels">
<summary>📡 Unified Intelligence from 8 Premier Analytical Channels, Quantitative Model Feeds &amp; AI Projections</summary>
<div class="rollup-content">
<ul>
<li><strong>Platinum Rose AI:</strong> Autonomous 5-Layer Ensemble Forecast &amp; Market Delta Engine (Phase 1 Synth)</li>
<li><strong>Even Money Podcast:</strong> Ross Tucker &amp; Steve Fezzik</li>
<li><strong>Sharp or Square / Action Network:</strong> Chad Millman &amp; Simon Hunter</li>
<li><strong>Action Network Sports Betting Podcast:</strong> Chris Raybon, Stuckey &amp; Doug Kazarian</li>
<li><strong>The Favorites &amp; Action Network Trends:</strong> Brandon Kravitz, Kendra Middleton, Evan Abrams ("Mr. Optimus Primer")</li>
<li><strong>BettingPros Podcast (Ep. 1051 &amp; Ep. 1052):</strong> Matt Perrault, Pat Fitzmaurice, Tera Roberts, Scott Bogman</li>
<li><strong>VSiN &amp; T-Shoe Index:</strong> Tyler Shoemaker (Proprietary Mathematical Power Ratings), Dave Tuley, Zachary Cohen (OptaAI), Adam Burke (First TD Models), John Hansen ("The Guru")</li>
<li><strong>The Hammer, PFF &amp; Sharp Football:</strong> Rob Pizzola, ClevTa, Drew Dinsick, Hitman, Austin Mock, Judah Fortgang, Curtis Hirsch</li>
<li><strong>Live Twitter/X Sharp Intel &amp; Steam Feed:</strong> @propswithicy, @Zl0ckz21_, @DanGambleAI, @thejoeholkashow, @salbets_, @BFawkes22, @johnewing, @invisiblestats, @CodyBrownBets</li>
</ul>
</div>
</details>

<details class="rollup-box section-slate-status" id="slate-operational-status" style="border-left: 4px solid #3B82F6;">
<summary style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #60A5FA; border-left: 4px solid #3B82F6;">🚨 Slate Operational Status (Sep 9, 2026 — Kickoff Cycle Active)</summary>
<div class="rollup-content" style="background: var(--card);">
<div style="font-size: 0.92rem; line-height: 1.5;">
<p>• <strong>Game 1 (Patriots @ Seahawks):</strong> 🏁 <strong>FINAL: Seattle Seahawks 13, New England Patriots 10</strong>.
<br>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Spread:</strong> New England Patriots +3.5 <strong>COVERS (WIN ✅)</strong> | Seattle Seahawks -3.5 (LOSS ❌).
<br>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Total:</strong> <strong>UNDER 44.5 CASHES (WIN ✅)</strong> by 21.5 points (23 combined points).
<br>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Team Total:</strong> Seattle Team Total <strong>UNDER 24.5 CASHES (WIN ✅)</strong> (13 points).
<br>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Props:</strong> Drake Maye Pass Yards (127 yds vs 226.5/231.5 -> Under WINS ✅ / Over LOSES ❌); A.J. Brown Anytime TD (ankle injury 1st half -> LOSES ❌).
<br>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Model Edge:</strong> Platinum Rose AI model edge on NE +3.5 (+3.9 pts) cashes cleanly.<br></p>
<p>• <strong>Immediate Execution Spotlight:</strong> 🔥 <strong>San Francisco 49ers vs. Los Angeles Rams (Thursday Melbourne Showcase)</strong>. Major high-stakes clash between 49ers +3.5 consensus (and Platinum Rose AI +2.2 edge) vs. Stuckey's #1 contest play on Rams -3.5.<br></p>
<p>• <strong>Interactive Tooltips &amp; Sortable Tables:</strong> 💡 Hover over any category header marked with <strong>ⓘ</strong> for laymen definitions. <strong>Click any column header to sort</strong> ascending/descending (e.g., sort by highest Confidence, largest Market Edge, or greatest Trench Mismatch)!<br></p>
<p>• <strong>Multi-Page Data Packet:</strong> All 13 cited articles link to dedicated <a href="articles/index.html" class="table-link" style="color:#93C5FD;font-weight:700;text-decoration:underline;">Deep-Dive Solo Article Summaries</a> for comprehensive evidence verification.</p>
</div>
</div>
</details>"""
    master_html = old_top_pattern.sub(new_top_rollups, master_html, count=1)

# Ensure Bet Type Filters are present on Executive Master Board
if 'class="bet-filter-bar"' not in master_html:
    filter_bar_html = """
<div class="bet-filter-bar">
  <div class="filter-label">🎯 Filter by Bet Type:</div>
  <div class="filter-buttons">
    <button class="filter-btn active" data-filter="all" onclick="filterExecutiveBoard('all', this)">All Selections <span class="filter-count">27</span></button>
    <button class="filter-btn" data-filter="sides" onclick="filterExecutiveBoard('sides', this)">Sides & Spreads <span class="filter-count">14</span></button>
    <button class="filter-btn" data-filter="totals" onclick="filterExecutiveBoard('totals', this)">Totals (O/U) <span class="filter-count">7</span></button>
    <button class="filter-btn" data-filter="teasers" onclick="filterExecutiveBoard('teasers', this)">Teasers <span class="filter-count">3</span></button>
    <button class="filter-btn" data-filter="props" onclick="filterExecutiveBoard('props', this)">Player Props <span class="filter-count">7</span></button>
    <button class="filter-btn" data-filter="sgps" onclick="filterExecutiveBoard('sgps', this)">SGPs & Parlays <span class="filter-count">4</span></button>
  </div>
  <div class="filter-status" id="executive-filter-status">Showing all 27 selections</div>
</div>
"""
    target_str = '<p>The master board below synthesizes all official selections'
    p_end = master_html.find('</p><div class="table-responsive"><table', master_html.find(target_str))
    if p_end != -1:
        insert_pos = p_end + 4
        master_html = master_html[:insert_pos] + filter_bar_html + master_html[insert_pos:]

# Granular 27 rows are natively pre-tagged with dedicated data-bet-types in scratch source

# Ensure filter script is present
filter_script = """
<script>
function filterExecutiveBoard(filterType, btnEl) {
  const buttons = document.querySelectorAll('.bet-filter-bar .filter-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const table = document.getElementById('executive-master-table') || document.querySelector('.sortable-table');
  if (!table) return;
  const rows = table.querySelectorAll('tbody tr');
  let visibleCount = 0;

  rows.forEach(row => {
    const typesStr = row.getAttribute('data-bet-types') || '';
    const types = typesStr.toLowerCase().split(' ').filter(Boolean);
    if (filterType === 'all' || types.includes(filterType.toLowerCase())) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  const statusEl = document.getElementById('executive-filter-status');
  if (statusEl) {
    if (filterType === 'all') {
      statusEl.textContent = `Showing all ${visibleCount} selections`;
    } else {
      statusEl.textContent = `Showing ${visibleCount} of ${rows.length} selections`;
    }
  }
}
</script>
"""
if "function filterExecutiveBoard" not in master_html and "</body>" in master_html:
    master_html = master_html.replace("</body>", f"{filter_script}\n</body>", 1)

master_navbar = generate_navbar(active_page="master", to_root="")
master_html = inject_nav_into_html(master_html, master_navbar, breadcrumb_html="")

with open(os.path.join(PACKET_DIR, "index.html"), "w", encoding="utf-8") as f:
    f.write(master_html)
print("Saved dist/nfl_week1_master_packet/index.html")

# 6. Build SuperContest Report (supercontest.html)
print("\nProcessing SuperContest Dossier (supercontest.html)...")
sc_src = os.path.join(SCRATCH_DIR, "nfl_week1_supercontest_intelligence_summary.html")
sc_html = open(sc_src, "r", encoding="utf-8").read()

# Replace ESPN CDN logos with local assets/logos/ and ESPN fallback with explicit width/height
sc_html = re.sub(
    r'https://a\.espncdn\.com/i/teamlogos/nfl/500/([a-z]+)\.png',
    r'assets/logos/\1.png" onerror="this.onerror=null;this.src=\'https://a.espncdn.com/i/teamlogos/nfl/500/\1.png\';',
    sc_html
)
sc_html = sc_html.replace('class="team-logo"', 'class="team-logo" width="22" height="22"')
sc_html = sc_html.replace('class="team-logo-sm"', 'class="team-logo-sm" width="18" height="18"')
sc_html = sc_html.replace("</style>", logo_style_block, 1)

sc_navbar = generate_navbar(active_page="supercontest", to_root="")
sc_breadcrumb = """<div class="packet-breadcrumb-bar">
  <div class="packet-breadcrumb-inner">
    <a href="index.html" class="back-btn">← Back to Master Board</a>
    <span class="sep">/</span>
    <span class="current">SuperContest Only Mode</span>
  </div>
</div>"""
sc_html = inject_nav_into_html(sc_html, sc_navbar, breadcrumb_html=sc_breadcrumb)

with open(os.path.join(PACKET_DIR, "supercontest.html"), "w", encoding="utf-8") as f:
    f.write(sc_html)
print("Saved dist/nfl_week1_master_packet/supercontest.html")

# 7. Generate Podcasts Hub Portal (podcasts/index.html)
print("\nGenerating Enhanced Podcasts Hub Portal (podcasts/index.html)...")
pod_hub_src = os.path.join(SCRATCH_DIR, "podcasts_hub_master.html")
if os.path.exists(pod_hub_src):
    podcasts_hub_content = open(pod_hub_src, "r", encoding="utf-8").read()
else:
    raise FileNotFoundError(f"Missing {pod_hub_src}")

pod_nav = generate_navbar(active_page="podcasts", to_root="../")
pod_bc = """<div class="packet-breadcrumb-bar">
  <div class="packet-breadcrumb-inner">
    <a href="../index.html" class="back-btn">← Back to Master Board</a>
    <span class="sep">/</span>
    <span class="current">Podcast Intelligence Hub</span>
  </div>
</div>"""
podcasts_hub_html = inject_nav_into_html(podcasts_hub_content, pod_nav, breadcrumb_html=pod_bc, to_root="../")
with open(os.path.join(PACKET_DIR, "podcasts", "index.html"), "w", encoding="utf-8") as f:
    f.write(podcasts_hub_html)
print("Saved dist/nfl_week1_master_packet/podcasts/index.html")

# 8. Build 7 Individual Podcast Summaries
print("\nProcessing 7 Podcast Solo Reports...")
for fn, title, hosts, tag in PODCAST_LIST:
    src_path = os.path.join(SCRATCH_DIR, fn)
    if not os.path.exists(src_path):
        print(f"Warning: {src_path} not found!")
        continue
    content = open(src_path, "r", encoding="utf-8").read()
    
    # Fix sharp or square title if needed
    if fn == "sharp_or_square_week1_bets_summary.html":
        content = content.replace(
            "<title>Even Money Podcast — NFL Week 1 Comprehensive Betting Intelligence</title>",
            "<title>Sharp or Square Podcast — NFL Week 1 Comprehensive Betting Intelligence</title>"
        )

    # Generate navbar and breadcrumb
    nav_html = generate_navbar(active_page="podcasts", to_root="../", active_subfile=fn)
    bc_html = f"""<div class="packet-breadcrumb-bar">
  <div class="packet-breadcrumb-inner">
    <a href="../index.html" class="back-btn">← Back to Master Board</a>
    <span class="sep">/</span>
    <a href="index.html">Podcasts</a>
    <span class="sep">/</span>
    <span class="current">{title}</span>
  </div>
</div>"""
    
    out_html = inject_nav_into_html(content, nav_html, breadcrumb_html=bc_html, to_root="../")
    
    # Update local logo paths if any
    out_html = re.sub(r'src="assets/logos/', 'src="../assets/logos/', out_html)
    out_html = re.sub(r'src="https://a\.espncdn\.com/i/teamlogos/nfl/500/([a-z]+)\.png"',
                      r'src="../assets/logos/\1.png" onerror="this.onerror=null;this.src=\'https://a.espncdn.com/i/teamlogos/nfl/500/\1.png\';"',
                      out_html)
    
    dest_path = os.path.join(PACKET_DIR, "podcasts", fn)
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(out_html)
    print(f"Saved dist/nfl_week1_master_packet/podcasts/{fn}")


def transform_article_to_collapsible(html):
    # Ensure viewport meta tag is standard
    html = re.sub(r'<meta name="viewport" content="[^"]*">', '<meta name="viewport" content="width=device-width, initial-scale=1.0">', html)
    
    # Add rollup controls above first content-section
    rollup_header = '''<div class="rollup-controls" style="margin-top: 20px;">
  <button class="btn-toggle btn-primary" onclick="toggleAllRollups(true)">Expand All Sections</button>
  <button class="btn-toggle" onclick="toggleAllRollups(false)">Collapse All Sections</button>
</div>'''

    if '<div class="content-section">' in html:
        # Convert each <div class="content-section"> ... <h2>(.*?)</h2> into <details class="rollup-box" open><summary></summary><div class="rollup-content">
        pattern = re.compile(r'<div class="content-section">\s*<h2[^>]*>(.*?)</h2>', re.DOTALL)
        def replace_sec(m):
            title = m.group(1).strip()
            return f'<details class="rollup-box" open>\n  <summary>{title}</summary>\n  <div class="rollup-content">'
        
        html = pattern.sub(replace_sec, html)
        # Also replace closing </div> corresponding to content-section with </div></details>
        # Every content-section originally ended with </div>
        # A clean way is to replace </div>\s*(?=<details class="rollup-box"|<div class="citation-banner"|<footer|</body>)
        html = re.sub(r'</div>(\s*)(?=<details class="rollup-box"|<div class="citation-banner"|<footer|</body>)', r'</div>\n</details>\1', html)
        
        # Insert rollup header above the first details
        html = html.replace('<details class="rollup-box" open>', rollup_header + '\n<details class="rollup-box" open>', 1)

    # Ensure toggleAllRollups script exists
    script = '''<script>
function toggleAllRollups(expand) {
  document.querySelectorAll('details.rollup-box').forEach(d => {
    d.open = expand;
  });
}
</script>'''
    if 'function toggleAllRollups' not in html and '</body>' in html:
        html = html.replace('</body>', f'{script}\n</body>', 1)
        
    return html

# 9. Build Articles Hub Portal (articles/index.html)
print("\nProcessing Enhanced Articles Hub Portal (articles/index.html)...")
art_hub_src = os.path.join(SCRATCH_DIR, "articles_hub_master.html")
if os.path.exists(art_hub_src):
    articles_hub_content = open(art_hub_src, "r", encoding="utf-8").read()
else:
    art_index_src = os.path.join(ARTICLES_DIR, "index.html")
    articles_hub_content = open(art_index_src, "r", encoding="utf-8").read()
    articles_hub_content = re.sub(r'<div class="top-nav">.*?</div>\s*</div>', '', articles_hub_content, flags=re.DOTALL)
    articles_hub_content = re.sub(r'\.\./scratch/nfl_week1_master_betting_intelligence_summary\.html', '../index.html', articles_hub_content)

art_nav = generate_navbar(active_page="articles", to_root="../")
art_bc = """<div class="packet-breadcrumb-bar">
  <div class="packet-breadcrumb-inner">
    <a href="../index.html" class="back-btn">← Back to Master Board</a>
    <span class="sep">/</span>
    <span class="current">Article Deep Dives Hub</span>
  </div>
</div>"""

articles_hub_html = inject_nav_into_html(articles_hub_content, art_nav, breadcrumb_html=art_bc, to_root="../")
with open(os.path.join(PACKET_DIR, "articles", "index.html"), "w", encoding="utf-8") as f:
    f.write(articles_hub_html)
print("Saved dist/nfl_week1_master_packet/articles/index.html")

# 10. Build 13 Individual Article Summaries
print("\nProcessing 13 Article Solo Reports...")
for fn, title, author, tag in ARTICLE_LIST:
    src_path = os.path.join(ARTICLES_DIR, fn)
    if not os.path.exists(src_path):
        print(f"Warning: {src_path} not found!")
        continue
    content = open(src_path, "r", encoding="utf-8").read()
    
    # Remove old top-nav
    content = re.sub(r'<div class="top-nav">.*?</div>\s*</div>', '', content, flags=re.DOTALL)
    
    # Update return links to ../index.html
    content = re.sub(r'\.\./scratch/nfl_week1_master_betting_intelligence_summary\.html', '../index.html', content)

    # Generate navbar and breadcrumb
    nav_html = generate_navbar(active_page="articles", to_root="../", active_subfile=fn)
    bc_html = f"""<div class="packet-breadcrumb-bar">
  <div class="packet-breadcrumb-inner">
    <a href="../index.html" class="back-btn">← Back to Master Board</a>
    <span class="sep">/</span>
    <a href="index.html">Articles</a>
    <span class="sep">/</span>
    <span class="current">{title.split(':')[0]}</span>
  </div>
</div>"""

    content = transform_article_to_collapsible(content)
    out_html = inject_nav_into_html(content, nav_html, breadcrumb_html=bc_html, to_root="../")
    
    dest_path = os.path.join(PACKET_DIR, "articles", fn)
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(out_html)
    print(f"Saved dist/nfl_week1_master_packet/articles/{fn}")

# 11. Create Distribution ZIP File
print(f"\nPackaging {PACKET_DIR} into {ZIP_PATH}...")
with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(PACKET_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, PACKET_DIR)
            zf.write(full_path, os.path.join("nfl_week1_master_packet", rel_path))

zip_size_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)
print(f"Successfully generated ZIP archive: {ZIP_PATH} ({zip_size_mb:.2f} MB)")

# 12. Automated Verification Suite
print("\n=== Running Automated Verification Suite ===")
html_files = glob.glob(os.path.join(PACKET_DIR, "**", "*.html"), recursive=True)
print(f"Auditing {len(html_files)} HTML files for broken links...")

broken_links = []
total_links_checked = 0

for hf in html_files:
    content = open(hf, "r", encoding="utf-8").read()
    file_dir = os.path.dirname(hf)
    
    # Check <a href="...">
    hrefs = re.findall(r'href=[\"\'](.*?)[\"\']', content)
    for href in hrefs:
        if href.startswith(("http://", "https://", "mailto:", "#", "javascript:")):
            continue
        total_links_checked += 1
        # Split target file and anchor
        parts = href.split("#")
        target_path = parts[0]
        anchor = parts[1] if len(parts) > 1 else None
        
        if target_path:
            resolved_path = os.path.normpath(os.path.join(file_dir, target_path))
            if not os.path.exists(resolved_path):
                broken_links.append((hf, href, f"File missing: {resolved_path}"))
            elif anchor and resolved_path.endswith(".html"):
                # Check anchor in target HTML
                target_content = open(resolved_path, "r", encoding="utf-8").read()
                if f'id="{anchor}"' not in target_content and f'name="{anchor}"' not in target_content:
                    broken_links.append((hf, href, f"Anchor #{anchor} not found in {resolved_path}"))
        elif anchor:
            # Local anchor in current file
            if f'id="{anchor}"' not in content and f'name="{anchor}"' not in content:
                broken_links.append((hf, href, f"Anchor #{anchor} not found in self"))

    # Check <img src="...">
    srcs = re.findall(r'src=[\"\'](.*?)[\"\']', content)
    for src in srcs:
        if src.startswith(("http://", "https://", "data:")):
            continue
        total_links_checked += 1
        resolved_path = os.path.normpath(os.path.join(file_dir, src))
        if not os.path.exists(resolved_path):
            broken_links.append((hf, src, f"Image missing: {resolved_path}"))

print(f"Total internal links & asset sources verified: {total_links_checked}")
if broken_links:
    print(f"FAILED: Found {len(broken_links)} broken references:")
    for src_file, link, reason in broken_links:
        print(f"  In {os.path.basename(src_file)} -> '{link}': {reason}")
    sys.exit(1)
else:
    print("SUCCESS: 0 broken links found! All relative paths, images, and anchors are 100% verified.")

print("\n=== Master Packet Assembly Complete! ===")

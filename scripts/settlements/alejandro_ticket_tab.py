"""Alejandro's Ticket breakdown tab: thin wrapper over partner_ticket_tab.py (PR-2026-W10-AL settings).
Usage: python3 alejandro_ticket_tab.py <repo_root> [--file <balance-only base>]"""
import os, runpy, sys
root = sys.argv[1]; extra = sys.argv[2:]
sys.argv = [os.path.join(os.path.dirname(__file__), 'partner_ticket_tab.py'), root,
    '--partner', 'Alejandro', '--file', 'reports/settlements/2026-w10/Week10-Balance-Alejandro.html',
    '--statement', 'PR-2026-W10-AL', '--pronoun', 'his', '--key-stake', 'stake is his half of the face value',
    '--stake-total', '84.94',  # matches statements PR-2026-W08-AL ($69.94) + PR-2026-W09-AL ($15.00)
    '--prior', 'Prior-season balance (2025)=-115', '--net-label', '2026 net, Weeks 8–10 TNF',
    '--balance-label', "Current balance, Alejandro's favor",
    '--note', 'Odd-cent stakes split to the half-cent per ticket; totals are rounded once, matching the Week 8 ($69.94) and Week 9 ($15.00) statements.'] + extra
runpy.run_path(sys.argv[0], run_name='__main__')

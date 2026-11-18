"""Alejandro's Leg analysis tab: thin wrapper over partner_leg_tab.py.
Usage: python3 alejandro_leg_tab.py <repo_root> [--file <path>]"""
import os, runpy, sys
root = sys.argv[1]; extra = sys.argv[2:]
sys.argv = [os.path.join(os.path.dirname(__file__), 'partner_leg_tab.py'), root,
    '--partner', 'Alejandro', '--file', 'reports/settlements/2026-w10/Week10-Balance-Alejandro.html',
    '--statement', 'PR-2026-W10-AL'] + extra
runpy.run_path(sys.argv[0], run_name='__main__')

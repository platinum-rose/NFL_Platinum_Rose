# C:\Users\andre\.gemini\antigravity\brain\b627786e-a938-479a-b576-b3b6c7c2b993\scratch\convert_summary.py
import re
import sys
from pathlib import Path
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=70, bottom=70, left=90, right=90):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_formatted_runs(paragraph, text, base_color=None, base_size=Pt(10), base_font="Calibri"):
    # Strip tooltip popups and HTML markup cleanly for Word docx
    text = re.sub(r'<span class="tip-text"[^>]*>.*?</span>', '', text, flags=re.DOTALL | re.IGNORECASE)
    sub_lines = re.split(r'<br\s*/?>', text, flags=re.IGNORECASE)
    for line_idx, sub_line in enumerate(sub_lines):
        if line_idx > 0:
            paragraph.add_run().add_break()
        tokens = re.split(r'(<a\s+href=[\'"][^\'"]+[\'"][^>]*>.*?</a>|\[.*?\]\(.*?\)|<img[^>]*>|<strong>.*?</strong>|<b>.*?</b>|\*\*.*?\*\*|\*.*?\*|\\\$(?=[A-Za-z\\{]).*?\\\$|\$(?=[A-Za-z\\{]).*?\$)', sub_line)
        for tok in tokens:
            if not tok:
                continue

            m_img = re.match(r'<img[^>]*src=[\'"](?:https?://[^\'"]*/)?([a-zA-Z0-9_-]+)\.png[\'"][^>]*>', tok, flags=re.IGNORECASE)
            if m_img:
                abbr = m_img.group(1).lower()
                logo_path = Path(f'E:/dev/projects/NFL_Dashboard/data/logos/{abbr}.png')
                if logo_path.exists():
                    try:
                        run_img = paragraph.add_run()
                        run_img.add_picture(str(logo_path), width=Pt(11), height=Pt(11))
                        paragraph.add_run(' ')
                    except Exception:
                        pass
                continue

            m_strong = re.match(r'<(?:strong|b)>(.*?)</(?:strong|b)>', tok, flags=re.DOTALL | re.IGNORECASE)
            if m_strong:
                content = m_strong.group(1)
                content = re.sub(r'</?(?:span|abbr|div|p|i|em|a)[^>]*>', '', content, flags=re.IGNORECASE)
                run = paragraph.add_run(content)
                run.font.name = base_font
                run.font.size = base_size
                if base_color:
                    run.font.color.rgb = base_color
                run.font.bold = True
                continue

            m_a = re.match(r'<a\s+href=[\'"]([^\'"]+)[\'"][^>]*>(.*?)</a>', tok, flags=re.DOTALL | re.IGNORECASE)
            if m_a:
                link_url, link_label = m_a.groups()
                clean_label = re.sub(r'</?[^>]+>', '', link_label)
                clean_label = re.sub(r'[\*_]', '', clean_label)
                if link_url.startswith('#'):
                    anchor_name = link_url[1:]
                    w_ns = nsdecls('w')
                    sz_val = int(base_size.pt * 2) if hasattr(base_size, 'pt') else 17
                    hl_xml = f'<w:hyperlink {w_ns} w:anchor="{anchor_name}"><w:r><w:rPr><w:color w:val="1E40AF"/><w:u w:val="single"/><w:rFonts w:ascii="{base_font}" w:hAnsi="{base_font}"/><w:sz w:val="{sz_val}"/><w:b/></w:rPr><w:t>{clean_label}</w:t></w:r></w:hyperlink>'
                    try:
                        paragraph._p.append(parse_xml(hl_xml))
                    except Exception:
                        run = paragraph.add_run(clean_label)
                        run.font.name = base_font
                        run.font.size = base_size
                        run.font.color.rgb = RGBColor(30, 64, 175)
                        run.font.underline = True
                else:
                    run = paragraph.add_run(clean_label)
                    run.font.name = base_font
                    run.font.size = base_size
                    run.font.color.rgb = RGBColor(30, 64, 175)
                    run.font.underline = True
                continue

            tok_clean = re.sub(r'</?(?:span|abbr|div|p|i|em|a)[^>]*>', '', tok, flags=re.IGNORECASE)
            
            m_link = re.match(r'\[(.*?)\]\((.*?)\)', tok)
            if m_link:
                link_label, link_url = m_link.groups()
                clean_label = re.sub(r'[\*_]', '', link_label)
                if link_url.startswith('#'):
                    anchor_name = link_url[1:]
                    w_ns = nsdecls('w')
                    sz_val = int(base_size.pt * 2) if hasattr(base_size, 'pt') else 17
                    hl_xml = f'<w:hyperlink {w_ns} w:anchor="{anchor_name}"><w:r><w:rPr><w:color w:val="1E40AF"/><w:u w:val="single"/><w:rFonts w:ascii="{base_font}" w:hAnsi="{base_font}"/><w:sz w:val="{sz_val}"/><w:b/></w:rPr><w:t>{clean_label}</w:t></w:r></w:hyperlink>'
                    try:
                        paragraph._p.append(parse_xml(hl_xml))
                    except Exception:
                        run = paragraph.add_run(clean_label)
                        run.font.name = base_font
                        run.font.size = base_size
                        run.font.color.rgb = RGBColor(30, 64, 175)
                        run.font.underline = True
                else:
                    run = paragraph.add_run(clean_label)
                    run.font.name = base_font
                    run.font.size = base_size
                    run.font.color.rgb = RGBColor(30, 64, 175)
                    run.font.underline = True
                continue

            if not tok_clean:
                continue

            run = paragraph.add_run()
            run.font.name = base_font
            run.font.size = base_size
            if base_color:
                run.font.color.rgb = base_color
            
            if tok_clean.startswith('**') and tok_clean.endswith('**'):
                run.text = tok_clean[2:-2]
                run.font.bold = True
            elif tok_clean.startswith('*') and tok_clean.endswith('*'):
                run.text = tok_clean[1:-1]
                run.font.italic = True
            elif (tok_clean.startswith(r'\$') and tok_clean.endswith(r'\$')) or (tok_clean.startswith('$') and tok_clean.endswith('$')):
                if tok_clean.startswith(r'\$') and tok_clean.endswith(r'\$'):
                    inner = tok_clean[2:-2]
                else:
                    inner = tok_clean[1:-1]
                inner = inner.replace(r'\rightarrow', ' → ').replace('->', ' → ')
                run.text = inner.strip()
                run.font.bold = True
            else:
                run.text = tok_clean.replace(r'\rightarrow', ' → ').replace('->', ' → ')

def generate_docx(md_path, docx_path):
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    PRIMARY = RGBColor(16, 44, 87)       # Navy #102C57
    SECONDARY = RGBColor(53, 95, 142)    # Slate Blue #355F8E
    DARK_TEXT = RGBColor(30, 41, 59)     # Slate 800
    MUTED_TEXT = RGBColor(100, 116, 139) # Slate 500

    lines = Path(md_path).read_text(encoding='utf-8').splitlines()
    in_table = False
    table_lines = []
    in_code_block = False
    code_lines = []
    bm_id = 100
    pending_bm_name = None

    def flush_table(tbl_lines):
        if not tbl_lines:
            return
        rows = []
        for tl in tbl_lines:
            if re.match(r'^\s*\|?\s*:?-+:?\s*\|', tl):
                continue
            parts = [c.strip() for c in tl.strip().strip('|').split('|')]
            if parts:
                rows.append(parts)
        if not rows:
            return
        num_cols = max(len(r) for r in rows)
        tbl = doc.add_table(rows=len(rows), cols=num_cols)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        if num_cols == 6:
            col_widths = [Inches(1.3), Inches(1.1), Inches(0.9), Inches(1.5), Inches(1.1), Inches(1.6)]
        elif num_cols == 7:
            col_widths = [Inches(1.0), Inches(0.9), Inches(1.1), Inches(1.1), Inches(0.9), Inches(1.0), Inches(1.5)]
        else:
            col_widths = [Inches(7.0 / num_cols)] * num_cols

        for r_idx, r_data in enumerate(rows):
            is_hdr = (r_idx == 0)
            row = tbl.rows[r_idx]
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            if is_hdr:
                trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

            for c_idx in range(num_cols):
                cell = row.cells[c_idx]
                if c_idx < len(col_widths):
                    cell.width = col_widths[c_idx]
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                val = r_data[c_idx] if c_idx < len(r_data) else ''
                
                if is_hdr:
                    set_cell_background(cell, '102C57')
                    add_formatted_runs(p, val, base_color=RGBColor(255, 255, 255), base_size=Pt(8.5))
                    for run in p.runs:
                        run.font.bold = True
                else:
                    bg = 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF'
                    set_cell_background(cell, bg)
                    add_formatted_runs(p, val, base_color=DARK_TEXT, base_size=Pt(8.5))
                    if 'Consensus' in val or '4U' in val:
                        for run in p.runs:
                            run.font.bold = True
                            run.font.color.rgb = PRIMARY
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def flush_code(c_lines):
        if not c_lines:
            return
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(6)
        txt = "\n".join(c_lines)
        run = p.add_run(txt)
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        run.font.color.rgb = SECONDARY

    def flush_html_table(html_content):
        nonlocal bm_id
        raw_rows_matches = list(re.finditer(r'<tr([^>]*)>(.*?)</tr>', html_content, flags=re.DOTALL | re.IGNORECASE))
        if not raw_rows_matches:
            return
        rows = []
        row_bms = []
        for match in raw_rows_matches:
            tr_attrs = match.group(1)
            m_tr_id = re.search(r'id=[\'"]([a-zA-Z0-9_-]+)[\'"]', tr_attrs)
            row_bms.append(m_tr_id.group(1) if m_tr_id else None)
            raw_cells = re.findall(r'<(?:th|td)[^>]*>(.*?)</(?:th|td)>', match.group(2), flags=re.DOTALL | re.IGNORECASE)
            if raw_cells:
                rows.append([c.strip() for c in raw_cells])
        if not rows:
            return
        num_cols = max(len(r) for r in rows)
        tbl = doc.add_table(rows=len(rows), cols=num_cols)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        col_widths = [Inches(7.2 / num_cols)] * num_cols

        for r_idx, r_data in enumerate(rows):
            is_hdr = (r_idx == 0)
            row = tbl.rows[r_idx]
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            if is_hdr:
                trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

            row_bm = row_bms[r_idx] if r_idx < len(row_bms) else None

            for c_idx in range(num_cols):
                cell = row.cells[c_idx]
                if c_idx < len(col_widths):
                    cell.width = col_widths[c_idx]
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                val = r_data[c_idx] if c_idx < len(r_data) else ''

                if c_idx == 0 and row_bm:
                    w_ns = nsdecls('w')
                    p._p.append(parse_xml(f'<w:bookmarkStart {w_ns} w:id="{bm_id}" w:name="{row_bm}"/>'))
                    p._p.append(parse_xml(f'<w:bookmarkEnd {w_ns} w:id="{bm_id}"/>'))
                    bm_id += 1

                if is_hdr:
                    set_cell_background(cell, '102C57')
                    add_formatted_runs(p, val, base_color=RGBColor(255, 255, 255), base_size=Pt(7.5))
                    for run in p.runs:
                        run.font.bold = True
                else:
                    bg = 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF'
                    set_cell_background(cell, bg)
                    add_formatted_runs(p, val, base_color=DARK_TEXT, base_size=Pt(7.5))
                    if 'Consensus' in val or '4U' in val or 'Grade A' in val:
                        for run in p.runs:
                            run.font.bold = True
                            run.font.color.rgb = PRIMARY
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith('```'):
            if in_code_block:
                flush_code(code_lines)
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_lines = []
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        if stripped.startswith('|') and stripped.endswith('|'):
            table_lines.append(stripped)
            in_table = True
            i += 1
            continue
        elif in_table:
            flush_table(table_lines)
            table_lines = []
            in_table = False

        if '<table' in stripped:
            html_table_lines = [stripped]
            while i + 1 < len(lines) and '</table>' not in lines[i]:
                i += 1
                html_table_lines.append(lines[i])
            full_tbl_html = "\n".join(html_table_lines)
            flush_html_table(full_tbl_html)
            i += 1
            continue

        if not stripped:
            i += 1
            continue

        if '<div class="quick-nav-header"' in stripped or '<div class="global-rollup-bar"' in stripped or '<div class="rollup-controls"' in stripped:
            div_depth = 1
            while i + 1 < len(lines) and div_depth > 0:
                i += 1
                div_depth += lines[i].count('<div') - lines[i].count('</div')
            i += 1
            continue

        if '<div class="quick-pick-line">' in stripped or stripped.startswith('<div class="quick-pick-line">'):
            content = re.sub(r'</?div[^>]*>', '', stripped).strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            add_formatted_runs(p, content, base_color=DARK_TEXT, base_size=Pt(9.5))
            i += 1
            continue

        if stripped.startswith('<details'):
            m_id = re.search(r'id=[\'"]([a-zA-Z0-9_-]+)[\'"]', stripped)
            if m_id:
                pending_bm_name = m_id.group(1)
            i += 1
            continue

        if stripped.startswith('<summary>') or stripped.startswith('<summary '):
            summary_txt = re.sub(r'</?summary[^>]*>', '', stripped).strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(2)
            if pending_bm_name:
                w_ns = nsdecls('w')
                p._p.append(parse_xml(f'<w:bookmarkStart {w_ns} w:id="{bm_id}" w:name="{pending_bm_name}"/>'))
                p._p.append(parse_xml(f'<w:bookmarkEnd {w_ns} w:id="{bm_id}"/>'))
                bm_id += 1
                pending_bm_name = None
            add_formatted_runs(p, summary_txt, base_color=SECONDARY, base_size=Pt(11))
            for run in p.runs:
                run.font.bold = True
            i += 1
            continue

        if stripped == '</details>':
            pending_bm_name = None
            i += 1
            continue

        if stripped.startswith('<style') or stripped.startswith('<div') or stripped.startswith('</div') or stripped.startswith('<button') or stripped.startswith('</button') or stripped.startswith('<span') or stripped.startswith('</span'):
            m_div_anc = re.search(r'<(?:div|a)\s+id=[\'"]([a-zA-Z0-9_-]+)[\'"]', stripped)
            if m_div_anc:
                bm_name = m_div_anc.group(1)
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                w_ns = nsdecls('w')
                p._p.append(parse_xml(f'<w:bookmarkStart {w_ns} w:id="{bm_id}" w:name="{bm_name}"/>'))
                p._p.append(parse_xml(f'<w:bookmarkEnd {w_ns} w:id="{bm_id}"/>'))
                bm_id += 1
            i += 1
            continue

        bm_names = []
        for m_bm in re.finditer(r'\{#([a-zA-Z0-9_-]+)\}', stripped):
            bm_names.append(m_bm.group(1))
        stripped = re.sub(r'\{#([a-zA-Z0-9_-]+)\}', '', stripped).strip()

        for m_a in re.finditer(r'<a\s+id=[\'"]([a-zA-Z0-9_-]+)[\'"]\s*>\s*</a>', stripped):
            bm_names.append(m_a.group(1))
        stripped = re.sub(r'<a\s+id=[\'"]([a-zA-Z0-9_-]+)[\'"]\s*>\s*</a>', '', stripped).strip()

        if re.match(r'^---+$', stripped):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            r = p.add_run("━" * 60)
            r.font.color.rgb = MUTED_TEXT
            i += 1
            continue

        if stripped.startswith('# '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            w_ns = nsdecls('w')
            for bm_name in bm_names:
                p._p.append(parse_xml(f'<w:bookmarkStart {w_ns} w:id="{bm_id}" w:name="{bm_name}"/>'))
                p._p.append(parse_xml(f'<w:bookmarkEnd {w_ns} w:id="{bm_id}"/>'))
                bm_id += 1
            add_formatted_runs(p, stripped[2:], base_color=PRIMARY, base_size=Pt(18))
            for run in p.runs:
                run.font.bold = True
            i += 1
            continue

        if stripped.startswith('## '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            w_ns = nsdecls('w')
            for bm_name in bm_names:
                p._p.append(parse_xml(f'<w:bookmarkStart {w_ns} w:id="{bm_id}" w:name="{bm_name}"/>'))
                p._p.append(parse_xml(f'<w:bookmarkEnd {w_ns} w:id="{bm_id}"/>'))
                bm_id += 1
            add_formatted_runs(p, stripped[3:], base_color=PRIMARY, base_size=Pt(13))
            for run in p.runs:
                run.font.bold = True
            i += 1
            continue

        if stripped.startswith('### ') or stripped.startswith('#### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(2)
            w_ns = nsdecls('w')
            for bm_name in bm_names:
                p._p.append(parse_xml(f'<w:bookmarkStart {w_ns} w:id="{bm_id}" w:name="{bm_name}"/>'))
                p._p.append(parse_xml(f'<w:bookmarkEnd {w_ns} w:id="{bm_id}"/>'))
                bm_id += 1
            txt = stripped[4:] if stripped.startswith('### ') else stripped[5:]
            add_formatted_runs(p, txt, base_color=SECONDARY, base_size=Pt(11))
            for run in p.runs:
                run.font.bold = True
            i += 1
            continue

        if re.match(r'^\s{2,}\*\s+', line) or re.match(r'^\s{2,}-\s+', line):
            content = re.sub(r'^\s{2,}[\*-]\s+', '', line)
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.space_after = Pt(2)
            r_bullet = p.add_run("▪ ")
            r_bullet.font.color.rgb = SECONDARY
            add_formatted_runs(p, content, base_color=DARK_TEXT, base_size=Pt(9.5))
            i += 1
            continue

        if stripped.startswith('* ') or stripped.startswith('- '):
            content = stripped[2:]
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.2)
            p.paragraph_format.space_after = Pt(3)
            r_bullet = p.add_run("• ")
            r_bullet.font.color.rgb = PRIMARY
            add_formatted_runs(p, content, base_color=DARK_TEXT, base_size=Pt(9.5))
            i += 1
            continue

        m_num = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if m_num:
            num, content = m_num.groups()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.2)
            p.paragraph_format.space_after = Pt(3)
            r_num = p.add_run(f"{num}. ")
            r_num.font.bold = True
            r_num.font.color.rgb = PRIMARY
            add_formatted_runs(p, content, base_color=DARK_TEXT, base_size=Pt(9.5))
            i += 1
            continue

        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        add_formatted_runs(p, stripped, base_color=DARK_TEXT, base_size=Pt(9.5))
        i += 1

    if in_table:
        flush_table(table_lines)
    if in_code_block:
        flush_code(code_lines)

    doc.save(docx_path)
    print(f"Successfully generated DOCX from markdown: {docx_path}")

def generate_html(md_path, html_path):
    lines = Path(md_path).read_text(encoding='utf-8').splitlines()
    body_html = []
    outside_html = []
    in_table = False
    table_lines = []
    in_code = False
    code_lines = []
    in_ul = False
    in_ol = False

    def md_inline(txt):
        def replace_link(match):
            label = match.group(1)
            url = match.group(2)
            label = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', label)
            label = re.sub(r'\*(.*?)\*', r'<em>\1</em>', label)
            cls_name = "back-to-top" if "Back to" in label or "⬆" in label else "table-link"
            return f'<a href="{url}" class="{cls_name}">{label}</a>'

        txt = re.sub(r'\[(.*?)\]\((.*?)\)', replace_link, txt)
        txt = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', txt)
        txt = re.sub(r'\*(.*?)\*', r'<em>\1</em>', txt)
        txt = txt.replace(r'\rightarrow', '&rarr;').replace('->', '&rarr;')
        txt = re.sub(r'\\?\$(?=[A-Za-z\\{])(.*?)\\?\$', r'<em>\1</em>', txt)  # math only; leave money like $30 alone
        return txt

    def close_lists():
        nonlocal in_ul, in_ol
        res = []
        if in_ul:
            res.append('</ul>')
            in_ul = False
        if in_ol:
            res.append('</ol>')
            in_ol = False
        return res

    for line in lines:
        s = line.strip()
        if s.startswith('```'):
            if in_code:
                body_html.append(f'<pre><code>{"".join(code_lines)}</code></pre>')
                code_lines = []
                in_code = False
            else:
                body_html.extend(close_lists())
                in_code = True
                code_lines = []
            continue

        if in_code:
            code_lines.append(line + "\n")
            continue

        if s.startswith('|') and s.endswith('|'):
            body_html.extend(close_lists())
            table_lines.append(s)
            in_table = True
            continue
        elif in_table:
            t_html = ['<div class="table-responsive"><table class="sortable-table">']
            is_first = True
            for tl in table_lines:
                if re.match(r'^\s*\|?\s*:?-+:?\s*\|', tl):
                    continue
                cells = [c.strip() for c in tl.strip().strip('|').split('|')]
                tag = 'th' if is_first else 'td'
                if is_first:
                    t_html.append('<thead><tr>')
                else:
                    t_html.append('<tr>')
                for c in cells:
                    fmt = md_inline(c)
                    if not is_first:
                        if 'Cross-Show Consensus' in c:
                            fmt = f'<span class="badge badge-cross">{fmt}</span>'
                        elif 'Show Consensus' in c or 'Consensus' in c or '4U' in c:
                            fmt = f'<span class="badge badge-consensus">{fmt}</span>'
                        elif '2 Units' in c or '2U' in c:
                            fmt = f'<span class="badge badge-unit">{fmt}</span>'
                        elif 'Teaser' in c:
                            fmt = f'<span class="badge badge-teaser">{fmt}</span>'
                        elif 'Best Bet' in c or 'Feature' in c or 'Simon Says' in c:
                            fmt = f'<span class="badge badge-best">{fmt}</span>'
                    t_html.append(f'<{tag}>{fmt}</{tag}>')
                if is_first:
                    t_html.append('</tr></thead><tbody>')
                    is_first = False
                else:
                    t_html.append('</tr>')
            t_html.append('</tbody></table></div>')
            body_html.append(''.join(t_html))
            table_lines = []
            in_table = False

        if not s:
            continue

        if s.startswith('<summary'):
            body_html.extend(close_lists())
            m_sum = re.match(r'<summary(?:\s+class=[\'"][^\'"]*[\'"])?>(.*?)</summary>', s)
            if m_sum:
                content = m_sum.group(1)
                body_html.append(f'<summary><span class="sum-text">{md_inline(content)}</span></summary>')
            else:
                body_html.append(s)
            continue

        if s.startswith('<div class="side-toc"') or s.startswith('<button class="toc-toggle"'):
            outside_html.append(s)
            continue

        if s.startswith('<style') or s.startswith('<details') or s.startswith('</details') or s.startswith('</summary') or s.startswith('<div') or s.startswith('</div') or s.startswith('<button') or s.startswith('</button') or s.startswith('<a id='):
            body_html.extend(close_lists())
            body_html.append(s)
            continue

        anchor_id = None
        m_anc = re.search(r'\{#([a-zA-Z0-9_-]+)\}', s)
        if m_anc:
            anchor_id = m_anc.group(1)
            s = re.sub(r'\{#([a-zA-Z0-9_-]+)\}', '', s).strip()
        m_a = re.search(r'<a\s+id=[\'"]([a-zA-Z0-9_-]+)[\'"]\s*>\s*</a>', s)
        if m_a:
            anchor_id = m_a.group(1)
            s = re.sub(r'<a\s+id=[\'"]([a-zA-Z0-9_-]+)[\'"]\s*>\s*</a>', '', s).strip()

        id_attr = f' id="{anchor_id}"' if anchor_id else ''

        if re.match(r'^---+$', s):
            body_html.extend(close_lists())
            body_html.append('<hr/>')
            continue

        if s.startswith('# '):
            body_html.extend(close_lists())
            body_html.append(f'<h1{id_attr}>{md_inline(s[2:])}</h1>')
            continue

        if s.startswith('## '):
            body_html.extend(close_lists())
            body_html.append(f'<h2{id_attr}>{md_inline(s[3:])}</h2>')
            continue

        if s.startswith('### '):
            body_html.extend(close_lists())
            body_html.append(f'<h3{id_attr}>{md_inline(s[4:])}</h3>')
            continue

        if s.startswith('#### '):
            body_html.extend(close_lists())
            body_html.append(f'<h4{id_attr}>{md_inline(s[5:])}</h4>')
            continue

        if re.match(r'^\s{2,}[\*-]\s+', line):
            c = re.sub(r'^\s{2,}[\*-]\s+', '', line)
            if not in_ul:
                body_html.append('<ul>')
                in_ul = True
            body_html.append(f'<li class="sub-bullet">{md_inline(c)}</li>')
            continue

        if s.startswith('* ') or s.startswith('- '):
            c = s[2:]
            if not in_ul:
                body_html.extend(close_lists())
                body_html.append('<ul>')
                in_ul = True
            body_html.append(f'<li>{md_inline(c)}</li>')
            continue

        m_num = re.match(r'^(\d+)\.\s+(.*)', s)
        if m_num:
            _, c = m_num.groups()
            if not in_ol:
                body_html.extend(close_lists())
                body_html.append('<ol>')
                in_ol = True
            body_html.append(f'<li>{md_inline(c)}</li>')
            continue

        body_html.extend(close_lists())
        body_html.append(f'<p>{md_inline(s)}</p>')

    body_html.extend(close_lists())

    doc_title = "NFL Week 1 Master Betting Intelligence Report"
    for l in lines:
        if l.startswith('# '):
            clean = re.sub(r'^[#\s\U00010000-\U0010ffff\u2600-\u27ff\*]+', '', l).strip()
            if clean:
                doc_title = clean
            break

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{doc_title}</title>
<style>
  :root {{
    --primary: #102c57;
    --primary-light: #1e4d8c;
    --secondary: #334155;
    --accent: #b45309;
    --bg: #f8fafc;
    --card: #ffffff;
    --border: #e2e8f0;
    --text: #0f172a;
    --muted: #64748b;
    --highlight: #f1f5f9;
  }}
  @media (prefers-color-scheme: dark) {{
    :root {{
      --primary: #60a5fa;
      --primary-light: #93c5fd;
      --secondary: #cbd5e1;
      --accent: #fbbf24;
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --highlight: #1e293b;
    }}
  }}
  html {{
    scroll-behavior: smooth;
  }}
  :target {{
    animation: target-pulse 2.5s ease-out;
    scroll-margin-top: 24px;
  }}
  @keyframes target-pulse {{
    0% {{ background-color: rgba(59, 130, 246, 0.25); border-radius: 6px; padding: 2px 6px; }}
    100% {{ background-color: transparent; }}
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--bg);
    color: var(--text);
    line-height: 1.65;
    margin: 0;
    padding: 32px 20px;
  }}
  .container {{
    max-width: 1100px;
    margin: 0 auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 36px 44px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  }}
  h1 {{
    color: var(--primary);
    font-size: 26px;
    margin-top: 0;
    margin-bottom: 12px;
    line-height: 1.3;
  }}
  h2 {{
    color: var(--primary);
    font-size: 20px;
    margin-top: 32px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--border);
    padding-bottom: 8px;
  }}
  h3 {{
    color: var(--secondary);
    font-size: 16px;
    margin-top: 20px;
    margin-bottom: 8px;
  }}
  h4 {{
    color: var(--secondary);
    font-size: 14.5px;
    margin-top: 16px;
    margin-bottom: 6px;
  }}
  p {{
    margin: 10px 0;
    font-size: 14.5px;
  }}
  hr {{
    border: 0;
    height: 1px;
    background: var(--border);
    margin: 28px 0;
  }}
  .table-responsive {{
    overflow-x: auto;
    overflow-y: visible;
    margin: 16px 0;
    padding-bottom: 24px;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }}
  th, td {{
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }}
  th {{
    background-color: var(--primary);
    color: #ffffff;
    font-weight: 600;
    position: relative;
  }}
  th:hover, th:has(.term-tooltip:hover) {{
    z-index: 100;
  }}
  tr:nth-child(even) {{
    background-color: var(--highlight);
  }}
  .badge {{
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    margin: 1px 0;
  }}
  .badge-cross {{
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }}
  .badge-consensus {{
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }}
  .badge-unit {{
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }}
  .badge-teaser {{
    background: #f3e8ff;
    color: #6b21a8;
    border: 1px solid #e9d5ff;
  }}
  .badge-best {{
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }}
  .badge-stable {{
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }}
  .badge-watch {{
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }}
  .badge-volatile {{
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }}
  .badge-zero {{
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }}
  .table-link {{
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
    border-bottom: 1.5px dashed var(--primary);
    transition: all 0.2s ease;
  }}
  .table-link:hover {{
    color: var(--primary-light);
    border-bottom-style: solid;
  }}
  .badge a {{
    color: inherit;
    text-decoration: none;
    border-bottom: none;
  }}
  .badge a:hover {{
    text-decoration: underline;
    border-bottom: none;
  }}
  .back-to-top {{
    display: inline-block;
    margin: 8px 0 16px 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary);
    text-decoration: none;
    background: var(--highlight);
    border: 1px solid var(--border);
    padding: 4px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }}
  .back-to-top:hover {{
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }}
  ul, ol {{
    padding-left: 24px;
    margin: 10px 0;
  }}
  li {{
    margin-bottom: 8px;
    font-size: 14.5px;
  }}
  li.sub-bullet {{
    list-style-type: square;
    margin-bottom: 6px;
  }}
  pre {{
    background: var(--highlight);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 13px;
    overflow-x: auto;
  }}
  code {{
    font-family: Consolas, Monaco, monospace;
  }}
  /* Quick Nav Panel & Compact Controls */
  .quick-nav-panel {{
    background: var(--highlight);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 18px;
    margin: 18px 0 22px 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  }}
  .quick-nav-header {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }}
  .quick-nav-controls {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }}
  .quick-nav-label {{
    font-size: 13px;
    font-weight: 700;
    color: var(--primary);
    margin-right: 4px;
  }}
  .quick-nav-hint {{
    font-size: 12px;
    color: var(--muted);
  }}
  .btn-pill {{
    background: var(--card);
    color: var(--primary);
    border: 1px solid var(--border);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }}
  .btn-pill:hover {{
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }}
  .btn-pill.btn-primary {{
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }}
  .btn-pill.btn-primary:hover {{
    background: var(--primary-light);
    border-color: var(--primary-light);
  }}
  .quick-picks-list {{
    display: flex;
    flex-direction: column;
    gap: 8px;
  }}
  .quick-pick-line {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    line-height: 1.4;
  }}
  .pick-tier-badge {{
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    border-radius: 4px;
    min-width: 72px;
    text-align: center;
  }}
  .badge-top5 {{
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }}
  .badge-alt {{
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }}
  @media (prefers-color-scheme: dark) {{
    .badge-top5 {{
      background: rgba(22, 101, 52, 0.4);
      color: #86efac;
      border-color: #166534;
    }}
    .badge-alt {{
      background: rgba(71, 85, 105, 0.4);
      color: #cbd5e1;
      border-color: #475569;
    }}
  }}
  .quick-pick-link {{
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--primary);
    font-weight: 700;
    text-decoration: none;
    padding: 2px 6px;
    border-radius: 5px;
    transition: all 0.15s ease;
  }}
  .quick-pick-link:hover {{
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary-light);
    transform: translateY(-1px);
  }}
  .quick-pick-sep {{
    color: var(--muted);
    font-weight: 400;
    user-select: none;
  }}
  tr:target {{
    background-color: #dbeafe !important;
    outline: 2px solid #2563eb;
    transition: background-color 0.5s ease;
  }}
  @media (prefers-color-scheme: dark) {{
    tr:target {{
      background-color: rgba(37, 99, 235, 0.25) !important;
      outline: 2px solid #60a5fa;
    }}
  }}
  /* Rollup / Collapsible Box Styles */
  .global-rollup-bar {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    background: var(--highlight);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 16px;
    margin: 20px 0 24px 0;
  }}
  .global-rollup-bar .bar-title {{
    font-weight: 700;
    font-size: 13.5px;
    color: var(--primary);
  }}
  .global-rollup-bar .bar-hint {{
    font-size: 12.5px;
    color: var(--muted);
    margin-left: auto;
  }}
  .rollup-controls {{
    display: flex;
    gap: 8px;
    margin: 12px 0 16px 0;
  }}
  .btn-toggle {{
    background: var(--highlight);
    color: var(--primary);
    border: 1px solid var(--border);
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }}
  .btn-toggle:hover {{
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }}
  .btn-primary {{
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }}
  .btn-primary:hover {{
    background: var(--primary-light);
    border-color: var(--primary-light);
  }}
  details.rollup-box {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin: 14px 0;
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }}
  details.rollup-box:hover {{
    border-color: var(--primary-light);
  }}
  details.rollup-box[open] {{
    border-color: var(--primary);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  }}
  details.rollup-box:target {{
    border-color: #2563eb !important;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35) !important;
    animation: target-box-pulse 2.5s ease-out;
  }}
  @keyframes target-box-pulse {{
    0% {{ box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.55); border-color: #2563eb; }}
    100% {{ box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
  }}
  details.rollup-box summary {{
    padding: 12px 18px;
    font-size: 15px;
    font-weight: 700;
    color: var(--primary);
    background: var(--highlight);
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    list-style: none;
    transition: background 0.2s ease;
  }}
  details.rollup-box summary::-webkit-details-marker {{
    display: none;
  }}
  details.rollup-box summary:hover {{
    background: #e2e8f0;
  }}
  @media (prefers-color-scheme: dark) {{
    details.rollup-box summary:hover {{
      background: #334155;
    }}
  }}
  details.rollup-box > summary .sum-text {{ flex: 1 1 auto; min-width: 0; }}
  details.rollup-box > summary::after {{
    content: '▼';
    font-size: 11px;
    color: var(--muted);
    transition: transform 0.2s ease;
    transform: rotate(-90deg);
  }}
  details.rollup-box[open] > summary::after {{
    transform: rotate(0deg);
  }}
  details.rollup-box .rollup-content {{
    padding: 16px 20px;
    border-top: 1px solid var(--border);
  }}
  /* Interactive Laymen Term Tooltips */
  .term-tooltip {{
    position: relative;
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    cursor: help;
    border-bottom: 1.5px dotted #3b82f6;
    color: inherit;
    font-weight: inherit;
  }}
  .term-tooltip:hover {{
    z-index: 101;
  }}
  .term-tooltip::after {{
    content: ' ⓘ';
    font-size: 10px;
    color: #3b82f6;
    opacity: 0.85;
    font-weight: bold;
  }}
  .term-tooltip .tip-text {{
    visibility: hidden;
    width: 290px;
    background-color: #0f172a;
    color: #f8fafc;
    text-align: left;
    border-radius: 8px;
    padding: 10px 14px;
    position: absolute;
    z-index: 99999;
    top: calc(100% + 8px);
    bottom: auto;
    left: 50%;
    transform: translateX(-50%);
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
  }}
  .term-tooltip .tip-text strong {{
    color: #60a5fa;
    display: block;
    margin-bottom: 4px;
    font-size: 12.5px;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 3px;
  }}
  .term-tooltip .tip-text::after {{
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-left: -6px;
    border-width: 6px;
    border-style: solid;
    border-color: transparent transparent #0f172a transparent;
  }}
  .term-tooltip:hover .tip-text {{
    visibility: visible;
    opacity: 1;
    transform: translateX(-50%) translateY(3px);
  }}
  th:first-child .term-tooltip .tip-text,
  th:nth-child(2) .term-tooltip .tip-text {{
    left: 0;
    transform: none;
  }}
  th:first-child .term-tooltip .tip-text::after,
  th:nth-child(2) .term-tooltip .tip-text::after {{
    left: 24px;
  }}
  th:first-child .term-tooltip:hover .tip-text,
  th:nth-child(2) .term-tooltip:hover .tip-text {{
    transform: translateY(3px);
  }}
  th:last-child .term-tooltip .tip-text,
  th:nth-last-child(2) .term-tooltip .tip-text {{
    left: auto;
    right: 0;
    transform: none;
  }}
  th:last-child .term-tooltip .tip-text::after,
  th:nth-last-child(2) .term-tooltip .tip-text::after {{
    left: auto;
    right: 24px;
  }}
  th:last-child .term-tooltip:hover .tip-text,
  th:nth-last-child(2) .term-tooltip:hover .tip-text {{
    transform: translateY(3px);
  }}
  details.section-alternates {{
    margin-top: 18px;
    border: 1.5px dashed #475569;
    border-radius: 8px;
  }}
  details.section-alternates summary {{
    background: rgba(30, 41, 59, 0.7);
    color: #93c5fd;
    font-size: 14.5px;
  }}
  /* Sortable Tables */
  th.sortable-header {{
    cursor: pointer;
    user-select: none;
    position: relative;
    padding-right: 22px;
    transition: background-color 0.2s ease;
  }}
  th.sortable-header:hover {{
    background-color: var(--primary-light);
  }}
  .sort-icon {{
    display: inline-block;
    margin-left: 6px;
    font-size: 11px;
    opacity: 0.65;
    vertical-align: middle;
    transition: opacity 0.2s ease, color 0.2s ease;
  }}
  th.sortable-header:hover .sort-icon {{
    opacity: 1;
  }}
  th.sortable-header[data-sort-dir="asc"] .sort-icon,
  th.sortable-header[data-sort-dir="desc"] .sort-icon {{
    opacity: 1;
    color: #60a5fa;
    font-weight: 900;
  }}
  .team-logo {{
    width: 22px;
    height: 22px;
    vertical-align: middle;
    margin-right: 6px;
    object-fit: contain;
    display: inline-block;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
  }}
  .team-logo-sm {{
    width: 18px;
    height: 18px;
    vertical-align: middle;
    margin-right: 4px;
    object-fit: contain;
    display: inline-block;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }}
</style>
</head>
<body>
{"".join(outside_html)}
<div class="container">
{"".join(body_html)}
</div>
<script>
function toggleRollups(groupClass, expand) {{
  const selector = groupClass ? 'details.' + groupClass : 'details.rollup-box';
  document.querySelectorAll(selector).forEach(d => {{
    d.open = expand;
  }});
}}

function toggleAllMainSections(expand) {{
  document.querySelectorAll('details.section-main').forEach(d => {{
    d.open = expand;
  }});
}}

function toggleAllRollups(expand) {{
  document.querySelectorAll('details.rollup-box').forEach(d => {{
    d.open = expand;
  }});
}}

function openTargetDetails(hash) {{
  if (!hash || hash === '#') return;
  const targetId = hash.replace('#', '');
  const targetEl = document.getElementById(targetId);
  if (targetEl) {{
    let curr = targetEl;
    while (curr && curr !== document.body) {{
      if (curr.tagName && curr.tagName.toLowerCase() === 'details') {{
        curr.open = true;
      }}
      curr = curr.parentElement;
    }}
    setTimeout(() => {{
      targetEl.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
    }}, 80);
  }}
}}

function parseCellValue(cell) {{
  if (!cell) return {{ type: 'empty', val: '' }};
  const ds = cell.querySelector('[data-sort]');
  if (ds) return {{ type: 'num', val: parseFloat(ds.getAttribute('data-sort')) }};
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('.tip-text').forEach(el => el.remove());
  const txt = (clone.innerText || clone.textContent || '').trim();
  if (!txt) return {{ type: 'empty', val: '' }};

  // 1. Confidence Index (e.g. "96 / 100", "88 / 100")
  const mConf = txt.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*100/i);
  if (mConf) return {{ type: 'num', val: parseFloat(mConf[1]) }};

  // 2. Trench Mismatch SD (e.g. "+3.08 SD", "LAR +3.08 SD", "TB +2.10 SD")
  const mSD = txt.match(/([+-]?\\d+(?:\\.\\d+)?)\\s*SD/i);
  if (mSD) return {{ type: 'num', val: parseFloat(mSD[1]) }};

  // 3. Units (e.g. "4 Units", "2.0 Units", "0.5 Units", "4U")
  const mUnit = txt.match(/(\\d+(?:\\.\\d+)?)\\s*(?:Units?|U\\b)/i);
  if (mUnit) return {{ type: 'num', val: parseFloat(mUnit[1]) }};

  // 4. Source count consensus (e.g. "5-Source Consensus", "5-Show")
  const mShow = txt.match(/(\\d+)[-\\s](?:Source|Show)/i);
  if (mShow) return {{ type: 'num', val: parseFloat(mShow[1]) }};

  // 5. Market Edge with sign (e.g. "+5.4 on IND", "+2.2", "-4.6")
  const mEdge = txt.match(/([+-]\\d+(?:\\.\\d+)?)/);
  if (mEdge) return {{ type: 'num', val: parseFloat(mEdge[1]) }};

  // 6. Odds / Payout (e.g. "+765", "+645", "+371", "+150")
  const mOdds = txt.match(/[+](\\d{2,5})/);
  if (mOdds) return {{ type: 'num', val: parseFloat(mOdds[1]) }};

  // 7. General leading number (e.g. "49.1", "25.2", "-1.3")
  const mNum = txt.match(/^([+-]?\\d+(?:\\.\\d+)?)/);
  if (mNum) return {{ type: 'num', val: parseFloat(mNum[1]) }};

  return {{ type: 'str', val: txt.toLowerCase() }};
}}

function initSortableTables() {{
  document.querySelectorAll('table.sortable-table').forEach(table => {{
    const thead = table.querySelector('thead');
    if (!thead) return;
    const headerRow = thead.querySelector('tr');
    if (!headerRow) return;
    const headers = headerRow.querySelectorAll('th');
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    headers.forEach((th, colIdx) => {{
      th.classList.add('sortable-header');
      const sortIcon = document.createElement('span');
      sortIcon.className = 'sort-icon';
      sortIcon.setAttribute('aria-hidden', 'true');
      sortIcon.innerHTML = ' ↕';
      th.appendChild(sortIcon);

      th.addEventListener('click', (e) => {{
        if (e.target.closest('a')) return;

        const currentDir = th.getAttribute('data-sort-dir');
        let newDir = 'desc';
        if (!currentDir) {{
          const sampleRow = tbody.querySelector('tr');
          const sampleCell = sampleRow ? sampleRow.children[colIdx] : null;
          const parsed = parseCellValue(sampleCell);
          newDir = (parsed.type === 'num') ? 'desc' : 'asc';
        }} else {{
          newDir = currentDir === 'desc' ? 'asc' : 'desc';
        }}

        headers.forEach(h => {{
          h.removeAttribute('data-sort-dir');
          const icon = h.querySelector('.sort-icon');
          if (icon) icon.innerHTML = ' ↕';
        }});

        th.setAttribute('data-sort-dir', newDir);
        sortIcon.innerHTML = newDir === 'desc' ? ' ▼' : ' ▲';

        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((rowA, rowB) => {{
          const cellA = rowA.children[colIdx];
          const cellB = rowB.children[colIdx];
          const valA = parseCellValue(cellA);
          const valB = parseCellValue(cellB);

          let cmp = 0;
          if (valA.type === 'num' && valB.type === 'num') {{
            cmp = valA.val - valB.val;
          }} else if (valA.type === 'num') {{
            cmp = 1;
          }} else if (valB.type === 'num') {{
            cmp = -1;
          }} else if (valA.type === 'empty' && valB.type === 'empty') {{
            cmp = 0;
          }} else if (valA.type === 'empty') {{
            cmp = -1;
          }} else if (valB.type === 'empty') {{
            cmp = 1;
          }} else {{
            cmp = String(valA.val).localeCompare(String(valB.val));
          }}

          return newDir === 'desc' ? -cmp : cmp;
        }});

        rows.forEach(r => tbody.appendChild(r));
      }});
    }});
  }});
}}

function initGroupSort() {{
  document.querySelectorAll('button.group-sort').forEach(btn => {{
    if (btn.dataset.ready) return;
    btn.dataset.ready = '1';
    btn.addEventListener('click', () => {{
      const sc = document.getElementById(btn.dataset.scope);
      if (!sc) return;
      const key = btn.dataset.key;
      const items = Array.from(sc.querySelectorAll(':scope > .sort-group'));
      items.sort((a, b) => key === 'conf' ? (parseFloat(b.dataset.conf) - parseFloat(a.dataset.conf)) : String(a.dataset[key]).localeCompare(String(b.dataset[key])));
      items.forEach(i => sc.appendChild(i));
      btn.parentElement.querySelectorAll('button.group-sort').forEach(b => b.classList.toggle('btn-primary', b === btn));
    }});
  }});
}}

function initTableFilters() {{
  document.querySelectorAll('.table-filter').forEach(bar => {{
    if (bar.dataset.ready) return;
    bar.dataset.ready = '1';
    const tables = () => {{
      if (bar.dataset.scope) {{
        const sc = document.getElementById(bar.dataset.scope);
        return sc ? Array.from(sc.querySelectorAll('table')) : [];
      }}
      let el = bar.nextElementSibling;
      while (el && el.tagName !== 'TABLE' && !el.querySelector('table')) el = el.nextElementSibling;
      return el ? [el.tagName === 'TABLE' ? el : el.querySelector('table')] : [];
    }};
    bar.querySelectorAll('button[data-filter]').forEach(btn => btn.addEventListener('click', () => {{
      bar.querySelectorAll('button[data-filter]').forEach(b => b.classList.toggle('btn-primary', b === btn));
      const want = btn.dataset.filter.toLowerCase();
      tables().forEach(t => {{
        const ths = Array.from(t.querySelectorAll('thead th'));
        const idx = ths.findIndex(th => {{
          const c = th.cloneNode(true);
          c.querySelectorAll('.tip-text,.sort-icon').forEach(e => e.remove());
          return c.textContent.trim().toLowerCase() === (bar.dataset.col || '').toLowerCase();
        }});
        let shown = 0;
        t.querySelectorAll('tbody tr').forEach(tr => {{
          const cell = idx >= 0 ? tr.children[idx] : null;
          const v = cell ? cell.textContent.trim().toLowerCase() : '';
          const ok = want === 'all' || idx < 0 || v === want;
          tr.style.display = ok ? '' : 'none';
          if (ok) shown++;
        }});
        const grp = t.closest('.pool-group, .filter-group');
        if (grp) {{ grp.style.display = shown ? '' : 'none'; if (grp.tagName === 'DETAILS' && want !== 'all' && shown) grp.open = true; }}
      }});
    }}));
  }});
}}

window.addEventListener('hashchange', () => openTargetDetails(location.hash));
window.addEventListener('DOMContentLoaded', () => {{
  if (location.hash) {{
    openTargetDetails(location.hash);
  }}
  initSortableTables();
  initTableFilters();
  initGroupSort();
}});
if (document.readyState !== 'loading') {{
  initSortableTables();
  initTableFilters();
  initGroupSort();
}}

document.addEventListener('click', (e) => {{
  const link = e.target.closest('a[href^="#"]');
  if (link) {{
    const hash = link.getAttribute('href');
    if (hash && hash !== '#executive-board') {{
      openTargetDetails(hash);
    }}
  }}
}});
</script>
</body>
</html>"""

    Path(html_path).write_text(full_html, encoding='utf-8')
    print(f"Successfully generated HTML: {html_path}")

if __name__ == '__main__':
    if len(sys.argv) >= 4:
        md = sys.argv[1]
        docx_path = sys.argv[2]
        html_path = sys.argv[3]
    else:
        md = 'E:/dev/projects/NFL_Dashboard/scratch/nfl_week1_supercontest_intelligence_summary.md'
        docx_path = 'E:/dev/projects/NFL_Dashboard/scratch/nfl_week1_supercontest_intelligence_summary.docx'
        html_path = 'E:/dev/projects/NFL_Dashboard/scratch/nfl_week1_supercontest_intelligence_summary.html'
    generate_docx(md, docx_path)
    generate_html(md, html_path)

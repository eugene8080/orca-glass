"""Render the reviewed Markdown policy as a standalone, searchable PDF."""
from pathlib import Path
from html import escape
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'store/privacy-and-terms.md'
OUTPUT = ROOT / 'store/Orca-Glass-Privacy-and-Terms.pdf'
INK = colors.HexColor('#20282b')
MUTED = colors.HexColor('#546468')
ACCENT = colors.HexColor('#24665e')

styles = {
    'title': ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=23, leading=27, textColor=INK, spaceAfter=10),
    'section': ParagraphStyle('section', fontName='Helvetica-Bold', fontSize=17, leading=21, textColor=INK, spaceAfter=8),
    'heading': ParagraphStyle('heading', fontName='Helvetica-Bold', fontSize=10.2, leading=13, textColor=ACCENT, spaceBefore=9, spaceAfter=3, keepWithNext=True),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=9.2, leading=12.5, textColor=INK, spaceAfter=5, alignment=TA_LEFT),
    'meta': ParagraphStyle('meta', fontName='Helvetica', fontSize=8.5, leading=11, textColor=MUTED, spaceAfter=8),
}

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#d4dfdb'))
    canvas.line(44, 39, A4[0] - 44, 39)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(44, 26, 'QUIET SIGNAL  |  ORCA GLASS')
    canvas.drawRightString(A4[0] - 44, 26, str(doc.page))
    canvas.restoreState()

story = []
source = re.sub(r'^(#{1,3} .+)$', r'\n\1\n', SOURCE.read_text(encoding='utf-8'), flags=re.MULTILINE)
for block in re.split(r'\n\s*\n', source.strip()):
    if block == '---':
        story.append(PageBreak())
        continue
    for prefix, style in [('### ', 'heading'), ('## ', 'section'), ('# ', 'title')]:
        if block.startswith(prefix):
            story.append(Paragraph(escape(block[len(prefix):]), styles[style]))
            break
    else:
        style = 'meta' if block.startswith('Updated ') else 'body'
        # Source labels and URLs deliberately stay separate, with live links.
        lines = []
        for line in block.splitlines():
            escaped = escape(line)
            if line.startswith('https://'):
                escaped = f'<link href="{escaped}" color="#24665e">{escaped}</link>'
            lines.append(escaped)
        story.append(Paragraph('<br/>'.join(lines), styles[style]))

doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=44, rightMargin=44,
                        topMargin=42, bottomMargin=52, title='Orca Glass - Privacy Policy and Terms of Use',
                        author='Quiet Signal', subject='Self-hosted app; no developer collection of app data')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)

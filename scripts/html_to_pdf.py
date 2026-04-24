#!/opt/homebrew/bin/python3
"""Generate PDF from HTML using weasyprint.
Usage: python3 html_to_pdf.py <input.html> <output.pdf> [cwd]
Strips Google Fonts and injects local font files to avoid network hangs.
"""
import sys, os, re, tempfile

def main():
    if len(sys.argv) < 3:
        print("Usage: html_to_pdf.py <input.html> <output.pdf> [cwd]", file=sys.stderr)
        sys.exit(1)

    html_path = sys.argv[1]
    pdf_path  = sys.argv[2]
    cwd       = sys.argv[3] if len(sys.argv) > 3 else os.getcwd()

    if not os.path.exists(html_path):
        print(f"HTML file not found: {html_path}", file=sys.stderr)
        sys.exit(1)

    fonts_dir = os.path.join(cwd, "public", "fonts")
    hind_reg  = os.path.join(fonts_dir, "HindSiliguri-Regular.ttf")
    hind_bold = os.path.join(fonts_dir, "HindSiliguri-Bold.ttf")

    html = open(html_path, encoding="utf-8").read()

    # Remove all Google Fonts network requests (causes hanging)
    html = re.sub(r'<link[^>]*fonts\.googleapis\.com[^>]*/?>', '', html, flags=re.IGNORECASE)
    html = re.sub(r'<link[^>]*fonts\.gstatic\.com[^>]*/?>', '',  html, flags=re.IGNORECASE)
    html = re.sub(r'<link[^>]*preconnect[^>]*google[^>]*/?>', '', html, flags=re.IGNORECASE)

    # Inject local @font-face before </head>
    if os.path.exists(hind_reg):
        local_fonts = f"""<style>
@font-face {{font-family:'Hind Siliguri';src:url('file://{hind_reg}');font-weight:300 400 500;font-style:normal}}
@font-face {{font-family:'Hind Siliguri';src:url('file://{hind_bold}');font-weight:600 700;font-style:normal}}
@font-face {{font-family:'Inter';src:url('file://{hind_reg}');font-weight:300 400 500 600;font-style:normal}}
@font-face {{font-family:'Inter';src:url('file://{hind_bold}');font-weight:700 800;font-style:normal}}
</style>"""
        html = html.replace('</head>', local_fonts + '\n</head>', 1)

    # Write patched HTML to a temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', encoding='utf-8', delete=False) as f:
        f.write(html)
        tmp = f.name

    try:
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration
        font_config = FontConfiguration()
        extra = CSS(string="""
            @media print {
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            .page { box-shadow: none !important; margin: 0 !important; }
        """, font_config=font_config)
        HTML(filename=tmp).write_pdf(
            pdf_path,
            stylesheets=[extra],
            font_config=font_config,
            presentational_hints=True,
        )
        print(f"OK:{pdf_path}")
    finally:
        os.unlink(tmp)

if __name__ == "__main__":
    main()

#!/opt/homebrew/bin/python3
"""Generate PDF from an HTML file using weasyprint."""
import sys, os

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 html_to_pdf.py <input.html> <output.pdf>", file=sys.stderr)
        sys.exit(1)

    html_path = sys.argv[1]
    pdf_path  = sys.argv[2]

    if not os.path.exists(html_path):
        print(f"HTML file not found: {html_path}", file=sys.stderr)
        sys.exit(1)

    from weasyprint import HTML, CSS
    from weasyprint.text.fonts import FontConfiguration

    font_config = FontConfiguration()

    # Extra CSS: force print-color-adjust so backgrounds render in PDF
    extra_css = CSS(string="""
        @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .page { box-shadow: none !important; margin: 0 !important; }
    """, font_config=font_config)

    HTML(filename=html_path).write_pdf(
        pdf_path,
        stylesheets=[extra_css],
        font_config=font_config,
        presentational_hints=True,
    )
    print(f"OK:{pdf_path}")

if __name__ == "__main__":
    main()

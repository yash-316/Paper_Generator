"""
Export service — results as CSV, Excel, or PDF.
"""
import io
from typing import Any


def export_results_csv(rows: list[dict[str, Any]]) -> bytes:
    import csv
    output = io.StringIO()
    if not rows:
        return b""
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue().encode("utf-8")


def export_results_excel(rows: list[dict[str, Any]], exam_title: str = "Results") -> bytes:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter

    wb = Workbook()
    ws = wb.active
    ws.title = "Results"

    # Title row
    ws.merge_cells("A1:L1")
    ws["A1"] = f"Exam Results — {exam_title}"
    ws["A1"].font = Font(bold=True, size=14)
    ws["A1"].alignment = Alignment(horizontal="center")

    if not rows:
        buf = io.BytesIO()
        wb.save(buf)
        return buf.getvalue()

    headers = list(rows[0].keys())
    # Header row
    header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col_idx, value=header.replace("_", " ").title())
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    # Data rows
    for row_idx, row in enumerate(rows, 3):
        for col_idx, key in enumerate(headers, 1):
            ws.cell(row=row_idx, column=col_idx, value=row.get(key))

    # Auto-width
    for col_idx in range(1, len(headers) + 1):
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = 18

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def export_results_pdf(exam_title: str, rows: list[dict[str, Any]]) -> bytes:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), leftMargin=1*cm, rightMargin=1*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph(f"Exam Results — {exam_title}", styles["Title"]))
    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph(f"Total Students: {len(rows)}", styles["Normal"]))
    elements.append(Spacer(1, 0.5*cm))

    if rows:
        headers = list(rows[0].keys())
        table_data = [[h.replace("_", " ").title() for h in headers]]
        for row in rows:
            table_data.append([str(row.get(h, "")) for h in headers])

        col_width = (landscape(A4)[0] - 2*cm) / len(headers)
        table = Table(table_data, colWidths=[col_width] * len(headers))
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563EB")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F0F4FF")]),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(table)

    doc.build(elements)
    return buf.getvalue()

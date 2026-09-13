import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.pdfgen import canvas

# Define pt manually (ReportLab uses points by default, so 1 pt = 1)
pt = 1

# ==========================================
# COLOR PALETTE (Matched with frontend TSX)
# ==========================================
INK = colors.HexColor('#0F172A')       # slate-900
SUBTLE = colors.HexColor('#94A3B8')    # slate-400
MUTED = colors.HexColor('#64748B')     # slate-500
BODY = colors.HexColor('#475569')      # slate-600
LINE = colors.HexColor('#F1F5F9')      # slate-100
PANEL = colors.HexColor('#F8FAFC')     # slate-50
EMERALD = colors.HexColor('#059669')
EMERALD_BG = colors.HexColor('#ECFDF5')
ROSE = colors.HexColor('#E11D48')
WHITE = colors.HexColor('#FFFFFF')

STATUS_COLORS = {
    'paid': {'bg': colors.HexColor('#D1FAE5'), 'text': colors.HexColor('#047857')},
    'unpaid': {'bg': colors.HexColor('#FEF3C7'), 'text': colors.HexColor('#B45309')},
    'partial': {'bg': colors.HexColor('#DBEAFE'), 'text': colors.HexColor('#1D4ED8')},
    'overdue': {'bg': colors.HexColor('#FFE4E6'), 'text': colors.HexColor('#BE123C')}
}

# ==========================================
# PAGE TEMPLATE (For Top Emerald Bar)
# ==========================================
def draw_top_bar(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(EMERALD)
    # Draw a 6pt green bar at the very top of the page
    canvas.rect(0, A4[1] - 6*pt, A4[0], 6*pt, fill=1, stroke=0)
    canvas.restoreState()

# ==========================================
# MAIN PDF GENERATOR CLASS
# ==========================================
class PDFInvoiceService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        self.styles.add(ParagraphStyle(name='Brand', fontName='Helvetica-Bold', fontSize=15, textColor=INK))
        self.styles.add(ParagraphStyle(name='MutedSmall', fontName='Helvetica', fontSize=7.5, textColor=SUBTLE))
        self.styles.add(ParagraphStyle(name='BodyTextSmall', fontName='Helvetica', fontSize=8, textColor=BODY))
        self.styles.add(ParagraphStyle(name='MetaTitle', fontName='Helvetica-Bold', fontSize=7.5, textColor=SUBTLE, alignment=TA_RIGHT))
        self.styles.add(ParagraphStyle(name='MetaValue', fontName='Helvetica-Bold', fontSize=14, textColor=INK, alignment=TA_RIGHT))
        self.styles.add(ParagraphStyle(name='PartyLabel', fontName='Helvetica-Bold', fontSize=7, textColor=SUBTLE))
        self.styles.add(ParagraphStyle(name='PartyName', fontName='Helvetica-Bold', fontSize=10.5, textColor=INK))
        self.styles.add(ParagraphStyle(name='Th', fontName='Helvetica-Bold', fontSize=7, textColor=SUBTLE))
        self.styles.add(ParagraphStyle(name='Td', fontName='Helvetica', fontSize=8.5, textColor=INK))
        self.styles.add(ParagraphStyle(name='TdBold', fontName='Helvetica-Bold', fontSize=9, textColor=INK))
        
        # Grand Total Box Styles (Pink/Rose Theme)
        self.styles.add(ParagraphStyle(name='GrandLabel', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE))
        self.styles.add(ParagraphStyle(name='GrandValue', fontName='Helvetica-Bold', fontSize=16, textColor=WHITE, alignment=TA_RIGHT))
        self.styles.add(ParagraphStyle(name='GrandCurrency', fontName='Helvetica', fontSize=7, textColor=WHITE, alignment=TA_RIGHT))

    def format_currency(self, amount):
        return f"Rs. {amount:,.2f}"

    def generate_pdf(self, invoice_data, business_profile, customer_data):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=36*pt, 
            leftMargin=36*pt, 
            topMargin=24*pt, 
            bottomMargin=36*pt
        )
        elements = []
        
        status = str(invoice_data.get('status', 'unpaid')).lower()
        
        # 1. HEADER SECTION
        brand_col = [
            Paragraph(f"{business_profile.get('business_name', '')}", self.styles['Brand']),
            Spacer(1, 2),
            Paragraph("Retail Tax Invoice", self.styles['MutedSmall'])
        ]
        
        meta_col = [
            Paragraph("INVOICE NUMBER", self.styles['MetaTitle']),
            Paragraph(invoice_data.get('invoice_number', ''), self.styles['MetaValue']),
            Paragraph(f"Issue Date: {invoice_data.get('date', '')}", self.styles['MutedSmall']),
            Paragraph(f"Due Date: {invoice_data.get('due_date', '')}", self.styles['MutedSmall'])
        ]
        
        header_table = Table([[brand_col, meta_col]], colWidths=['60%', '40%'])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('LINEBELOW', (0, 0), (-1, -1), 1, LINE),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 15))

        # 2. PARTIES SECTION (Billed By & Billed To)
        merchant = [
            Paragraph("BILLED BY (MERCHANT)", self.styles['PartyLabel']),
            Paragraph(business_profile.get('business_name', ''), self.styles['PartyName']),
            Paragraph(f"GSTIN: {business_profile.get('gst_number', 'N/A')}", self.styles['BodyTextSmall']),
            Paragraph(business_profile.get('address', ''), self.styles['MutedSmall'])
        ]
        
        client = [
            Paragraph("BILLED TO (CUSTOMER)", self.styles['PartyLabel']),
            Paragraph(customer_data.get('name', ''), self.styles['PartyName']),
            Paragraph(f"GSTIN: {customer_data.get('gst_number', 'N/A')}", self.styles['BodyTextSmall']),
            Paragraph(customer_data.get('address', ''), self.styles['MutedSmall'])
        ]
        
        parties_table = Table([[merchant, client]], colWidths=['50%', '50%'])
        parties_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEBEFORE', (1, 0), (1, 0), 1, LINE), # Vertical line separator
            ('LEFTPADDING', (1, 0), (1, 0), 15),
            ('LINEBELOW', (0, 0), (-1, -1), 1, LINE),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ]))
        elements.append(parties_table)
        elements.append(Spacer(1, 15))

        # 3. ITEMS TABLE
        table_data = [['#', 'DESCRIPTION', 'QTY', 'PRICE', 'GST %', 'TOTAL']]
        
        for idx, item in enumerate(invoice_data.get('items', [])):
            total = item['quantity'] * item['unit_price'] * (1 + item['gst_rate'] / 100)
            table_data.append([
                str(idx + 1).zfill(2),
                Paragraph(item['description'], self.styles['TdBold']),
                str(item['quantity']),
                self.format_currency(item['unit_price']),
                f"{item['gst_rate']}%",
                self.format_currency(total)
            ])

        items_table = Table(table_data, colWidths=['6%', '38%', '14%', '16%', '12%', '14%'])
        items_table.setStyle(TableStyle([
            ('FONT', (0,0), (-1,0), 'Helvetica-Bold', 7),
            ('TEXTCOLOR', (0,0), (-1,0), SUBTLE),
            ('ALIGN', (2,0), (2,-1), 'CENTER'), # QTY
            ('ALIGN', (3,0), (3,-1), 'RIGHT'),  # PRICE
            ('ALIGN', (4,0), (4,-1), 'CENTER'), # GST
            ('ALIGN', (5,0), (5,-1), 'RIGHT'),  # TOTAL
            ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor('#E2E8F0')), # Header border
            ('LINEBELOW', (0,1), (-1,-1), 0.5, LINE), # Row borders
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 20))

        # 4. BOTTOM SECTION (Payment Info & Totals)
        subtotal = invoice_data.get('subtotal', 0)
        gst_total = invoice_data.get('gst_total', 0)
        grand_total = invoice_data.get('grand_total', 0)
        
        # Payment Panel (Left Side)
        payment_status_text = "VERIFIED / Settled" if status == 'paid' else "Pending"
        payment_info = [
            Paragraph("<b>PAYMENT DETAILS</b>", self.styles['BodyTextSmall']),
            Spacer(1, 5),
            Paragraph(f"Method: {invoice_data.get('payment_method', 'Not recorded')}", self.styles['MutedSmall']),
            Paragraph(f"Status: {payment_status_text}", self.styles['MutedSmall']),
            Spacer(1, 5),
            Paragraph(f"<i>Thank you for shopping with {business_profile.get('business_name', '')}!</i>", self.styles['MutedSmall'])
        ]
        
        # Totals Panel (Right Side)
        totals_data = [
            [Paragraph("Subtotal (Base Price)", self.styles['BodyTextSmall']), Paragraph(self.format_currency(subtotal), ParagraphStyle('r', alignment=TA_RIGHT, fontSize=8, textColor=BODY))],
            [Paragraph("CGST", self.styles['BodyTextSmall']), Paragraph(self.format_currency(gst_total/2), ParagraphStyle('r', alignment=TA_RIGHT, fontSize=8, textColor=BODY))],
            [Paragraph("SGST", self.styles['BodyTextSmall']), Paragraph(self.format_currency(gst_total/2), ParagraphStyle('r', alignment=TA_RIGHT, fontSize=8, textColor=BODY))],
        ]
        totals_table = Table(totals_data, colWidths=['50%', '50%'])
        totals_table.setStyle(TableStyle([
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 2),
        ]))

        # The Rose "Grand Total" Box
        grand_box_data = [[
            [Paragraph("GRAND TOTAL", self.styles['GrandLabel']), Paragraph("Rounded Total", ParagraphStyle('sub', fontSize=6.5, textColor=WHITE))],
            [Paragraph(self.format_currency(grand_total), self.styles['GrandValue']), Paragraph("INR (INDIAN RUPEE)", self.styles['GrandCurrency'])]
        ]]
        grand_box = Table(grand_box_data, colWidths=['50%', '50%'])
        grand_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), ROSE),
            ('TOPPADDING', (0,0), (-1,-1), 12),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM')
        ]))

        right_col = [totals_table, Spacer(1, 8), grand_box]
        
        bottom_table = Table([[payment_info, right_col]], colWidths=['50%', '50%'])
        bottom_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('RIGHTPADDING', (0,0), (0,0), 20),
        ]))
        elements.append(KeepTogether(bottom_table))
        elements.append(Spacer(1, 30))

        # 5. FOOTER (Terms & Signature)
        terms = invoice_data.get('terms')
        if not terms:
            terms = '• Goods once sold can be exchanged within 2 days with original invoice.\n• Subject to local jurisdiction only. This is a computer generated invoice.'
            
        footer_data = [[
            [Paragraph("Terms & Conditions", self.styles['PartyLabel']), Paragraph(terms.replace('\n', '<br/>'), self.styles['MutedSmall'])],
            [Paragraph(business_profile.get('business_name', ''), ParagraphStyle('sig', fontName='Helvetica-Oblique', fontSize=10, textColor=BODY, alignment=TA_CENTER)), 
             Spacer(1, 20),
             Paragraph("Authorized Signatory", ParagraphStyle('sigLabel', fontName='Helvetica-Bold', fontSize=7, textColor=INK, alignment=TA_CENTER))]
        ]]
        
        footer_table = Table(footer_data, colWidths=['65%', '35%'])
        footer_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('LINEABOVE', (0,0), (-1,-1), 1, LINE),
            ('TOPPADDING', (0,0), (-1,-1), 15),
            ('LINEABOVE', (1,0), (1,0), 0.5, SUBTLE), # Signature Line
        ]))
        elements.append(KeepTogether(footer_table))

        # Build PDF with custom PageTemplate to ensure Top Bar renders
        doc.build(elements, onFirstPage=draw_top_bar, onLaterPages=draw_top_bar)
        
        # YAHAN CHANGE KIYA HAI: Direct buffer return hoga (pehle buffer.getvalue() tha)
        return buffer


# Wrapper function to maintain compatibility with existing routes
def generate_invoice_pdf(invoice_data, business_profile, customer_data=None):
    from fastapi.encoders import jsonable_encoder
    
    if customer_data is None:
        customer_data = {}
        
    # FastAPI ka encoder sabhi Pydantic/SQLAlchemy objects ko Dictionaries me convert karega
    inv_dict = jsonable_encoder(invoice_data)
    biz_dict = jsonable_encoder(business_profile)
    cust_dict = jsonable_encoder(customer_data)
    
    service = PDFInvoiceService()
    return service.generate_pdf(inv_dict, biz_dict, cust_dict)
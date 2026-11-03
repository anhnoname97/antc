"""Dung file ke hoach Excel cho Portal v2 tu 1-thiet-ke.md va quyet-dinh.md."""
import re, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter

md_path, qd_path, out = sys.argv[1:4]
md = open(md_path, encoding='utf-8').read()
qd = open(qd_path, encoding='utf-8').read()

def clean(s):
    s = s.replace('<br>', '\n').replace('`', '').replace('**', '').replace('~~', '')
    return s.strip()

def tables_under(text):
    """Tra ve list (heading gan nhat, rows) cho moi bang markdown."""
    out, head, cur = [], '', None
    for line in text.split('\n'):
        if line.startswith('#'):
            head = line.lstrip('#').strip()
        if line.startswith('|'):
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            if cur is None:
                cur = (head, [])
                out.append(cur)
            if all(re.fullmatch(r':?-{3,}:?', c) for c in cells if c):
                continue
            cur[1].append(cells)
        else:
            cur = None
    return out

def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i + len(start)) if end else len(text)
    return text[i:j]

F = 'Arial'
HFILL = PatternFill('solid', fgColor='0E7C72')
HFONT = Font(name=F, bold=True, color='FFFFFF', size=10)
BFONT = Font(name=F, size=10)
INPUT = PatternFill('solid', fgColor='FFF2CC')
GROUP = PatternFill('solid', fgColor='E3F4F1')
thin = Side(style='thin', color='D6DFE1')
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical='top')

def write_table(ws, headers, rows, widths, start_row=1, input_cols=()):
    for ci, hname in enumerate(headers, 1):
        c = ws.cell(row=start_row, column=ci, value=hname)
        c.font, c.fill, c.alignment, c.border = HFONT, HFILL, Alignment(wrap_text=True, vertical='center'), BORDER
    for ri, r in enumerate(rows, start_row + 1):
        for ci, v in enumerate(r, 1):
            c = ws.cell(row=ri, column=ci, value=v)
            c.font, c.alignment, c.border = BFONT, WRAP, BORDER
            if ci in input_cols:
                c.fill = INPUT
    for ci, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(ci)].width = w
    ws.freeze_panes = ws.cell(row=start_row + 1, column=2)
    ws.auto_filter.ref = f"A{start_row}:{get_column_letter(len(headers))}{start_row + len(rows)}"

wb = Workbook()
wb.calculation.fullCalcOnLoad = True

# ---------- Cong viec
task_part = section(md, '## Task', '## Contract')
STAGES = []
rows = []
for head, tbl in tables_under(task_part):
    if not tbl or tbl[0][0] != '#':
        continue
    stage = clean(head)
    STAGES.append(stage)
    for r in tbl[1:]:
        code, name, lane, scope, dep, done, check, status = (r + [''] * 8)[:8]
        m = re.search(r'\(([\d,]+)\)\s*$', name)
        est = float(m.group(1).replace(',', '.')) if m else None
        if m:
            name = name[:m.start()].strip()
        rows.append([clean(code), stage, clean(name), clean(lane), est, clean(scope), clean(dep), clean(done), clean(check), clean(status), '', 'Chưa làm', None, None, ''])
ws = wb.active
ws.title = 'Công việc'
hdr = ['Mã', 'Giai đoạn', 'Việc', 'Luồng', 'Ước lượng (ngày công)', 'Phạm vi / file dự kiến', 'Phụ thuộc', 'Tiêu chí hoàn thành', 'Cách kiểm chứng', 'Điều kiện bắt đầu', 'Người làm', 'Tiến độ', 'Ngày bắt đầu', 'Ngày xong', 'Ghi chú']
write_table(ws, hdr, rows, [10, 26, 34, 10, 11, 70, 18, 46, 40, 22, 14, 13, 13, 13, 30], input_cols=(11, 12, 13, 14, 15))
n_task = len(rows)
last = n_task + 1
for r in range(2, last + 1):
    ws.cell(row=r, column=5).number_format = '0.0'
    for c in (13, 14):
        ws.cell(row=r, column=c).number_format = 'dd/mm/yyyy'
dv = DataValidation(type='list', formula1='"Chưa làm,Đang làm,Chờ review,Cần sửa,Xong,Bị chặn"', allow_blank=True)
ws.add_data_validation(dv)
dv.add(f'L2:L{last}')
dvd = DataValidation(type='date', operator='greaterThan', formula1='45658', allow_blank=True, error='Nhập ngày dạng dd/mm/yyyy')
ws.add_data_validation(dvd)
dvd.add(f'M2:N{last}')

# ---------- Tong quan (dat dau)
ov = wb.create_sheet('Tổng quan', 0)
ov['A1'] = 'Kế hoạch Portal v2 · antoantaichinh.vn'
ov['A1'].font = Font(name=F, bold=True, size=14, color='0B3B3A')
info = [
    ('Lập ngày', '03/11/2026'),
    ('Nguồn', 'docs/ban-giao/PORTAL-V2/1-thiet-ke.md (thiết kế, chia việc, Phụ lục A, B). Quyết định từ QĐ-032 trong docs/quyet-dinh.md'),
    ('Mockup', 'mockup-o-nhap-backoffice.html (backoffice), mockup-portal-v2.html (website)'),
    ('Cách cập nhật', 'Chỉ sửa các cột nền vàng ở sheet "Công việc": Người làm, Tiến độ (chọn trong danh sách), Ngày bắt đầu, Ngày xong, Ghi chú. Bảng dưới tự tính lại.'),
    ('Ước lượng', 'Ngày công của một người, lấy từ 1-thiet-ke.md. Chưa gồm việc của Ban biên tập (sheet "Việc ngoài dev").'),
]
for i, (k, v) in enumerate(info, 3):
    ov.cell(row=i, column=1, value=k).font = Font(name=F, bold=True, size=10)
    c = ov.cell(row=i, column=2, value=v)
    c.font, c.alignment = BFONT, WRAP
    ov.merge_cells(start_row=i, start_column=2, end_row=i, end_column=6)
r0 = 3 + len(info) + 1
heads = ['Giai đoạn', 'Số task', 'Ngày công', 'Xong', 'Đang làm', '% xong (theo ngày công)']
for ci, hname in enumerate(heads, 1):
    c = ov.cell(row=r0, column=ci, value=hname)
    c.font, c.fill, c.border, c.alignment = HFONT, HFILL, BORDER, Alignment(wrap_text=True)
rng = lambda col: f"'Công việc'!${col}$2:${col}${last}"
for i, st in enumerate(STAGES, r0 + 1):
    ov.cell(row=i, column=1, value=st)
    ov.cell(row=i, column=2, value=f'=COUNTIF({rng("B")},A{i})')
    ov.cell(row=i, column=3, value=f'=SUMIF({rng("B")},A{i},{rng("E")})')
    ov.cell(row=i, column=4, value=f'=COUNTIFS({rng("B")},A{i},{rng("L")},"Xong")')
    ov.cell(row=i, column=5, value=f'=COUNTIFS({rng("B")},A{i},{rng("L")},"Đang làm")')
    ov.cell(row=i, column=6, value=f'=IFERROR(SUMIFS({rng("E")},{rng("B")},A{i},{rng("L")},"Xong")/C{i},0)')
tr = r0 + len(STAGES) + 1
ov.cell(row=tr, column=1, value='Tổng')
for col in 'BCDE':
    ov[f'{col}{tr}'] = f'=SUM({col}{r0 + 1}:{col}{tr - 1})'
ov[f'F{tr}'] = f'=IFERROR(SUMIFS({rng("E")},{rng("L")},"Xong")/C{tr},0)'
for r in range(r0 + 1, tr + 1):
    for c in range(1, 7):
        cell = ov.cell(row=r, column=c)
        cell.font = Font(name=F, size=10, bold=(r == tr))
        cell.border = BORDER
        if r == tr:
            cell.fill = GROUP
    ov.cell(row=r, column=3).number_format = '0.0'
    ov.cell(row=r, column=6).number_format = '0%'
lane_r = tr + 2
ov.cell(row=lane_r, column=1, value='Theo luồng').font = Font(name=F, bold=True, size=10)
lanes = ['chính', 'V2-ui', 'V2-web', 'người (anhnn, khách)']
for ci, hname in enumerate(['Luồng', 'Số task', 'Ngày công'], 1):
    c = ov.cell(row=lane_r + 1, column=ci, value=hname)
    c.font, c.fill, c.border = HFONT, HFILL, BORDER
for i, ln in enumerate(lanes, lane_r + 2):
    ov.cell(row=i, column=1, value=ln)
    ov.cell(row=i, column=2, value=f'=COUNTIF({rng("D")},A{i})')
    ov.cell(row=i, column=3, value=f'=SUMIF({rng("D")},A{i},{rng("E")})')
    for c in range(1, 4):
        ov.cell(row=i, column=c).font = BFONT
        ov.cell(row=i, column=c).border = BORDER
    ov.cell(row=i, column=3).number_format = '0.0'
note_r = lane_r + 2 + len(lanes) + 1
ov.cell(row=note_r, column=1, value='Đường găng').font = Font(name=F, bold=True, size=10)
crit = clean(re.search(r'Đường găng:\n(.+)', md).group(1))
c = ov.cell(row=note_r, column=2, value=crit)
c.font, c.alignment = BFONT, WRAP
ov.merge_cells(start_row=note_r, start_column=2, end_row=note_r, end_column=6)
ov.row_dimensions[note_r].height = 45
for col, w in zip('ABCDEF', [30, 14, 12, 10, 10, 18]):
    ov.column_dimensions[col].width = w
ov.column_dimensions['B'].width = 14

# ---------- Truong (Phu luc A)
pa = section(md, '## Phụ lục A', '## Phụ lục B')
trows = []
cur_type = ''
for line in pa.split('\n'):
    m = re.match(r'#### `([^`]+)` · (.+)', line)
    if m:
        cur_type = f'{m.group(1)} · {m.group(2)}'
        continue
    if line.startswith('| ') and not line.startswith('| Tab ') and not line.startswith('|---'):
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) >= 7:
            trows.append([cur_type] + [clean(c) for c in cells[:7]])
wa = wb.create_sheet('Trường')
write_table(wa, ['Loại nội dung', 'Tab', 'Nhóm', 'Alias', 'Tên trường', 'Kiểu nhập (data type)', 'Bắt buộc', 'Ghi chú'], trows, [30, 18, 26, 36, 32, 34, 12, 40])

# ---------- Data type (Phu luc B)
pb = section(md, '## Phụ lục B')
drows = []
for head, tbl in tables_under(pb):
    hdrs = tbl[0]
    for r in tbl[1:]:
        drows.append([head] + [clean(f'{hdrs[i]}: {v}') if i else clean(v) for i, v in enumerate(r) if v])
wd = wb.create_sheet('Data type')
write_table(wd, ['Nhóm', 'Data type / alias', 'Chi tiết 1', 'Chi tiết 2', 'Chi tiết 3', 'Chi tiết 4'], [r + [''] * (6 - len(r)) for r in drows], [40, 40, 50, 40, 30, 24])

# ---------- API
api = [
    ['C1', 'GET', '/umbraco/management/api/v1/antc/picker-items?dataType={guid}&q=&skip=0&take=20', 'Danh sách cho ô chọn combobox: key, name, icon, code, isActive, isPublished, parentName, contentType', '401 UNAUTHORIZED, 404 DATATYPE_NOT_FOUND, 400 VALIDATION_FAILED', 'Backoffice', 'QĐ-045', 'V2-01i'],
    ['C2', 'POST', '/api/v1/feedback', 'Gửi góp ý: pageUrl, kind, message, contact, consent. Trả 201 { id }. Lưu như câu hỏi Hỏi – Đáp, bảng riêng', '400 VALIDATION_FAILED (fields), 429 RATE_LIMITED', 'Công khai', 'QĐ-047', 'V2-09c'],
    ['C3', 'GET', '/umbraco/management/api/v1/antc/content-info/{key}', 'Địa chỉ, nơi đang dùng, thời gian đọc, tình trạng 90 ngày, trạng thái PDF', '401, 404 NOT_FOUND', 'Backoffice', 'QĐ-045', 'V2-01q'],
    ['C3', 'POST', '/umbraco/management/api/v1/antc/checklists/{key}/pdf/regenerate', 'Sinh lại PDF checklist. Trả 202', '403 FORBIDDEN (không phải Quản trị viên), 409 PDF_MODE_UPLOAD', 'Backoffice', 'QĐ-045', 'V2-08c'],
    ['C4', 'GET', '/umbraco/management/api/v1/antc/publish-check/{key}', 'Kết quả kiểm trước khi xuất bản: ok, items[field, label, tab, message]. Dùng chung bảng luật với kiểm khi xuất bản', '401, 404 NOT_FOUND', 'Backoffice', 'QĐ-045', 'V2-10b'],
]
wapi = wb.create_sheet('API')
write_table(wapi, ['Mã', 'Phương thức', 'Đường dẫn', 'Nội dung', 'Lỗi (dạng QĐ-004)', 'Phạm vi', 'Quyết định', 'Task'], api, [6, 11, 60, 60, 40, 12, 11, 9])

# ---------- Quyet dinh
qrows = []
for m in re.finditer(r'### (QĐ-0(3[2-9]|[4-9]\d)) · (.+)\n\n- Ngày: ([^·]+)· Người xác nhận: ([^·]+)· Trạng thái: (.+)', qd):
    qrows.append([m.group(1), clean(m.group(3)), m.group(4).strip(), m.group(5).strip(), m.group(6).strip()])
wq = wb.create_sheet('Quyết định')
write_table(wq, ['Mã', 'Nội dung', 'Ngày', 'Người xác nhận', 'Trạng thái'], qrows, [10, 90, 13, 14, 12])

# ---------- Truong hop bien, Viec ngoai dev
def md_table_after(title):
    part = section(md, title)
    return tables_under(part)[0][1]
eb = md_table_after('## Trường hợp biên phải xử lý')
we = wb.create_sheet('Trường hợp biên')
write_table(we, [clean(x) for x in eb[0]], [[clean(c) for c in r] for r in eb[1:]], [50, 90])
nd = md_table_after('## Việc không phải của dev')
wn = wb.create_sheet('Việc ngoài dev')
write_table(wn, [clean(x) for x in nd[0]] + ['Tiến độ', 'Ghi chú'], [[clean(c) for c in r] + ['Chưa làm', ''] for r in nd[1:]], [70, 22, 26, 14, 30], input_cols=(4, 5))
dv2 = DataValidation(type='list', formula1='"Chưa làm,Đang làm,Xong"', allow_blank=True)
wn.add_data_validation(dv2)
dv2.add(f'D2:D{len(nd)}')

for w in wb.worksheets:
    w.sheet_view.zoomScale = 100
wb.save(out)
print('tasks', n_task, 'stages', len(STAGES), 'fields', len(trows), 'datatypes', len(drows), 'qd', len(qrows), 'edge', len(eb) - 1, 'nondev', len(nd) - 1)

"""Chup anh ban dung v2: tung khoi cua 6 trang o 3 be rong, kem cac trang thai tuong tac.

python capture.py <thu-muc-ra> [--widths 1440,744,390] [--only gioi-thieu,ung-pho]
"""
import argparse
import io
import pathlib
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).parent
S = "main > section:nth-of-type"

# (tien to, ten trang, [(so, slug, selector), ...])
PAGES = [
    ("gt", "gioi-thieu", [
        ("01", "hero", "#top"), ("02", "nam-phan", "#parts"), ("03", "cau-chuyen", "#story"),
        ("04", "mot-dia-chi", "#check"), ("05", "ba-kenh", "#guide"), ("06", "dung-lai", "#fin"),
        ("07", "chan-trang", "footer.ftr")]),
    ("up", "ung-pho", [
        ("01", "hero", f"{S}(1)"), ("02", "chon-tinh-huong", "#chon"), ("03", "dau-hieu", "#dau-hieu"),
        ("04", "hai-cau-tu-hoi", "#hai-cau"), ("05", "so-can-biet", "#so-can-biet"), ("06", "tiep-theo", "section.next")]),
    ("td", "thu-doan", [
        ("01", "hero", f"{S}(1)"), ("02", "bon-thu", f"{S}(2)"), ("03", "cach-ho-lam", "#tac"),
        ("04", "theo-linh-vuc", "#linh-vuc"), ("05", "canh-bao-moi", f"{S}(5)"), ("06", "tiep-theo", "section.next")]),
    ("ct", "cuoc-thi", [
        ("01", "hero", f"{S}(1)"), ("02", "200-cau-8-chuyen-de", "#cuoc-thi"), ("03", "thu-suc", "#thu-suc"),
        ("04", "gop-y-chia-se", f"{S}(4)"), ("05", "tiep-theo", "section.next")]),
    ("hd", "hoi-dap", [
        ("01", "hero", f"{S}(1)"), ("02", "hoi-rieng-tra-loi-cong-khai", f"{S}(2)"), ("03", "gui-cau-hoi", "#gui"),
        ("04", "da-tra-loi", "#da-tra-loi"), ("05", "tiep-theo", "section.next")]),
    ("ctt", "cuoc-thi-thang", [
        ("01", "hero", f"{S}(1)"), ("02", "cach-nhan-ra-cuoc-thi-that", "section.safe"), ("03", "tham-gia-4-buoc", "#dang-ky"),
        ("04", "giai-thuong", f"{S}(4)"), ("05", "lich-ca-nam", f"{S}(5)"), ("06", "ket-qua-thang-truoc", f"{S}(6)"),
        ("07", "thac-mac-thuong-gap", f"{S}(7)"), ("08", "tiep-theo", "section.next")]),
]

RECT_JS = """(sel) => { const e = document.querySelector(sel); if (!e) return null;
  const r = e.getBoundingClientRect(); return {y: Math.round(r.top + scrollY), h: Math.round(r.height)}; }"""
WARM_JS = "() => document.documentElement.scrollHeight"


def new_page(browser, name, width, reduced=True, warm=False):
    ctx = browser.new_context(viewport={"width": width, "height": 900},
                              reduced_motion="reduce" if reduced else "no-preference")
    pg = ctx.new_page()
    pg.goto((HERE / "pages" / f"{name}.html").as_uri())
    pg.wait_for_timeout(1500)
    if not warm:
        return ctx, pg
    h = pg.evaluate(WARM_JS)
    y = 0
    while y < h:
        pg.evaluate(f"window.scrollTo(0,{y})")
        pg.wait_for_timeout(80)
        y += 500
        h = pg.evaluate(WARM_JS)
    pg.evaluate("window.scrollTo(0,0)")
    pg.wait_for_timeout(500)
    return ctx, pg


def save_png(im, path):
    im.convert("RGB").save(path, "PNG", optimize=True)
    return path


def shot_rect(pg, sel, path, width):
    # ve dau trang: header co dinh chi nam o 0..121px, khong de len khoi duoc chup
    pg.evaluate("window.scrollTo(0,0)")
    pg.wait_for_timeout(200)
    rect = pg.evaluate(RECT_JS, sel)
    if not rect:
        print("  ! khong thay", sel)
        return False
    png = pg.screenshot(full_page=True, clip={"x": 0, "y": rect["y"], "width": width, "height": rect["h"]})
    save_png(Image.open(io.BytesIO(png)), path)
    return True


def do_sections(browser, out, width, only):
    for prefix, name, blocks in PAGES:
        if only and name not in only:
            continue
        ctx, pg = new_page(browser, name, width)
        if name != "gioi-thieu":
            # nut 113 noi la phan tu co dinh, se roi vao mot khoi bat ky trong anh chup toan trang
            pg.add_style_tag(content=".fab{display:none!important}")
        full = Image.open(io.BytesIO(pg.screenshot(full_page=True))).convert("RGB")
        for num, slug, sel in blocks:
            rect = pg.evaluate(RECT_JS, sel)
            if not rect:
                print(f"  ! {name} {sel}: khong thay")
                continue
            if width == 1440 and name == "gioi-thieu" and num == "03":
                continue  # chup rieng 4 chuong o che do chuyen dong binh thuong
            if prefix != "gt" and slug == "chan-trang":
                continue
            if prefix == "ct" and num == "03":
                continue  # da co 4 anh trang thai ct-03a..d
            crop = full.crop((0, rect["y"], width, min(full.height, rect["y"] + rect["h"])))
            save_png(crop, out / f"{prefix}-{num}-{slug}-{width}.png")
        ctx.close()
        print(f"  {name} @ {width}: xong")


def story_pinned(browser, out):
    ctx, pg = new_page(browser, "gioi-thieu", 1440, reduced=False)
    info = pg.evaluate("(()=>{const r=document.getElementById('story').getBoundingClientRect();return {top:r.top+scrollY,h:r.height}})()")
    for letter, chapter, frac in (("a", 1, 0.10), ("b", 2, 0.44), ("c", 3, 0.74), ("d", 4, 0.97)):
        pg.evaluate(f"window.scrollTo(0,{info['top'] + frac * (info['h'] - 900)})")
        pg.wait_for_timeout(2200)
        pg.screenshot(path=str(out / f"gt-03{letter}-cau-chuyen-chuong-{chapter}-1440.png"))
    ctx.close()
    print("  gioi-thieu @ 1440: 4 chuong cau chuyen xong")


def tac_pinned(browser, out):
    """Hang 'bay cach' o 1440px truot ngang theo cuon: chup giua va cuoi."""
    ctx, pg = new_page(browser, "thu-doan", 1440, reduced=False)
    info = pg.evaluate("(()=>{const r=document.getElementById('tac').getBoundingClientRect();return {top:r.top+scrollY,h:r.height}})()")
    span = max(info["h"] - 900, 1)
    print("  thu-doan #tac (chuyen dong binh thuong):", info)
    for letter, label, frac in (("b", "giua", 0.5), ("c", "cuoi", 0.97)):
        pg.evaluate(f"window.scrollTo(0,{info['top'] + frac * span})")
        pg.wait_for_timeout(2200)
        pg.screenshot(path=str(out / f"td-03{letter}-cach-ho-lam-{label}-1440.png"))
    ctx.close()


def states(browser, out, width, only):
    def run(name, fn):
        if only and name not in only:
            return
        ctx, pg = new_page(browser, name, width)
        try:
            fn(pg)
        except Exception as e:  # noqa: BLE001
            print(f"  ! {name} @ {width}: {type(e).__name__}: {str(e)[:120]}")
        ctx.close()

    def save(pg, sel, fname):
        # nut 113 noi la phan tu co dinh: an di de anh trang thai khong bi lech (van giu o anh hero)
        pg.add_style_tag(content=".fab{display:none!important}")
        shot_rect(pg, sel, out / f"{fname}-{width}.png", width)

    def thu_suc(pg):
        sel = "#thu-suc"
        save(pg, sel, "ct-03a-thu-suc-chua-chon")
        pg.locator("#qzO .qo").nth(0).click()
        pg.wait_for_timeout(500)
        save(pg, sel, "ct-03b-thu-suc-chon-dap-an-a")
        pg.reload()
        pg.wait_for_timeout(800)
        pg.locator("#qzO .qo").nth(1).click()
        pg.wait_for_timeout(500)
        save(pg, sel, "ct-03c-thu-suc-chon-dap-an-b")
        pg.locator("#qzN").click(timeout=5000)
        pg.wait_for_timeout(400)
        for _ in range(2):
            if not pg.locator("#qzBody").is_visible():
                break
            pg.locator("#qzO .qo").nth(1).click(timeout=5000)
            pg.wait_for_timeout(300)
            if pg.locator("#qzN").is_visible():
                pg.locator("#qzN").click(timeout=5000)
                pg.wait_for_timeout(400)
        pg.wait_for_timeout(500)
        save(pg, sel, "ct-03d-thu-suc-ket-qua")

    def dau_hieu(pg):
        pg.locator("label[for=s1]").click()
        pg.wait_for_timeout(600)
        save(pg, "#dau-hieu", "up-03b-dau-hieu-da-danh-dau-1")
        pg.locator("label[for=s3]").click()
        pg.wait_for_timeout(600)
        save(pg, "#dau-hieu", "up-03c-dau-hieu-da-danh-dau-2")

    def gioi_thieu(pg):
        pg.locator("#check .hs").nth(0).click()
        pg.wait_for_timeout(500)
        save(pg, "#check", "gt-04b-mot-dia-chi-diem-1")
        pg.reload()
        pg.wait_for_timeout(800)
        pg.locator("#quiz .opt").nth(0).click()
        pg.wait_for_timeout(500)
        save(pg, "#check", "gt-04c-trang-nao-that-chon-a")
        pg.reload()
        pg.wait_for_timeout(800)
        pg.locator("#quiz .opt").nth(1).click()
        pg.wait_for_timeout(500)
        save(pg, "#check", "gt-04d-trang-nao-that-chon-b")

    def hoi_dap(pg):
        # canh bao khi go chuoi tu 6 chu so tro len (de tranh lo ma OTP, so tai khoan)
        pg.fill("#askT", "Mã OTP của tôi là 123456, tôi có bị lừa không?")
        pg.wait_for_timeout(500)
        save(pg, "#gui", "hd-03b-form-canh-bao-so-nhay-cam")
        pg.reload()
        pg.wait_for_timeout(800)
        pg.fill("#askT", "Có người chuyển nhầm tiền vào tài khoản của tôi, tôi nên làm gì?")
        pg.locator("label:has(#wantReply)").click()
        pg.fill("#askM", "ten@vidu.vn")
        pg.locator("label:has(#agree)").click()
        pg.wait_for_timeout(500)
        save(pg, "#gui", "hd-03c-form-da-nhap")
        pg.locator("#askBtn").click(timeout=5000)
        pg.wait_for_timeout(700)
        save(pg, "#gui", "hd-03d-form-da-gui")

    def cuoc_thi_thang(pg):
        sel = f"{S}(7)"
        pg.locator(f"{sel} summary").nth(0).click()
        pg.wait_for_timeout(500)
        save(pg, sel, "ctt-07b-thac-mac-mo-cau-1")
        pg.fill("#remM", "ten@vidu.vn")
        pg.locator("#remForm button[type=submit]").click()
        pg.wait_for_timeout(600)
        save(pg, sel, "ctt-07c-nhac-lich-da-gui")

    run("cuoc-thi", thu_suc)
    run("ung-pho", dau_hieu)
    run("gioi-thieu", gioi_thieu)
    run("hoi-dap", hoi_dap)
    run("cuoc-thi-thang", cuoc_thi_thang)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--widths", default="1440,744,390")
    ap.add_argument("--only", default="")
    ap.add_argument("--no-states", action="store_true")
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    only = [x for x in a.only.split(",") if x]
    with sync_playwright() as p:
        b = p.chromium.launch(channel="msedge")
        for w in [int(x) for x in a.widths.split(",")]:
            do_sections(b, out, w, only)
            if not a.no_states:
                states(b, out, w, only)
        if 1440 in [int(x) for x in a.widths.split(",")] and (not only or "gioi-thieu" in only):
            story_pinned(b, out)
        if 1440 in [int(x) for x in a.widths.split(",")] and (not only or "thu-doan" in only):
            tac_pinned(b, out)
        b.close()
    files = sorted(out.glob("*.png"))
    print(f"\nTong: {len(files)} anh, {sum(f.stat().st_size for f in files) / 1048576:.1f} MB")

# Génère les WebP du site à partir des images Sky Motors (dossier sky-motors/). Aucun agrandissement au-delà de la taille source.
import os, glob
from PIL import Image
SRC = os.path.join(os.path.dirname(__file__), 'sky-motors')
OUT = os.path.join(os.path.dirname(__file__), '..', 'yamoo-drive', 'public')
BG = (26, 27, 30)

def load(name):
    im = Image.open(os.path.join(SRC, name)).convert('RGBA')
    base = Image.new('RGBA', im.size, BG + (255,))
    base.alpha_composite(im)
    return base.convert('RGB')

def save(im, path, width, quality=80):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, 'WEBP', quality=quality, method=6)
    return im.size

def crop_ratio(im, ratio, cx=0.5, cy=0.5):
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio); x = round((w - nw) * cx); return im.crop((x, 0, x + nw, h))
    nh = round(w / ratio); y = round((h - nh) * cy); return im.crop((0, y, w, y + nh))

# slug -> (principale, [galerie : 1re = grande image, 2e, 3e])
PLAN = {
    'jetour-t1': ('t1-a.webp', ['t1-c.webp', 't1-d.webp', 't1-main.webp']),
    'jetour-t2': ('t2-main.webp', ['t2-car1.webp', 't2-d.webp', 't2-b.webp']),
    'jetour-dashing': ('dashing-a.webp', ['dashing-a.webp', 'dashing-int.webp', 'dashing-main.webp']),
    'jetour-x90-plus': ('x90-a.webp', ['x90-a.webp', 'x90-main.webp', 'x90-car1.webp']),
    'jetour-x70-plus': ('x70-a.webp', ['x70-a.webp', 'x70-main.webp', 'x70-car1.webp']),
    'jetour-x50': ('x50-a.webp', ['x50-a.webp', 'x50-main.webp', 'x50-b.webp']),
    'jmc-grand-avenue': ('ga-c.webp', ['ga-c.webp', 'ga-b.webp', 'ga-f.jpg']),
    'jmc-vigus': ('vigus-c.webp', ['vigus-c.webp', 'vigus-b.webp', 'vigus-d.webp']),
}
vd = os.path.join(OUT, 'vehicles')
for f in glob.glob(os.path.join(vd, '*.webp')): os.remove(f)
for slug, (main, gal) in PLAN.items():
    print(slug, 'main', save(load(main), f'{vd}/{slug}.webp', 800))
    for i, g in enumerate(gal):
        suffix = '-lg' if i == 0 else f'-{i + 1}'
        im = load(g)
        if g.endswith('.jpg') and im.width == im.height:
            im = crop_ratio(im, 4 / 3, 0.5, 0.55)
        print('  ', suffix, save(im, f'{vd}/{slug}{suffix}.webp', 1200))

idir = os.path.join(OUT, 'images')
hero = crop_ratio(load('dashing-a.webp'), 16 / 9, 0.5, 0.6); print('hero', save(hero, f'{idir}/hero.webp', 1920))
mob = crop_ratio(load('dashing-a.webp'), 0.7, 0.58, 0.5); print('hero-mobile', save(mob, f'{idir}/hero-mobile.webp', 840))
hd = crop_ratio(load('x90-a.webp'), 16 / 9, 0.5, 0.55); print('header', save(hd, f'{idir}/header.webp', 1280))
por = crop_ratio(load('ga-f.jpg'), 3 / 4, 0.6, 0.5); print('portrait', save(por, f'{idir}/portrait.webp', 900))
ap = crop_ratio(load('ga-c.webp'), 4 / 3, 0.55, 0.5); print('approche', save(ap, f'{idir}/approche.webp', 1200))

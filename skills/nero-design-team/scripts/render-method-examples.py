"""Render original schematic method comparisons; no project inputs or network access."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/methods'
REGULAR = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
BOLD = Path('/System/Library/Fonts/Supplemental/Arial Bold.ttf')

def font(size, bold=False):
    target = BOLD if bold else REGULAR
    if not target.is_file():
        # Pillow's packaged/default font is a portable fallback for these Latin examples.
        return ImageFont.load_default(size=size)
    return ImageFont.truetype(str(target), size)

def label(d, xy, text, size=22, color='#21313d', bold=False):
    d.text(xy, text, font=font(size, bold), fill=color)

def frame(number, title, explanation):
    im = Image.new('RGB', (1440, 640), '#f3f5f7'); d = ImageDraw.Draw(im)
    label(d, (44, 24), f'{number}  {title}', 30, bold=True)
    label(d, (44, 68), explanation, 19, '#536471')
    for x, name in [(44,'BEFORE'),(748,'AFTER')]:
        d.rounded_rectangle((x,112,x+648,548),radius=12,fill='white',outline='#cbd5dc',width=2)
        label(d,(x+22,130),name,15,'#60717d',True)
    label(d,(44,588),'Original schematic examples. Compare the method, not the skin. No project acceptance is implied.',18,'#536471')
    return im,d

def button(d, box, text, fill='#245bc1', color='white', size=23):
    d.rounded_rectangle(box,radius=8,fill=fill)
    bb=d.textbbox((0,0),text,font=font(size,True)); w=bb[2]-bb[0]; h=bb[3]-bb[1]
    label(d,((box[0]+box[2]-w)/2,(box[1]+box[3]-h)/2-3),text,size,color,True)

def save(im,name):
    OUT.mkdir(parents=True,exist_ok=True); im.save(OUT/f'{name}.png')

im,d=frame('M01','Hierarchy','Choose the intended first reading target; keep all of the content.')
for y,t in [(205,'Research review'),(300,'3 open items')]:label(d,(75,y),t,42,'#245bc1',True)
button(d,(75,402,646,478),'View evidence',size=36)
label(d,(780,191),'Research review',23,'#60717d')
label(d,(780,245),'3 open items',52,bold=True)
button(d,(780,406,1350,474),'View evidence',fill='#e8edf3',color='#21313d')
save(im,'hierarchy')

im,d=frame('M02','Grouping and spacing','Make semantic pairs visible; whitespace is a means, not a target.')
items=[('Period','2026 Q2'),('Status','Needs review'),('Owner','Project team')]
for i,(a,b) in enumerate(items):
    y=180+i*112;label(d,(76,y),a,24);label(d,(76,y+55),b,24)
    y=184+i*108;d.rounded_rectangle((778,y,1364,y+90),radius=6,fill='#f3f5f7')
    label(d,(798,y+10),a,18,'#60717d');label(d,(798,y+39),b,29,bold=True)
save(im,'grouping')

im,d=frame('M03','Typography roles','One font can support distinct roles without losing words or source notes.')
texts=['Evidence review','Three items need attention.','Check the source period before use.','Source: illustrative dataset.']
for i,t in enumerate(texts):label(d,(76,196+i*70),t,24)
for y,t,size,bold,color in [(190,texts[0],36,True,'#21313d'),(267,texts[1],27,True,'#21313d'),(331,texts[2],24,False,'#21313d'),(449,texts[3],19,False,'#60717d')]:label(d,(780,y),t,size,color,bold)
save(im,'typography')

im,d=frame('M04','Cross-asset composition','Preserve each asset\'s job; coordinate type, spacing and material strength.')
for x,coherent in [(76,False),(780,True)]:
    d.rounded_rectangle((x,183,x+580,239),radius=5 if coherent else 25,fill='#e6eff0' if coherent else '#ffeddc')
    label(d,(x+15,194),'Overview',27 if coherent else 30,'#21313d',True)
    d.rounded_rectangle((x,269,x+220,480),radius=5 if coherent else 38,fill='#f3f6f6' if coherent else '#eaddff',outline='#cbd5dc',width=1 if coherent else 4)
    label(d,(x+17,290),'Open items',22 if coherent else 29,bold=True)
    label(d,(x+20,340),'3',56,'#276b70' if coherent else '#6f37bf',True)
    label(d,(x+255,278),'Evidence',22 if coherent else 33,bold=True)
    for i,h in enumerate([63,105,84]):
        bx=x+265+i*85;d.rectangle((bx,465-h,bx+45,465),fill='#276b70' if coherent else ['#ffab52','#3f64bc','#d95381'][i]);label(d,(bx+8,480),'ABC'[i],17)
label(d,(780,518),'Illustrative values: A 3 / B 5 / C 4',15,'#60717d')
label(d,(76,518),'Illustrative values: A 3 / B 5 / C 4',15,'#60717d')
save(im,'composition')

im,d=frame('M05','Search by method','Explore different reading experiences, not only palette variants.')
for x,after in [(76,False),(780,True)]:
    label(d,(x,181),'Task: review evidence',25,bold=True)
    for i in range(3):
        bx=x+i*192;d.rounded_rectangle((bx,240,bx+174,445),radius=5,fill='#f5f7f9',outline='#b8c6cf',width=1)
        c=['#245bc1','#9a477d','#37837b'][i]
        if not after:
            d.rectangle((bx+13,255,bx+161,287),fill=c)
            for j in range(3):d.rounded_rectangle((bx+13,305+j*40,bx+161,333+j*40),radius=6,fill='#dbe3e8')
        elif i==0:
            d.rectangle((bx+13,255,bx+161,287),fill='#21313d')
            for j in range(6):d.line((bx+13,310+j*18,bx+91,310+j*18),fill='#93a4af',width=3)
            d.ellipse((bx+105,310,bx+160,365),fill='#d8b08c')
        elif i==1:
            d.ellipse((bx+40,260,bx+135,355),outline='#37837b',width=12)
            for j in range(3):d.line((bx+14,380+j*20,bx+160,380+j*20),fill='#879da7',width=3)
        else:
            for j in range(7):
                d.line((bx+12,262+j*24,bx+160,262+j*24),fill='#9cadb8',width=2)
            for off in [63,115]:d.line((bx+off,260,bx+off,412),fill='#9cadb8',width=2)
        label(d,(bx,466),(['Blue','Plum','Green'] if not after else ['Reading order','Status focus','Comparison'])[i],18,bold=True)
save(im,'exploration')

im,d=frame('M06','Motion purpose','Schematic frames show continuity; live behavior still needs interaction testing.')
for x,after in [(76,False),(780,True)]:
    for i in range(2):
        y=190+i*150;d.rectangle((x,y,x+575,y+125),fill='#f3f6f8',outline='#cbd5dc')
        button(d,(x+16,y+34,x+152,y+81),'Details',size=18)
        if i:
            px=x+326 if after else x+190
            d.rectangle((px,y+12,px+226,y+112),fill='#dcebe8',outline='#37837b',width=2)
            label(d,(px+15,y+37),'Evidence panel',19,bold=True)
            if after:d.line((x+158,y+57,px-9,y+57),fill='#37837b',width=3)
    label(d,(x,515),'Static equivalent: details remain reachable.',17,'#536471')
save(im,'motion')
print(json.dumps({'files':[str(p) for p in sorted(OUT.glob('*.png'))],'size':[1440,640],'kind':'original_schematic_examples'}))

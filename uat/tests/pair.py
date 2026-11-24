# Side-by-side: Concept D prototype (left) vs working app (right)
import sys
from PIL import Image, ImageDraw
d='/home/user/rpharmacy/uat/tests/out/cd/'
dev,names,out=sys.argv[1],sys.argv[2].split(','),sys.argv[3]
scale=0.5 if dev=='desktop' else 0.62
rows=[]
for n in names:
    a=Image.open(d+f'{dev}-{n}-proto.png');b=Image.open(d+f'{dev}-{n}-app.png')
    a=a.resize((int(a.width*scale),int(a.height*scale)));b=b.resize((int(b.width*scale),int(b.height*scale)))
    W=Image.new('RGB',(a.width+b.width+30,max(a.height,b.height)+24),'white');dr=ImageDraw.Draw(W)
    dr.text((4,4),f'{n} · Concept D prototype',fill='black');dr.text((a.width+34,4),f'{n} · working app (UAT)',fill='black')
    W.paste(a,(0,24));W.paste(b,(a.width+30,24));rows.append(W)
H=sum(r.height for r in rows)+10*len(rows);M=Image.new('RGB',(max(r.width for r in rows),H),(200,200,200));y=0
for r in rows:M.paste(r,(0,y));y+=r.height+10
M.save(out)

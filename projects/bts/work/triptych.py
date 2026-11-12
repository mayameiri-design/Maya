import subprocess, numpy as np
from PIL import Image, ImageFilter, ImageEnhance
R='/home/user/Maya/projects/bts/'
W,H,SH=1080,1920,640
FPS=30
def ease_out(x): x=min(max(x,0),1); return 1-(1-x)**3
def ease_io(x): x=min(max(x,0),1); return 4*x**3 if x<.5 else 1-(-2*x+2)**3/2

def read_clip(path,start,dur):
    n=int(dur*FPS)
    p=subprocess.run(['ffmpeg','-v','error','-ss',str(start),'-i',R+path,'-t',str(dur+0.1),'-vf',f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True,check=True).stdout
    a=np.frombuffer(p,np.uint8).reshape(-1,H,W,3)
    a=a[:n]
    fr=[Image.fromarray(x) for x in a]
    while len(fr)<n: fr.append(fr[-1])
    return fr

def ad_composite(path):
    """4:5 ad frame, full, centered over dark blurred copy -> 1080x1920 (same as v2)"""
    im=Image.open(R+path).convert('RGB')
    bg=im.resize((1188,1485)); 
    bg=im.resize((int(1920*im.width/im.height)+1,1920)) if False else im.resize((1080*2,1350*2))
    bg=im.resize((int(H*im.width/im.height),H)) # cover by height
    if bg.width<W: bg=im.resize((W,int(W*im.height/im.width)))
    l=(bg.width-W)//2; t=(bg.height-H)//2
    bg=bg.crop((l,t,l+W,t+H)).filter(ImageFilter.GaussianBlur(28))
    bg=ImageEnhance.Brightness(bg).enhance(0.72)
    fg=im.resize((W,int(W*im.height/im.width)))
    bg.paste(fg,(0,(H-fg.height)//2))
    return bg

def inner_full(path):
    """ad frames that contain a letterboxed 9:16 phone video: crop the bars, scale uniformly to 1080x1920"""
    im=Image.open(R+path).convert('RGB').crop((158,0,921,1350))
    r=im.resize((int(im.width*H/im.height)+1,H),Image.LANCZOS)
    l=(r.width-W)//2
    return r.crop((l,0,l+W,H))

def band_from_image(img, cy):
    """landscape strip SHxW cropped from a 1080x? image around fractional y-center"""
    y=int(img.height*cy-SH/2); y=max(0,min(img.height-SH,y))
    return img.crop((0,y,W,y+SH))

def ad_strip_image(path):
    im=Image.open(R+path).convert('RGB'); return im.resize((W,int(W*im.height/im.width)))

def zoomed(img,z):
    if z==1: return img
    w,h=img.size; nw,nh=int(w*z),int(h*z)
    r=img.resize((nw,nh),Image.BILINEAR); l=(nw-w)//2; t=(nh-h)//2
    return r.crop((l,t,l+w,t+h))

def strip_frames(frames,cy):
    return [band_from_image(f,cy) for f in frames]

def build(top,mid_comp,bot,dy,reverse,nframes,tin=12,thold_end=45,tr=18,name='x'):
    """top/bot: list of strip images (len>=nframes). mid_comp: 1080x1920 image.
    forward: slide-in strips, hold, middle expands to full, hold.
    reverse: start full, window shrinks to band, strips slide out->in? (mirror)"""
    out=[]
    for f in range(nframes):
        canvas=Image.new('RGB',(W,H),(8,8,8))
        # phase params
        if not reverse:
            slide=[ease_out((f-0)/tin),ease_out((f-4)/tin),ease_out((f-8)/tin)]  # top,mid,bot
            e=ease_io((f-thold_end)/tr)
            hold_zoom=1+0.05*min(f/thold_end,1)
        else:
            e=1-ease_io((f-thold_end)/tr)   # starts full (e=1) then shrinks to 0
            slide=[1,1,1]; hold_zoom=1+0.05*max((f-thold_end-tr)/max(nframes-thold_end-tr,1),0)
        yt=int(SH*(1-e)); yb=int(2*SH+(H-2*SH)*e)
        # middle window
        c=zoomed(mid_comp,hold_zoom if e<1 else 1.0)
        shift=int(dy*(1-e))
        win=Image.new('RGB',(W,yb-yt))
        win.paste(c,(0,-yt+shift))
        mx=int((1-slide[1])*W)
        if not reverse: canvas.paste(win,(mx,yt))
        else: canvas.paste(win,(0,yt))
        if yt>0 or reverse:
            ts=zoomed(top[min(f,len(top)-1)],1.0)
            if not reverse:
                canvas.paste(ts,(-int((1-slide[0])*W),yt-SH))
            else:
                canvas.paste(ts,(0,yt-SH))
        if yb<H or reverse:
            bs=bot[min(f,len(bot)-1)]
            if not reverse:
                canvas.paste(bs,(-int((1-slide[2])*W),yb))
            else:
                canvas.paste(bs,(0,yb))
        out.append(canvas)
    return out

def write(frames,path):
    p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-crf','17','-pix_fmt','yuv420p',path],stdin=subprocess.PIPE)
    for fr in frames: p.stdin.write(np.asarray(fr).tobytes())
    p.stdin.close(); p.wait()

if __name__=='__main__':
    # INTRO: top=0942 face, mid=ad grimace, bottom=0950 door  (2.4s)
    N=72
    top=strip_frames(read_clip('raw/IMG_0942.MOV',0.4,N/FPS),0.40)
    bot=strip_frames(read_clip('raw/IMG_0950.MOV',0.1,N/FPS),0.55)
    mid=inner_full('stills/ad_0122_grimace.jpg')
    write(build(top,mid,bot,dy=442,reverse=False,nframes=N),R+'work/intro.mp4')
    # ENDING: full smile -> shrinks to band; top=ad food, bottom=ad grimace (2.6s)
    N2=78
    topi=inner_full('stills/ad_0098_food.jpg'); boti=inner_full('stills/ad_0122_grimace.jpg')
    top2=[band_from_image(topi,0.42)]*N2; bot2=[band_from_image(boti,0.27)]*N2
    mid2=ad_composite('stills/ad_0385_courier_smile.jpg')
    write(build(top2,mid2,bot2,dy=270,reverse=True,nframes=N2,thold_end=15,tr=18),R+'work/ending.mp4')

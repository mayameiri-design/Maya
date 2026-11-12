import sys, subprocess, numpy as np
sys.path.insert(0,'/home/user/Maya/projects/bts/work')
from PIL import Image, ImageOps
import triptych as T
R=T.R; W,H=T.W,T.H; FPS=30
AD='/tmp/claude-0/-home-user-Maya/7784b9bc-7174-50b2-bcc7-c7c70ffd8607/scratchpad/ad/ad.mp4'
HEAD=TAIL=3
def raw(cmd):
    p=subprocess.run(cmd,capture_output=True,check=True).stdout
    return np.frombuffer(p,np.uint8).reshape(-1,H,W,3)
def fit(a,n):
    a=list(a)
    while len(a)<n: a.append(a[-1])
    return np.stack(a[:n])
def clip_frames(path,s,n,speed=1.0):
    need=HEAD+n+TAIL; pre=min(s,HEAD/FPS); off=s-pre
    vf=f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}'
    if speed!=1: vf=f'setpts=PTS/{speed},'+vf
    a=raw(['ffmpeg','-v','error','-ss',str(off),'-i',R+path,'-t',str((need/FPS+.2)*speed),'-vf',vf,'-f','rawvideo','-pix_fmt','rgb24','-'])
    lead=HEAD-int(round(pre*FPS))
    if lead>0: a=np.concatenate([np.repeat(a[:1],lead,0),a])
    return fit(a,need)
def ad_frames(mode,s,n):
    need=HEAD+n+TAIL; pre=min(s,HEAD/FPS); off=s-pre
    if mode=='inner':
        fg=f'crop=763:1350:158:0,scale=-2:{H}:flags=lanczos,crop={W}:{H},fps={FPS}'; cmd_f=['-vf',fg]
    else:
        fc=(f'[0:v]split[b][f];[b]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=28:3,eq=brightness=-0.15[bg];'
            f'[f]scale={W}:1350[fg];[bg][fg]overlay=0:(H-h)/2,fps={FPS}[o]'); cmd_f=['-filter_complex',fc,'-map','[o]']
    a=raw(['ffmpeg','-v','error','-ss',str(off),'-i',AD,'-t',str(need/FPS+.2)]+cmd_f+['-f','rawvideo','-pix_fmt','rgb24','-'])
    lead=HEAD-int(round(pre*FPS))
    if lead>0: a=np.concatenate([np.repeat(a[:1],lead,0),a])
    return fit(a,need)
def still_frames(path,n):
    im=ImageOps.exif_transpose(Image.open(R+path)).convert('RGB'); sc=max(W/im.width,H/im.height)
    im=im.resize((int(im.width*sc)+1,int(im.height*sc)+1),Image.LANCZOS); l=(im.width-W)//2; t=(im.height-H)//2
    im=im.crop((l,t,l+W,t+H)); need=HEAD+n+TAIL
    out=[T.zoomed(im,1+0.07*i/need) for i in range(need)]
    return np.stack([np.asarray(x) for x in out])
def punch(a,n=6,z0=1.11):
    out=a.copy()
    for i in range(n):
        k=HEAD+i; z=1+(z0-1)*(1-T.ease_out(i/(n-1)))**1.0
        if z>1.001: out[k]=np.asarray(T.zoomed(Image.fromarray(a[k]),z))
    return out
def hblur(canvas,length):
    if length<2: return canvas
    acc=np.zeros(canvas.shape,np.float32); n=9
    for i in range(n): acc+=np.roll(canvas,-int(length*i/(n-1))+length//2,axis=1)
    return (acc/n).astype(np.uint8)
def whip_frame(A,B,p):
    off=int(W*T.ease_io(p)); canvas=np.concatenate([A,B],axis=1)
    bl=int(150*np.sin(np.pi*p)**1.2)
    canvas=hblur(canvas,bl)
    return canvas[:,off:off+W]

segs=[ # (kind,args,len,whip_in)
 ('clip',('raw/IMG_0958.MOV',0.0),15,False),
 ('clip',('raw/IMG_0958.MOV',1.6),15,True),
 ('still',('stills/kitchen_team.jpg',),15,False),
 ('ad',('full',13.2),15,False),
 ('clip',('raw/IMG_0942.MOV',1.2),15,True),
 ('still',('stills/monitor_dop.jpg',),15,False),
 ('clip',('raw/IMG_0946.MOV',0.2),30,True),
 ('ad',('inner',10.5),30,False),
 ('clip',('raw/IMG_0950.MOV',0.2),30,True),
 ('ad',('full',19.0),30,False),
 ('still',('stills/chairs_light.jpg',),15,False),
 ('clip',('raw/IMG_0958.MOV',2.3),15,True),
 ('ad',('full',22.2),15,False),
 ('clip',('raw/IMG_0942.MOV',2.1),15,False),
 ('ad',('inner',11.6),15,False),
 ('clip',('raw/IMG_0946.MOV',2.0),15,True),
 ('ad',('full',27.6),15,False),
 ('ad',('full',38.3),30,False),
]
def load(sg):
    k,a,n,_=sg
    if k=='clip': return punch(clip_frames(a[0],a[1],n))
    if k=='ad': return punch(ad_frames(a[0],a[1],n))
    return punch(still_frames(a[0],n))
def intro_frames():
    N=45
    top=T.strip_frames(T.read_clip('raw/IMG_0942.MOV',0.4,N/FPS),0.40)
    bot=T.strip_frames(T.read_clip('raw/IMG_0950.MOV',0.1,N/FPS),0.55)
    mid=T.inner_full('stills/ad_0122_grimace.jpg')
    return [np.asarray(f) for f in T.build(top,mid,bot,dy=442,reverse=False,nframes=N,tin=8,thold_end=14,tr=12)]
def ending_frames():
    N=75
    topi=T.inner_full('stills/ad_0098_food.jpg'); boti=T.inner_full('stills/ad_0122_grimace.jpg')
    t2=[T.band_from_image(topi,0.42)]*N; b2=[T.band_from_image(boti,0.27)]*N
    mid=T.ad_composite('stills/ad_0385_courier_smile.jpg')
    return [np.asarray(f) for f in T.build(t2,mid,b2,dy=270,reverse=True,nframes=N,thold_end=6,tr=14)]

def main():
    p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-crf','17','-pix_fmt','yuv420p',R+'work/v4_video.mp4'],stdin=subprocess.PIPE)
    wr=lambda fr:p.stdin.write(np.ascontiguousarray(fr).tobytes())
    t=0; whips=[]
    for f in intro_frames(): wr(f); t+=1
    cur=load(segs[0]); curn=segs[0][2]
    for i in range(len(segs)):
        sg=segs[i]; n=sg[2]
        nxt_whip = i+1<len(segs) and segs[i+1][3]
        s0=HEAD+(3 if sg[3] else 0); s1=HEAD+n-(3 if nxt_whip else 0)
        for k in range(s0,s1): wr(cur[k]); t+=1
        if i+1<len(segs):
            nxt=load(segs[i+1])
            if nxt_whip:
                whips.append((t+3)/FPS)
                for k in range(6): wr(whip_frame(cur[n+k],nxt[k],(k+0.5)/6)); t+=1
            cur=nxt
    for f in ending_frames(): wr(f); t+=1
    p.stdin.close(); p.wait()
    print('frames',t,'sec',t/FPS,'whips',whips)
    open(R+'work/v4_whips.txt','w').write(' '.join(f'{w:.3f}' for w in whips)+f'\n{t/FPS:.3f}\n')
main()

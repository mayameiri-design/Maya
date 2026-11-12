import sys, subprocess, numpy as np
sys.path.insert(0,'/home/user/Maya/projects/bts/work')
from PIL import Image, ImageOps
import triptych as T
R=T.R; W,H=T.W,T.H; FPS=30
AD='/tmp/claude-0/-home-user-Maya/7784b9bc-7174-50b2-bcc7-c7c70ffd8607/scratchpad/ad/story.mov'
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
    a=raw(['ffmpeg','-v','error','-ss',str(off),'-i',AD,'-t',str(need/FPS+.2),'-vf',f'scale={W}:{H},fps={FPS}','-f','rawvideo','-pix_fmt','rgb24','-'])
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


def seg(kind,args,n,whip=False,pn=True): return (kind,args,n,whip,pn)
mid=[
 seg('clip',('raw/IMG_0958.MOV',0.0),15),
 seg('clip',('raw/IMG_0958.MOV',1.6),15,True),
 seg('still',('stills/kitchen_team.jpg',),15),
 seg('ad',('inner',9.0),15),
 seg('clip',('raw/IMG_0942.MOV',1.2),15,True),
 seg('still',('stills/monitor_dop.jpg',),15),
 seg('clip',('raw/IMG_0946.MOV',0.2),30,True),
 seg('ad',('inner',10.5),30),
 seg('clip',('raw/IMG_0950.MOV',0.2),30,True),
 seg('ad',('full',19.0),30),
 seg('still',('stills/chairs_light.jpg',),15),
 seg('clip',('raw/IMG_0958.MOV',2.3),15,True),
 seg('ad',('full',22.2),15),
 seg('clip',('raw/IMG_0942.MOV',2.1),15),
 seg('ad',('inner',11.6),15),
 seg('clip',('raw/IMG_0946.MOV',2.0),15,True),
 seg('ad',('full',27.6),15),
]
mid=[(m[0],m[1],int(m[2]*18/15),m[3],m[4]) for m in mid]
shalom=[seg('ad',('inner',0.0),45,False,False)]
ending=[seg('ad',('full',13.2),54,False,False), seg('ad',('full',39.06),51,False,False)]
def load(sg):
    k,a,n=sg[0],sg[1],sg[2]; pn=sg[4]
    f=clip_frames(a[0],a[1],n) if k=='clip' else ad_frames(a[0],a[1],n) if k=='ad' else still_frames(a[0],n)
    return punch(f) if pn else f
def intro_frames():
    N=36
    top=T.strip_frames(T.read_clip('raw/IMG_0942.MOV',0.4,N/FPS),0.40)
    bot=T.strip_frames(T.read_clip('raw/IMG_0950.MOV',0.1,N/FPS),0.55)
    midimg=Image.open(R+'stills/story_1220_grimace.jpg').convert('RGB').resize((W,H),Image.LANCZOS)
    return [np.asarray(f) for f in T.build(top,midimg,bot,dy=576,reverse=False,nframes=N,tin=7,thold_end=11,tr=10)]
T0=[0]; whips=[]
def play(seglist,wr):
    cur=load(seglist[0])
    for i in range(len(seglist)):
        sg=seglist[i]; n=sg[2]
        nxt_whip=i+1<len(seglist) and seglist[i+1][3]
        s0=HEAD+(3 if sg[3] else 0); s1=HEAD+n-(3 if nxt_whip else 0)
        for k in range(s0,s1): wr(cur[k]); T0[0]+=1
        if i+1<len(seglist):
            nxt=load(seglist[i+1])
            if nxt_whip:
                whips.append((T0[0]+3)/FPS)
                for k in range(6): wr(whip_frame(cur[n+k],nxt[k],(k+0.5)/6)); T0[0]+=1
            cur=nxt
def main():
    p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-crf','17','-pix_fmt','yuv420p',R+'work/v8_video.mp4'],stdin=subprocess.PIPE)
    wr=lambda fr:p.stdin.write(np.ascontiguousarray(fr).tobytes())
    play(shalom,wr)
    for f in intro_frames(): wr(f); T0[0]+=1
    t_mid=T0[0]/FPS
    play(mid,wr)
    t_hot=T0[0]/FPS
    play(ending,wr)
    t_door=t_hot+54/FPS
    # short fade to black at end (last 8 frames re-written is not possible; append black frames)
    for i in range(6): wr(np.zeros((H,W,3),np.uint8)); T0[0]+=1
    p.stdin.close(); p.wait()
    import json
    json.dump(dict(total=T0[0]/FPS,whips=whips,t_mid=t_mid,t_hot=t_hot,t_door=t_door),open(R+'work/v8_events.json','w'))
    print(T0[0]/FPS,whips,t_mid,t_hot,t_door)
main()

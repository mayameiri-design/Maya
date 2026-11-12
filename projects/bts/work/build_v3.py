import subprocess
R='/home/user/Maya/projects/bts/'
# (type, file, start, end_or_frames)
seq=[('vid','work/intro.mp4',72),
 ('clip','raw/IMG_0958.MOV',0.0,2.4),
 ('still','stills/monitor_dop.jpg',30),
 ('still','stills/kitchen_team.jpg',30),
 ('adstill','stills/ad_0134_kitchen.jpg',30),
 ('clip','raw/IMG_0942.MOV',0.0,2.9),
 ('clip','raw/IMG_0946.MOV',0.1,2.8),
 ('still','stills/chairs_light.jpg',27),
 ('clip','raw/IMG_0950.MOV',0.1,2.5),
 ('adstill','stills/ad_0160_courier_bag.jpg',30),
 ('vid','work/ending.mp4',78)]
V="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p"
A="aresample=48000,aformat=channel_layouts=stereo"
def zoom(d): return f"zoompan=z='1+0.04*on/{d}':d={d}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,setsar=1,format=yuv420p"
args=['ffmpeg','-v','error','-y'];fc=[];cat=''
for i,s in enumerate(seq):
    args+=['-i',R+s[1]]
    if s[0]=='clip':
        fc.append(f"[{i}:v]trim={s[2]}:{s[3]},setpts=PTS-STARTPTS,{V}[v{i}]")
        fc.append(f"[{i}:a]atrim={s[2]}:{s[3]},asetpts=PTS-STARTPTS,{A}[a{i}]")
    elif s[0]=='vid':
        d=s[2]
        fc.append(f"[{i}:v]{V}[v{i}]")
        fc.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{d/30:.3f}[a{i}]")
    else:
        d=s[2]
        if s[0]=='still':
            fc.append(f"[{i}:v]scale=1188:2112:force_original_aspect_ratio=increase,crop=1188:2112,{zoom(d)}[v{i}]")
        else:
            # 4:5 ad frame: full frame centered over dark blurred copy
            fc.append(f"[{i}:v]split[b][f];[b]scale=1188:2112:force_original_aspect_ratio=increase,crop=1188:2112,boxblur=40:5,eq=brightness=-0.18[bg];[f]scale=1188:1485[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,{zoom(d)}[v{i}]")
        fc.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{d/30:.3f}[a{i}]")
    cat+=f"[v{i}][a{i}]"
fc.append(f"{cat}concat=n={len(seq)}:v=1:a=1[v][a]")
args+=['-filter_complex',';'.join(fc),'-map','[v]','-map','[a]','-c:v','libx264','-crf','18','-preset','medium','-c:a','aac','-b:a','192k',R+'BTS_v3_cut.mp4']
subprocess.run(args,check=True)
tot=0;cuts=[]
for s in seq:
    tot+= (s[3]-s[2]) if s[0]=='clip' else s[2]/30
    cuts.append(round(tot,3))
print(cuts)

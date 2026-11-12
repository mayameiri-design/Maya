import numpy as np, wave, json, subprocess
AD='/tmp/claude-0/-home-user-Maya/7784b9bc-7174-50b2-bcc7-c7c70ffd8607/scratchpad/ad/story.mov'
ev=json.load(open('v7_events.json')); sr=44100; dur=ev['total']; N=int(sr*dur); rng=np.random.default_rng(5)
def speech(a,b):
    p=subprocess.run(['ffmpeg','-v','error','-ss',str(a),'-t',str(b-a),'-i',AD,'-vn','-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(p,np.float32).astype(np.float64)
sp=np.zeros(N)
def put(sig,t0):
    i=int(t0*sr); j=min(N,i+len(sig)); sp[i:j]+=sig[:j-i]
put(speech(0.0,1.5),0.0); put(speech(13.2,15.0),ev['t_hot']); put(speech(39.06,40.75),ev['t_door'])
slam_t=ev['t_door']+(40.54-39.06)
out=np.zeros(N)
def add(sig,t0,g=1.0):
    i=int(t0*sr); j=min(N,i+len(sig))
    if 0<=i<N: out[i:j]+=sig[:j-i]*g
def tt(d): return np.arange(int(sr*d))/sr
def lp1(x,a):  # one-pole lowpass
    y=np.zeros_like(x); s=0.0
    for i,v in enumerate(x): s+=a*(v-s); y[i]=s
    return y
BPM=150; beat=60/BPM; step=beat/4; t0m=1.5
# --- sounds ---
t=tt(0.55); k808=np.sin(2*np.pi*np.cumsum(48+150*np.exp(-t*38))/sr)*np.exp(-t*5.5); k808=np.tanh(k808*1.8)
t=tt(0.25); clap=sum(np.diff(rng.standard_normal(len(t)),prepend=0)*np.exp(-np.clip(t-d,0,None)*45)*(t>=d) for d in (0,0.011,0.022))*0.35
t=tt(0.05); hat=np.diff(rng.standard_normal(len(t)),prepend=0)*np.exp(-t*110)*0.3
t=tt(0.16); cow=lambda f:(np.sign(np.sin(2*np.pi*f*t))+np.sign(np.sin(2*np.pi*f*1.505*t)))*np.exp(-t*24)*0.12
def bass(f,d):
    t=tt(d); return np.tanh(np.sin(2*np.pi*f*t)*1.6)*np.exp(-t*3.2)*(1-np.exp(-t*80))
def stab(freqs):
    t=tt(0.35); y=sum(np.sign(np.sin(2*np.pi*f*t))+np.sign(np.sin(2*np.pi*f*1.006*t)) for f in freqs)
    y=lp1(y,0.12)*np.exp(-t*9); return y*0.07
kickst={0,3,6,10,13}; clapst={4,12}; 
root=[55.0,55.0,65.41,49.0]                          # A1 A1 C2 G1
cowseq=[880,0,988,0,880,0,0,784, 0,880,0,988,1175,0,988,0]  # minor-pentatonic phrase
nst=int((slam_t-t0m)/step)+1
for s_ in range(nst):
    tm=t0m+s_*step; b16=s_%16; bar=s_//16
    if b16 in kickst: add(k808,tm,0.9)
    if b16 in clapst: add(clap,tm,0.9)
    add(hat,tm,0.75 if b16%2==0 else 0.45)
    if b16 in (14,15) and bar%2==1:                     # hat roll at the end of every 2nd bar
        add(hat,tm+step/2,0.6)
    if cowseq[b16]: add(cow(cowseq[b16]),tm,1.0 if bar>=1 else 0.0)
    if b16==0: add(bass(root[bar%4],beat*3.6),tm,0.7)
    if b16 in (0,10): add(stab([220,261.63,329.63]),tm,1.0 if bar>=1 else 0.6)
for w in ev['whips']:
    d=0.3; t=tt(d); n=rng.standard_normal(len(t)); y=np.cumsum(n); y=y-np.convolve(y,np.ones(50)/50,'same'); y/=np.abs(y).max()
    add(y*np.sin(np.pi*np.clip(t/d,0,1))**2*0.5,w-d*0.5)
t=tt(0.9); add(np.sin(2*np.pi*48*t)*np.exp(-t*4.5)*1.1+0.3*np.diff(rng.standard_normal(len(t)),prepend=0)*np.exp(-t*18),1.87,0.9)
t=tt(0.75); add(np.diff(rng.standard_normal(len(t)),prepend=0)*(t/0.75)**2*0.3,0.75)
out[int(slam_t*sr):]=0
duck=np.ones(N); duck[int(ev['t_hot']*sr):]=0.22; k=int(sr*0.1); duck=np.convolve(duck,np.ones(k)/k,'same')
music=np.tanh(out*duck*1.15); music/=np.abs(music).max()/0.82
spn=sp/max(np.abs(sp).max(),1e-6)*0.95
mix=np.tanh(music*0.8+spn); mix/=np.abs(mix).max()/0.93
w=wave.open('v7_audio.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((mix*32767).astype(np.int16).tobytes()); w.close()
print('ok',round(slam_t,2),dur)

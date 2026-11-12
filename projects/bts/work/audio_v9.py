import numpy as np, wave, json, subprocess
AD='/tmp/claude-0/-home-user-Maya/7784b9bc-7174-50b2-bcc7-c7c70ffd8607/scratchpad/ad/story.mov'
ev=json.load(open('v9_events.json')); sr=44100; dur=ev['total']; N=int(sr*dur); rng=np.random.default_rng(3)
def speech(a,b):
    p=subprocess.run(['ffmpeg','-v','error','-ss',str(a),'-t',str(b-a),'-i',AD,'-vn','-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(p,np.float32).astype(np.float64)
sp=np.zeros(N)
def put(sig,t0):
    i=int(t0*sr); j=min(N,i+len(sig)); sp[i:j]+=sig[:j-i]
put(speech(0.0,1.5),0.0); put(speech(13.2,15.95),ev['t_hot']); put(speech(39.06,41.45),ev['t_door'])
slam_t=ev['t_door']+(40.54-39.06)
out=np.zeros(N)
def add(sig,t0,g=1.0):
    i=int(t0*sr); j=min(N,i+len(sig))
    if 0<=i<N: out[i:j]+=sig[:j-i]*g
def tt(d): return np.arange(int(sr*d))/sr
BPM=100; beat=60/BPM; step=beat/4; t0m=1.5
t=tt(0.28); kick=np.sin(2*np.pi*np.cumsum(52+110*np.exp(-t*34))/sr)*np.exp(-t*13)
t=tt(0.14); snap=(np.diff(rng.standard_normal(len(t)),prepend=0)*np.exp(-t*38)*0.5+np.sin(2*np.pi*190*t)*np.exp(-t*45)*0.4)
t=tt(0.04); hat=np.diff(rng.standard_normal(len(t)),prepend=0)*np.exp(-t*140)*0.25
def pluck(f,d=0.55):
    t=tt(d); y=(np.sin(2*np.pi*f*t)+0.5*np.sin(4*np.pi*f*t)*np.exp(-t*20)+0.25*np.sin(6*np.pi*f*t)*np.exp(-t*30))
    return y*np.exp(-t*7)*(1-np.exp(-t*400))
def chord(fs): return sum(pluck(f) for f in fs)*0.16
def mar(f):
    t=tt(0.35); return (np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*f*4*t)*np.exp(-t*25))*np.exp(-t*9)*0.3
def sub(f,d=0.4):
    t=tt(d); return np.sin(2*np.pi*f*t)*np.exp(-t*5)*(1-np.exp(-t*120))
chords=[(220,261.63,329.63),(174.61,220,261.63),(261.63,329.63,392),(196,246.94,293.66)]  # Am F C G
roots=[55,43.65,65.41,49]; mel=[659.25,783.99,880,587.33]
nst=int((slam_t-t0m)/step)+1
for s_ in range(nst):
    tm=t0m+s_*step; b16=s_%16; bar=(s_//16)%4; bn=s_//16
    if b16 in ((0,6,10) if bn%2==0 else (0,3,10)): add(kick,tm,0.62)
    if b16 in (4,12): add(snap,tm,0.7)
    if b16%2==0: add(hat,tm,0.8 if b16%4==2 else 0.5)
    elif bn>=1: add(hat,tm,0.25)
    if b16 in (0,3,6,10): add(chord(chords[bar]),tm,1.0 if bn>=1 else 0.7)
    if b16 in (0,10): add(sub(roots[bar]),tm,0.4)
    if bn>=1 and b16 in (2,5,8,13): add(mar(mel[(b16//2+bar)%4]),tm,0.9)
for w in ev['whips']:
    d=0.3; t=tt(d); n=rng.standard_normal(len(t)); y=np.cumsum(n); y=y-np.convolve(y,np.ones(50)/50,'same'); y/=np.abs(y).max()
    add(y*np.sin(np.pi*np.clip(t/d,0,1))**2*0.3,w-d*0.5)
t=tt(0.8); add(np.sin(2*np.pi*50*t)*np.exp(-t*5)*0.8,1.87,0.5)
t=tt(0.75); add(np.diff(rng.standard_normal(len(t)),prepend=0)*(t/0.75)**2*0.2,0.75)
out[int(slam_t*sr):]=0
duck=np.ones(N); duck[int(ev['t_hot']*sr):]=0.2; k=int(sr*0.1); duck=np.convolve(duck,np.ones(k)/k,'same')
music=np.tanh(out*duck); music/=np.abs(music).max()/0.6
spn=sp/max(np.abs(sp).max(),1e-6)*0.95
mix=np.tanh(music+spn); mix/=np.abs(mix).max()/0.93
w=wave.open('v9_audio.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((mix*32767).astype(np.int16).tobytes()); w.close()
print('ok',round(slam_t,2),round(dur,2))

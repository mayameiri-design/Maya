#!/bin/bash
# v1: hard cuts only. clips + 3 minimal stills (slow 4% push). 1080x1920 @30
set -e
cd /home/user/Maya/projects/bts
V="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p"
S="scale=1188:2112:force_original_aspect_ratio=increase,crop=1188:2112,zoompan=z='1+0.04*on/33':d=33:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,setsar=1,format=yuv420p"
A="aresample=48000,aformat=channel_layouts=stereo"
ffmpeg -v error -y \
 -i raw/IMG_0958.MOV -i stills/monitor_dop.jpg -i raw/IMG_0942.MOV -i stills/kitchen_team.jpg \
 -i raw/IMG_0946.MOV -i stills/chairs_light.jpg -i raw/IMG_0950.MOV \
 -filter_complex "
[0:v]trim=0:2.9,setpts=PTS-STARTPTS,$V[v0];[0:a]atrim=0:2.9,asetpts=PTS-STARTPTS,$A[a0];
[1:v]$S[v1];anullsrc=r=48000:cl=stereo,atrim=0:1.1[a1];
[2:v]trim=0:2.9,setpts=PTS-STARTPTS,$V[v2];[2:a]atrim=0:2.9,asetpts=PTS-STARTPTS,$A[a2];
[3:v]$S[v3];anullsrc=r=48000:cl=stereo,atrim=0:1.1[a3];
[4:v]trim=0.1:2.8,setpts=PTS-STARTPTS,$V[v4];[4:a]atrim=0.1:2.8,asetpts=PTS-STARTPTS,$A[a4];
[5:v]$S[v5];anullsrc=r=48000:cl=stereo,atrim=0:1.1[a5];
[6:v]trim=0.1:2.5,setpts=PTS-STARTPTS,$V[v6];[6:a]atrim=0.1:2.5,asetpts=PTS-STARTPTS,$A[a6];
[v0][a0][v1][a1][v2][a2][v3][a3][v4][a4][v5][a5][v6][a6]concat=n=7:v=1:a=1[v][a]" \
 -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k work/BTS_v1_cut.mp4

# Perfect Loop Toolkit

Click-free looping for video and audio, with three parts:

| Folder | For | What it does |
|---|---|---|
| `web/index.html` | Any browser (works offline) | Makes an equal-power-crossfaded audio loop and exports `loop.wav`; calculates overlap frames/timecode |
| `premiere-cs5-cs6/PerfectLoop.jsx` | Adobe Premiere Pro CS5 / CS5.5 / CS6 (pre-Creative Cloud) | Duplicates the selected clip, overlaps the copy, adds a Cross Dissolve (video) or Constant Power (audio) at the seam |
| HitFilm (this README) | HitFilm Express / Pro | Manual workflow, because HitFilm has no scripting API |

> Status: the web tool is straightforward browser code. The Premiere script is UNTESTED, written from the CS5/CS6 ExtendScript + QE DOM as I know it. Lines marked `VERIFY` are the likeliest to need edits.

## 1. The core idea
A "perfect loop" hides the seam where the end of a clip meets its start. Premiere and HitFilm have no native loop tool, so the standard fix is:
1. Put a second copy of the clip right after the first.
2. Overlap the two by N frames (default 15).
3. Crossfade across the overlap: Cross Dissolve for picture, an equal-power fade for sound.

Equal-power means the two fades follow cos/sin curves, so loudness stays constant through the seam. A plain linear crossfade dips about 3 dB in the middle.

## 2. Web tool (`web/index.html`)
1. Double-click the file to open it in Chrome, Firefox, Edge or Safari. No internet needed.
2. Load an audio file, or a video file (it decodes the audio track).
3. Set In/Out in seconds and the crossfade length.
4. Choose a mode:
   - **crossfade**: the loop is shorter than the region by the crossfade length, and the seam is sample-continuous. Best for pads, ambience and music beds.
   - **seamless**: keeps the exact region length and applies 5 ms micro-fades at the seam (inaudible). Best when the length must match a beat grid.
5. Press **Preview** to hear it loop, then **Download loop.wav** (16-bit PCM).
6. Import the WAV into your editor and repeat it on the timeline.
7. Use the **overlap calculator** for frame counts and timecode when you cut the video.

Limits: browser decoding depends on codecs (WAV, MP3, AAC and OGG are fine; exotic formats may fail). Video is not re-encoded. This tool only handles audio.

## 3. Premiere Pro CS5 / CS6 (`PerfectLoop.jsx`)
### Install and run
1. Open your project, save a backup copy, and open the sequence.
2. Select the clip(s) to loop on the timeline.
3. Choose **File > Scripts > Run Script File...** and pick `PerfectLoop.jsx`.
4. Edit the top of the file first if needed: `OVERLAP_FRAMES`, `VIDEO_TRANSITION`, `AUDIO_TRANSITION`.

### Requirements
- **Handle media:** the clip must have spare source frames beyond its out point (and before its in point). If it uses the file's full length, trim 15+ frames off each end first, or the transition cannot be applied.
- **Free space:** the copy is placed `OVERLAP_FRAMES` before the original ends, so the track needs room after the clip. The script uses `overwriteClip`, which will overwrite whatever is there.

### Troubleshooting
| Symptom | Likely cause / fix |
|---|---|
| `getSelection is not a function` | Your build predates it (CS5). Select nothing and change the script to use the first clip of a track, or upgrade to CS5.5+. |
| "Transition not found" | The name does not match your Effects panel (e.g. localized). Change `VIDEO_TRANSITION` / `AUDIO_TRANSITION`. CS5 may lack the audio one. |
| Copy lands in the wrong place | `cIdx + 1` assumes the copy is the next clip; with gaps or other clips, adjust. |
| Transition does nothing | No handle media; see Requirements. |
| Audio seam still clicks | Apply manually: select the audio seam, then **Sequence > Apply Audio Transition**, or use the web tool's WAV. |

### Manual fallback in Premiere
Copy and paste the clip, overlap the copies by 15 frames, drag Cross Dissolve onto the seam, then set its duration to match the overlap.

## 4. HitFilm (Express / Pro)
HitFilm cannot run scripts. Its plugin system is OpenFX, which processes pixels, not timelines, so automation is not possible. Use this manual workflow (menu names may differ slightly by version):
1. Place the clip on the timeline.
2. Select it, copy, and paste. Drag the copy to start N frames before the original ends. Use the web calculator for N.
3. Put the copy on the track above, or on the same track so HitFilm offers a transition at the overlap.
4. Add a **Cross Dissolve** (or fade the top clip's opacity over the same N frames).
5. For audio, make the loop in `web/index.html` and import the WAV. This is cleaner than fading in the editor.
6. Check the seam with playback looped over the overlap.

## 5. Tips
- 10-20 frames is a good overlap for most footage. Use longer overlaps for slow-moving shots, shorter for fast motion.
- Loop points land best when both clips show similar motion. Choose your out point where the subject's position matches the in point.
- Always check the seam in full-res playback, not just a proxy.

## 6. What was verified
- Adobe's current UXP docs (Premiere 25.6+) cover video transitions only and have no audio transition API. This is why no UXP version is included.
- The CS5/CS6 script is written from memory of that era's DOM and is not verified.

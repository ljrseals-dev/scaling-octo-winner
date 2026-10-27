// PerfectLoop.jsx - Premiere Pro CS5 / CS5.5 / CS6 (ExtendScript + QE DOM)
// Run: File > Scripts > Run Script File...
// UNTESTED best-effort script. Try it on a COPY of your project first.
// Lines marked VERIFY are the likeliest to need tweaks on your version.

var OVERLAP_FRAMES   = 15;               // <- overlap length in frames (edit me)
var VIDEO_TRANSITION = "Cross Dissolve"; // <- must match the name in the Effects panel
var AUDIO_TRANSITION = "Constant Power"; // <- VERIFY: may not exist in CS5

function pad(n){ return (n < 10 ? "0" : "") + n; }
function tc(frames, fps){                // frames -> 00:00:SS:FF
    var s = Math.floor(frames / fps), f = frames % fps;
    return "00:" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(f);
}

app.enableQE();                          // unlocks the undocumented QE DOM
var seq = app.project.activeSequence;
if (!seq) {
    alert("Open a sequence first.");
} else {
    var sel = seq.getSelection();        // VERIFY: CS5.5+ only
    if (!sel || sel.length === 0) {
        alert("Select a clip on the timeline first.");
    } else {
        var qeSeq = qe.project.getActiveSequence();
        var fps   = Math.round(254016000000 / Number(seq.timebase)); // ticks -> fps
        var dur   = tc(OVERLAP_FRAMES, fps);
        var done  = 0;

        for (var i = 0; i < sel.length; i++) {
            var clip    = sel[i];
            var isVideo = (clip.mediaType === "Video");
            var tracks  = isVideo ? seq.videoTracks : seq.audioTracks;

            // --- find the clip's track and index ---
            var tIdx = -1, cIdx = -1;
            for (var t = 0; t < tracks.numTracks && tIdx < 0; t++) {
                for (var c = 0; c < tracks[t].clips.numItems; c++) {
                    if (tracks[t].clips[c].nodeId === clip.nodeId) { tIdx = t; cIdx = c; break; }
                }
            }
            if (tIdx < 0) { $.writeln("Could not locate clip " + i); continue; }

            // --- DUPLICATE + OVERLAP: place a copy so it starts OVERLAP_FRAMES early ---
            var startSec = clip.end.seconds - (OVERLAP_FRAMES / fps);
            tracks[tIdx].overwriteClip(clip.projectItem, startSec);
            var copy = tracks[tIdx].clips[cIdx + 1];       // VERIFY: index of the new clip
            copy.inPoint  = clip.inPoint;                  // VERIFY: settable in your version
            copy.outPoint = clip.outPoint;

            // --- TRANSITION on the seam (needs spare handle media) ---
            var qeTrack = isVideo ? qeSeq.getVideoTrackAt(tIdx) : qeSeq.getAudioTrackAt(tIdx);
            var qeClip  = qeTrack.getItemAt(cIdx + 1);     // VERIFY: skips empty gaps
            var trans   = isVideo ? qe.project.getVideoTransitionByName(VIDEO_TRANSITION)
                                  : qe.project.getAudioTransitionByName(AUDIO_TRANSITION);
            if (trans) { qeClip.addTransition(trans, true, dur); done++; }
            else { $.writeln("Transition not found: " + (isVideo ? VIDEO_TRANSITION : AUDIO_TRANSITION)); }
        }
        alert("Perfect Loop: processed " + done + " clip(s). Check the seam!");
    }
}

# Audio

Most of the game's sound is generated in the browser (see
`js/systems/AudioManager.js`) — the sea, bird calls, a soft ukulele phrase,
the chest, the stamp, the little win chimes. Those need no files and work
offline.

**This folder is only for music**, which can't sensibly be synthesised.

## Optional: add a music track

Drop a looping track here as `island-theme.mp3` (gentle ukulele suits the
island). Then in `js/main.js`, after the audio is unlocked:

```js
audio.playMusic('assets/audio/island-theme.mp3');
```

If the file isn't there nothing breaks — the call fails quietly and the sea
carries the soundtrack on its own.

Keep it quiet and loopable. The brief asks for background sound that is
"almost unnoticeable", so the volume is already set low in `AudioManager`.

Use music you have the right to use — freesound.org, Pixabay Music, or the
YouTube Audio Library all have tracks that are free to reuse.

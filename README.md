0. **export PATH="$(pwd)/browser-drivers:$PATH"**
1. **youtube-dl** - to download video from youtube
**Example:**
```youtube-dl -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' https://www.youtube.com/watch?v=t-YfNpUJpqA```
2. Create folder with name like video id. It's **v** query parameter from link **v=t-YfNpUJpqA** and put video
with name "**video**" to the folder.
3. **convert-4-to-3.js** - convert video to audio
4. **get-words-for-video.js** - get subtitles for video
5. **devide-video-on-frames.js** - devide video on frames with ~25fps
6. **split-audio.js** - split audio by time words intervals from youtube and split time duration with aeneas
7. **get-face-intervals.py** - get number of frames with face and cut it
8. **form-frames-pack.js** - form result frame pack

### Helpers
1. **generate-html-checker.js** - generate html page with scripts inside to check correctness of forming frame pack

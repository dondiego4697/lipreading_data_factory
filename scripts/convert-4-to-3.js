const {readDir, getAbsolutePath} = require('../utils/fs');
const {spawn} = require('../utils/spawn');
const {debug} = require('../utils/debugger');

const convert = async () => {
    const videoDirs = readDir(getAbsolutePath('./videos'));

    for (let i = 0; i < videoDirs.length; i++) {
        debug(`${i + 1} / ${videoDirs.length}`, 'green');
        const videoName = videoDirs[i];
        const path = getAbsolutePath(`./videos/${videoName}`);
        const cmd = `ffmpeg -i ${path}/video.mp4 -y -af volume=2 -loglevel quiet ${path}/audio.mp3`.split(' ');
        await spawn(cmd[0], cmd.slice(1));
    }
};

(async () => {
    await convert();
})();

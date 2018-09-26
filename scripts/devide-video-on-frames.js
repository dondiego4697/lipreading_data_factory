const {readDir, getAbsolutePath, mkDir, rmDir} = require('../utils/fs');
const {spawn} = require('../utils/spawn');
const {debug} = require('../utils/debugger');

const FRAME_DIR = 'frames';

const convert = async () => {
    const videoDirs = readDir(getAbsolutePath('./videos'));

    for (let i = 0; i < videoDirs.length; i++) {
        debug(`${i + 1} / ${videoDirs.length}`, 'green');
        const videoName = videoDirs[i];
        const path = getAbsolutePath(`./videos/${videoName}`);

        if (readDir(path).indexOf(FRAME_DIR) !== -1) {
            rmDir(`${path}/frames`);
        }
        mkDir(`${path}/frames`);

        //ffmpeg -i res/videos/__ip9j2dZfM/__ip9j2dZfM.mp4 res/videos/__ip9j2dZfM/frames/thumb%04d.jpg -hide_banner
        const cmd = `ffmpeg -i ${path}/video.mp4 -r 25 ${path}/frames/thumb%04d.jpg -hide_banner`.split(' ');
        await spawn(cmd[0], cmd.slice(1));
    }

};

(async () => {
    await convert();
})();

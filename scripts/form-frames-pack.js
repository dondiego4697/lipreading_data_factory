const {readDir, getAbsolutePath, readFile, writeToFile, mkDir} = require('../utils/fs');
const {spawn} = require('../utils/spawn');
const {debug} = require('../utils/debugger');
const {addSecondToTime, getSeconds} = require('../utils/time');

const FRAME_PACK = 'frame-pack';

const fillFramePackFolder = async (videoName, framesData) => {
    const videoFolderPath = getAbsolutePath(`./videos/${videoName}`);
    const framePackPath = `${videoFolderPath}/${FRAME_PACK}`;
    writeToFile(`${framePackPath}/data.json`, JSON.stringify(framesData));

    const framesPath = `${framePackPath}/frames`;
    mkDir(framesPath);

    for (let i = 0; i < framesData.length; i++) {
        const frameData = framesData[i];
        for (let j = 0; j < frameData.interval.length; j++) {
            const source = `${videoFolderPath}/mouth_frames/${frameData.interval[j]}.jpg`;
            const dist = `${framesPath}/${frameData.interval[j]}.jpg`;
            const cmd = `cp ${source} ${dist}`.split(' ');
            await spawn(cmd[0], cmd.slice(1));
        }
    }
};

const getMouthFramesNumbers = (path) => {
    const frames = readDir(path)
        .filter((f) => f.indexOf('.jpg') !== -1)
        .map((f) => Number(/(\d+).jpg/ig.exec(f)[1]))
        .sort((a, b) => a - b);

    return frames;
};

const checkFrameExistence = (frames, number) => {
    return frames.indexOf(number) !== -1;
};

const FRAMES_PER_S = 25;
const formFramesPack = async () => {
    const videoDirs = readDir(getAbsolutePath('./videos'));

    for (let i = 0; i < videoDirs.length; i++) {
        debug(`${i + 1} / ${videoDirs.length}`, 'green');
        const name = videoDirs[i];
        const path = getAbsolutePath(`./videos/${name}`);

        const framePackPath = `${path}/${FRAME_PACK}`;
        if (readDir(path).indexOf(FRAME_PACK) !== -1) {
            const cmd = `rm -rf ${framePackPath}`.split(' ');
            await spawn(cmd[0], cmd.slice(1));
        }
        mkDir(framePackPath);

        const wordsData = JSON.parse(readFile(`${path}/words.json`));
        const mouthFramesNumbers = getMouthFramesNumbers(`${path}/mouth_frames`);
        let framesData = [];

        for (let i = 1; i < wordsData.length - 2; i++) {
            const startTime = getSeconds(addSecondToTime(wordsData[i].time));
            const endTime = getSeconds(addSecondToTime(wordsData[i + 1].time));
            const duration = endTime - startTime + 1;

            const words = wordsData[i].text.split(' ');
            const lettersCount = words.join('').length;
            const wordsDurations = words.map((w) => {
                const part = w.length / lettersCount;
                return part * duration;
            });

            let currTime = startTime;
            const frameData = wordsDurations.map((d, i) => {
                // TODO нужен aeneas
                const intervalBorders = [Math.floor(currTime * FRAMES_PER_S), Math.ceil((currTime + d) * FRAMES_PER_S)];
                let interval = [];
                for (let j = intervalBorders[0]; j <= intervalBorders[1]; j++) {
                    interval.push(j);
                }
                currTime += d;
                return {
                    interval,
                    word: words[i]
                };
            }).filter((data) => {
                return data.interval.some((i) => {
                    return checkFrameExistence(mouthFramesNumbers, i);
                });
            });

            framesData = framesData.concat(frameData);
        }

        await fillFramePackFolder(name, framesData);
    }
};

(async () => {
    await formFramesPack();
})();

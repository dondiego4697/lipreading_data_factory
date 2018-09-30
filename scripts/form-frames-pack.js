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
        const interval = frameData.framesInterval;
        for (let j = 0; j < interval.length; j++) {
            const source = `${videoFolderPath}/mouth_frames/${interval[j]}.jpg`;
            const dist = `${framesPath}/${interval[j]}.jpg`;
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

        // исключаем первое и последнее предложение!
        for (let i = 1; i < wordsData.length - 1; i++) {
            const startTime = getSeconds(wordsData[i].time);

            const wordsTime = JSON.parse(readFile(`${path}/audio-split/${i}.json`));
            const wordsInfo = wordsTime.fragments;
            let skipWordPart = false;

            const frameData = wordsInfo.map((word, k) => {
                const wordDuration = Number(word.end) - Number(word.begin);
                if (wordDuration === 0) {
                    skipWordPart = true;
                }

                const begin = startTime + Number(word.begin); // in seconds
                const end = begin + wordDuration; // in seconds

                const intervalBorders = [Math.floor(begin * FRAMES_PER_S), Math.ceil(end * FRAMES_PER_S)];
                const interval = [];
                for (let j = intervalBorders[0]; j <= intervalBorders[1]; j++) {
                    interval.push(j);
                }

                return {
                    framesInterval: interval,
                    word: word.lines[0],
                    dev: {
                        id: `${i}_${k}`,
                        framesPath: `${framePackPath}/frames`,
                        audioPath: `${path}/audio-split/${i}.mp3`,
                        audioIntervalInSeconds: [Number(word.begin), Number(word.end)]
                    }
                };
            }).filter((data) => {
                return data.framesInterval.every((i) => {
                    return checkFrameExistence(mouthFramesNumbers, i);
                });
            });

            if (!skipWordPart) {
                framesData = framesData.concat(frameData);
            }
        }

        await fillFramePackFolder(name, framesData);
    }
};

(async () => {
    await formFramesPack();
})();

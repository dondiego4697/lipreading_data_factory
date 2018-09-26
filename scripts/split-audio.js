const {readDir, getAbsolutePath, readFile, mkDir, writeToFile} = require('../utils/fs');
const {spawn} = require('../utils/spawn');
const {debug} = require('../utils/debugger');

const AUDIO_SPLIT = 'audio-split';
const split = async () => {
    const videoDirs = readDir(getAbsolutePath('./videos'));

    for (let i = 0; i < videoDirs.length; i++) {
        debug(`${i + 1} / ${videoDirs.length}`, 'green');
        const name = videoDirs[i];
        const path = getAbsolutePath(`./videos/${name}`);
        const audioSplitPath = `${path}/${AUDIO_SPLIT}`;
        if (readDir(path).indexOf(AUDIO_SPLIT) !== -1) {
            const cmd = `rm -rf ${audioSplitPath}`.split(' ');
            await spawn(cmd[0], cmd.slice(1));
        }
        mkDir(audioSplitPath);

        const wordsData = JSON.parse(readFile(`${path}/words.json`));

        // Разделяем аудио
        for (let i = 0; i < wordsData.length - 1; i++) {
            const wordData = wordsData[i];
            const startTime = i === 0 ? '00:00:00' : `00:${wordData.time}`;
            const endTime = `00:${wordsData[i + 1].time}`;

            const ffmpeg = `ffmpeg -i ${path}/audio.mp3 -acodec copy -ss ${startTime} -to ${endTime} ${audioSplitPath}/${i}.mp3`.split(' ');
            await spawn(ffmpeg[0], ffmpeg.slice(1));

            // записываем соответственно текст
            writeToFile(`${audioSplitPath}/${i}.txt`, wordData.text.split(' ').join('\n'));
        }

        // пропускаем через aeneas
        const aeneas = `sh ${getAbsolutePath('./scripts/aeneas.sh')}`.split(' ');
        await spawn(aeneas[0], aeneas.slice(1));

        // декодируем utf-8
        for (let i = 0; i < wordsData.length - 1; i++) {
            const wordsDurations = JSON.parse(readFile(`${audioSplitPath}/${i}.json`));
            wordsDurations.fragments = wordsDurations.fragments.map((f) => {
                f.lines = f.lines.map((l) => l);
                return f;
            });
            writeToFile(`${audioSplitPath}/${i}.json`, JSON.stringify(wordsDurations));
        }
    }
};

(async () => {
    await split();
})();

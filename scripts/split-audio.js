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
            const offset = '.400';
            const startTime = i === 0 ? '00:00:00' : `00:${wordData.time}${offset}`;
            const endTime = `00:${wordsData[i + 1].time}${offset}`;

            const audioSplitFile = `${audioSplitPath}/${i}`;
            const mp3Devide = `ffmpeg -i ${path}/audio.mp3 -acodec copy -ss ${startTime} -to ${endTime} ${audioSplitFile}.mp3`.split(' ');
            await spawn(mp3Devide[0], mp3Devide.slice(1));
            const mp3ToWav = `ffmpeg -i ${audioSplitFile}.mp3 -ar 16000 ${audioSplitFile}.wav`.split(' ');
            await spawn(mp3ToWav[0], mp3ToWav.slice(1));

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

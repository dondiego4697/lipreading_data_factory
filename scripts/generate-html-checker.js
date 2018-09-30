const {readDir, getAbsolutePath, readFile, mkDir, writeToFile} = require('../utils/fs');
const {spawn} = require('../utils/spawn');
const {debug} = require('../utils/debugger');
const {getSeconds, secondsToString} = require('../utils/time');

const makeHTML = (data) => {
    return `
        <html>
            <head>
                <title>CHECKER</title>
            </head>
            <body>
                <script>
                    var framePackData = ${JSON.stringify(data)};
                    var rand = Math.floor(Math.random() * (framePackData.length - 1));
                    var data = framePackData[rand];

                    var word = document.createElement('h1');
                    word.innerHTML = data.word;
                    document.body.appendChild(word);

                    var interval = data.framesInterval;
                    var promises = interval.map((i) => {
                        return new Promise((resolve) => {
                            var img = new Image();
                            img.onload = () => {resolve(img)};
                            img.src = data.dev.framesPath + '/' + i + '.jpg';
                        });
                    });

                    Promise.all(promises).then((imgs) => {
                        imgs.forEach((img) => {
                            var canvas = document.createElement('canvas');
                            canvas.width = 120;
                            canvas.height = 120;
                            document.body.appendChild(canvas);
                            canvas.getContext('2d').drawImage(img, 0, 0);
                        });
                    });

                    var audio = document.createElement('audio');
                    audio.src = data.dev.checkerPath + '/' + data.dev.id + '.mp3';
                    audio.controls = true;
                    document.body.appendChild(audio);
                </script>
            </body>
        </html>
    `;
};

const CHECKER_NAME = 'checker';
const generate = async () => {
    const videoDirs = readDir(getAbsolutePath('./videos'));

    for (let i = 0; i < videoDirs.length; i++) {
        debug(`${i + 1} / ${videoDirs.length}`, 'green');
        const name = videoDirs[i];
        const path = getAbsolutePath(`./videos/${name}`);
        const checkerPath = `${path}/${CHECKER_NAME}`;

        if (readDir(path).indexOf(CHECKER_NAME) !== -1) {
            const cmd = `rm -rf ${checkerPath}`.split(' ');
            await spawn(cmd[0], cmd.slice(1));
        }
        mkDir(checkerPath);

        const framePackData = JSON.parse(readFile(`${path}/frame-pack/data.json`));

        // Убираем первое и последнее предложение, также как и при формирование пакета form-frame-pack.js
        for (let j = 0; j < framePackData.length; j++) {
            const data = framePackData[j];
            const {audioPath, id, audioIntervalInSeconds: aiis} = data.dev;
            const ffmpeg = `ffmpeg -i ${audioPath} -acodec copy -ss ${aiis[0]} -to ${aiis[1]} ${checkerPath}/${id}.mp3`.split(' ');
            await spawn(ffmpeg[0], ffmpeg.slice(1));

            data.dev.checkerPath = `${path}/checker`;
        }

        const html = makeHTML(framePackData);
        writeToFile(`${checkerPath}/_index.html`, html);
    }
};

(async () => {
    await generate();
})();

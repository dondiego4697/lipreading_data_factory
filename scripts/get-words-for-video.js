const {readDir, getAbsolutePath, writeToFile} = require('../utils/fs');
const {debug} = require('../utils/debugger');
const Browser = require('../utils/browser/Browser');
const getSubtitles = require('../utils/browser/get-subtitles');

const browser = new Browser();

const get = async () => {
    const videoDirs = readDir(getAbsolutePath('./videos'));

    for (let i = 0; i < videoDirs.length; i++) {
        debug(`${i + 1} / ${videoDirs.length}`, 'green');
        const videoName = videoDirs[i];
        const path = getAbsolutePath(`./videos/${videoName}`);

        try {
            await browser.createBuilder();
            const url = `https://www.youtube.com/watch?v=${videoName}`;
            await browser.openPage(url);
            await browser.waitUntil({
                id: 'menu'
            });
            await browser.wait(5000);

            const subtitles = await getSubtitles(browser);
            await writeToFile(`${path}/words.json`, JSON.stringify(subtitles));

        } catch(e) {
            debug(`${e.message}; url=${videoName}`, 'red');
        } finally {
            await browser.removeBuilder();
        }
    }
};

(async () => {
    await get();
})();

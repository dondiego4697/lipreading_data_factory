/* Поиск элемента с субтитрами */
const getSubtitlesFromBrowser = async (browser) => {
    await browser.executeScript(() => {
        const btn = Array.prototype.slice.call(document.getElementsByTagName('button'))
            .filter((el) => el.getAttribute('aria-label') === 'Ещё')[0];
        btn.click();
    });

    await browser.waitUntil({
        tagName: 'paper-listbox'
    });

    await browser.executeScript(() => {
        document.getElementsByTagName('paper-listbox')[0].children[1].click();
    });

    await browser.waitUntil({
        tagName: 'ytd-transcript-body-renderer'
    });

    return await browser.executeScript(() => {
        const rows = Array.prototype.slice.call(document.getElementsByTagName('ytd-transcript-body-renderer')[0].children);
        return rows.filter((row) => {
            return row.children.length > 1;
        }).map((row) => {
            const rowChildren = row.children;
            const time = rowChildren[0].innerText;
            const text = rowChildren[1].children[0].innerText;
            return {
                time,
                text
            }
        });
    });
};

module.exports = getSubtitlesFromBrowser;

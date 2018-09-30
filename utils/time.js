module.exports = {
    addSecondToTime(time) {
        const date = new Date();
        const split = time.split(':');
        date.setSeconds(split[1]);
        date.setMinutes(split[0]);
        date.setSeconds(date.getSeconds() + 1);
        const d = /:(\d+):(\d+)/i.exec(date.toString());
        return `${d[1]}:${d[2]}`;
    },

    getSeconds(time) {
        const date = new Date();
        const split = time.split(':');
        date.setSeconds(split[1]);
        date.setMinutes(split[0]);

        return date.getSeconds() + date.getMinutes() * 60;
    },

    secondsToString(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;

        return `00:${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
    }
};

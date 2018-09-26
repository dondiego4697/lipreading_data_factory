module.exports = {
    debug(text, color) {
        if (color === 'yellow') {
            console.log('\x1b[33m%s\x1b[0m', text);
        } else if (color === 'red') {
            console.log('\x1b[31m%s\x1b[0m', text);
        } else if (color === 'green') {
            console.log('\x1b[32m%s\x1b[0m', text);
        } else {
            console.log(text);
        }
    }
};

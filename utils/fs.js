const fs = require('fs');
const path = require('path');

const IGNORE_FILES = ['.DS_Store', '._.DS_Store'];

module.exports = {
    getAbsolutePath(p) {
        return path.resolve(process.cwd(), p);
    },

    readDir(p) {
        return fs.readdirSync(p).filter((name) => {
            return !IGNORE_FILES.some((i) => name === i);
        });
    },

    writeToFile(p, data) {
        return fs.writeFileSync(p, data);
    },

    mkDir(p) {
        fs.mkdirSync(p);
    },

    rmDir(p) {
        fs.rmdirSync(p);
    }
};

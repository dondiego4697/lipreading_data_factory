const {spawn: createChildeProcess} = require('child_process');
const {debug} = require('./debugger');

module.exports = {
    async spawn(cmd, parameters) {
        const getData = async (child) => {
            return new Promise((resolve, reject) => {
                child.stderr.on('data', (data) => {
                    debug(data.toString(), 'green');
                });

                child.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(`Child process exited with code ${code}`);
                    }
                });
            });
        };

        const child = createChildeProcess(cmd, parameters);
        try {
            await getData(child);
        } catch (e) {
            debug(`Error: ${e}`, 'red');
        }
    }
};

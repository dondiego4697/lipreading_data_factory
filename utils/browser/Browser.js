const {Builder, By, Key, until} = require('selenium-webdriver');

class Browser {
    constructor() {
        this.DEFAULT_TIMEOUT = 10000;
    }

    static checkArgs(args) {
        const checkArgs = ['urls'];
        Object.keys(args).forEach(key => {
            const index = checkArgs.indexOf(key);
            if (index === -1 || typeof args[key] === 'undefined') throw new Error('wrong args');
        });
        return args;
    }

    async wait(ms) {
        await this._driver.sleep(ms);
    }

    async createBuilder() {
        this._driver = await new Builder().forBrowser('firefox').build();
    }

    async removeBuilder() {
        try {
            await this._driver.quit();
        } catch (err) {}
    }

    async openPage(url) {
        await this._driver.get(url);
    }

    async findElements(params) {
        return await this._driver.findElements(params);
    }

    static async getElementAttribute(webElement, attributeName) {
        return await webElement.getAttribute(attributeName);
    }

    async waitUntil(condition, timeout) {
        return await this._driver.wait(until.elementLocated(condition), timeout || this.DEFAULT_TIMEOUT);
    }

    async executeScript(script) {
        return await this._driver.executeScript(script);
    }
}

module.exports = Browser;

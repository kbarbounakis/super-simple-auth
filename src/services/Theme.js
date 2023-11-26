import postcss from 'postcss';
import config from '../../postcss.config';
import { readFile, writeFile } from 'fs/promises';
import debug from 'debug';
import path from 'path';
const error = debug('app:postcss:error');
const log = debug('app:postcss:log');

class Theme {
    constructor() {
        this.build({
            from: path.resolve(__dirname, '../../assets/styles/tailwind.css'),
            to: path.resolve(__dirname, '../../assets/styles/style.css'),
            map: {
              inline: false
            }
        });
    }

    /**
     * @param {import('postcss').ProcessOptions} processOptions - Options for PostCSS processing.
     * @returns {Function} - Express middleware function.
     */
    build(processOptions) {
        void readFile(processOptions.from).then((css) => {
            return postcss(config.plugins).process( css, processOptions).then(result => {
                return writeFile(processOptions.to, result.css).then(() => {
                    log(`${processOptions.from} -> ${processOptions.to}`);
                    if ( result.map ) {
                        return writeFile(`${processOptions.to}.map`, result.map.toString()).then(() => {
                            log(`${processOptions.from} -> ${processOptions.to}.map`);
                        });
                    }
                });
            });
        }).catch((err) => {
            error(`${processOptions.from} -> ${processOptions.to}`);
            error(err);
        });
    }
}

export {
    Theme
}
const path = require('path');
const fs = require('fs');
const streamifier = require('streamifier');
const am = require('appcache-manifest');

module.exports = (bundler) => {

    bundler.on('bundled', (bundle) => {

        const bundleName = bundle.name;
        const bundleFilename = path.basename(bundleName);
        const bundleExt = path.extname(bundleName);
        const bundleBasename = path.basename(bundleName, bundleExt);
        const manifestName = `${bundleBasename}.appcache`;

        streamifier.createReadStream(fs.readFileSync(bundleName))
            .pipe(am.createFixer({manifest: manifestName}))
            .pipe(fs.createWriteStream(bundleName))
            .on('finish', () => {

                const bundleDir = path.dirname(bundleName);
                const inputGlob = path.join(bundleDir, `/**/!(${bundleFilename}|${manifestName})`);
                const outputFile = path.join(bundleDir, manifestName);

                am.generate(inputGlob, {networkStar: true, stamp: true})
                    .pipe(fs.createWriteStream(outputFile));

            });
    });
};

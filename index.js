const path = require('path');
const fs = require('fs');
const streamifier = require('streamifier');
const am = require('appcache-manifest');

module.exports = (bundler) => {

    const logger = bundler.logger;

    bundler.on('bundled', (bundle) => {

        const bundleName = bundle.name;
        const bundleExt = path.extname(bundleName);
        const bundleBasename = path.basename(bundleName, bundleExt);
        const manifestName = `${bundleBasename}.appcache`;

        logger.status('🔧', 'Fix the HTML');

        streamifier.createReadStream(bundle.entryAsset.generated.html)
            .pipe(am.createFixer({manifest: manifestName}))
            .pipe(fs.createWriteStream(bundleName))
            .on('finish', () => {

                const bundleDir = path.dirname(bundleName);
                const inputGlob = path.join(bundleDir, `/**/!(${manifestName})`);
                const outputFile = path.join(bundleDir, manifestName);

                logger.status('📃', 'Generate the manifest');

                am.generate(inputGlob, {networkStar: true, stamp: true})
                    .pipe(fs.createWriteStream(outputFile));

            });
    });
};

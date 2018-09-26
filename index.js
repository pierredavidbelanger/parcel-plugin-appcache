const path = require('path');
const fs = require('fs');
const streamifier = require('streamifier');
const am = require('appcache-manifest');

function reduceBundles(bundles) {
    const result = [];
    bundles.forEach(function(bundle){
        result.push(bundle.name);
        result.concat(reduceBundles(bundle.childBundles));
    });
    return result;
}

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
                const inputGlob = reduceBundles(bundle.childBundles);
                const outputFile = path.join(bundleDir, manifestName);

                am.generate(inputGlob, {networkStar: true, stamp: true})
                    .pipe(fs.createWriteStream(outputFile));

            });
    });
};

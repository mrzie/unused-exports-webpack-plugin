const path = require('path');
const UnusedExportsPlugin = require('../lib/index.js').default;

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true
    },
    plugins: [
        new UnusedExportsPlugin({
            onFinish: (result) => {
                console.log('\n🔍 Unused Exports Detection Results:');
                console.log('='.repeat(50));
                
                if (result.length === 0) {
                    console.log('✅ No unused exports found!');
                    return;
                }
                
                result.forEach(({ resource, providedNames, unusedNames }) => {
                    const relativePath = path.relative(process.cwd(), resource);
                    console.log(`\n📁 ${relativePath}`);
                    console.log(`   Total exports: ${providedNames.length}`);
                    console.log(`   Unused exports: ${unusedNames.length}`);
                    
                    if (unusedNames.length > 0) {
                        console.log('   ❌ Unused exports:');
                        unusedNames.forEach(name => {
                            console.log(`      - ${name}`);
                        });
                    }
                });
                
                console.log('\n' + '='.repeat(50));
                console.log(`📊 Total: ${result.length} files contain unused exports`);
            }
        })
    ],
    optimization: {
        usedExports: true,
        sideEffects: false
    }
};
import type {Compiler, NormalModule, WebpackPluginInstance} from "webpack";
import {minimatch} from "minimatch";

interface UnusedExportInfo {
    resource: string;
    providedNames: string[];
    unusedNames: string[];
}

interface UnusedExportsPluginOptions {
    onFinish?: (result: UnusedExportInfo[]) => void;
    ignorePaths?: (string | RegExp)[];
    includePaths?: (string | RegExp)[];
    basePath?: string;
}

class UnusedExportsPlugin implements WebpackPluginInstance {
    onFinish: (result: UnusedExportInfo[]) => void;
    ignorePaths: (string | RegExp)[];
    includePaths: (string | RegExp)[] ;
    basePath: string;
    constructor(options: UnusedExportsPluginOptions = {}) {
        this.onFinish = options.onFinish ?? (() => {});
        this.ignorePaths = options.ignorePaths ?? ['node_modules'];
        this.includePaths = options.includePaths ?? [] ;
        this.basePath = options.basePath ?? process.cwd();
    }

    apply(compiler: Compiler) {
        // Dynamically get webpack/rspack API for compatibility with both environments
        // Priority: compiler.rspack > compiler.webpack > require('webpack')
        const compilerAny = compiler as any;
        const webpack = compilerAny.rspack || compiler.webpack || require('webpack');
        const UsageState = webpack.UsageState;

        const unusedExports = new Map();
        compiler.hooks.environment.tap('UnusedExportsPlugin', () => {
            if (!compiler.options.optimization) {
                compiler.options.optimization = {};
            }

            if (compiler.options.optimization.usedExports !== true) {
                compiler.options.optimization.usedExports = true;
                console.warn('⚠️ usedExports has been automatically enabled as it is required for UnusedExportsPlugin');
            }

        });
        compiler.hooks.compilation.tap('UnusedExportsPlugin', compilation => {
            compilation.hooks.afterSeal.tap('UnusedExportsPlugin', () => {
                const moduleGraph = compilation.moduleGraph;
                for (const module of compilation.modules) {
                    if (module.constructor.name !== 'NormalModule') {
                        continue;
                    }
                    const normalModule = module as NormalModule;
                    if (!normalModule.resource) {
                        continue;
                    }
                    if (!normalModule.resource.startsWith(this.basePath)) {
                        continue;
                    }

                    if (
                        this.ignorePaths.some(path =>
                            (path instanceof RegExp ? path.test(normalModule.resource) : minimatch(normalModule.resource, path)),
                        )
                    ) {
                        continue;
                    }
                    if (
                        this.includePaths.length && !this.includePaths.some(path =>
                            (path instanceof RegExp ? path.test(normalModule.resource) : minimatch(normalModule.resource, path)),
                        )
                    ) {
                        continue;
                    }

                    const exportsInfo = moduleGraph.getExportsInfo(module);
                    const providedNames = exportsInfo.getProvidedExports();
                    if (!Array.isArray(providedNames)) {
                        unusedExports.delete(normalModule.resource);
                        continue;
                    }

                    const unusedNames = providedNames.filter(name => exportsInfo.getUsed(name, undefined) === UsageState.Unused);
                    if (unusedNames.length) {
                        unusedExports.set(normalModule.resource, {providedNames, unusedNames});
                    }
                    else {
                        unusedExports.delete(normalModule.resource);
                    }
                }
            });
        });

        compiler.hooks.afterEmit.tap('UnusedExportsPlugin', () => {
            const result = [...unusedExports.entries()].map(([resource, {providedNames, unusedNames}]) => ({resource, providedNames, unusedNames}));
            this.onFinish(result);
        });
    }
}

export default UnusedExportsPlugin;
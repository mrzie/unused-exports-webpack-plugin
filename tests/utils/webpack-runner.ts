import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import path from 'path';
import UnusedExportsPlugin from '../../src/index';

export interface UnusedExportInfo {
  resource: string;
  providedNames: string[];
  unusedNames: string[];
}

interface WebpackConfig {
  entry: string;
  plugins?: webpack.WebpackPluginInstance[];
  optimization?: webpack.Configuration['optimization'];
  mode?: webpack.Configuration['mode'];
  basePath?: string;
}

interface TestFiles {
  [filePath: string]: string;
}

export async function runWebpack(
  config: WebpackConfig,
  files: TestFiles
): Promise<UnusedExportInfo[]> {
  const basePath = config.basePath || path.resolve(__dirname, '../../');
  const fs = createFsFromVolume(new Volume());

  // Write test files to memory filesystem
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(basePath, filePath);
    const dir = path.dirname(absolutePath);
    
    // Create directory if it doesn't exist
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Directory might already exist, ignore
    }
    
    fs.writeFileSync(absolutePath, content, { encoding: 'utf-8' });
  }

  // Capture onFinish callback result
  let result: UnusedExportInfo[] = [];
  const plugin = new UnusedExportsPlugin({
    ...(config.basePath && { basePath }),
    onFinish: (data) => {
      result = data;
    },
  });

  // Create webpack compiler
  const compiler = webpack({
    entry: path.isAbsolute(config.entry)
      ? config.entry
      : path.join(basePath, config.entry),
    output: {
      path: path.join(basePath, 'dist'),
      filename: 'bundle.js',
    },
    mode: config.mode || 'development',
    plugins: [...(config.plugins || []), plugin],
    optimization: {
      usedExports: true,
      ...config.optimization,
    },
    infrastructureLogging: {
      level: 'error',
    },
    context: basePath,
  });

  if (!compiler) {
    throw new Error('Failed to create webpack compiler');
  }

  // Set filesystem for webpack to use memory filesystem
  compiler.inputFileSystem = fs as any;
  compiler.outputFileSystem = fs as any;
  compiler.intermediateFileSystem = fs as any;

  // Run webpack compilation
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (stats?.hasErrors()) {
        reject(new Error(stats.compilation.errors.map(e => e.message).join('\n')));
        return;
      }

      resolve(result);
    });
  });
}


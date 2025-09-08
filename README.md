# unused-exports-webpack-plugin

A webpack plugin that detects unused exports in your bundle using webpack's module graph.

## Installation

```bash
npm install unused-exports-webpack-plugin
```

## Usage

```javascript
const UnusedExportsPlugin = require('unused-exports-webpack-plugin');

module.exports = {
  // ... your webpack config
  plugins: [
    new UnusedExportsPlugin({
      onFinish: (result) => {
        console.log('Unused exports:', result);
      }
    })
  ],
  optimization: {
    usedExports: true
  }
};
```

## Options

- `onFinish`: Callback function that receives unused exports information. Result is an array of `{resource, providedNames, unusedNames}`
- `ignorePaths`: Array of paths to ignore. Supports glob patterns or RegExp (default: `['node_modules']`)
- `includePaths`: Array of paths to include. Supports glob patterns or RegExp (default: `[]` - includes all)
- `basePath`: Base path for analysis (default: `process.cwd()`)

## License

MIT
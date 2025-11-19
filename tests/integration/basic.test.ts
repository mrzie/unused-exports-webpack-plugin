import { readFileSync } from 'fs';
import { join } from 'path';
import { runWebpack } from '../utils/webpack-runner';

const fixturesDir = join(__dirname, 'fixtures/basic');

function readFixture(filename: string): string {
  return readFileSync(join(fixturesDir, filename), 'utf-8');
}

describe('Basic functionality', () => {
  it('should detect unused exports', async () => {
    const files = {
      'index.js': readFixture('index.js'),
      'utils.js': readFixture('utils.js'),
      'helpers.js': readFixture('helpers.js'),
    };

    const result = await runWebpack(
      {
        entry: './index.js',
      },
      files
    );

    expect(result).toHaveLength(2);

    const utilsResult = result.find((r) => r.resource.includes('utils.js'));
    expect(utilsResult).toBeDefined();
    expect(utilsResult?.providedNames.sort()).toEqual(['PI', 'add', 'divide', 'multiply'].sort());
    expect(utilsResult?.unusedNames.sort()).toEqual(['PI', 'divide'].sort());

    const helpersResult = result.find((r) => r.resource.includes('helpers.js'));
    expect(helpersResult).toBeDefined();
    expect(helpersResult?.providedNames.sort()).toEqual([
      'DEFAULT_LANGUAGE',
      'formatEmail',
      'formatName',
    ].sort());
    expect(helpersResult?.unusedNames.sort()).toEqual(['DEFAULT_LANGUAGE', 'formatEmail'].sort());
  });

  it('should return empty array when all exports are used', async () => {
    const files = {
      'index.js': `
        import { a, b } from './utils.js';
        console.log(a, b);
      `,
      'utils.js': `
        export const a = 1;
        export const b = 2;
      `,
    };

    const result = await runWebpack(
      {
        entry: './index.js',
      },
      files
    );

    expect(result).toHaveLength(0);
  });

  it('should include all provided names in result', async () => {
    const files = {
      'index.js': `
        import { a } from './utils.js';
        console.log(a);
      `,
      'utils.js': `
        export const a = 1;
        export const b = 2;
        export const c = 3;
      `,
    };

    const result = await runWebpack(
      {
        entry: './index.js',
      },
      files
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.providedNames.sort()).toEqual(['a', 'b', 'c'].sort());
    expect(result[0]?.unusedNames.sort()).toEqual(['b', 'c'].sort());
  });
});


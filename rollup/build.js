const rollup = require('rollup');
const path = require('path');

console.log(path.dirname('./patha/pathb/index.js'));

async function build() {
  const bundle = await rollup.rollup({
    input: path.resolve(process.cwd(), 'src', 'index.js'),
    plugins: [
      {
        name: 'rollup:test-plugin',
        resolveId(importee, importer, resolveOptions) {
          if (importee === './moduleC') {
            return 'virtual:module';
          }
        },
        load(id) {
          if (id.startsWith('virtual:')) {
            return `export default function fn(){console.log('virtual')};fn()`;
          }
        },
        renderChunk(code, chunk) {
          // console.log(code, chunk);
        },
        generateBundle(output, normalizeOutputOptions, bundle, outputBundle) {

        }
      }
    ],
    output: {
      manualChunks: {
        'module': ['mo']
      }
    }
  });

  const result = await bundle.write({
    format: 'esm',
    dir: 'dist',
    manualChunks
  });

  console.log(result.output.map(o => {
    return `--------${o.name}-Start--------\n${o.code}\n--------${o.name}-End----------`;
  }).join('\n'));
}

build();

const chunkGroups = {
  'A-vendor': 'moduleA',
  'B-vendor': 'moduleB'
};

function manualChunks(id, { getModuleInfo }) {
  for (const group of Object.keys(chunkGroups)) {
    const deps = chunkGroups[group];
    if (
      id.includes('node_modules') &&
      // 递归向上查找引用者，检查是否命中 chunkGroups 声明的包
      isDepInclude(id, deps, [], getModuleInfo)
    ) {
      return group;
    }
  }
}

// 缓存对象
const cache = new Map();

function isDepInclude(id, depPaths, importChain, getModuleInfo) {
  const key = `${id}-${depPaths.join('|')}`;
  // 出现循环依赖，不考虑
  if (importChain.includes(id)) {
    cache.set(key, false);
    return false;
  }
  // 验证缓存
  if (cache.has(key)) {
    return cache.get(key);
  }
  // 命中依赖列表
  if (depPaths.includes(id)) {
    // 引用链中的文件都记录到缓存中
    importChain.forEach(item => cache.set(`${item}-${depPaths.join('|')}`, true));
    return true;
  }
  const moduleInfo = getModuleInfo(id);
  if (!moduleInfo || !moduleInfo.importers) {
    cache.set(key, false);
    return false;
  }
  // 核心逻辑，递归查找上层引用者
  const isInclude = moduleInfo.importers.some(
    importer => isDepInclude(importer, depPaths, importChain.concat(id), getModuleInfo)
  );
  // 设置缓存
  cache.set(key, isInclude);
  return isInclude;
};

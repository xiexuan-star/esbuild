import * as t from '@babel/types';
import generator from '@babel/generator';
import { parse } from '@babel/parser';
import path from 'path';
import babel from '@babel/core';

const result = babel.transform('const foo =()=>{};Promise.resolve();', {
  "presets": [
    [
      "@babel/preset-env",
      {
        // 指定兼容的浏览器版本
        "targets": {
          "ie": "11"
        },
        // 基础库 core-js 的版本，一般指定为最新的大版本
        "corejs": 3,
        // Polyfill 注入策略，后文详细介绍
        "useBuiltIns": 'usage',
        // 不将 ES 模块语法转换为其他模块语法
        "modules": false
      }
    ]
  ]
});

// console.log(result.code);

const resultOfTransformRuntime = babel.transform('const foo=async ()=>{};Promise.resolve();',{
  "plugins": [
    // 添加 transform-runtime 插件
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3
      }
    ]
  ],
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "ie": "11"
        },
        // "corejs": 3,
        // 关闭 @babel/preset-env 默认的 Polyfill 注入
        "useBuiltIns": false,
        "modules": false
      }
    ]
  ]
})

console.log(resultOfTransformRuntime.code);

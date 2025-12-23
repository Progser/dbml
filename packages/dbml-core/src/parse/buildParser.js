import pegjsRequire from 'pegjs-require-import';
import Promise from 'bluebird';

import fs from 'fs';
import path from 'path';

Promise.promisifyAll(fs);

// Путь к выходной директории — lib/parse
const outputDir = path.resolve(__dirname, '../../lib/parse');

async function buildParserFile (source, fileName) {
  // Создаём директорию асинхронно, если её нет
  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
  } catch (err) {
    // Игнорируем ошибку, если директория уже существует
    if (err.code !== 'EEXIST') throw err;
  }

  const filePath = path.join(outputDir, fileName);
  return fs.writeFileAsync(filePath, source);
}

const options = {
  format: 'commonjs',
  dependencies: {
    _: 'lodash',
    pluralize: 'pluralize',
  },
  output: 'source',
};

const mysqlParserSource = pegjsRequire('./mysql/parser.pegjs', options);
const postgresParserSource = pegjsRequire('./postgresql/parser.pegjs', options);
const dbmlParserSource = pegjsRequire('./dbml/parser.pegjs', options);
const schemarbParserSource = pegjsRequire('./schemarb/parser.pegjs', options);

Promise.all([
  buildParserFile(mysqlParserSource, 'mysqlParser.js'),
  buildParserFile(postgresParserSource, 'postgresParser.js'),
  buildParserFile(dbmlParserSource, 'dbmlParser.js'),
  buildParserFile(schemarbParserSource, 'schemarbParser.js'),
]).then(() => {
  console.log('Build parsers completed!');
}).catch((err) => {
  console.log(err);
});

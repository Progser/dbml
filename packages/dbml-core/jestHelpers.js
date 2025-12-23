const fs = require('fs');
const path = require('path');
const _ = require('lodash');

global.scanTestNames = (dirname, subpath) => {
  const dirFilepath = path.join(dirname, subpath);
  const files = fs.readdirSync(dirFilepath);

  return files.filter((fn) => {
    return fn.match(/\.in\./);
  }).map((fn) => fn.split('.in.')[0]);
};

global.getFileExtension = (format) => {
  if (format === 'schemarb') {
    return 'rb';
  }

  const SQL_FORMATS = ['mysql', 'postgres', 'mssql', 'oracle', 'snowflake'];
  if (SQL_FORMATS.includes(format)) {
    return 'sql';
  }
  return format;
};

/**
 * Нормализует текст для сравнения: приводит к единому формату переносов и пробелов.
 */
function normalizeText (str) {
  return str
    .trim()
    .replace(/\\r\\n/g, '\\n') // экранированный \r\n → \n
    .replace(/\r\n/g, '\n') // Windows → Unix
    .replace(/\n+/g, '\n') // несколько \n → один
    .replace(/ *\n */g, '\n') // убираем пробелы вокруг \n
    .replace(/\s+/g, ' ') // все остальные \s → один пробел
    .trim();
}

/**
 * Нормализует все строковые поля в объекте
 */
function normalizeObjStrings (obj) {
  if (typeof obj === 'string') {
    return normalizeText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeObjStrings);
  }
  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    Object.keys(obj).sort().forEach((key) => {
      result[key] = normalizeObjStrings(obj[key]);
    });
    return result;
  }
  return obj;
}

// Экспортируем в global
global.normalizeText = normalizeText;
global.normalizeObjStrings = normalizeObjStrings;

function omitDeep (obj, predicate) {
  _.forIn(obj, (value, key) => {
    if (predicate(key, value)) {
      delete obj[key];
      return;
    }
    if (_.isObject(value)) {
      obj[key] = omitDeep(value, predicate);
    }
  });
  return obj;
}

global.isEqualExcludeTokenEmpty = (receivedObj, sourceObj) => {
  const isTokenEmptyProperty = (key, value) => {
    return key === 'token' || value === undefined || value === null
      || (Array.isArray(value) && _.isEmpty(value)) || (typeof value === 'object' && _.isEmpty(value));
  };

  const sourceObjExcludeTokenEmpty = omitDeep(sourceObj, isTokenEmptyProperty);
  const receivedObjExludeTokenEmpty = omitDeep(receivedObj, isTokenEmptyProperty);

  const sourceNormalized = normalizeObjStrings(sourceObjExcludeTokenEmpty);
  const receivedNormalized = normalizeObjStrings(receivedObjExludeTokenEmpty);

  expect(sourceNormalized).toEqual(receivedNormalized);
};

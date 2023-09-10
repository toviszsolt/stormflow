const { crc32 } = require('crc');

const unixNow = () => Math.floor(new Date().getTime() / 1000);

const unixFromStr = (dateStr) => Math.floor(new Date(dateStr).getTime() / 1000);

const unixToDateObj = (unixTimestamp = unixFromStr()) => new Date(unixTimestamp * 1000);

const unixToDateStr = (unixTimestamp, format) => {
  const pad = (str) => String(str).padStart(2, '0');
  const date = new Date(unixTimestamp * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const hours12 = hours > 12 ? hours - 12 : hours;
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const firstDayOfYear = new Date(year, 0, 1);
  const daysSinceFirstDay = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil(daysSinceFirstDay / 7);

  const formatTokens = {
    offset: `GMT${date.getTimezoneOffset() > 0 ? '-' : '+'}${String(
      Math.abs(date.getTimezoneOffset() / 60),
    ).padStart(2, '0')}:${String(Math.abs(date.getTimezoneOffset() % 60)).padStart(2, '0')}`,
    mer: hours < 12 ? 'a.m.' : 'p.m',
    mh: hours12,
    MH: pad(hours12),
    y: String(year).slice(-2),
    Y: year,
    m: month,
    M: pad(month),
    w: weekNumber,
    W: pad(weekNumber),
    d: day,
    D: pad(day),
    h: hours,
    H: pad(hours),
    i: minutes,
    I: pad(minutes),
    s: seconds,
    S: pad(seconds),
  };

  let formattedDate = format;
  for (const token in formatTokens) {
    formattedDate = formattedDate.replaceAll(`%${token}`, String(formatTokens[token]));
  }

  return formattedDate;
};

const deepClone = (obj) => JSON.parse(JSON.stringify(obj || null));

const uniqueId = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const randomCharacter = alphabet[Math.floor(Math.random() * alphabet.length)];

  return (
    randomCharacter +
    crc32(Math.random().toString(36).substring(2, 7) + Date.now().toString()).toString(16)
  );
};

module.exports = {
  unixNow,
  unixFromStr,
  unixToDateObj,
  unixToDateStr,
  deepClone,
  uniqueId,
};

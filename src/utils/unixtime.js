/**
 * Rreturns the current date and time in unix time format
 * @returns {number} - The current date and time in unix time format
 */
const timeNow = () => Math.floor(new Date().getTime() / 1000);

/**
 * Converts a date string to unix time format
 * @param {string} dateStr - The date string to convert to unix time format
 * @returns {number} - The date string in unix time format
 */
const timeFromStr = (dateStr) => Math.floor(new Date(dateStr).getTime() / 1000);

/**
 * Converts a unix time format to a Date object
 * @param {number} unixTimestamp
 * @returns {Date} - The Date object representing the unix time format.
 */
const timeToDateObj = (unixTimestamp) => new Date(unixTimestamp * 1000);

/**
 * Converts a Unix time format to a date string.
 * @param {number} unixTimestamp The Unix timestamp to convert to a date string.
 * @param {string} [format='%Y-%M-%D %H:%I:%S'] The format of the date string to return.
 * Possible tokens: %offset, %mer, %MER, %mh, %MH, %y, %Y, %m, %M, %w, %W, %d, %D, %h, %H, %i, %I, %s, %S.
 * @returns {string} The date string representing the Unix time format.
 */
const timeToDateStr = (unixTimestamp, format = '%Y-%M-%D %H:%I:%S') => {
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
  const daysSinceFirstDay = Math.floor((date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil(daysSinceFirstDay / 7);
  const tokens = {
    offset: `GMT${date.getTimezoneOffset() > 0 ? '-' : '+'}${String(Math.abs(date.getTimezoneOffset() / 60)).padStart(
      2,
      '0',
    )}:${String(Math.abs(date.getTimezoneOffset() % 60)).padStart(2, '0')}`,
    mer: hours < 12 ? 'a.m.' : 'p.m',
    MER: hours < 12 ? 'A.M.' : 'P.M',
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

  const formattedDate = Object.keys(tokens).reduce((result, token) => {
    return result.replaceAll(`%${token}`, String(tokens[token]));
  }, format);

  return formattedDate;
};

export { timeFromStr, timeNow, timeToDateObj, timeToDateStr };

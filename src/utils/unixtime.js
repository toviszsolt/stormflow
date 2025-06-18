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
 * Converts a Unix timestamp to a date string.
 * @param {number} unixTimestamp - The Unix timestamp to convert.
 * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - The format of the returned date string.
 * Supported tokens: YYYY, YY, MMMM, MMM, MM, M, DD, D, dddd, ddd, dd, d, HH, H, hh, h, mm, m, ss, s, SSS, A, a, Z, ZZ.
 * @returns {string} The date string representing the Unix timestamp.
 */
const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthNamesLong = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const dayNamesMin = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayNamesLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timeToDateStr = (unixTimestamp, format = 'YYYY-MM-DD HH:mm:ss') => {
  const pad = (str, len = 2) => String(str).padStart(len, '0');
  const date = new Date(unixTimestamp * 1000);

  const offsetMinutes = date.getTimezoneOffset();
  const offsetSign = offsetMinutes > 0 ? '-' : '+';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);
  const offsetZ = `${offsetSign}${offsetHours}:${offsetMins}`;
  const offsetZZ = `${offsetSign}${offsetHours}${offsetMins}`;

  const map = {
    YYYY: date.getFullYear(),
    YY: String(date.getFullYear()).slice(-2),
    M: date.getMonth() + 1,
    MM: pad(date.getMonth() + 1),
    MMM: monthNamesShort[date.getMonth()],
    MMMM: monthNamesLong[date.getMonth()],
    D: date.getDate(),
    DD: pad(date.getDate()),
    d: date.getDay(),
    dd: dayNamesMin[date.getDay()],
    ddd: dayNamesShort[date.getDay()],
    dddd: dayNamesLong[date.getDay()],
    H: date.getHours(),
    HH: pad(date.getHours()),
    h: date.getHours() % 12 || 12,
    hh: pad(date.getHours() % 12 || 12),
    m: date.getMinutes(),
    mm: pad(date.getMinutes()),
    s: date.getSeconds(),
    ss: pad(date.getSeconds()),
    SSS: pad(date.getMilliseconds(), 3),
    A: date.getHours() < 12 ? 'AM' : 'PM',
    a: date.getHours() < 12 ? 'am' : 'pm',
  };

  return format
    .replace(/ZZ/g, offsetZZ)
    .replace(/Z/g, offsetZ)
    .replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|SSS|A|a/g, (match) => map[match] ?? match);
};

export { timeFromStr, timeNow, timeToDateObj, timeToDateStr };

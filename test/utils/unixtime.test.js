import moment from 'moment-timezone';
import { timeFromStr, timeNow, timeToDateObj, timeToDateStr } from '../../src/utils/unixtime.js';

describe('timeNow', () => {
  it('returns the current time in Unix time format', () => {
    const currentTime = Math.floor(new Date().getTime() / 1000);
    expect(timeNow()).toBe(currentTime);
  });
});

describe('timeFromStr', () => {
  it('converts a date string to Unix time format', () => {
    const dateStr = '2024-02-28T12:00:00Z';
    const expectedTime = Math.floor(new Date(dateStr).getTime() / 1000);
    expect(timeFromStr(dateStr)).toBe(expectedTime);
  });
});

describe('timeToDateObj', () => {
  it('converts Unix time format to a Date object', () => {
    const unixTime = 1646044800;
    const expectedDate = new Date('2022-02-28T10:40:00Z');
    expect(timeToDateObj(unixTime)).toEqual(expectedDate);
  });
});

describe('timeToDateStr', () => {
  it('converts Unix time format to a date string with default format', () => {
    const unixTime = 1646052000;
    const expectedDate = moment.unix(unixTime).format('YYYY-MM-DD HH:mm:ss');
    expect(timeToDateStr(unixTime)).toBe(expectedDate);
  });

  it('converts Unix time format to a date string with custom format', () => {
    const unixTime = 1646044800;
    const customFormat = 'YYYY-MM-DD hh:mm:ss A';
    const expectedDate = moment.unix(unixTime).format('YYYY-MM-DD hh:mm:ss A');
    expect(timeToDateStr(unixTime, customFormat)).toBe(expectedDate);
  });
});

describe('timeToDateStr formats', () => {
  const unixTime = 1718793600;
  const date = new Date(unixTime * 1000);

  it('YY', () => {
    expect(timeToDateStr(unixTime, 'YY')).toBe(date.getFullYear().toString().slice(-2));
  });

  it('YYYY', () => {
    expect(timeToDateStr(unixTime, 'YYYY')).toBe(date.getFullYear().toString());
  });

  it('M/MM/MMM/MMMM', () => {
    expect(timeToDateStr(unixTime, 'M')).toBe((date.getMonth() + 1).toString());
    expect(timeToDateStr(unixTime, 'MM')).toBe((date.getMonth() + 1).toString().padStart(2, '0'));
    expect(timeToDateStr(unixTime, 'MMM')).toBe(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()],
    );
    expect(timeToDateStr(unixTime, 'MMMM')).toBe(
      [
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
      ][date.getMonth()],
    );
  });

  it('D/DD', () => {
    expect(timeToDateStr(unixTime, 'D')).toBe(date.getDate().toString());
    expect(timeToDateStr(unixTime, 'DD')).toBe(date.getDate().toString().padStart(2, '0'));
  });

  it('d/dd/ddd/dddd', () => {
    expect(timeToDateStr(unixTime, 'd')).toBe(date.getDay().toString());
    expect(timeToDateStr(unixTime, 'dd')).toBe(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()]);
    expect(timeToDateStr(unixTime, 'ddd')).toBe(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]);
    expect(timeToDateStr(unixTime, 'dddd')).toBe(
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
    );
  });

  it('H/HH/h/hh', () => {
    expect(timeToDateStr(unixTime, 'H')).toBe(date.getHours().toString());
    expect(timeToDateStr(unixTime, 'HH')).toBe(date.getHours().toString().padStart(2, '0'));
    const h12 = date.getHours() % 12 || 12;
    expect(timeToDateStr(unixTime, 'h')).toBe(h12.toString());
    expect(timeToDateStr(unixTime, 'hh')).toBe(h12.toString().padStart(2, '0'));
  });

  it('m/mm', () => {
    expect(timeToDateStr(unixTime, 'm')).toBe(date.getMinutes().toString());
    expect(timeToDateStr(unixTime, 'mm')).toBe(date.getMinutes().toString().padStart(2, '0'));
  });

  it('s/ss', () => {
    expect(timeToDateStr(unixTime, 's')).toBe(date.getSeconds().toString());
    expect(timeToDateStr(unixTime, 'ss')).toBe(date.getSeconds().toString().padStart(2, '0'));
  });

  it('SSS', () => {
    expect(timeToDateStr(unixTime, 'SSS')).toBe(date.getMilliseconds().toString().padStart(3, '0'));
  });

  it('A/a', () => {
    expect(timeToDateStr(unixTime, 'A')).toBe(date.getHours() < 12 ? 'AM' : 'PM');
    expect(timeToDateStr(unixTime, 'a')).toBe(date.getHours() < 12 ? 'am' : 'pm');
  });

  it('Z/ZZ', () => {
    const offsetMinutes = date.getTimezoneOffset();
    const offsetSign = offsetMinutes > 0 ? '-' : '+';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const offsetMins = String(absOffset % 60).padStart(2, '0');
    expect(timeToDateStr(unixTime, 'Z')).toBe(`${offsetSign}${offsetHours}:${offsetMins}`);
    expect(timeToDateStr(unixTime, 'ZZ')).toBe(`${offsetSign}${offsetHours}${offsetMins}`);
  });

  it('Z/ZZ with positive offset', () => {
    const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = jest.fn(() => 120);
    const unixTime = 1718793600;
    expect(timeToDateStr(unixTime, 'Z')).toBe('-02:00');
    expect(timeToDateStr(unixTime, 'ZZ')).toBe('-0200');
    Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
  });

  it('correctly replaces Z and ZZ tokens in sequence', () => {
    const unixTime = 1718793600;
    const date = new Date(unixTime * 1000);
    const offsetMinutes = date.getTimezoneOffset();
    const offsetSign = offsetMinutes > 0 ? '-' : '+';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const offsetMins = String(absOffset % 60).padStart(2, '0');
    const expected = `${offsetSign}${offsetHours}${offsetMins} ${offsetSign}${offsetHours}:${offsetMins}`;
    expect(timeToDateStr(unixTime, 'ZZ Z')).toBe(expected);
  });

  it('returns the original string for unknown tokens', () => {
    const unixTime = 1718793600;
    expect(timeToDateStr(unixTime, 'FOO')).toBe('FOO');
  });
});

const moment = require('moment-timezone');
const { timeNow, timeFromStr, timeToDateObj, timeToDateStr } = require('../../utils/unixtime');

describe('timeNow', () => {
  it('return the current time in Unix time format', () => {
    const currentTime = Math.floor(new Date().getTime() / 1000);
    expect(timeNow()).toBe(currentTime);
  });
});

describe('timeFromStr', () => {
  it('convert a date string to Unix time format', () => {
    const dateStr = '2024-02-28T12:00:00Z';
    const expectedTime = Math.floor(new Date(dateStr).getTime() / 1000);
    expect(timeFromStr(dateStr)).toBe(expectedTime);
  });
});

describe('timeToDateObj', () => {
  it('convert Unix time format to a Date object', () => {
    const unixTime = 1646044800;
    const expectedDate = new Date('2022-02-28T10:40:00Z');
    expect(timeToDateObj(unixTime)).toEqual(expectedDate);
  });
});

describe('timeToDateStr', () => {
  it('convert Unix time format to a date string with default format', () => {
    const unixTime = 1646052000;
    const expectedDate = moment.unix(unixTime).format('YYYY-MM-DD HH:mm:ss');
    expect(timeToDateStr(unixTime)).toBe(expectedDate);
  });

  it('convert Unix time format to a date string with custom format', () => {
    const unixTime = 1646044800;
    const customFormat = '%Y-%M-%D %H:%I:%S %MER';
    const expextedDate = moment
      .unix(unixTime)
      .format('YYYY-MM-DD HH:mm:ss A')
      .replace(/(A|P)M/, '$1.M.');
    expect(timeToDateStr(unixTime, customFormat)).toBe(expextedDate);
  });
});

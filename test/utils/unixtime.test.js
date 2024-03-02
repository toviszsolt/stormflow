const { timeNow, timeFromStr, timeToDateObj, timeToDateStr } = require('../../utils/unixtime');

describe('timeUtils', () => {
  describe('timeNow', () => {
    it('returns the current time in Unix time format', () => {
      const currentTime = Math.floor(new Date().getTime() / 1000);
      expect(timeNow()).toBe(currentTime);
    });
  });

  describe('timeFromStr', () => {
    it('converts a date string to Unix time format', () => {
      const dateStr = '2024-02-28T12:00:00Z'; // Assuming UTC time zone
      const expectedTime = Math.floor(new Date(dateStr).getTime() / 1000);
      expect(timeFromStr(dateStr)).toBe(expectedTime);
    });
  });

  describe('timeToDateObj', () => {
    it('converts Unix time format to a Date object', () => {
      const unixTime = 1646044800; // Unix time for '2022-02-28T10:40:00Z'
      const expectedDate = new Date('2022-02-28T10:40:00Z');
      expect(timeToDateObj(unixTime)).toEqual(expectedDate);
    });
  });

  describe('timeToDateStr', () => {
    it('converts Unix time format to a date string with default format', () => {
      const unixTime = 1646052000; // Unix time for '2022-02-28T13:40:00Z'
      const expectedDateString = '2022-02-28 13:40:00'; // Local time
      expect(timeToDateStr(unixTime)).toBe(expectedDateString);
    });

    it('converts Unix time format to a date string with custom format', () => {
      const unixTime = 1646044800; // Unix time for '2022-02-28T10:40:00Z'
      const customFormat = '%Y-%M-%D %H:%I:%S %MER';
      const expectedDateString = '2022-02-28 11:40:00 A.M.'; // Local time
      expect(timeToDateStr(unixTime, customFormat)).toBe(expectedDateString);
    });
  });
});

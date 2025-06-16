/**
 * Determines the type of a given value.
 * @param {*} variable - The value to determine the type of.
 * @returns {string} The type of the value. Possible values: 'null', 'array', 'date', or the JavaScript type (e.g., 'string', 'number', 'boolean', 'object', 'function').
 */
const getType = (variable) => {
  if (variable === null) return 'null';
  if (Array.isArray(variable)) return 'array';
  if (variable instanceof Date) return 'date';
  return typeof variable;
};

export { getType };

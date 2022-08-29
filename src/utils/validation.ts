const getType = (val: any): string => {
  const type = Object.prototype.toString.call(val);
  return type.slice(8, type.length - 1);
};

const isValidArray = (val: any): boolean => {
  return Array.isArray(val) && !!val.length;
};

const doesOnjectContainsKey = (obj: any, key: string): boolean => {
  if (!obj) {
    return false;
  }
  const type = getType(obj);
  if (type !== "Object") {
    return false;
  }
  return Object.keys(obj).includes(key);
};

const doesAtleastOneObjectContainsKeyValue = (
  arr: any[][] = [],
  key: string,
  value: any
): boolean => {
  let returnStatus = false;
  for (const objArray of arr) {
    for (const obj of objArray) {
      if (doesOnjectContainsKey(obj, key)) {
        if (obj[key] === value) {
          returnStatus = true;
          break;
        }
      }
    }
  }
  return returnStatus;
};

export {
  isValidArray,
  doesOnjectContainsKey,
  doesAtleastOneObjectContainsKeyValue
};

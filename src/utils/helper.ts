import { VsCommandParserOptions } from "../types/VsCommandParser.types";
import { isValidArray } from "./validation";

const padArray = (
  arr: string[],
  pad: string = "",
  paddedArrayLength: number,
  padPosition: "trailing" | "leading"
) => {
  if (!isValidArray(arr)) {
    throw new TypeError(`provided value is not array`);
  }

  if (arr.length === paddedArrayLength) return arr;

  for (let i = 0; i < paddedArrayLength - arr.length; i++) {
    if (padPosition === "leading") {
      arr.unshift(pad);
    } else {
      arr.push(pad);
    }
  }
  return arr;
};

const pickOption = (
  arr: string[],
  name: string,
  optionNames: string[]
): string[] => {
  if (!Array.isArray(arr)) {
    throw new TypeError(`provided value is not array`);
  }
  if (!name) {
    throw new TypeError(`provided name is not valid`);
  }

  const optionIndex = arr.findIndex(
    (option: string) => option === name || option.startsWith(name)
  );
  if (optionIndex < 0) {
    return [];
  }
  let returnArray = [];
  const commandValue = arr[optionIndex];
  if (
    commandValue.includes(`${name}=`) &&
    commandValue.replace(`${name}=`, "")
  ) {
    returnArray = [name, "=", commandValue.replace(`${name}=`, "")];
  } else if (commandValue.includes(`${name}=`)) {
    returnArray = padArray(
      arr.slice(optionIndex, optionIndex + 2),
      "",
      3,
      "trailing"
    );
  } else {
    returnArray = padArray(
      arr.slice(optionIndex, optionIndex + 3),
      "",
      3,
      "trailing"
    );
  }
  const val = [...returnArray].pop();
  const otherOptionIndex = optionNames.findIndex(optionName => {
    const regexp = new RegExp(`${optionName}=(.*)`);
    if (
      optionName !== name &&
      (optionName === val ||
        val === `${optionName}=` ||
        (val?.match(regexp) || []).length)
    ) {
      return true;
    }
  });
  if (otherOptionIndex > -1 && otherOptionIndex > optionNames.indexOf(name)) {
    throw new Error(
      `${name} cannot have ${val} as value. If you wish to provide empty value, either use named option at last position or mark this option as not required and don't provide it`
    );
  }
  return returnArray;
};

const printHelp = (vsCommandParserOptions: VsCommandParserOptions) => {
  const {
    options = {},
    namedOptions = {},
    userInputOptions = {},
    userChoiceOptions: selectOptions = {}
  } = vsCommandParserOptions;

  const optionsKeys = Object.keys(options);
  const namedOptionsKeys = Object.keys(namedOptions);
  const userInputOptionsKeys = Object.keys(userInputOptions);
  const selectOptionsKeys = Object.keys(selectOptions);

  if (optionsKeys.length || namedOptionsKeys.length || selectOptionsKeys) {
    let obj: { [key: string]: object } = {};

    if (optionsKeys.length) {
      optionsKeys.forEach((optionName: string, index: number) => {
        const description = options[optionName].description || "";
        obj[optionName] = {
          required: options[optionName].required || false,
          description: `This is inline option ${index + 1}${
            description ? ` : ${description}` : ""
          }`
        };
      });
    }

    if (Object.keys(obj).length) {
      console.log();
      console.log(`Inline options help:\n`);
      console.table(obj);
      console.log();
      obj = {};
    }

    if (namedOptionsKeys.length) {
      namedOptionsKeys.forEach((optionName: string) => {
        const description = namedOptions[optionName].description || "";
        obj[optionName] = {
          required: namedOptions[optionName].required || false,
          description: `This is named option${
            description ? ` : ${description}` : ""
          }`
        };
      });
    }

    if (Object.keys(obj).length) {
      console.log(`Named inline options help:\n`);
      console.table(obj);
      console.log();
      obj = {};
    }

    if (userInputOptionsKeys.length) {
      userInputOptionsKeys.forEach((optionName: string) => {
        const description = userInputOptions[optionName].description || "";
        obj[optionName] = {
          required: userInputOptions[optionName].required || false,
          description: `This is user input question${
            description ? ` : ${description}` : ""
          }`
        };
      });
    }

    if (Object.keys(obj).length) {
      console.log(`User input options help:\n`);
      console.table(obj);
      console.log();
      obj = {};
    }

    if (selectOptionsKeys.length) {
      selectOptionsKeys.forEach((optionName: string) => {
        const description = selectOptions[optionName].description || "";
        obj[optionName] = {
          required: selectOptions[optionName].required || false,
          description: `This is user choice question${
            description ? ` : ${description}` : ""
          }`
        };
        if (
          selectOptions[optionName].choices &&
          selectOptions[optionName].choices?.length
        ) {
          obj[optionName] = {
            ...obj[optionName],
            optionSelection: selectOptions[optionName].choices
          };
        }
      });
    }

    if (Object.keys(obj).length) {
      console.log(`User choice options help:\n`);
      console.table(obj);
      console.log();
    }
  }
};

export { pickOption, printHelp };

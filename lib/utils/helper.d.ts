import { VsCommandParserOptions } from "../types/VsCommandParser.types";
declare const pickOption: (arr: string[], name: string, optionNames: string[]) => string[];
declare const printHelp: (vsCommandParserOptions: VsCommandParserOptions) => void;
export { pickOption, printHelp };

import { ParsedArguments, VsCommandParserOptions } from "./types/VsCommandParser.types";
declare class VsCommandParser {
    private commandOptions;
    private parsedArguments;
    private useProvidedArguments;
    constructor(vsCommandParserOptions: VsCommandParserOptions);
    private processCommandOptionValue;
    /**
     * parse
     */
    parse(): Promise<ParsedArguments | void>;
    /**
     * getOptionValue
     */
    getOptionValue(optionName: string): string;
}
export default VsCommandParser;

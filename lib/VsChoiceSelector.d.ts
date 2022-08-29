import { ParsedUserChoiceOption, UserChoiceOption } from "./types/VsCommandParser.types";
/**
 * CLI choice selector
 */
declare class VsChoiceSelector {
    private vsCliChoiceSelectorOption;
    private vsCliOptionSelectorParsedOption;
    private currentQuestionKey;
    private static _this;
    private selectedOption;
    constructor(_vsCliChoiceSelectorOption: UserChoiceOption);
    private getColorizedString;
    private cursor;
    /**
     * https://en.wikipedia.org/wiki/ANSI_escape_code
     *
     * 1. Escape --> \x1b
     * 2. Clear line --> nK ( If n is 0 (or missing), clear from cursor to the end of the line. If n is 1, clear from cursor to beginning of the line. If n is 2, clear entire line. Cursor position does not change)
     * 3. Cursor --> A - up, B - down, C - forward, D - backward
     */
    private clearLines;
    private cursorMode;
    private captureAnswer;
    private close;
    private up;
    private down;
    private processInput;
    private renderChoices;
    /**
     * Ask all choice questions
     * @returns {ParsedUserChoiceOption} - returns promise wait for promise to resolve or reject
     */
    ask(): Promise<ParsedUserChoiceOption>;
}
export default VsChoiceSelector;

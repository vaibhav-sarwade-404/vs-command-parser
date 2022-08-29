"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const constants_1 = require("./utils/constants");
/**
 * CLI choice selector
 */
class VsChoiceSelector {
    constructor(_vsCliChoiceSelectorOption) {
        this.vsCliOptionSelectorParsedOption = {};
        this.selectedOption = 0;
        this.getColorizedString = (str, color) => {
            return `${color === "green" ? constants_1.COLORS.green : ""}${str}${constants_1.COLORS.reset}`;
        };
        this.cursor = (cursorDir) => {
            const ESC = "\u001B[";
            switch (cursorDir) {
                case "up":
                    return `${ESC}1A`;
                case "right":
                    return `${ESC}1C`;
                case "down":
                    return `${ESC}1B`;
                case "h-absolute":
                    return `${ESC}1G`;
                case "left":
                default:
                    return `${ESC}1D`;
            }
        };
        /**
         * https://en.wikipedia.org/wiki/ANSI_escape_code
         *
         * 1. Escape --> \x1b
         * 2. Clear line --> nK ( If n is 0 (or missing), clear from cursor to the end of the line. If n is 1, clear from cursor to beginning of the line. If n is 2, clear entire line. Cursor position does not change)
         * 3. Cursor --> A - up, B - down, C - forward, D - backward
         */
        this.clearLines = (lines = 1, dir) => {
            const ESC = "\u001B[";
            const eraseLineCommand = ESC + "2K";
            let asciiCodeCommand = "";
            for (let i = 0; i < lines; i++) {
                asciiCodeCommand +=
                    eraseLineCommand + (i < lines - 1 ? this.cursor("up") : "");
            }
            process_1.stdout.write(asciiCodeCommand);
        };
        this.cursorMode = (mode) => {
            mode === "hide" ? process_1.stdout.write("\x1B[?25l") : process_1.stdout.write("\x1B[?25h");
        };
        this.captureAnswer = () => {
            const { choices, description, transformer, validator, validationMsg, required } = this.vsCliChoiceSelectorOption[this.currentQuestionKey];
            let ans = choices[VsChoiceSelector._this.selectedOption];
            if (typeof transformer === "function") {
                ans = transformer(ans);
            }
            let isValidValue = true;
            if (required) {
                isValidValue = !ans;
            }
            if (isValidValue && typeof validator === "function") {
                isValidValue = validator(ans);
            }
            VsChoiceSelector._this.vsCliOptionSelectorParsedOption[this.currentQuestionKey] = {
                value: ans,
                description,
                validationMsg: isValidValue
                    ? ""
                    : validationMsg
                        ? validationMsg
                        : `Options "${this.currentQuestionKey}" is required`
            };
        };
        this.close = () => {
            process_1.stdin.removeListener("data", VsChoiceSelector._this.processInput);
            process_1.stdin.setRawMode(false);
            process_1.stdin.pause();
            this.captureAnswer();
            process_1.stdin.emit("close");
        };
        this.up = () => {
            this.selectedOption =
                this.selectedOption > 0 ? this.selectedOption - 1 : this.selectedOption;
            this.clearLines(3, "up");
            this.renderChoices();
        };
        this.down = () => {
            const { choices } = this.vsCliChoiceSelectorOption[this.currentQuestionKey];
            this.selectedOption =
                this.selectedOption < choices.length - 1
                    ? this.selectedOption + 1
                    : choices.length - 1;
            this.clearLines(3, "up");
            this.renderChoices();
        };
        this.renderChoices = () => {
            const { choices } = this.vsCliChoiceSelectorOption[this.currentQuestionKey];
            choices &&
                choices.forEach((option, index) => {
                    process_1.stdout.write(`${index === this.selectedOption ? ">" : " "} ${this.getColorizedString(option, index === this.selectedOption ? "green" : "reset")}\n`);
                });
        };
        this.vsCliChoiceSelectorOption = _vsCliChoiceSelectorOption;
    }
    processInput(input) {
        switch (input.toString("utf-8")) {
            case "\r":
            case "\x03":
            case "\u0003": // Ctrl + c
                return this.close();
            case "\u001b[A": // Up arrow
                return this.up();
            case "\u001b[B": // Down arrow
                return this.down();
        }
    }
    /**
     * Ask all choice questions
     * @returns {ParsedUserChoiceOption} - returns promise wait for promise to resolve or reject
     */
    ask() {
        return __awaiter(this, void 0, void 0, function* () {
            const selectOptionKeys = Object.keys(this.vsCliChoiceSelectorOption);
            if (selectOptionKeys.length) {
                for (const selectOptionKey of selectOptionKeys) {
                    let { question = "default choice question?", choices = ["default choice 1", "default choice 2"], description = "default description", required = false } = this.vsCliChoiceSelectorOption[selectOptionKey];
                    if (!question) {
                        question = "default choice question?";
                    }
                    if (!Array.isArray(choices)) {
                        choices = ["default choice 1", "default choice 2"];
                    }
                    this.currentQuestionKey = selectOptionKey;
                    yield new Promise((resolve, reject) => {
                        try {
                            VsChoiceSelector._this = this;
                            process_1.stdout.write(`${question}\n`);
                            this.renderChoices();
                            process_1.stdin.setRawMode(true);
                            process_1.stdin.resume();
                            process_1.stdin.setEncoding("utf-8");
                            choices &&
                                choices.length &&
                                process_1.stdin.on("data", (input) => {
                                    VsChoiceSelector._this.processInput(input);
                                });
                            process_1.stdin.on("close", () => {
                                resolve("");
                            });
                        }
                        catch (error) {
                            this.vsCliOptionSelectorParsedOption[selectOptionKey] = {
                                value: "",
                                description: description,
                                validationMsg: required
                                    ? `Options "${selectOptionKey}" is required`
                                    : ""
                            };
                            reject(error);
                        }
                    });
                    console.log();
                }
            }
            return this.vsCliOptionSelectorParsedOption;
        });
    }
}
exports.default = VsChoiceSelector;

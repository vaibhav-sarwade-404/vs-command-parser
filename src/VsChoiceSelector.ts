import { stdin, stdout } from "process";

import {
  ParsedUserChoiceOption,
  UserChoiceOption
} from "./types/VsCommandParser.types";
import { COLORS } from "./utils/constants";

/**
 * CLI choice selector
 */
class VsChoiceSelector {
  private vsCliChoiceSelectorOption: UserChoiceOption;
  private vsCliOptionSelectorParsedOption: ParsedUserChoiceOption = {};
  private currentQuestionKey!: string;
  private static _this: VsChoiceSelector;
  private selectedOption = 0;
  constructor(_vsCliChoiceSelectorOption: UserChoiceOption) {
    this.vsCliChoiceSelectorOption = _vsCliChoiceSelectorOption;
  }

  private getColorizedString = (str: string, color: "green" | "reset") => {
    return `${color === "green" ? COLORS.green : ""}${str}${COLORS.reset}`;
  };

  private cursor = (
    cursorDir: "up" | "right" | "down" | "left" | "h-absolute"
  ) => {
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
  private clearLines = (lines: number = 1, dir: "up" | "down") => {
    const ESC = "\u001B[";
    const eraseLineCommand = ESC + "2K";

    let asciiCodeCommand = "";
    for (let i = 0; i < lines; i++) {
      asciiCodeCommand +=
        eraseLineCommand + (i < lines - 1 ? this.cursor("up") : "");
    }
    stdout.write(asciiCodeCommand);
  };

  private cursorMode = (mode: "hide" | "show") => {
    mode === "hide" ? stdout.write("\x1B[?25l") : stdout.write("\x1B[?25h");
  };

  private captureAnswer = () => {
    const {
      choices,
      description,
      transformer,
      validator,
      validationMsg,
      required
    } = this.vsCliChoiceSelectorOption[this.currentQuestionKey];
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
    VsChoiceSelector._this.vsCliOptionSelectorParsedOption[
      this.currentQuestionKey
    ] = {
      value: ans,
      description,
      validationMsg: isValidValue
        ? ""
        : validationMsg
        ? validationMsg
        : `Options "${this.currentQuestionKey}" is required`
    };
  };

  private close = () => {
    stdin.removeListener("data", VsChoiceSelector._this.processInput);
    stdin.setRawMode(false);
    stdin.pause();
    this.captureAnswer();
    stdin.emit("close");
  };

  private up = () => {
    this.selectedOption =
      this.selectedOption > 0 ? this.selectedOption - 1 : this.selectedOption;
    this.clearLines(3, "up");
    this.renderChoices();
  };

  private down = () => {
    const { choices } = this.vsCliChoiceSelectorOption[this.currentQuestionKey];
    this.selectedOption =
      this.selectedOption < choices.length - 1
        ? this.selectedOption + 1
        : choices.length - 1;
    this.clearLines(3, "up");
    this.renderChoices();
  };

  private processInput(input: Buffer) {
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

  private renderChoices = () => {
    const { choices } = this.vsCliChoiceSelectorOption[this.currentQuestionKey];
    choices &&
      choices.forEach((option: string, index: number) => {
        stdout.write(
          `${
            index === this.selectedOption ? ">" : " "
          } ${this.getColorizedString(
            option,
            index === this.selectedOption ? "green" : "reset"
          )}\n`
        );
      });
  };

  /**
   * Ask all choice questions
   * @returns {ParsedUserChoiceOption} - returns promise wait for promise to resolve or reject
   */
  public async ask(): Promise<ParsedUserChoiceOption> {
    const selectOptionKeys = Object.keys(this.vsCliChoiceSelectorOption);
    if (selectOptionKeys.length) {
      for (const selectOptionKey of selectOptionKeys) {
        let {
          question = "default choice question?",
          choices = ["default choice 1", "default choice 2"],
          description = "default description",
          required = false
        } = this.vsCliChoiceSelectorOption[selectOptionKey];
        if (!question) {
          question = "default choice question?";
        }
        if (!Array.isArray(choices)) {
          choices = ["default choice 1", "default choice 2"];
        }
        this.currentQuestionKey = selectOptionKey;
        await new Promise((resolve, reject) => {
          try {
            VsChoiceSelector._this = this;
            stdout.write(`${question}\n`);
            this.renderChoices();
            stdin.setRawMode(true);
            stdin.resume();
            stdin.setEncoding("utf-8");
            choices &&
              choices.length &&
              stdin.on("data", (input: Buffer) => {
                VsChoiceSelector._this.processInput(input);
              });
            stdin.on("close", () => {
              resolve("");
            });
          } catch (error) {
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
  }
}

export default VsChoiceSelector;

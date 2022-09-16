import * as readline from "readline";
import { stdin, stdout } from "process";

import {
  Option,
  ParsedArguments,
  VsCommandParserOptions
} from "./types/VsCommandParser.types";
import { pickOption, printHelp } from "./utils/helper";
import VsChoiceSelector from "./VsChoiceSelector";
import {
  doesAtleastOneObjectContainsKeyValue,
  doesOnjectContainsKey
} from "./utils/validation";

class VsCommandParser {
  private commandOptions: VsCommandParserOptions;
  private parsedArguments: ParsedArguments = {};
  private useProvidedArguments: string[];
  constructor(vsCommandParserOptions: VsCommandParserOptions) {
    const { options, namedOptions, userChoiceOptions, userInputOptions } =
      vsCommandParserOptions;
    if (!options && !namedOptions && !userInputOptions && !userChoiceOptions) {
      throw new Error(`At least one option is required`);
    }
    if (
      doesOnjectContainsKey(options, "help") ||
      doesOnjectContainsKey(namedOptions, "help") ||
      doesOnjectContainsKey(userChoiceOptions, "help") ||
      doesOnjectContainsKey(userInputOptions, "help")
    ) {
      throw new Error(
        `"help" is reserved option, cannot create "VsCommandParser" instance.`
      );
    }

    //Validate UserInputOptions
    if (userInputOptions) {
      for (const userInputOption of Object.values(userInputOptions)) {
        if (!userInputOption.question) {
          throw new Error(
            `Question attribute is required for all userInputOptions`
          );
        }
      }
    }

    //validate userChoiceOptions
    if (userChoiceOptions) {
      for (const userChoiceOption of Object.values(userChoiceOptions)) {
        const { question, choices } = userChoiceOption;
        if (!question) {
          throw new Error(
            `Question attribute is required for all userChoiceOptions`
          );
        }
        if (
          !choices ||
          !Array.isArray(choices) ||
          !(Array.isArray(choices) && choices.length)
        ) {
          throw new Error(
            `Choice attribute is required for all userChoiceOptions, it should non empty choices / string array`
          );
        }
      }
    }
    const allOptionKeysArray = [
      ...Object.keys(options || {}),
      ...Object.keys(namedOptions || {}),
      ...Object.keys(userInputOptions || {}),
      ...Object.keys(userChoiceOptions || {})
    ];
    if (allOptionKeysArray.length !== [...new Set(allOptionKeysArray)].length) {
      throw new Error(
        `Same option key cannot be used in different options (inline, namedOptions, userInputOptions, userChoiceOptions).`
      );
    }
    this.commandOptions = vsCommandParserOptions;
    const argv = process.argv.splice(2);

    let parsedArgv = argv;
    if (process.env.npm_config_argv) {
      parsedArgv = JSON.parse(process.env.npm_config_argv).original.slice(2);
    }

    /**
     * npm run dev test --test1 = test1Value --test2 = test2Value = 2 something     =
     * ['test', '--test1', '=', 'test1Value', '--test2',    '=', 'test2Value', '=', '2', 'something', '=' ]
     *
     * [ 'test', '--test1=asd', '--test2=asd2', 'something=asmdlasmd' ]
     * ['test', '--test1=asd', '--test2=asd2', 'something', '=', 'asmdlasmd']
     */
    this.useProvidedArguments = parsedArgv;
  }

  private processCommandOptionValue = (
    optionName: string,
    value: string,
    optionRules: Option = {}
  ) => {
    const {
      description = "",
      transformer,
      validator,
      validationMsg = "",
      required = false
    } = optionRules;

    if (typeof transformer === "function") {
      value = transformer(value);
    }
    let isValidValue = true;
    if (required) {
      isValidValue = !value;
    }
    if (isValidValue && typeof validator === "function") {
      isValidValue = validator(value);
    }

    this.parsedArguments[optionName] = {
      value,
      validationMsg: isValidValue
        ? ""
        : validationMsg
        ? validationMsg
        : `Options "${optionName}" is required`,
      description
    };
  };

  /**
   * parse
   */
  public async parse(): Promise<ParsedArguments | void> {
    const { options = {}, namedOptions = {} } = this.commandOptions;

    if (
      !this.useProvidedArguments.length &&
      doesAtleastOneObjectContainsKeyValue(
        [Object.values(options), Object.values(namedOptions)],
        "required",
        true
      )
    ) {
      throw new Error(
        `Atleast one inline or named option is required. Please run command with "help" to get more information about options`
      );
    }

    if (this.useProvidedArguments.length) {
      const firstArgument = this.useProvidedArguments[0];
      if (firstArgument === "help") {
        printHelp(this.commandOptions);
        process.exit(0);
      }
    }

    if (this.commandOptions.options) {
      const commandOptionsArray: string[] = Object.keys(
        this.commandOptions.options
      );
      commandOptionsArray.forEach((commandOption: string, index: number) => {
        let commandOptionValue = this.useProvidedArguments[index] || "";
        this.processCommandOptionValue(
          commandOption,
          commandOptionValue,
          (this.commandOptions.options || {})[commandOption] || {}
        );
      });
    }

    if (this.commandOptions.namedOptions) {
      const commandOptionsArray: string[] = Object.keys(
        this.commandOptions.namedOptions
      );
      for (const commandOption of commandOptionsArray) {
        const commandOptionArray = pickOption(
          this.useProvidedArguments,
          commandOption,
          Object.keys(this.commandOptions.namedOptions || {})
        );
        let commandOptionValue = "";
        if (commandOptionArray.length) {
          commandOptionValue = commandOptionArray.pop() || "";
        }
        this.processCommandOptionValue(
          commandOption,
          commandOptionValue,
          (this.commandOptions.namedOptions || {})[commandOption] || {}
        );
      }
    }

    if (this.commandOptions.userInputOptions) {
      const rl = readline.createInterface(stdin, stdout);
      const userInputCommandOptionsArray: string[] = Object.keys(
        this.commandOptions.userInputOptions
      );

      const renderQuestion = async (
        que: string,
        isRequired: boolean
      ): Promise<string> => {
        return new Promise(resolve => {
          rl.question(`\n${que}\n  `, _answer => {
            if (isRequired && !_answer) {
              return resolve(renderQuestion(que, isRequired));
            }
            resolve(_answer);
          });
        });
      };

      for (const commandOption of userInputCommandOptionsArray) {
        let {
          description = "",
          question = "default question?",
          transformer,
          validator,
          validationMsg = "",
          required = false
        } = this.commandOptions.userInputOptions[commandOption];
        let answer: string = "";
        if (!question) {
          question = "default question?";
        }
        answer = await renderQuestion(question || "", required);

        if (typeof transformer === "function") {
          answer = transformer(answer);
        }
        let isValidValue = true;
        if (required) {
          isValidValue = !answer;
        }
        if (isValidValue && typeof validator === "function") {
          isValidValue = validator(answer);
        }

        this.parsedArguments[commandOption] = {
          question,
          value: answer,
          description,
          validationMsg: isValidValue
            ? ""
            : validationMsg
            ? validationMsg
            : `Options "${commandOption}" is required`
        };
      }
      rl.close();
    }
    console.log();
    if (this.commandOptions.userChoiceOptions) {
      const vsCliOChoiceSelector = new VsChoiceSelector(
        this.commandOptions.userChoiceOptions
      );
      const parsedCliOptions = await vsCliOChoiceSelector.ask();
      if (parsedCliOptions) {
        const parsedOptionsKeys = Object.keys(parsedCliOptions);
        parsedOptionsKeys.forEach(parsedOptionName => {
          const { value, validationMsg, description } =
            parsedCliOptions[parsedOptionName];
          this.parsedArguments[parsedOptionName] = {
            value,
            validationMsg,
            description
          };
        });
      }
    }
    return this.parsedArguments;
  }

  /**
   * getOptionValue
   */
  public getOptionValue(optionName: string) {
    return (this.parsedArguments[optionName] || {}).value || "";
  }
}

export default VsCommandParser;

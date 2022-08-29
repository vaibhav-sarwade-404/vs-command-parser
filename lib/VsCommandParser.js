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
const readline = require("readline");
const process_1 = require("process");
const helper_1 = require("./utils/helper");
const VsChoiceSelector_1 = require("./VsChoiceSelector");
const validation_1 = require("./utils/validation");
class VsCommandParser {
    constructor(vsCommandParserOptions) {
        this.parsedArguments = {};
        this.processCommandOptionValue = (optionName, value, optionRules = {}) => {
            const { description = "", transformer, validator, validationMsg = "", required = false } = optionRules;
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
        const { options, namedOptions, userChoiceOptions, userInputOptions } = vsCommandParserOptions;
        if (!options && !namedOptions && !userInputOptions && !userChoiceOptions) {
            throw new Error(`At least one option is required`);
        }
        if ((0, validation_1.doesOnjectContainsKey)(options, "help") ||
            (0, validation_1.doesOnjectContainsKey)(namedOptions, "help") ||
            (0, validation_1.doesOnjectContainsKey)(userChoiceOptions, "help") ||
            (0, validation_1.doesOnjectContainsKey)(userInputOptions, "help")) {
            throw new Error(`"help" is reserved option, cannot create "VsCommandParser" instance.`);
        }
        //Validate UserInputOptions
        if (userInputOptions) {
            for (const userInputOption of Object.values(userInputOptions)) {
                if (!userInputOption.question) {
                    throw new Error(`Question attribute is required for all userInputOptions`);
                }
            }
        }
        //validate userChoiceOptions
        if (userChoiceOptions) {
            for (const userChoiceOption of Object.values(userChoiceOptions)) {
                const { question, choices } = userChoiceOption;
                if (!question) {
                    throw new Error(`Question attribute is required for all userChoiceOptions`);
                }
                if (!choices ||
                    !Array.isArray(choices) ||
                    !(Array.isArray(choices) && choices.length)) {
                    throw new Error(`Choice attribute is required for all userChoiceOptions, it should non empty choices / string array`);
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
            throw new Error(`Same option key cannot be used in different options (inline, namedOptions, userInputOptions, userChoiceOptions).`);
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
    /**
     * parse
     */
    parse() {
        return __awaiter(this, void 0, void 0, function* () {
            const { options = {}, namedOptions = {}, userChoiceOptions = {}, userInputOptions = {} } = this.commandOptions;
            if (!this.useProvidedArguments.length &&
                (0, validation_1.doesAtleastOneObjectContainsKeyValue)([
                    Object.values(options),
                    Object.values(namedOptions),
                    Object.values(userChoiceOptions),
                    Object.values(userInputOptions)
                ], "required", true)) {
                throw new Error(`Atleast one options is required. Please run command with "help" to get more information about options`);
            }
            if (this.useProvidedArguments.length) {
                const firstArgument = this.useProvidedArguments[0];
                if (firstArgument === "help") {
                    (0, helper_1.printHelp)(this.commandOptions);
                    process.exit(0);
                }
            }
            if (this.commandOptions.options) {
                const commandOptionsArray = Object.keys(this.commandOptions.options);
                commandOptionsArray.forEach((commandOption, index) => {
                    let commandOptionValue = this.useProvidedArguments[index] || "";
                    this.processCommandOptionValue(commandOption, commandOptionValue, (this.commandOptions.options || {})[commandOption] || {});
                });
            }
            if (this.commandOptions.namedOptions) {
                const commandOptionsArray = Object.keys(this.commandOptions.namedOptions);
                for (const commandOption of commandOptionsArray) {
                    const commandOptionArray = (0, helper_1.pickOption)(this.useProvidedArguments, commandOption, Object.keys(this.commandOptions.namedOptions || {}));
                    let commandOptionValue = "";
                    if (commandOptionArray.length) {
                        commandOptionValue = commandOptionArray.pop() || "";
                    }
                    this.processCommandOptionValue(commandOption, commandOptionValue, (this.commandOptions.namedOptions || {})[commandOption] || {});
                }
            }
            if (this.commandOptions.userInputOptions) {
                const rl = readline.createInterface(process_1.stdin, process_1.stdout);
                const userInputCommandOptionsArray = Object.keys(this.commandOptions.userInputOptions);
                const renderQuestion = (que, isRequired) => __awaiter(this, void 0, void 0, function* () {
                    return new Promise(resolve => {
                        rl.question(`\n${que}\n  `, _answer => {
                            if (isRequired && !_answer) {
                                return resolve(renderQuestion(que, isRequired));
                            }
                            resolve(_answer);
                        });
                    });
                });
                for (const commandOption of userInputCommandOptionsArray) {
                    let { description = "", question = "default question?", transformer, validator, validationMsg = "", required = false } = this.commandOptions.userInputOptions[commandOption];
                    let answer = "";
                    if (!question) {
                        question = "default question?";
                    }
                    answer = yield renderQuestion(question || "", required);
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
                const vsCliOChoiceSelector = new VsChoiceSelector_1.default(this.commandOptions.userChoiceOptions);
                const parsedCliOptions = yield vsCliOChoiceSelector.ask();
                if (parsedCliOptions) {
                    const parsedOptionsKeys = Object.keys(parsedCliOptions);
                    parsedOptionsKeys.forEach(parsedOptionName => {
                        const { value, validationMsg, description } = parsedCliOptions[parsedOptionName];
                        this.parsedArguments[parsedOptionName] = {
                            value,
                            validationMsg,
                            description
                        };
                    });
                }
            }
            return this.parsedArguments;
        });
    }
    /**
     * getOptionValue
     */
    getOptionValue(optionName) {
        return (this.parsedArguments[optionName] || {}).value || "";
    }
}
exports.default = VsCommandParser;

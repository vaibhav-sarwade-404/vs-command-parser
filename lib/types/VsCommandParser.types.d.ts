interface OptionBase {
    description?: string;
    transformer?: Function;
    validator?: Function;
    validationMsg?: string;
    required?: boolean;
}
interface ParsedArgumentsBase extends OptionBase {
    value: string;
    validationMsg: string;
    question?: string;
}
interface UserChoiceOptionBase extends OptionBase {
    question: string;
    choices: string[];
}
export declare type UserChoiceOption = {
    [key: string]: UserChoiceOptionBase;
};
export declare type ParsedUserChoiceOption = {
    [key: string]: ParsedArgumentsBase;
};
export declare type ParsedArguments = {
    [key: string]: ParsedArgumentsBase;
};
interface UserInputOptionBase extends OptionBase {
    question: string;
}
export declare type UserInputOption = UserInputOptionBase;
export declare type Option = OptionBase;
export declare type VsCommandParserOptions = {
    /**
     * Named options, order does not matter
     */
    namedOptions?: {
        [key: string]: Option;
    };
    /**
     * options, order matters to parse values
     */
    options?: {
        [key: string]: Option;
    };
    /**
     * options, order matters to parse values
     */
    userInputOptions?: {
        [key: string]: UserInputOption;
    };
    /**
     * Question with choices
     */
    userChoiceOptions?: UserChoiceOption;
};
export declare type ValidationField = {
    fieldName: string;
    validationMsg: string;
};
export {};

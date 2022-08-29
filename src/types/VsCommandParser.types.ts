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

export type UserChoiceOption = {
  [key: string]: UserChoiceOptionBase;
};

export type ParsedUserChoiceOption = {
  [key: string]: ParsedArgumentsBase;
};

export type ParsedArguments = {
  [key: string]: ParsedArgumentsBase;
};

interface UserInputOptionBase extends OptionBase {
  question: string;
}

export type UserInputOption = UserInputOptionBase;

export type Option = OptionBase;

export type VsCommandParserOptions = {
  /**
   * Named options, order does not matter
   */
  namedOptions?: { [key: string]: Option };
  /**
   * options, order matters to parse values
   */
  options?: { [key: string]: Option };

  /**
   * options, order matters to parse values
   */
  userInputOptions?: { [key: string]: UserInputOption };

  /**
   * Question with choices
   */
  userChoiceOptions?: UserChoiceOption;
};

export type ValidationField = {
  fieldName: string;
  validationMsg: string;
};

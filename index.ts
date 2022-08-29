import VsCommandParser from "./src";

(async () => {
  const commandParser = new VsCommandParser({
    options: {
      option1: {
        description: "option 1 description"
      },
      option2: {
        description: "option 2 description"
      }
    },
    namedOptions: {
      namedOptions1: {
        description: "option 1 description"
      },
      namedOptions2: {
        description: "option 2 description"
      }
    },
    userInputOptions: {
      userInputOptions1: {
        question: "que 1?",
        description: "option 1 description"
      },
      userInputOptions2: {
        question: "que 2?",
        description: "option 2 description"
      }
    },
    userChoiceOptions: {
      userChoiceOptions1: {
        question: "que 1?",
        choices: ["choice 1", "choice 2"],
        description: "option 1 description"
      },
      userChoiceOptions2: {
        question: "que 2?",
        choices: ["choice 1", "choice 2"],
        description: "option 2 description"
      }
    }
  });

  const ans = await commandParser.parse();
  console.log(ans);
})();

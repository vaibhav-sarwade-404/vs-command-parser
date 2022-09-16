const { copyFileSync, realpathSync, existsSync } = require("fs");
const path = require("path");

const buildDir = "lib";
const filesToMove = ["README.md"];

const resolvePath = relativePath =>
  path.resolve(realpathSync(process.cwd()), relativePath);

if (filesToMove.length) {
  for (const fileName of filesToMove) {
    const filePath = resolvePath(fileName);
    if (existsSync(filePath)) {
      const destFilePath = resolvePath(path.join(buildDir, fileName));
      copyFileSync(filePath, destFilePath);
    }
  }
}

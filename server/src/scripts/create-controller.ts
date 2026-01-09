import fs from "fs";
import path from "path";

const rawName = process.argv[2];

if (!rawName) {
  console.error("❌ Please provide a controller name");
  process.exit(1);
}

const name = rawName.toLowerCase();

const fileName = `${name}.controller.ts`;
const targetDir = path.join(__dirname, "../controllers"); // ✅ src/controllers
const filePath = path.join(targetDir, fileName);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(filePath)) {
  console.error("❌ Controller already exists");
  process.exit(1);
}

const controllerVar = `${name}Controller`;

const content = `import { Request, Response } from "express";

export const ${controllerVar} = {
  async example(req: Request, res: Response) {
    return res.json({ message: "${name} controller works" });
  }
};
`;

fs.writeFileSync(filePath, content, "utf8");
console.log(`✅ Controller created: src/controllers/${fileName}`);

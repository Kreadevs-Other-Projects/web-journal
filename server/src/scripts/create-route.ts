import fs from "fs";
import path from "path";

const rawName = process.argv[2];

if (!rawName) {
  console.error("❌ Please provide a route name");
  process.exit(1);
}

const name = rawName.toLowerCase();

const fileName = `${name}.route.ts`;

const targetDir = path.join(__dirname, "../routes");
const filePath = path.join(targetDir, fileName);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(filePath)) {
  console.error("❌ Route already exists");
  process.exit(1);
}

const controllerVar = `${name}Controller`;

const content = `import { Router } from "express";
import { ${controllerVar} } from "../controllers/${name}.controller";

const router = Router();

router.get("/", ${controllerVar}.example);

export default router;
`;

fs.writeFileSync(filePath, content, "utf8");
console.log(`✅ Route created: src/routes/${fileName}`);

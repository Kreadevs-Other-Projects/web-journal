import fs from "fs";
import path from "path";

const rawName = process.argv[2];

if (!rawName) {
  console.error("❌ Please provide a service name");
  process.exit(1);
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const className = `${capitalize(rawName)}Service`;
const fileName = `${rawName}.service.ts`;

// ✅ IMPORTANT: from src/scripts -> go to src/services
const targetDir = path.join(__dirname, "../services");
const filePath = path.join(targetDir, fileName);

// ✅ ensure directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(filePath)) {
  console.error("❌ Service already exists");
  process.exit(1);
}

const content = `export class ${className} {
  async example() {
    return "${rawName} service works";
  }
}
`;

fs.writeFileSync(filePath, content, "utf8");
console.log(`✅ Service created: src/services/${fileName}`);

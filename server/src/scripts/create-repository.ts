import fs from "fs";
import path from "path";

const rawName = process.argv[2];

if (!rawName) {
  console.error("❌ Please provide a repository name");
  process.exit(1);
}

const name = rawName.toLowerCase();

const fileName = `${name}.repository.ts`;
const targetDir = path.join(__dirname, "../repositories"); // ✅ src/repositories
const filePath = path.join(targetDir, fileName);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(filePath)) {
  console.error("❌ Repository already exists");
  process.exit(1);
}

const className = `${name.charAt(0).toUpperCase() + name.slice(1)}Repository`;

const content = `export class ${className} {
  // TODO: inject db/pool here if needed
  async example() {
    return "${name} repository works";
  }
}
`;

fs.writeFileSync(filePath, content, "utf8");
console.log(`✅ Repository created: src/repositories/${fileName}`);

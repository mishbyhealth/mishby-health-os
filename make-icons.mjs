// make-icons.mjs
import sharp from "sharp";
import fs from "fs";

const sizes = [192, 512];
const svgFile = "./public/gw-logo.svg";

if (!fs.existsSync(svgFile)) {
  console.error("SVG logo not found at", svgFile);
  process.exit(1);
}

for (const size of sizes) {
  const outPath = `./public/gw-logo-${size}.png`;
  sharp(svgFile)
    .resize(size, size)
    .png()
    .toFile(outPath)
    .then(() => console.log(`Created ${outPath}`))
    .catch(err => console.error("Error creating", outPath, err));
}

// Also make favicon.ico
sharp(svgFile)
  .resize(32, 32)
  .toFile("./public/favicon.ico")
  .then(() => console.log("Created ./public/favicon.ico"));

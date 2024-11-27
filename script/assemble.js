const fs = require("fs");
const cheerio = require("cheerio");

const bundlejsPath = "dist/bundle.js";
const bundlecssPath = "dist/main.css";
const bundleHtmlPath = "dist/index.html";

const outputHtmlPath = "dist/bundle.html";

// 读取 HTML 文件
fs.readFile(bundleHtmlPath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  // 使用 cheerio 解析 HTML
  const $ = cheerio.load(data);

  // 移除所有现有的 <script> 标签
  $("script").remove();
  $("link").remove();

  // 读取 bundle.css 文件的内容
  const bundlecssContent = fs.readFileSync(bundlecssPath, "utf8");

  const styleTag = `<style>
    ${bundlecssContent}
    </style>`;

  $("head").append(styleTag);

  // 读取 bundle.js 文件的内容
  const bundlejsContent = fs.readFileSync(bundlejsPath, "utf8");

  // 创建新的 <script> 标签
  const scriptTag = `<script>
  ${bundlejsContent}
  </script>`;

  // 将新的 <script> 标签插入到 <body> 底部
  $("body").append(scriptTag);

  // 将修改后的 HTML 输出到新的文件（或者覆盖原文件）
  fs.writeFile(outputHtmlPath, $.html(), "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    console.log("File has been updated with the new script tag.");
  });
});

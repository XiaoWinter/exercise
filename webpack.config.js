const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  // 入口文件
  entry: './src/index.ts',
  optimization: {
    splitChunks: {
      chunks: 'all', // 如果你希望 JS 和 CSS 在单独的文件里，可以选择按需拆分
    },
  },
  // 输出配置
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true, // 构建时清理 /dist 文件夹
  },
  
  // 开发模式
  mode: 'development',
  
  // 开发服务器配置
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 3000,
    open: true, // 自动打开浏览器
    hot: true,  // 开启热更新
  },
  
  // 模块规则
  module: {
    rules: [
      // TypeScript 加载器
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // SCSS 加载器
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader, // 提取 CSS 为单独文件
          'css-loader',                // 解析 CSS 文件
          {
            loader: "sass-loader",
            options: {
              // Prefer `dart-sass`, even if `sass-embedded` is available
              implementation: require("sass"),
            },
          },
        ],
      },
      // HTML 加载器
      {
        test: /\.html$/,
        use: 'html-loader',
      },
    ],
  },
  
  // 插件配置
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // 指定 HTML 模板
      inject: 'head', // 将 JS 和 CSS 文件嵌入到头部
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css', // 输出的 CSS 文件名
    }),
  ],
  
  // 文件解析
  resolve: {
    extensions: ['.ts', '.js'], // 自动解析 .ts 和 .js 文件
  },
};

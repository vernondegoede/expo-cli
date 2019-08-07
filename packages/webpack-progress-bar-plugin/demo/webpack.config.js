const path = require('path');

const WebpackProgressBar = require('../build/ProgressBar').default;

let lastProgress;

const config = (name, color) => ({
  mode: 'production',
  context: __dirname,
  devtool: false,
  target: 'node',
  entry: './index.js',
  stats: false,
  output: {
    filename: './output.js',
    path: path.join(__dirname, '/dist'),
  },
  module: {
    rules: [{ test: /\.js$/, use: path.resolve(__dirname, 'test-loader.js') }],
  },
  plugins: [
    new WebpackProgressBar({
      // color,
      // name,
      reporters: [
        'fancy',
        // 'basic',
        'profile',
        // 'stats',
      ],
      // reporter: {
      //   progress({ state }) {
      //     if (lastProgress !== state.progress && state.progress % 5 === 0) {
      //       process.stderr.write(state.progress + '%\n');
      //       lastProgress = state.progress;
      //     }
      //   },
      // },
    }),
  ],
});

module.exports = [
  config('OrangeBar', 'orange'),
  // config('GreenBar', 'green')
];
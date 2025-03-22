const path = require("path");

module.exports = {
    entry: {
        LoginContent: "./LoginContent.js", // Entry for LoginContent
        SignUpContent: "./SignUpContent.js", // Entry for SignUpContent
    },
    output: {
        filename: "[name].bundle.js", // Generates login.bundle.js & signup.bundle.js
        path: path.resolve(__dirname, "dist"),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
        ],
    },
    mode: "production",
};

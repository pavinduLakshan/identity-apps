/**
 * Copyright (c) 2020, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const DeploymentConfig = require("../public/deployment.config.json");

const STATIC_DIRECTORY_NAME = "public";
const UN_MINIFIED_THEME_STYLESHEET_NAME = "theme.css";
const MINIFIED_THEME_STYLESHEET_NAME = "theme.min.css";

module.exports = {
    addons: [
        "@storybook/addon-links",
        "@storybook/addon-actions",
        "@storybook/addon-viewport",
        {
            name: "@storybook/addon-docs",
            options: {
                babelOptions: {},
                configureJSX: true,
                sourceLoaderOptions: null,
                transcludeMarkdown: true
            }
        },
        "@storybook/addon-controls",
        "@storybook/addon-backgrounds",
        "@storybook/addon-toolbars",
        "@storybook/addon-measure",
        "@storybook/addon-outline",
        "@nx/react/plugins/storybook",
        "@storybook/addon-essentials"
    ],
    previewHead: head => `
        ${head}
        <link rel="stylesheet" href="${RELATIVE_PATHS.storybookDefaultTheme}" />
    `,
    staticDirs: [ path.resolve(__dirname, "..", STATIC_DIRECTORY_NAME) ],
    stories: [
        "../src/**/*.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    webpackFinal: async config => {
        config.plugins.push(
            new CopyWebpackPlugin({
                patterns: [
                    {
                        force: true,
                        from: ABSOLUTE_PATHS.themes,
                        to({ context, absoluteFilename }) {
                            const fileName = absoluteFilename.split("/").pop();
                            let moderatedAbsoluteFileName = absoluteFilename;

                            if (fileName.startsWith("theme.")) {
                                if (fileName.endsWith(".min.css")) {
                                    moderatedAbsoluteFileName = moderatedAbsoluteFileName.replace(
                                        fileName,
                                        MINIFIED_THEME_STYLESHEET_NAME
                                    );
                                } else if (fileName.endsWith(".css")) {
                                    moderatedAbsoluteFileName = moderatedAbsoluteFileName.replace(
                                        fileName,
                                        UN_MINIFIED_THEME_STYLESHEET_NAME
                                    );
                                }
                            }

                            return `${
                                ABSOLUTE_PATHS.storybookThemes
                            }/${path.relative(
                                context,
                                moderatedAbsoluteFileName
                            )}`;
                        }
                    }
                ]
            })
        );

        config.resolve.plugins = [
            ...(config.resolve.plugins || []),
            new TsconfigPathsPlugin({
                configFile: path.resolve(__dirname, "tsconfig.json"),
                extensions: config.resolve.extensions
            })
        ];

        config.resolve.fallback = {
            crypto: false,
            path: require.resolve("path-browserify")
        };

        return config;
    },

    framework: {
        name: "@storybook/react-webpack5",
        options: {}
    },

    docs: {
        autodocs: true
    },

    typescript: {
        reactDocgen: "react-docgen-typescript"
    }
};

/**
 * Get paths relative to the root directory.
 * @param env - Node environment.
 * @param context - Configs etc.
 * @returns Set of paths relative to the root directory.
 */
const getRelativePaths = (env, context) => {
    const defaultTheme = context.config.theme.name || "default";

    return {
        source: "src",
        staticDirectory: STATIC_DIRECTORY_NAME,
        // Default theme relative to the static directory. (public)
        storybookDefaultTheme: path.join(
            "themes",
            defaultTheme,
            MINIFIED_THEME_STYLESHEET_NAME
        ),
        storybookHelpers: "storybook-helpers",
        storybookPreviewHeader: "preview-head.html",
        storybookThemes: path.join(STATIC_DIRECTORY_NAME, "themes"),
        themes: path.join(
            "node_modules",
            "@wso2is",
            "theme",
            "dist",
            "lib",
            "themes"
        )
    };
};

/**
 * Get absolute paths.
 * Get paths relative to the root directory.
 * @param env - Node environment.
 * @param context - Configs etc.
 * @returns Set of absolute paths.
 */
const getAbsolutePaths = (env, context) => {
    const RELATIVE_PATHS = getRelativePaths(env, context);

    return {
        libNodeModules: path.resolve(__dirname, "..", "node_modules"),
        libSource: path.resolve(__dirname, "..", RELATIVE_PATHS.source),
        storybookHelpers: path.resolve(
            __dirname,
            "..",
            RELATIVE_PATHS.source,
            RELATIVE_PATHS.storybookHelpers
        ),
        storybookPreviewHeader: path.resolve(
            __dirname,
            RELATIVE_PATHS.storybookPreviewHeader
        ),
        storybookThemes: path.resolve(
            __dirname,
            "..",
            RELATIVE_PATHS.storybookThemes
        ),
        themes: path.resolve(__dirname, "..", RELATIVE_PATHS.themes),
        tsconfig: path.resolve(__dirname, "..", "tsconfig.json")
    };
};

const ABSOLUTE_PATHS = getAbsolutePaths(process.env.NODE_ENV, {
    config: DeploymentConfig
});

const RELATIVE_PATHS = getRelativePaths(process.env.NODE_ENV, {
    config: DeploymentConfig
});

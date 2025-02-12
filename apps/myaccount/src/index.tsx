/**
 * Copyright (c) 2019-2023, WSO2 LLC. (https://www.wso2.com).
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

import { AuthParams, AuthProvider, ResponseMode, SPAUtils } from "@asgardeo/auth-react";
import { ContextUtils, StringUtils } from "@wso2is/core/utils";
import { Config } from "@wso2is/selfcare.core.v1/configs/app";
import AppSettingsProvider from "@wso2is/selfcare.core.v1/providers/app-settings-provider";
import { store } from "@wso2is/selfcare.core.v1/store";
import axios, { AxiosResponse } from "axios";
import * as React from "react";
import "react-app-polyfill/ie11";
import "react-app-polyfill/ie9";
import "react-app-polyfill/stable";
import ReactDOM, { Root } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PreLoader } from "./components/pre-loader";
import { ProtectedApp } from "./protected-app";
import { getAuthInitializeConfig } from "./utils";

// Set the runtime config in the context.
ContextUtils.setRuntimeConfig(Config.getDeploymentConfig());

const getAuthParams = (): Promise<AuthParams> => {
    if (!SPAUtils.hasAuthSearchParamsInURL()
        && Config.getDeploymentConfig()?.idpConfigs?.responseMode === ResponseMode.formPost) {

        const contextPath: string = window[ "AppUtils" ].getConfig().appBase
            ? `/${ StringUtils.removeSlashesFromPath(window[ "AppUtils" ].getConfig().appBase) }`
            : "";

        return axios.get(contextPath + "/auth").then((response: AxiosResponse) => {
            return Promise.resolve({
                authorizationCode: response?.data?.authCode,
                sessionState: response?.data?.sessionState,
                state: response?.data?.state
            });
        });
    }

    return;
};

/**
 * Render root component with configs.
 *
 * @returns Root element with configs.
 */
const RootWithConfig = () => {

    const [ ready, setReady ] = React.useState(false);

    React.useEffect(() => {
        if (window["AppUtils"]) {
            setReady(true);

            return;
        }

        setReady(false);
    }, [ window["AppUtils"] ]);

    if (!ready) {
        return <PreLoader />;
    }

    return (
        <AppSettingsProvider>
            <Provider store={ store }>
                <BrowserRouter>
                    <AuthProvider
                        config={
                            getAuthInitializeConfig()
                        }
                        fallback={ <PreLoader /> }
                        getAuthParams={ getAuthParams }
                    >
                        <ProtectedApp />
                    </AuthProvider>
                </BrowserRouter>
            </Provider>
        </AppSettingsProvider>
    );
};

const root: Root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);

root.render(<RootWithConfig />);

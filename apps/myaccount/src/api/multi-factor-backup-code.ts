/**
 * Copyright (c) 2022, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
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

import { AsgardeoSPAClient } from "@asgardeo/auth-react";
import { HttpMethods } from "@wso2is/core/models";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { store } from "../store";
 
/**
 * Get an axios instance.
 *
 * @type {AxiosHttpClientInstance}
 */
const httpClient = AsgardeoSPAClient.getInstance().httpRequest.bind(AsgardeoSPAClient.getInstance());
 
/**
 * The action types of the backu code post endpoint
 */
enum PostBackupCodeActions {
INIT = "INIT",
REFRESH = "REFRESH"
}
 
/**
 * Refresh backup codes of the authenticated user
 */
export const refreshBackupCode = (): Promise<any> => {
    const requestConfig = {
        data: {
            action: PostBackupCodeActions.REFRESH
        },
        headers: {
            "Access-Control-Allow-Origin": store.getState()?.config?.deployment?.clientHost,
            "Content-Type": "application/json"
        },
        method: HttpMethods.POST,
        url: store.getState().config.endpoints.backupCode
    };
 
    return httpClient(requestConfig)
        .then((response) => {
            if (response.status !== 200) {
                return Promise.reject(`An error occurred. The server returned ${response.status}`);
            } else {
                return Promise.resolve(response);
            }
        })
        .catch((error) => {
            return Promise.reject(error);
        });
};
 
/**
 * Generate backup codes the authenticated user
 */
export const initBackupCode = (): Promise<any> => {
     
    const requestConfig = {
        data: {
            action: PostBackupCodeActions.INIT
        },
        headers: {
            "Access-Control-Allow-Origin": store.getState()?.config?.deployment?.clientHost,
            "Content-Type": "application/json"
        },
        method: HttpMethods.POST,
        url: store.getState().config.endpoints.backupCode
    };
 
    return httpClient(requestConfig)
        .then((response) => {
            if (response.status !== 200) {
                return Promise.reject(`An error occurred. The server returned ${response.status}`);
            }
            return Promise.resolve(response);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
};
 
/**
 * This API is used to delete backup codes of the authenticated user.
 */
export const deleteBackupCode = (): Promise<any> => {
    const requestConfig = {
        headers: {
            "Access-Control-Allow-Origin": store.getState()?.config?.deployment?.clientHost,
            "Content-Type": "application/json"
        },
        method: HttpMethods.DELETE,
        url: store.getState().config.endpoints.backupCode
    };
 
    return httpClient(requestConfig)
        .then((response) => {
            if (response.status !== 200) {
                return Promise.reject(`An error occurred. The server returned ${response.status}`);
            }
 
            return Promise.resolve(response);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
};
 
/**
 * This API is used to retrieve backup codes of the authenticated user.
 */
export const getBackupCodes = (): Promise<any> => {
    const requestConfig = {
       headers: {
            "Access-Control-Allow-Origin": store.getState()?.config?.deployment?.clientHost,
            "Content-Type": "application/json"
        },
        method: HttpMethods.GET,
        url: store.getState().config.endpoints.backupCode
    };
 
    return httpClient(requestConfig)
        .then((response) => {
            if (response.status !== 200) {
                return Promise.reject(`An error occurred. The server returned ${response.status}`);
            }
            return Promise.resolve(response);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
};

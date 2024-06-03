/**
 * Copyright (c) 2022-2024, WSO2 LLC. (https://www.wso2.com).
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

import { RouteInterface } from "@wso2is/core/models";
import { AuthLayout as AuthLayoutSkeleton } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { PreLoader } from "../components";
import { getAuthLayoutRoutes } from "../configs";
import { AppConstants } from "../constants";

/**
 * Auth layout props interface.
 */
interface AuthLayoutPropsInterface {
    /**
     * Is layout fluid.
     */
    fluid?: boolean;
}

/**
 * Implementation of the Auth layout skeleton.
 * Used to render the authentication related components.
 *
 * @param props - Props injected to the component.
 * @returns Auth Layout component.
 */
export const AuthLayout: FunctionComponent<AuthLayoutPropsInterface> = (
    props: AuthLayoutPropsInterface
): ReactElement => {

    const { fluid } = props;

    const isAuthenticated: boolean = useSelector((state: any) => state.authenticationInformation.isAuth);

    const [ authLayoutRoutes, setAuthLayoutRoutes ] = useState<RouteInterface[]>(getAuthLayoutRoutes());

    /**
     * Listen for base name changes and updated the layout routes.
     */
    useEffect(() => {
        setAuthLayoutRoutes(getAuthLayoutRoutes());
    }, [ AppConstants.getTenantQualifiedAppBasename() ]);

    return (
        <AuthLayoutSkeleton fluid={ fluid }>
            <Suspense fallback={ <PreLoader /> }>
                <Routes>
                    {
                        authLayoutRoutes.map((route: RouteInterface, index: number) => (
                            route.redirectTo
                                ? (<Route
                                    path="*"
                                    element={
                                        <Navigate to={ route.redirectTo } key={ index } />
                                    }
                                    key={ index }>
                                </Route>)
                                :
                                route.protected
                                    ? (
                                        <Route
                                            path={ route.path }
                                            element={
                                                isAuthenticated && route.component
                                                    ? <route.component />
                                                    : <Navigate to={ AppConstants.getAppLoginPath() } />
                                            }
                                            key={ index }
                                        />
                                    )
                                    : (
                                        <Route
                                            path={ route.path }
                                            element={
                                                route.component
                                                    ? <route.component />
                                                    : null
                                            }
                                            key={ index }
                                        />
                                    )
                        ))
                    }
                </Routes>
            </Suspense>
        </AuthLayoutSkeleton>
    );
};

/**
 * Default props for the auth layout.
 */
AuthLayout.defaultProps = {
    fluid: true
};

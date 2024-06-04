/**
 * Copyright (c) 2019, WSO2 LLC. (https://www.wso2.com).
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
import { ContentLoader, ErrorLayout as ErrorLayoutSkeleton } from "@wso2is/react-components";
import React, { FunctionComponent, PropsWithChildren, ReactElement, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { getErrorLayoutRoutes } from "../configs";
import { AppConstants } from "../constants";

/**
 * Error layout Prop types.
 */
export interface ErrorLayoutPropsInterface {
    /**
     * Is layout fluid.
     */
    fluid?: boolean;
}

/**
 * Implementation of the error layout skeleton.
 * Used to render error pages.
 *
 * @param props - Props injected to the component.
 *
 * @returns Error page layout.
 */
export const ErrorLayout: FunctionComponent<PropsWithChildren<ErrorLayoutPropsInterface>> = (
    props: PropsWithChildren<ErrorLayoutPropsInterface>
): ReactElement => {

    const { fluid } = props;

    const isAuthenticated: boolean = useSelector((state: any) => state.authenticationInformation.isAuth);

    const [ errorLayoutRoutes, setErrorLayoutRoutes ] = useState<RouteInterface[]>(getErrorLayoutRoutes());

    /**
     * Listen for base name changes and updates the layout routes.
     */
    useEffect(() => {
        setErrorLayoutRoutes(getErrorLayoutRoutes());
    }, [ AppConstants.getTenantQualifiedAppBasename() ]);

    return (
        <ErrorLayoutSkeleton fluid={ fluid }>
            <Suspense fallback={ <ContentLoader dimmer/> }>
                <Routes>
                    {
                        errorLayoutRoutes.map((route: RouteInterface, index: number) => (
                            route.redirectTo
                                ? <Navigate to={ route.redirectTo } key={ index } />
                                : route.protected
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
                                            element={ <route.component /> }
                                            key={ index }
                                        />
                                    )
                        ))
                    }
                </Routes>
            </Suspense>
        </ErrorLayoutSkeleton>
    );
};

/**
 * Default props for the component.
 */
ErrorLayout.defaultProps = {
    fluid: true
};

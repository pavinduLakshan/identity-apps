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

import AppShell from "@oxygen-ui/react/AppShell";
import { AlertInterface, RouteInterface } from "@wso2is/core/models";
import { initializeAlertSystem } from "@wso2is/core/store";
import {
    Alert,
    ContentLoader
} from "@wso2is/react-components";
import React, {
    FunctionComponent,
    ReactElement,
    Suspense,
    useEffect,
    useState
} from "react";
import { System } from "react-notification-system";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { Dispatch } from "redux";
import { Header } from "../components";
import {
    getDefaultLayoutRoutes
} from "../configs";
import { AppConstants, UIConstants } from "../constants";
import { AppState } from "../store";

/**
 * Default page layout.
 *
 * @param props - Props injected to the default page layout component.
 *
 * @returns Dashboard Layout.
 */
export const DefaultLayout: FunctionComponent = (): ReactElement => {
    const dispatch: Dispatch = useDispatch();

    const alert: AlertInterface = useSelector(
        (state: AppState) => state.global.alert
    );
    const alertSystem: System = useSelector(
        (state: AppState) => state.global.alertSystem
    );
    const isAuthenticated: boolean = useSelector((state: any) => state.authenticationInformation.isAuth);

    const [ defaultLayoutRoutes, setDefaultLayoutRoutes ] = useState<
        RouteInterface[]
    >(getDefaultLayoutRoutes());

    /**
     * Listen for base name changes and updated the layout routes.
     */
    useEffect(() => {
        setDefaultLayoutRoutes(getDefaultLayoutRoutes());
    }, [ AppConstants.getTenantQualifiedAppBasename() ]);

    const handleAlertSystemInitialize = (system: System) => {
        dispatch(initializeAlertSystem(system));
    };

    return (
        <>
            <Alert
                dismissInterval={ UIConstants.ALERT_DISMISS_INTERVAL }
                alertsPosition="br"
                alertSystem={ alertSystem }
                alert={ alert }
                onAlertSystemInitialize={ handleAlertSystemInitialize }
                withIcon={ true }
            />
            <AppShell header={ <Header /> }>
                <Suspense fallback={ <ContentLoader dimmer={ false } /> }>
                    <Routes>
                        { defaultLayoutRoutes.map((route: RouteInterface, index: number) =>
                            route.redirectTo ? (
                                <Navigate to={ route.redirectTo } key={ index } />
                            ) : route.protected ? (
                                <Route
                                    path={ route.path }
                                    element={
                                        isAuthenticated && route.component
                                            ? <route.component />
                                            : <Navigate to={ AppConstants.getAppLoginPath() } />
                                    }
                                    key={ index }
                                />
                            ) : (
                                <Route
                                    path={ route.path }
                                    element={    route.component ? (
                                        <route.component />
                                    ) : null
                                    }
                                    key={ index }
                                />
                            )
                        ) }
                    </Routes>
                </Suspense>
            </AppShell>
        </>
    );
};

/**
 * Default props for the default layout.
 */
DefaultLayout.defaultProps = {
    fluid: false
};

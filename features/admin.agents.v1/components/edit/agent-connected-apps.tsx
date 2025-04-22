/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
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

import { CardActions, Grid, Typography } from "@mui/material";
import Box from "@oxygen-ui/react/Box";
import Card from "@oxygen-ui/react/Card";
import CardContent from "@oxygen-ui/react/CardContent";
import { useApplicationList } from "@wso2is/admin.applications.v1/api/application";
import { APIAuthorization } from "@wso2is/admin.applications.v1/components/api-authorization/api-authorization";
import { getEmptyPlaceholderIllustrations } from "@wso2is/admin.core.v1/configs/ui";
import { EmphasizedSegment, Message } from "@wso2is/react-components";
import { EmptyPlaceholder, PrimaryButton } from "@wso2is/react-components/src/components";
import React, { ReactElement, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon, Input } from "semantic-ui-react";

export default function AgentConnectedApps () {

    const { t } = useTranslation();
    
    const [ apps, setApps ] = useState([
        { configured: false, description: "Legacy API that connects to an old enterprise CRM system.",
            id: 1, name: "Legacy CRM" },
        { configured: true,id: 3, name: "Supplier Management API",
            description: "API for managing supplier information and transactions." },
        { configured: true, description: "Secure API for B2B communication and data exchange.",
            id: 4, name: "B2B API Connector" },
        { configured: false, id: 5, name: "ERP Analytics API",
            description: "API for fetching and analyzing analytics data." },
        { configured: false, id: 6, name: "E-commerce Backend API",
            description: "API that handles e-commerce product, order, and payment data." },
        { configured: true, description: "API for managing IoT devices and their data remotely.",
            id: 8, name: "IoT Device Manager" }
    ]);

    const {
        data: applicationListData,
        isLoading: isApplicationListRequestLoading,
        error: applicationListFetchRequestError
    } = useApplicationList(
        "templateId",
        null,
        null,
        null,
        true,
        true
    );

    console.log(applicationListData);
    const [ trigger, setTrigger ] = useState(false);

    const manageAppConnection = (appId: number) => {
        console.log(appId);
        const appsCopy = apps;
        const index = appsCopy.findIndex((app: any) => app.id === appId);

        if (index !== -1) {
            appsCopy[index].configured = !appsCopy[index].configured; // Toggle the value
        }

        setApps(appsCopy);
        setTrigger(!trigger);
    };

    /**
     * Shows list placeholders.
     *
     * @returns Placeholder component.
     */
    const showPlaceholders = (): ReactElement => {
      
        return (
            <div style={{ display: "flex", width: "100vw", marginTop: "3%", flexDirection: "row", justifyContent: "center"}}>
            <EmptyPlaceholder
                data-testid={ `-empty-placeholder` }
                image={ getEmptyPlaceholderIllustrations().newList }
                imageSize="tiny"
                title={ "No applications found" }
                subtitle={ [
                    "There are currently no applications for this agent to connect" as ReactNode
                ] }
            />
            </div>

        );
    };

    // return (
    //     <APIAuthorization
    //                                 templateId={ "custom-oidc-application" }
    //                                 readOnly={ false }
    //                                 usedInAgentTemplate={ true }
    //                             />
    // )
    return (
        <EmphasizedSegment padded="very" style={ { border: "none", padding: "21px" } }>



<Box display="flex" justifyContent="space-between">
<div>
                <Typography variant="h5">
                Applications
            </Typography>
            <Typography variant="body1" className="mt-2 mb-5" style={ { color: "#9c9c9c" } }>
                Enable this agent to access and interact with applications.
            </Typography>
            </div>
            <PrimaryButton
                            data-testid="user-mgt-groups-list-update-button"
                            onClick={ () => null }
                            style={{ padding: "1.7%", height: "50%"}}
                        >
                            <Icon name="plus"/>
                            Connect application
                        </PrimaryButton>
</Box>



            <Input
                data-testid="user-mgt-groups-list-search-input"
                icon={ <Icon name="search"/> }
                onChange={ null }
                placeholder={ "Search applications" }
                floated="left"
                size="large"
                style={ { width: "60%", marginBottom: "25px" } }
            />

            <Grid container spacing={ 2 }>
                { applicationListData?.applications?.length > 0 ?
                
                    applicationListData?.applications?.map((integration: any) =>
 (
                        <Grid
                            item
                            xs={ 12 }
                            sm={ 6 }
                            md={ 4 }
                            key={ integration.id }
                        >
                            <Card
                                style={ { cursor: "pointer" } }
                            >
                                <CardContent style={ { minHeight: "80px", paddingLeft: 0 } }>
                                    <Typography variant="h5">{ integration.name }</Typography>
                                    <Typography variant="body1">{ integration.templateId }</Typography>
                                    <Typography variant="body2" className="mt-1" style={ { color: "orange" } }>
                                        { integration?.configured && (<>
                                            <Icon name="check circle" />
                                    Connected
                                        </>) }
                                    </Typography>
                                </CardContent>
                                <CardActions style={ { paddingLeft: 0 } }>
                                    <Typography
                                        style={ {
                                            color: "orange",
                                            cursor: "pointer"
                                        } }
                                        variant="body1"
                                        onClick={ () => manageAppConnection(integration?.id) }
                                    >
                                        { integration?.configured ? "Disconnect" : "Connect" }
                                    </Typography>
                                </CardActions>
                            </Card>
                        </Grid>
                    )) 
                :  showPlaceholders()
                }
            </Grid>
        </EmphasizedSegment>
    );
}

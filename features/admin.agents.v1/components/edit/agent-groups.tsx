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

import { Typography } from "@mui/material";
import { AdvancedSearchWithBasicFilters } from "@wso2is/admin.core.v1/components/advanced-search-with-basic-filters";
import { UIConstants } from "@wso2is/admin.core.v1/constants/ui-constants";
import { AppState } from "@wso2is/admin.core.v1/store";
import { APPLICATION_DOMAIN, INTERNAL_DOMAIN } from "@wso2is/admin.roles.v2/constants/role-constants";
import { PRIMARY_USERSTORE } from "@wso2is/admin.userstores.v1/constants";
import { RolesMemberInterface } from "@wso2is/core/models";
import { StringUtils } from "@wso2is/core/utils";
import { DataTable } from "@wso2is/react-components";
import { ListLayout } from "@wso2is/react-components";
import { Button, EmphasizedSegment } from "@wso2is/react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Grid, Icon, Input, Label, Table } from "semantic-ui-react";
import { UserGroupsListTable } from "@wso2is/admin.users.v1/components/user-groups-list"

export default function AgentGroups() {
    const { t } = useTranslation();

    const user = {
        "emails": [],
        "name": {
            "givenName": "",
            "familyName": ""
        },
        "meta": {
            "location": "https://localhost:9443/scim2/Users/e6a156ba-beff-471a-a02b-3cd9722fcdd2",
            "resourceType": "User"
        },
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
            "urn:scim:wso2:schema",
            "urn:scim:schemas:extension:custom:User"
        ],
        "roles": [
            {
                "audienceValue": "10084a8d-113f-4211-a0d5-efe36b082211",
                "display": "admin",
                "orgId": "",
                "orgName": "",
                "audienceType": "organization",
                "value": "f50bc6ba-928b-4c77-9598-9f6e394f7bef",
                "$ref": "https://localhost:9443/scim2/v2/Roles/f50bc6ba-928b-4c77-9598-9f6e394f7bef",
                "audienceDisplay": "Super"
            },
            {
                "audienceValue": "e2eb55d3-ac42-485a-aa09-9120c7a1ed4d",
                "display": "Administrator",
                "orgId": "",
                "orgName": "",
                "audienceType": "application",
                "value": "7d2e88b9-c3f8-43d3-98d3-3ac7dbcf5198",
                "$ref": "https://localhost:9443/scim2/v2/Roles/7d2e88b9-c3f8-43d3-98d3-3ac7dbcf5198",
                "audienceDisplay": "Console"
            },
            {
                "audienceValue": "10084a8d-113f-4211-a0d5-efe36b082211",
                "display": "everyone",
                "orgId": "",
                "orgName": "",
                "audienceType": "organization",
                "value": "995b7e43-e4fb-412e-b4ac-c94b82afbad5",
                "$ref": "https://localhost:9443/scim2/v2/Roles/995b7e43-e4fb-412e-b4ac-c94b82afbad5",
                "audienceDisplay": "Super"
            }
        ],
        "groups": [
            {
                "display": "Travel Agent",
                "value": "8a605d3b-4e4b-4b5f-a426-da31a6bdbdee",
                "$ref": "https://localhost:9443/scim2/Groups/8a605d3b-4e4b-4b5f-a426-da31a6bdbdee"
            }
        ],
        "id": "e6a156ba-beff-471a-a02b-3cd9722fcdd2",
        "userName": "admin"
    }

    return (<EmphasizedSegment padded="very" style={ { border: "none", padding: "21px" } }>
        <Typography variant="h4">
            Groups
        </Typography>
        <Typography variant="body1" className="mb-5" style={ { color: "#9c9c9c" } }>
            Add or remove the groups agent is assigned with and note that this will affect performing certain tasks.
        </Typography>

        {/* <EmphasizedSegment
            data-testid="user-mgt-groups-list"
            className="user-role-edit-header-segment"
            style={ { border: "none", paddingLeft: 0 } }
        >
            <Grid.Row>
                <Grid.Column>
                    <Input
                        data-testid="user-mgt-groups-list-search-input"
                        icon={ <Icon name="search"/> }
                        onChange={ null }
                        placeholder={ t("user:updateUser.groups." +
                                                    "editGroups.searchPlaceholder") }
                        floated="left"
                        size="small"
                    />

                    <Button
                        data-testid="user-mgt-groups-list-update-button"
                        size="medium"
                        icon="pencil"
                        floated="right"
                        onClick={ null }
                    />

                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Table singleLine compact>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>
                                <strong>
                                    { t("user:updateUser.groups." +
                                                                "editGroups.groupList.headers.0") }
                                </strong>
                            </Table.HeaderCell>
                            <Table.HeaderCell>
                                <strong>
                                    { t("user:updateUser.groups." +
                                                                "editGroups.groupList.headers.1") }
                                </strong>
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    { resolveTableContent() }
                </Table>
            </Grid.Row>
        </EmphasizedSegment> */}


<UserGroupsListTable
                handleOpenAddNewGroupModal={ () => null }
                handleUserUpdate={ () => null }
                isLoading={ false }
                isReadOnly={ false }
                user={ user }
                agentView={ true }
            />

    </EmphasizedSegment>);
}

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

import { Chip } from "@mui/material";
import Autocomplete, { AutocompleteChangeDetails, AutocompleteChangeReason, AutocompleteRenderGetTagProps, AutocompleteRenderInputParams } from "@oxygen-ui/react/Autocomplete";
import Checkbox from "@oxygen-ui/react/Checkbox";
import FormControlLabel from "@oxygen-ui/react/FormControlLabel";
import List from "@oxygen-ui/react/List";
import ListItem from "@oxygen-ui/react/ListItem";
import ListItemButton from "@oxygen-ui/react/ListItemButton";
import ListItemIcon from "@oxygen-ui/react/ListItemIcon";
import ListItemText from "@oxygen-ui/react/ListItemText";
import Paper from "@oxygen-ui/react/Paper";
import Radio from "@oxygen-ui/react/Radio";
import RadioGroup from "@oxygen-ui/react/RadioGroup";
import TextField from "@oxygen-ui/react/TextField";
import Typography from "@oxygen-ui/react/Typography";
import { RolesV2Interface } from "@wso2is/admin.roles.v2/models/roles";
import { RolesInterface } from "@wso2is/core/models";
import { Hint } from "@wso2is/react-components";
import { AnimatePresence, motion } from "framer-motion";
import React, { ChangeEvent, FunctionComponent, ReactElement, SyntheticEvent, useState } from "react";
import { DropdownProps, Header, Segment } from "semantic-ui-react";

/**
 * Interface for the User Sharing Form component.
 */
export interface UserSharingFormPropsInterface {
    /**
     * Initial value for the sharing option.
     */
    initialValue?: string;
    /**
     * Callback function to handle value changes.
     */
    onValueChange?: (value: string) => void;
    /**
     * Is the component disabled.
     */
    disabled?: boolean;
    /**
     * Is the component in read-only mode.
     */
    readOnly?: boolean;
    /**
     * Whether organizations are available to share with.
     */
    hasOrganizations?: boolean;
    /**
     * User object for role sharing.
     */
    user?: any;
    /**
     * Selected roles for sharing.
     */
    selectedRoles?: RolesInterface[];
    /**
     * Setter for selected roles.
     */
    setSelectedRoles?: (roles: RolesInterface[]) => void;
    /**
     * Callback for role changes.
     */
    onRoleChange?: (role: any, isSelected: boolean) => void;
    /**
     * Data component ID for testing.
     */
    ["data-componentid"]?: string;
}

/**
 * Sharing options for the user.
 */
const SHARING_OPTIONS = [
    {
        label: "Do not share the user with any organization",
        value: "no-share"
    },
    {
        label: "Share the user with all organizations",
        value: "share-all"
    },
    {
        label: "Share the user with selected organizations",
        value: "share-selected"
    }
];

/**
 * User sharing form component with radio button options.
 *
 * @param props - Props for the UserSharingForm component.
 * @returns The UserSharingForm component.
 */
export const UserSharingForm: FunctionComponent<UserSharingFormPropsInterface> = ({
    initialValue = "no-share",
    onValueChange,
    disabled = false,
    readOnly = false,
    hasOrganizations = true,
    user,
    selectedRoles = [],
    setSelectedRoles,
    onRoleChange,
    ["data-componentid"]: componentId = "user-sharing-form"
}: UserSharingFormPropsInterface): ReactElement => {

    const [ selectedValue, setSelectedValue ] = useState<string>(initialValue);
    const [ selectedOrgs, setSelectedOrgs ] = useState<any[]>([]);
    const [ selectedOrgForRoles, setSelectedOrgForRoles ] = useState<any>(null);

    // Mock organization data - this would come from props or API
    const mockOrganizations = [
        { id: "org1", name: "Organization A", displayName: "Organization A" },
        { id: "org2", name: "Organization B", displayName: "Organization B" },
        { id: "org3", name: "Organization C", displayName: "Organization C" },
        { id: "org4", name: "Organization D", displayName: "Organization D" }
    ];

    const handleValueChange = (value: string): void => {
        setSelectedValue(value);
        if (onValueChange) {
            onValueChange(value);
        }
    };

    const handleOrgToggle = (org: any) => {
        const isSelected = selectedOrgs.some(selectedOrg => selectedOrg.id === org.id);

        if (isSelected) {
            setSelectedOrgs(selectedOrgs.filter(selectedOrg => selectedOrg.id !== org.id));
            // If deselecting the currently viewed org, clear the role panel
            if (selectedOrgForRoles?.id === org.id) {
                setSelectedOrgForRoles(null);
            }
        } else {
            setSelectedOrgs([ ...selectedOrgs, org ]);
        }
    };

    const handleOrgClick = (org: any) => {
        setSelectedOrgForRoles(org);
    };

    return (
        <Segment padded="very" data-componentid={ componentId }>
            <Header as="h3" content="Sharing" />
            <Header.Subheader content="Choose how this user and their assigned roles will be shared with organizations." />

            <RadioGroup
                value={ selectedValue }
                onChange={ (event) => handleValueChange(event.target.value) }
                name="userSharingOption"
                data-componentid={ `${componentId}-radio-group` }
            >
                { SHARING_OPTIONS.map((option) => {
                    const isSelectedOrganizationsOption = option.value === "share-selected";
                    const shouldDisableOption = disabled || readOnly || (isSelectedOrganizationsOption && !hasOrganizations);

                    return (
                        <React.Fragment key={ option.value }>
                            <FormControlLabel
                                value={ option.value }
                                control={ <Radio disabled={ shouldDisableOption } /> }
                                label={ option.label }
                                data-componentid={ `${componentId}-radio-${option.value}` }
                            />
                            <AnimatePresence mode="wait">
                                {
                                    selectedValue === "share-all" && option.value === "share-all"
                                    && (
                                        <motion.div
                                            key="share-all-roles-block"
                                            initial={ { height: 0, opacity: 0 } }
                                            animate={ { height: "auto", opacity: 1 } }
                                            exit={ { height: 0, opacity: 0 } }
                                            transition={ { duration: 0.3 } }
                                            className="ml-5"
                                        >
                                            role selection controls for sharing with all organizations would appear here.
                                        </motion.div>
                                    )
                                }
                                {
                                    selectedValue === "share-selected" && option.value === "share-selected"
                                    && (
                                        <motion.div
                                            key="share-selected-orgs-block"
                                            initial={ { height: 0, opacity: 0 } }
                                            animate={ { height: "auto", opacity: 1 } }
                                            exit={ { height: 0, opacity: 0 } }
                                            transition={ { duration: 0.3 } }
                                            className="ml-5"
                                        >
                                            <div className="org-share-selected-container" style={ { display: "flex", gap: "20px", marginTop: "16px" } }>
                                                <div style={ { flex: 1 } }>
                                                    <Typography
                                                        variant="body2"
                                                        marginBottom={ 1 }
                                                    >
                                                        Select Organizations
                                                        <Hint inline popup>
                                                            Choose which organizations to share this user with
                                                        </Hint>
                                                    </Typography>
                                                    <Paper
                                                        variant="outlined"
                                                        style={ {
                                                            maxHeight: "300px",
                                                            overflow: "auto",
                                                            backgroundColor: "#fafafa"
                                                        } }
                                                    >
                                                        <List dense>
                                                            { mockOrganizations.map((org) => {
                                                                const isSelected = selectedOrgs.some(selectedOrg => selectedOrg.id === org.id);
                                                                const isActive = selectedOrgForRoles?.id === org.id;

                                                                return (
                                                                    <ListItem
                                                                        key={ org.id }
                                                                        disablePadding
                                                                        style={ {
                                                                            backgroundColor: isActive ? "#e3f2fd" : "transparent"
                                                                        } }
                                                                    >
                                                                        <ListItemButton
                                                                            onClick={ () => handleOrgClick(org) }
                                                                            disabled={ disabled || readOnly }
                                                                        >
                                                                            <ListItemIcon>
                                                                                <Checkbox
                                                                                    edge="start"
                                                                                    checked={ isSelected }
                                                                                    onChange={ () => handleOrgToggle(org) }
                                                                                    disabled={ disabled || readOnly }
                                                                                    onClick={ (e) => e.stopPropagation() }
                                                                                />
                                                                            </ListItemIcon>
                                                                            <ListItemText
                                                                                primary={ org.displayName || org.name }
                                                                            />
                                                                        </ListItemButton>
                                                                    </ListItem>
                                                                );
                                                            }) }
                                                        </List>
                                                        { mockOrganizations.length === 0 && (
                                                            <div style={ { padding: "16px", textAlign: "center" } }>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    No organizations available
                                                                </Typography>
                                                            </div>
                                                        ) }
                                                    </Paper>
                                                </div>
                                                <div style={ { flex: 1 } }>
                                                    <Typography
                                                        variant="body2"
                                                        marginBottom={ 1 }
                                                    >
                                                        { selectedOrgForRoles
                                                            ? `Select Roles for ${selectedOrgForRoles.displayName || selectedOrgForRoles.name}`
                                                            : "Select Roles for Organization"
                                                        }
                                                        <Hint inline popup>
                                                            Choose which roles to assign to this user in the selected organization
                                                        </Hint>
                                                    </Typography>
                                                    <div
                                                        style={ {
                                                            padding: "16px",
                                                            backgroundColor: selectedOrgForRoles ? "#f5f5f5" : "#fafafa",
                                                            border: "1px solid #e0e0e0",
                                                            borderRadius: "4px",
                                                            minHeight: "300px"
                                                        } }>
                                                        { selectedOrgForRoles ? (
                                                            <div>
                                                                <Typography variant="subtitle2" gutterBottom>
                                                                    { selectedOrgForRoles.displayName || selectedOrgForRoles.name }
                                                                </Typography>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    Role selection controls for this organization would appear here.
                                                                    Available user roles can be selected for sharing with this organization.
                                                                </Typography>
                                                            </div>
                                                        ) : (
                                                            <Typography variant="body2" color="textSecondary">
                                                                Click on an organization from the list to configure roles for that organization
                                                            </Typography>
                                                        ) }
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                }
                            </AnimatePresence>
                        </React.Fragment>
                    );
                }) }
            </RadioGroup>
        </Segment>
    );
};

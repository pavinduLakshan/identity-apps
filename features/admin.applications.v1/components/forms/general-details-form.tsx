/**
 * Copyright (c) 2020-2024, WSO2 LLC. (https://www.wso2.com).
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

import Chip from "@oxygen-ui/react/Chip";
import Link from "@oxygen-ui/react/Link";
import { PaletteIcon } from "@oxygen-ui/react-icons";
import { ApplicationTabComponentsFilter } from
    "@wso2is/admin.application-templates.v1/components/application-tab-components-filter";
import { AppConstants, AppState, UIConfigInterface, history } from "@wso2is/admin.core.v1";
import { ApplicationTabIDs, applicationConfig, userstoresConfig } from "@wso2is/admin.extensions.v1";
import { FeatureStatusLabel } from "@wso2is/admin.feature-gate.v1/models/feature-status";
import { OrganizationType } from "@wso2is/admin.organizations.v1/constants";
import { TestableComponentInterface } from "@wso2is/core/models";
import { URLUtils } from "@wso2is/core/utils";
import { Field, Form } from "@wso2is/form";
import {
    ContentLoader,
    DocumentationLink,
    EmphasizedSegment,
    Heading,
    Hint,
    Message,
    useDocumentation
} from "@wso2is/react-components";
import { FormValidation } from "@wso2is/validation";
import React, { FunctionComponent, ReactElement, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Divider, Grid } from "semantic-ui-react";
import GroupAssignment from "./application-audience";
import { useMyAccountStatus } from "../../api/application";
import { ApplicationManagementConstants } from "../../constants/application-management";
import { ApplicationInterface, DiscoverableGroup } from "../../models/application";

/**
 * Proptypes for the applications general details form component.
 */
interface GeneralDetailsFormPopsInterface extends TestableComponentInterface {
    /**
     * Application access URL.
     */
    accessUrl?: string;
    /**
     * Currently editing application id.
     */
    appId?: string;
    /**
     * Application description.
     */
    description?: string;
    /**
     * Is the application discoverable.
     */
    discoverability?: boolean;
    /**
     * Set of hidden fields.
     */
    hiddenFields?: string[];
    /**
     * Application logo URL.
     */
    imageUrl?: string;
    /**
     * Name of the application.
     */
    name: string;
    /**
     * On submit callback.
     */
    onSubmit: (values: any) => void;
    /**
     * Make the form read only.
     */
    readOnly?: boolean;
    /**
     * Specifies if the form is submitting.
     */
    isSubmitting?: boolean;
    /**
     * Specifies a Management Application
     */
    isManagementApp?: boolean;
    /**
     * Specifies whether having edit-permissions
     */
    hasRequiredScope?: boolean;
    /**
     * Application
     */
    application?: ApplicationInterface;
    /**
     * Is the Branding Section Hidden?
     */
    isBrandingSectionHidden?: boolean;
}

/**
 * Form values interface.
 */
export interface GeneralDetailsFormValuesInterface {
    /**
     * Application access URL.
     */
    accessUrl?: string;
    /**
     * Application description.
     */
    description?: string;
    /**
     * Is the application discoverable.
     */
    discoverableByEndUsers?: boolean;
    /**
     * Application logo URL.
     */
    imageUrl?: string;
    /**
     * Name of the application.
     */
    name: string;
}

/**
 * Proptypes for the applications general details form error messages.
 */
export interface GeneralDetailsFormErrorValidationsInterface {
    /**
     *  Error message for the Application access URL.
     */
    accessUrl?: string;
}

const FORM_ID: string = "application-general-details";

/**
 * Form to edit general details of the application.
 *
 * @param props - Props injected to the component.
 * @returns Functional component.
 */
export const GeneralDetailsForm: FunctionComponent<GeneralDetailsFormPopsInterface> = (
    props: GeneralDetailsFormPopsInterface
): ReactElement => {

    const {
        appId,
        name,
        description,
        discoverability,
        hiddenFields,
        imageUrl,
        accessUrl,
        onSubmit,
        readOnly,
        hasRequiredScope,
        isSubmitting,
        isManagementApp,
        application,
        isBrandingSectionHidden,
        [ "data-testid" ]: testId
    } = props;

    const { t } = useTranslation();

    const { getLink } = useDocumentation();

    const UIConfig: UIConfigInterface = useSelector((state: AppState) => state?.config?.ui);

    const [ isDiscoverable, setDiscoverability ] = useState<boolean>(discoverability);

    const [ discoverableGroups, setDiscoverableGroups ] = useState<DiscoverableGroup[]>([
        { groups: [], userStore: userstoresConfig.primaryUserstoreId }
    ]);

    const [ isMyAccountEnabled, setMyAccountStatus ] = useState<boolean>(AppConstants.DEFAULT_MY_ACCOUNT_STATUS);
    const [ isM2MApplication, setM2MApplication ] = useState<boolean>(false);

    const isSubOrg: boolean = window[ "AppUtils" ].getConfig().organizationName;
    const orgType: OrganizationType = useSelector((state: AppState) => state?.organization?.organizationType);
    const isSubOrganizationType: boolean = orgType === OrganizationType.SUBORGANIZATION;

    const {
        data: myAccountStatus,
        isLoading: isMyAccountStatusLoading
    } = useMyAccountStatus(!isSubOrg && applicationConfig?.advancedConfigurations?.showMyAccountStatus);

    /**
     * Build the pattern for the access URL placeholders.
     */
    const accessUrlPlaceholdersPattern: RegExp = useMemo(() => {
        let placeholdersPattern: string = "";

        ApplicationManagementConstants.FORM_FIELD_CONSTRAINTS.ACCESS_URL_ALLOWED_PLACEHOLDERS.forEach(
            (placeholder: string, index: number) => {
                if (index == 0) {
                    placeholdersPattern += placeholder;
                } else {
                    placeholdersPattern += `|${placeholder}`;
                }
            }
        );

        return new RegExp(placeholdersPattern, "g");
    }, []);

    /**
     * Prepare form values for submitting.
     *
     * @param values - Form values.
     * @returns Sanitized form values.
     */
    const updateConfigurations = (values: GeneralDetailsFormValuesInterface) => {
        onSubmit({
            accessUrl: values.accessUrl?.toString(),
            advancedConfigurations: {
                discoverableByEndUsers: values.discoverableByEndUsers,
                discoverableGroups: discoverableGroups
            },
            description: values.description?.toString().trim(),
            id: appId,
            name: values.name?.toString(),
            ...!hiddenFields?.includes("imageUrl") && { imageUrl: values.imageUrl?.toString() }
        });
    };

    /**
     * Validates the Form.
     *
     * @param values - Form Values.
     * @returns Form validation.
     */
    const validateForm = (values: GeneralDetailsFormValuesInterface):
        GeneralDetailsFormErrorValidationsInterface => {

        const errors: GeneralDetailsFormErrorValidationsInterface = {
            accessUrl: undefined
        };

        if (isDiscoverable && !values.accessUrl) {
            errors.accessUrl = t("applications:forms.generalDetails.fields.accessUrl" +
                ".validations.empty");
        }

        return errors;
    };

    /**
     * Application Name validation.
     *
     * @param name - Application Name.
     * @returns Name validation.
     */
    const validateName = (name: string): string | void => {

        const isValid: boolean = name && !!name.match(
            ApplicationManagementConstants.FORM_FIELD_CONSTRAINTS.APP_NAME_PATTERN
        );

        if (!isValid) {
            return "Please enter a valid input.";
        }
    };

    /**
     * Application Description validation.
     *
     * @param description - Application Description.
     * @returns Description validation.
     */
    const validateDescription = (description: string): string | void => {

        const isValid: boolean = description && !!description.match(
            ApplicationManagementConstants.FORM_FIELD_CONSTRAINTS.APP_DESCRIPTION_PATTERN
        );

        if (!isValid) {
            return "Please enter a valid input.";
        }
    };

    /**
     * Access URL may have placeholders like `${UserTenantHint}`, or `${organizationIdHint}`.
     * This function validates the Access URL after removing those placeholders.
     *
     * @param value - Access URL to be validated.
     * @returns Error message.
     */
    const validateAccessURL = (value: string): string => {
        /**
         * Use a regex to replace `${UserTenantHint}`, and `${organizationIdHint}` placeholders
         * while preserving other characters
         */
        const moderatedValue: string = value?.trim()?.replace(accessUrlPlaceholdersPattern, "");
        let errorMsg: string;

        if (moderatedValue && (!URLUtils.isURLValid(moderatedValue, true) || !FormValidation.url(moderatedValue))) {
            errorMsg = t("applications:forms.generalDetails.fields.accessUrl.validations.invalid");
        }

        return errorMsg;
    };

    /**
     * Checks whether this is an M2M application.
     */
    useEffect(() => {
        setM2MApplication(application?.templateId === ApplicationManagementConstants.M2M_APP_TEMPLATE_ID);
    }, [ application ]);

    /**
     * Sets the initial spinner.
     * TODO: Remove this once the loaders are finalized.
     */
    useEffect(() => {
        let status: boolean = AppConstants.DEFAULT_MY_ACCOUNT_STATUS;

        if (myAccountStatus) {
            const enableProperty: string = myAccountStatus["value"];

            if (enableProperty && enableProperty === "false") {

                status = false;
            }
        }

        setMyAccountStatus(status);
    }, [ isMyAccountStatusLoading ]);

    if (isMyAccountStatusLoading) {
        return (
            <EmphasizedSegment padded="very">
                <ContentLoader inline="centered" active/>
            </EmphasizedSegment>
        );
    }

    return (
        <Form
            id={ FORM_ID }
            uncontrolledForm={ true }
            onSubmit={ (values: GeneralDetailsFormValuesInterface) => {
                updateConfigurations(values);
            } }
            initialValues={ {
                accessUrl: accessUrl,
                description: description,
                name: name
            } }
            validate={ validateForm }
        >
            <Grid>
                <ApplicationTabComponentsFilter
                    tabId={ ApplicationTabIDs.GENERAL }
                >
                    { isManagementApp && (
                        <Grid.Row columns={ 1 }>
                            <Grid.Column mobile={ 16 } tablet={ 16 } computer={ 16 }>
                                <Message
                                    type="info"
                                    content={ (
                                        <>
                                            { t("applications:forms.generalDetails.managementAppBanner") }
                                            <DocumentationLink
                                                link={ getLink("develop.applications.managementApplication.learnMore") }
                                            >
                                                {
                                                    t("common:learnMore")
                                                }
                                            </DocumentationLink>
                                        </>
                                    ) }
                                />
                            </Grid.Column>
                        </Grid.Row>
                    ) }
                    { !UIConfig.systemAppsIdentifiers.includes(name) && !isSubOrganizationType && (
                        <Grid.Row columns={ 1 }>
                            <Grid.Column mobile={ 16 } tablet={ 16 } computer={ 16 }>
                                <Field.Input
                                    ariaLabel="Application name"
                                    inputType="name"
                                    name="name"
                                    label={
                                        t("applications:forms.generalDetails.fields.name" +
                                            ".label")
                                    }
                                    required={ true }
                                    placeholder={
                                        t("applications:forms.generalDetails.fields.name" +
                                            ".placeholder")
                                    }
                                    value={ name }
                                    readOnly={ readOnly || isSubOrganizationType }
                                    validation ={ (value: string) => validateName(value.toString().trim()) }
                                    maxLength={
                                        ApplicationManagementConstants.FORM_FIELD_CONSTRAINTS.APP_NAME_MAX_LENGTH }
                                    minLength={ 3 }
                                    data-testid={ `${ testId }-application-name-input` }
                                    width={ 16 }
                                />
                            </Grid.Column>
                        </Grid.Row>
                    ) }
                    {
                        name !== ApplicationManagementConstants.MY_ACCOUNT_APP_NAME && !isSubOrganizationType && (
                            <Grid.Row columns={ 1 }>
                                <Grid.Column mobile={ 16 } tablet={ 16 } computer={ 16 }>
                                    <Field.Textarea
                                        ariaLabel="Application description"
                                        name="description"
                                        label={
                                            t("applications:forms.generalDetails.fields.description" +
                                                ".label")
                                        }
                                        required={ false }
                                        placeholder={
                                            t("applications:forms.generalDetails.fields.description" +
                                                ".placeholder")
                                        }
                                        value={ description }
                                        readOnly={ readOnly }
                                        validation ={ (value: string) => validateDescription(value.toString().trim()) }
                                        maxLength={ 300 }
                                        minLength={ 3 }
                                        data-testid={ `${ testId }-application-description-textarea` }
                                        width={ 16 }
                                    />
                                </Grid.Column>
                            </Grid.Row>
                        )
                    }
                    {
                        !isSubOrganizationType && !hiddenFields?.includes("imageUrl") && (
                            <Grid.Row columns={ 1 } data-componentid="application-edit-general-details-form-image-url">
                                <Grid.Column mobile={ 16 } tablet={ 16 } computer={ 16 }>
                                    <Field.Input
                                        ariaLabel="Application image URL"
                                        inputType="url"
                                        name="imageUrl"
                                        label={
                                            t("applications:forms.generalDetails" +
                                                ".fields.imageUrl.label")
                                        }
                                        required={ false }
                                        placeholder={
                                            t("applications:forms.generalDetails" +
                                                ".fields.imageUrl.placeholder")
                                        }
                                        value={ imageUrl }
                                        readOnly={ readOnly }
                                        data-testid={ `${ testId }-application-image-url-input` }
                                        maxLength={ 200 }
                                        minLength={ 3 }
                                        hint={
                                            t("applications:forms.generalDetails" +
                                                ".fields.imageUrl.hint")
                                        }
                                        width={ 16 }
                                    />
                                </Grid.Column>
                            </Grid.Row>
                        )
                    }
                    { (
                        !isM2MApplication
                        && (
                            isMyAccountEnabled
                            || isSubOrg
                        )
                        && !isSubOrganizationType
                    ) ? (
                            <>
                                <Grid.Row columns={ 1 }>
                                    <Grid.Column mobile={ 16 } tablet={ 16 } computer={ 16 }>
                                        <Field.Checkbox
                                            ariaLabel="Make application discoverable by end users"
                                            name="discoverableByEndUsers"
                                            required={ false }
                                            label={ t("applications:forms.generalDetails.fields" +
                                            ".discoverable.label") }
                                            initialValue={ isDiscoverable }
                                            readOnly={ readOnly }
                                            data-testid={ `${ testId }-application-discoverable-checkbox` }
                                            listen={ (value: boolean) => setDiscoverability(value) }
                                            hint={ (
                                                <Trans
                                                    i18nKey={
                                                        application.templateId === ApplicationManagementConstants.MOBILE
                                                            ? "applications:forms.inboundOIDC.mobileApp" +
                                                            ".discoverableHint"
                                                            : "applications:forms.generalDetails.fields." +
                                                            "discoverable.hint"
                                                    }
                                                    tOptions={ { myAccount: "My Account" } }
                                                >
                                                    { " " }
                                                    { getLink(
                                                        "develop.applications.managementApplication.selfServicePortal"
                                                    ) === undefined
                                                        ? (
                                                            <strong data-testid="application-name-assertion">
                                                            My Account
                                                            </strong>
                                                        )
                                                        : (
                                                            <strong
                                                                className="link pointing"
                                                                data-testid="application-name-assertion"
                                                                onClick={
                                                                    () => window.open(
                                                                        getLink(
                                                                            "develop.applications.managementApplication"
                                                                            + ".selfServicePortal"
                                                                        ),
                                                                        "_blank"
                                                                    )
                                                                }
                                                            >
                                                            My Account
                                                            </strong>
                                                        )
                                                    }
                                                </Trans>
                                            ) }
                                            width={ 16 }
                                        />
                                    </Grid.Column>
                                </Grid.Row>
                                { isDiscoverable && (
                                    <Grid.Row columns={ 1 }>
                                        <Grid.Column mobile={ 16 } tablet={ 16 } computer={ 16 }>
                                            <GroupAssignment
                                                discoverableGroups={ discoverableGroups }
                                                setDiscoverableGroups={ setDiscoverableGroups }
                                                application={ application }
                                            />
                                        </Grid.Column>
                                    </Grid.Row>
                                ) }
                            </>
                        ) : null
                    }
                    {
                        !isM2MApplication && !isSubOrganizationType && (
                            <Grid.Row columns={ 1 }>
                                <Grid.Column mobile={ 16 } tablet={ 16 } computer={ 16 }>
                                    <Field.Input
                                        ariaLabel={
                                            t("applications:forms.generalDetails.fields.accessUrl.ariaLabel")
                                        }
                                        inputType="url"
                                        name="accessUrl"
                                        label={
                                            t("applications:forms.generalDetails.fields.accessUrl.label")
                                        }
                                        required={ isDiscoverable }
                                        placeholder={
                                            t("applications:forms.generalDetails.fields.accessUrl" +
                                                ".placeholder")
                                        }
                                        value={ accessUrl }
                                        readOnly={
                                            !hasRequiredScope || (
                                                readOnly
                                                && applicationConfig.generalSettings.getFieldReadOnlyStatus(
                                                    application, "ACCESS_URL"
                                                )
                                            )
                                        }
                                        validation={ validateAccessURL }
                                        maxLength={ ApplicationManagementConstants
                                            .FORM_FIELD_CONSTRAINTS.ACCESS_URL_MAX_LENGTH }
                                        minLength={ ApplicationManagementConstants.FORM_FIELD_CONSTRAINTS
                                            .ACCESS_URL_MIN_LENGTH }
                                        data-testid={ `${ testId }-application-access-url-input` }
                                        hint={ t("applications:forms.generalDetails.fields.accessUrl.hint") }
                                        width={ 16 }
                                    />
                                </Grid.Column>
                            </Grid.Row>
                        )
                    }
                    <Grid.Row columns={ 1 }>
                        <Grid.Column mobile={ 16 } tablet={ 16 } computer={ 16 }>
                            {
                                (!isBrandingSectionHidden &&
                                !isM2MApplication &&
                                orgType !== OrganizationType.SUBORGANIZATION) && <Divider />
                            }
                            {
                                (!isBrandingSectionHidden && !isM2MApplication) && (
                                    <>
                                        <Heading as="h4">
                                            { t("applications:forms.generalDetails.sections.branding.title") }
                                            <Chip
                                                size="small"
                                                label={ t(FeatureStatusLabel.BETA) }
                                                className="oxygen-chip-beta mb-1 ml-2"
                                            />
                                        </Heading>
                                        <PaletteIcon fill="#ff7300" /> &nbsp;
                                        <Link
                                            className="application-branding-link"
                                            color="primary"
                                            data-componentid={ `${testId}-application-branding-link` }
                                            onClick={ () => {
                                                history.push({
                                                    pathname: AppConstants.getPaths().get("BRANDING"),
                                                    state: appId
                                                });
                                            } }
                                        >
                                            { t("applications:forms.generalDetails.brandingLink.label") }
                                        </Link>
                                        <Hint>{ t("applications:forms.generalDetails.brandingLink.hint") }</Hint>
                                    </>
                                )
                            }
                        </Grid.Column>
                    </Grid.Row>
                </ApplicationTabComponentsFilter>
            </Grid>
            <Field.Button
                form={ FORM_ID }
                size="small"
                buttonType="primary_btn"
                ariaLabel="Update button"
                name="update-button"
                data-testid={ `${ testId }-submit-button` }
                disabled={ isSubmitting }
                loading={ isSubmitting }
                label={ t("common:update") }
                hidden={
                    isSubOrganizationType ||
                    !hasRequiredScope || (
                        readOnly
                        && applicationConfig.generalSettings.getFieldReadOnlyStatus(
                            application, "ACCESS_URL"
                        )
                    )
                }
            />
        </Form>
    );
};

/**
 * Default props for the applications general settings form.
 */
GeneralDetailsForm.defaultProps = {
    "data-testid": "application-general-settings-form"
};

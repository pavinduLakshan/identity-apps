/**
 * Copyright (c) 2023, WSO2 LLC. (https://www.wso2.com).
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

import { HorizontalBarsFilterIcon } from "@oxygen-ui/react-icons";
import { FeatureAccessConfigInterface } from "@wso2is/access-control";
import { AppState } from "@wso2is/admin.core.v1/store";
import { isFeatureEnabled } from "@wso2is/core/helpers";
import { IdentifiableComponentInterface } from "@wso2is/core/models";
import { DropdownChild, Field, FormValue, Forms, Validation } from "@wso2is/forms";
import { I18n } from "@wso2is/i18n";
import { LinkButton, Popup, PrimaryButton } from "@wso2is/react-components";
import React, { ReactElement, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Divider, Form, Grid } from "semantic-ui-react";
import { getFilterAttributeListByActivityType } from "../config/org-insights";
import { OrgInsightsConstants } from "../constants/org-insights";
import {
    ActivityType,
    AuthenticatorFilterValue,
    FilterCondition,
    OnboardingMethodFilterValue
} from "../models/insights";

const dropdownInputRequiredAttributesForFilterValue: string[] = [ "onboardingMethod", "authenticator" ];

const filterValueDropdownItems: Record<string,DropdownChild[]> = {
    "authenticator": [
        {
            key:   1,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "basic"
            ) as ReactNode,
            value: AuthenticatorFilterValue.BASIC
        },
        {
            key:   2,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "identifierFirst"
            ) as ReactNode,
            value: AuthenticatorFilterValue.IDENTIFIER_FIRST
        },
        {
            key:   3,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "fido2"
            ) as ReactNode,
            value: AuthenticatorFilterValue.FIDO2
        },
        {
            key:   4,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "magicLink"
            ) as ReactNode,
            value: AuthenticatorFilterValue.MAGIC_LINK
        },
        {
            key:   5,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "emailOtp"
            ) as ReactNode,
            value: AuthenticatorFilterValue.EMAIL_OTP
        },
        {
            key:   6,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "smsOtp"
            ) as ReactNode,
            value: AuthenticatorFilterValue.SMS_OTP
        },
        {
            key:   7,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "totp"
            ) as ReactNode,
            value: AuthenticatorFilterValue.TOTP
        },
        {
            key:   8,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "backupCodes"
            ) as ReactNode,
            value: AuthenticatorFilterValue.BACK_UP_CODE
        },
        {
            key:   9,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "google"
            ) as ReactNode,
            value: AuthenticatorFilterValue.GOOGLE
        },
        {
            key:   10,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "facebook"
            ) as ReactNode,
            value: AuthenticatorFilterValue.FACEBOOK
        },
        {
            key:   11,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "github"
            ) as ReactNode,
            value: AuthenticatorFilterValue.GITHUB
        },
        {
            key:   12,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "apple"
            ) as ReactNode,
            value: AuthenticatorFilterValue.APPLE
        },
        {
            key:   13,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "oidc"
            ) as ReactNode,
            value: AuthenticatorFilterValue.OIDC
        },
        {
            key:   14,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "saml"
            ) as ReactNode,
            value: AuthenticatorFilterValue.SAML
        },
        {
            key:   15,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "hypr"
            ) as ReactNode,
            value: AuthenticatorFilterValue.HYPR
        },
        {
            key:   16,
            text:  I18n.instance.t(
                "insights:activityType.login.filters.authenticator.values." +
                "iproov"
            ) as ReactNode,
            value: AuthenticatorFilterValue.IPROOV
        }
    ],
    "onboardingMethod": [
        {
            key:   1,
            text:  I18n.instance.t(
                "insights:activityType.registration.filters.onboardingMethod.values." +
                "adminInitiated"
            ) as ReactNode,
            value: OnboardingMethodFilterValue.ADMIN_INITIATED
        },
        {
            key:   2,
            text:  I18n.instance.t(
                "insights:activityType.registration.filters.onboardingMethod.values." +
                "userInvited"
            ) as ReactNode,
            value: OnboardingMethodFilterValue.USER_INVITE
        },
        {
            key:   3,
            text:  I18n.instance.t(
                "insights:activityType.registration.filters.onboardingMethod.values." +
                "selfSignUp"
            ) as ReactNode,
            value: OnboardingMethodFilterValue.SELF_SIGN_UP
        }
    ]
};

const filterConditions: FilterCondition[] = [
    {
        key: 1,
        text: I18n.instance.t("common:equals") as ReactNode,
        value: "eq"
    }
];

interface InsightsFilterProps extends IdentifiableComponentInterface {
    onFilteringQuerySubmitted: (filteringQuery: string, displayingQuery: string) => void;
    selectedActivityType: ActivityType;
    showResetButton?: boolean;
}

export const InsightsFilter = (props: InsightsFilterProps): ReactElement => {
    const {
        onFilteringQuerySubmitted,
        selectedActivityType,
        showResetButton,
        ["data-componentid"]: componentId
    } = props;

    const { t } = useTranslation();

    const insightsFeatureConfig: FeatureAccessConfigInterface = useSelector(
        (state: AppState) => state?.config?.ui?.features?.insights
    );

    const [ isFilteringModalOpen, setIsFilteringModalOpen ] = useState<boolean>(false);
    const [ isFiltersReset, setIsFiltersReset ] = useState<boolean>(false);
    const [ selectedFilterAttribute, setSelectedFilterAttribute ] = useState<string>(
        getFilterAttributeListByActivityType(selectedActivityType)?.[0].value
    );
    const [ selectedFilterCondition,setSelectedFilterCondition ] = useState<string>(filterConditions[0].value);
    const [ selectedFilterValue, setSelectedFilterValue ] = useState<string>("");

    useEffect(() => {
        setSelectedFilterAttribute(getFilterAttributeListByActivityType(selectedActivityType)?.[0].value);
    }, [ selectedActivityType ]);

    useEffect(() => {
        setSelectedFilterValue("");
    },[ selectedFilterAttribute ]);

    useEffect(() => {
        if (dropdownInputRequiredAttributesForFilterValue.includes(selectedFilterAttribute)) {
            setSelectedFilterValue(filterValueDropdownItems[selectedFilterAttribute]?.[0].value);
        }
    },[ selectedFilterAttribute ]);

    const handleFormSubmit = (values: Map<string, FormValue>) => {
        setSelectedFilterAttribute(values.get("filterAttribute").toString());
        setSelectedFilterCondition(values.get("filterCondition").toString());
        setSelectedFilterValue(values.get("filterValue").toString());

        const query: string = values.get("filterAttribute")
            + "+"
            + values.get("filterCondition")
            + "+"
            + values.get("filterValue");

        const displayQueryParts: string[] = query.split("+");

        const matchingAttribute: Omit<DropdownChild,"key"> =
            getFilterAttributeListByActivityType(selectedActivityType)?.find(
                (dropdownItem: DropdownChild) =>
                    dropdownItem.value === values.get("filterAttribute")
            );

        const matchingValue: DropdownChild = filterValueDropdownItems[values.get("filterAttribute").toString()]?.
            find((dropdownItem: DropdownChild) =>
                dropdownItem.value === values.get("filterValue")
            );

        if (matchingValue) {
            displayQueryParts[2] = "\"" + matchingValue?.text?.toString() + "\"";
        }

        if (matchingAttribute) {
            displayQueryParts[0] = matchingAttribute?.text?.toString();
        }

        displayQueryParts[1] = "=";

        onFilteringQuerySubmitted(query, displayQueryParts.join(" "));
        setIsFilteringModalOpen(false);
    };

    const handleResetFilter = (): void => {
        setSelectedFilterValue("");
        onFilteringQuerySubmitted("", "");
        setIsFiltersReset(true);
    };

    return (
        <>filter</>
    );
};

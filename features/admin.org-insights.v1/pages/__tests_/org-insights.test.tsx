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

import { fireEvent, render, screen, waitFor, userEvent, within, act } from "@wso2is/unit-testing/utils";
import React from "react";
import "@testing-library/jest-dom";
import OrgInsightsPage from "../org-insights";

const SUCCESS_LOGIN_GRAPH_X_AXIS_START_DATE: string =
  "[data-componentid=\"org-insights-success-logins-graph\"] .recharts-cartesian-axis-ticks " +
  ".recharts-cartesian-axis-tick";
const DURATION_DROPDOWN: string = "org-insights-duration-dropdown";
const MAU_GRAPH_X_AXIS_START_DATE: string =
  "[data-componentid=\"org-insights-mau-graph\"] .recharts-cartesian-axis-ticks " +
  ".recharts-cartesian-axis-tick";

describe("Verify Organization Insights page behaviour", () => {
    it("Verify whether org owner can access the organization insights", () => {
        render(<OrgInsightsPage />);
    });

    it("Verify whether invited admins can access the organization insights", () => {
        render(<OrgInsightsPage />);
    });

    it("Verify whether privileged business users can access the organization insights", () => {
        render(<OrgInsightsPage />);
    });

    it.only("Verify whether the graphs' x axes change according to the time period selected from the dropdown",
        async () => {
            render(<OrgInsightsPage />);

            clickSelect(screen.getByTestId(DURATION_DROPDOWN), "Duration: Last 14 days");

            expect(document.querySelector(MAU_GRAPH_X_AXIS_START_DATE)).toHaveTextContent(
                getBoundaryTimestampsForSelectedDuration(14).startDate
            );
            expect(screen.getByTestId(SUCCESS_LOGIN_GRAPH_X_AXIS_START_DATE)).toHaveTextContent(
                getBoundaryTimestampsForSelectedDuration(14).startDate
            );
        });

    it("Verify the organization insights filter is working as expected for the selected activity type", () => {
        render(<OrgInsightsPage />);
    });

    it("Verify the filter expression is sent on submitting the advanced filter form successfully", () => {
        render(<OrgInsightsPage />);
    });
});

export const clickSelect = async (element: HTMLElement, value: string) => {
    const button = await within(element).findByRole('button');
    await act(async () => {
      fireEvent.mouseDown(button);
    });
  
    const option = await screen.findByRole('option', {
      name: new RegExp(value, 'i'),
    });
  
    await act(async () => {
      fireEvent.click(option);
    });
  };

/**
 * This function returns the start and end dates of the selected duration.
 *
 * @param durationInDays - number of days of the selected duration.
 * @returns - start and end dates of the selected duration.
 */
const getBoundaryTimestampsForSelectedDuration = (durationInDays: number) => {
    const endDate: Date = new Date();
    const startDate: Date = new Date(endDate.setDate(endDate.getDate() - durationInDays + 1));

    return {
        endDate: convertDateToNumericShortFormat(endDate.toDateString()),
        startDate: convertDateToNumericShortFormat(startDate.toDateString())
    };
};

/**
 * This function converts a date string to a numeric short format.
 *
 * @param dateString - The date string to be converted (Eg: 'Wed Jun 01 2023').
 *
 * @returns the converted date string (Eg: "Jun 01").
 */
function convertDateToNumericShortFormat(dateString: string) {
    // Split the date and time components
    const dateParts: string[] = dateString.split(" ");

    const month: string = dateParts[1];
    const day: number = parseInt(dateParts[2]);

    return month + " " + day;
}


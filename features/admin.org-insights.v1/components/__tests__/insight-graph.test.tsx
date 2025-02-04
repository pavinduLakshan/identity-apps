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

import { render } from "@testing-library/react";
import React from "react";
import { expect, test } from "vitest";
import { ResourceType } from "../../models/insights";
import { InsightsGraph } from "../insight-graph";

export function sum(a, b) {
    return a + b;
}

test("adds 1 + 2 to equal 3", () => {
    render(<InsightsGraph
        graphTitle=""
        hint={ <p>This is a sample hint</p> }
        resourceType={ ResourceType.MONTHLY_ACTIVE_USERS }
        primaryGraphColor=""
        data-componentid=""
    />);
});

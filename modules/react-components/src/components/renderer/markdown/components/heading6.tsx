/**
 * Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com).
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

import Typography from "@oxygen-ui/react/Typography";
import React, { FunctionComponent, ReactElement } from "react";
import { childRenderer } from "./utils";
import { MarkdownCustomComponentPropsInterface } from "../markdown";

/**
 * Markdown custom component for the h6 element.
 *
 * @param Props - Props to be injected into the component.
 */
const Heading6: FunctionComponent<
    MarkdownCustomComponentPropsInterface<"h6">
> = ({
    children,
    "data-componentid": componentId = "custom-markdown-heading6"
}: MarkdownCustomComponentPropsInterface<"h6">): ReactElement => {

    if (!children) {
        return null;
    }

    return (
        <Typography variant="subtitle1" component="h6" data-componentid={ componentId }>
            {
                typeof children === "string" ? (
                    children
                ): (
                    childRenderer({ children })
                )
            }
        </Typography>
    );
};

export default Heading6;

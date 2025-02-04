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

import React, { FunctionComponent, ReactElement } from "react";
import { CodeEditor } from "../../../code-editor";
import { MarkdownCustomComponentPropsInterface } from "../markdown";

/**
 * Props interface for the `MarkdownPre` component.
 */
interface MarkdownPreProps extends MarkdownCustomComponentPropsInterface<"pre"> {
    /**
     * Custom attributes supplied by the 'rehype-attr' plugin.
     */
    "data-config"?: {
        /**
         * Flag to determine whether the content is multiline.
         */
        multiline?: boolean;
    };
}

/**
 * Markdown custom component for the pre element.
 *
 * @param Props - Props to be injected into the component.
 */
const MarkdownPre: FunctionComponent<MarkdownPreProps> = ({
    children,
    "data-config": dataConfig,
    "data-componentid": componentId = "custom-markdown-pre"
}: MarkdownPreProps): ReactElement => {

    let content: string = children?.["props"]?.["children"];
    const language: string = children?.["props"]?.["className"]?.split("language-")?.[1];

    if (content?.endsWith("\n")) {
        content = content.substring(0, content.length - 1);
    }

    if (typeof content !== "string") {
        return null;
    }

    return (
        <div className="code-segment" data-componentid={ componentId }>
            <CodeEditor
                oneLiner={ dataConfig?.multiline === true ? undefined : true }
                readOnly
                withClipboardCopy
                language={ language || "shell" }
                sourceCode={ content }
                options={ {
                    lineWrapping: true
                } }
            />
        </div>
    );
};

export default MarkdownPre;

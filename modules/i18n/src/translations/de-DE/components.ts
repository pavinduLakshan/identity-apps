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

import { ComponentsNS } from "../../models/namespaces/components-ns";

export const components: ComponentsNS = {
    filePicker: {
        fileSelected: "You have selected {{fileName}} file",
        notThisFile: "Not this file?",
        pasteAreaPlaceholder: "Paste your content in this area...",
        errors: {
            invalidXMLFile: "XML file content is invalid",
            invalidXMLString: "XML string is invalid",
            noFileError: "Please add a file",
            unknownError: "Your input has unknown errors.",
            addFileError: "",
            invalidCertificateError: "Invalid certificate file. " +
            "Please use one of the following formats {{certTypesStr}}",
            invalidCertificateStringError: "Invalid certificate pem string.",
            invalidPemCertStringError: "",
            certificateFileError: "Certificate file has errors.",
            pemCertDecodeError: "Failed to decode pem certificate data.",
            generic: "",
            invalidFileError: "Invalid file type. Only CSV files are allowed.",
            maxFileSizeExceededError: "File exceeds max size of {{maxFileSize}} MB",
            xmlFileError: "XML file has errors",
            xmlStringError: "XML string has errors",
            xmlFileParseError: "Error while parsing XML file",
            rowCountExceedError: "Row count exceeds max limit of {{maxRowCount}}.",
            emptyCSVFileError: "CSV file is empty or invalid.",
            csvFileError: "CSV file has errors.",
            emptyCSVStringError: "CSV string is empty or invalid",
            csvStringError: "CSV string has errors",
        }
    }
}

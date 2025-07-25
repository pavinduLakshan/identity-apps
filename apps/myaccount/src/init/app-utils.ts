/**
 * Copyright (c) 2020-2025, WSO2 LLC. (https://www.wso2.com).
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

import { AppUtilsInterface } from "../models";

function loadUserConfig(configFile: string, callback: (responseText: string | null) => void) {
    const request: XMLHttpRequest = new XMLHttpRequest();

    request.overrideMimeType("application/json");
    request.open("GET", configFile, false);
    request.send(null);

    if (request.status === 404) {
        callback(null);
    }

    if (request.status === 200) {
        if ((request.responseText.trim().length === 0) ||
            (request.responseText.trim() === "") ||
            (request.responseText.trim() === "{}")) {

            callback(null);
        }
        else {
            callback(request.responseText);
        }
    }
}

function extend(...args: any[]) {
    args = args || [];

    for (let i: number = 1; i < args.length; i++) {
        if (!args[i])
            continue;

        for (const key in args[i]) {
            if ({}.hasOwnProperty.call(args[i], key)) {
                args[key] = args[i][key];
            }
        }
    }

    return args;
}

export const AppUtils: AppUtilsInterface = (function() {
    let _args: any = {},
        _default: any = {},
        _config: any = {};

    const superTenantFallback: string = "carbon.super";
    const tenantPrefixFallback: string = "t";
    const orgPrefixFallback: string = "o";
    const fallbackServerOrigin: string = "https://localhost:9443";
    const urlPathForSuperTenantOriginsFallback: string = "";
    const isSaasFallback: boolean = false;
    const tenantResolutionStrategyFallback: string = "id_token";
    const proxyContextPathFallback: string = "";

    const SERVER_ORIGIN_URL_PLACEHOLDER: string = "${serverOrigin}";
    const TENANT_PREFIX_IDP_URL_PLACEHOLDER: string = "${tenantPrefix}";
    const USER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER: string = "${userTenantDomain}";
    const SUPER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER: string= "${superTenantDomain}";

    return {
        /**
         * Constructs a basename to be used by the History API.
         *
         * @remarks For SaaS apps, basename should be "/". Since is applied on the fly.
         * @returns App base name for the History API.
         */
        constructAppBaseNameForHistoryAPI: function() {
            return "/";
        },

        /**
         * Constructs app paths.
         *
         * @remarks For non SaaS apps, a relative path without the tenant and basename would surfise.
         * @param path - Path to be constructed.
         * @returns App paths.
         */
        constructAppPaths: function(path: string) {
            if (!this.isSaas()) {
                return path;
            }

            return this.getAppBaseWithTenant() + path;
        },

        /**
         * Constructs redirect URLs i.e Login & Logout.
         *
         * @remarks For SaaS apps, the application the callback URLs shouldn't contain tenant domain.
         * @param url - URL to be constructed.
         * @returns Redirect URLs.
         */
        constructRedirectURLs: function(url: string) {
            const proxyContextPath: string = this.getProxyContextPath();
            let basePath: string = `${_config.clientOrigin}${
                proxyContextPath ? `/${proxyContextPath}` : ""
            }${this.getTenantPath(true)}`;

            if (basePath.includes(this.getSuperTenant())) {
                basePath = _config.clientOrigin;
            }

            return `${basePath}${(_config.appBaseName
                ? "/" + _config.appBaseName
                : "")}${url}`;
        },

        /**
         * Get app base from URL.
         *
         * @returns App base.
         */
        getAppBase: function() {
            const path: string = this.getLocationPathWithoutTenant();
            const pathChunks: string[] = path.split("/");

            if (pathChunks.length <= 1) {
                return "/";
            }

            if (pathChunks.length === 2) {
                return path;
            }

            return "/" + this.getLocationPathWithoutTenant().split("/")[1];
        },

        /**
         * Get app base with the tenant domain.
         *
         * @returns App base with tenant.
         */
        getAppBaseWithTenant: function() {
            return this.getTenantPath() + (_config.appBaseName ? ("/" + _config.appBaseName) : "");
        },

        /**
         * Get app base with the tenant domain and organization.
         *
         * @returns App base with tenant and organization.
         */
        getAppBaseWithTenantAndOrganization: function() {
            let tenantPath: string = this.getTenantPath(true);
            const appBaseName: string = _config.appBaseName
                ? `/${_config.appBaseName}`
                : "";
            const proxyContextPath: string = this.getProxyContextPath() ? `/${this.getProxyContextPath()}` : "";

            if (_config.tenantContext?.requireSuperTenantInAppUrls && !tenantPath) {
                tenantPath = `/${this.getTenantPrefix()}/${this.getSuperTenant()}`;
            }

            return `${proxyContextPath}${ tenantPath }${ this.getOrganizationPath() }${ appBaseName }`;
        },

        /**
         * Get the client ID of my account.
         *
         * @returns client ID of my account.
         */
        getClientId: function() {

            if(_config.tenantContext?.enableTenantQualifiedUrls || this.isSuperTenant()) {
                return _config.clientID;
            }

            return _config.clientID + "_" + this.getTenantName();
        },

        /**
         * Get the client origin with the tenant.
         *
         * @returns
         */
        getClientOriginWithTenant: function() {
            return `${_config.clientOrigin}${this.getAppBaseWithTenantAndOrganization()}`;
        },

        /**
         * Get the config object.
         *
         * @returns Deployment Configuration.
         */
        getConfig: function() {
            if (Object.entries(_config).length === 0) {
                return null;
            }
            if (_config.consoleApp && _config.consoleApp.origin) {
                _config.consoleAppOrigin = _config.consoleApp.origin
                    .replace(SERVER_ORIGIN_URL_PLACEHOLDER, _config.serverOrigin);
            }

            const tenantPath: string = this.getTenantPath();
            const resolvedTenantPath: string = tenantPath.match(this.getSuperTenant())?.length > 0 ? "" : tenantPath;

            return {
                __experimental__platformIdP: _config.__experimental__platformIdP,
                appBase: _config.appBaseName,
                appBaseNameForHistoryAPI: this.constructAppBaseNameForHistoryAPI(),
                appBaseWithTenant: this.getAppBaseWithTenantAndOrganization(),
                clientID: this.getClientId(),
                clientOrigin: _config.clientOrigin,
                clientOriginWithTenant: this.getClientOriginWithTenant(),
                consoleApp: {
                    path: _config.consoleApp?.path
                        ? _config.consoleAppOrigin + resolvedTenantPath + _config.consoleApp?.path
                        : null
                },
                customServerHost: _config.customServerHost,
                debug: _config.debug,
                extensions: _config.extensions,
                idpConfigs: this.resolveIdpConfigs(),
                isSaas: this.isSaas(),
                loginCallbackURL: this.constructRedirectURLs(_config.loginCallbackPath),
                logoutCallbackURL: this.constructRedirectURLs(_config.logoutCallbackPath),
                organizationPrefix: this.getOrganizationPrefix(),
                productVersionConfig: _config.ui.productVersionConfig,
                proxyContextPath: this.getProxyContextPath(),
                routes: {
                    home: this.constructAppPaths(_config.routePaths.home),
                    login: this.constructAppPaths(_config.routePaths.login),
                    logout: this.constructAppPaths(_config.routePaths.logout)
                },
                serverOrigin: _config.serverOrigin,
                serverOriginWithOrganization: _config.serverOrigin + this.getOrganizationPath(),
                serverOriginWithTenant: this.getServerOriginWithTenant(),
                session: _config.session,
                superTenant: this.getSuperTenant(),
                superTenantProxy: this.getSuperTenantProxy(),
                tenant: (this.isSuperTenant()) ? this.getSuperTenant() : this.getTenantName(),
                tenantPath: this.getTenantPath(),
                tenantPrefix: this.getTenantPrefix(),
                ui: _config.ui
            };
        },

        /**
         * Get URL location without tenant.
         *
         * @returns Location without the tenant.
         */
        getLocationPathWithoutTenant: function() {
            const path: string = window.location.pathname;
            const pathChunks: string[] = path.split("/");

            if ( (pathChunks[1] === this.getTenantPrefix()) && (pathChunks[2] === this.getTenantName(true)) ) {
                pathChunks.splice(1, 2);

                return pathChunks.join("/");
            }

            return path;
        },

        /**
         * Get the organization name.
         *
         * @returns Organization name.
         */
        getOrganizationName: function () {
            if (_config.organizationName) {
                return _config.organizationName;
            }

            return "";
        },

        /**
         * Get the organization path.
         *
         * @returns Organization path.
         */
        getOrganizationPath: function () {
            return this.getOrganizationName() !== ""
                ? `/${ this.getOrganizationPrefix() }/${ this.getOrganizationName() }`
                : "";
        },

        /**
         * Get the organization prefix.
         *
         * @returns Organization prefix.
         */
        getOrganizationPrefix: function () {
            return _args.organizationPrefix || orgPrefixFallback;
        },

        /**
         * Retrieves the proxy context path configured on the server.
         *
         * Reads in the following `proxy_context_path` from the `deployment.toml`.
         *
         *```
         * [server]
         * proxy_context_path = "auth"
         *```
         *
         * @returns The proxy context path.
         */
        getProxyContextPath: function() {
            // When there's no proxy context path, the IS server returns "null".
            if (_config.proxyContextPath === "null") {
                return "";
            }

            return _config.proxyContextPath;
        },

        /**
         * Get the server base URL with tenant name appended.
         *
         * @example
         * `https://localhost:9443/t/testtenant`
         * `https://localhost:9443/t/testtenant/o/suborgid`
         *
         * @param enforceOrgPath - whether the suborg prefix should be attached for suborganization base URL.
         * This was added to utilize this method for constructing the feature gate API base URL which should
         * not have suborg path prefix appended in the base URL when invoking from suborganizations.
         *
         * @returns the server base URL with the tenant name appended.
         */
        getServerOriginWithTenant: function(enforceOrgPath: boolean = true) {
            let tenantPath: string = this.getTenantPath(true);

            /**
             * If the tenant path is empty, and the organization name is present, then append the `carbon.super` path.
             */
            if (this.getOrganizationName() && !tenantPath) {
                tenantPath = `/${this.getTenantPrefix()}/${this.getSuperTenant()}`;
            }

            // eslint-disable-next-line max-len
            return `${ _config.serverOrigin }${ tenantPath }${ enforceOrgPath && this.getOrganizationName() ? "/o" : "" }`;
        },


        /**
         * Get the super tenant.
         *
         * @returns Super tenant.
         */
        getSuperTenant: function() {
            return _args.superTenant || superTenantFallback;
        },

        /**
         * Get the proxy name for super tenant if overriden. This will be used to build the URLs
         *
         * @returns Super tenant proxy.
         */
        getSuperTenantProxy: function() {
            return _config.superTenantProxy || this.getSuperTenant();
        },

        /**
         * Get the tenant name.
         *
         * @param fromLocation - Flag to determine if resolution should be done using URL location.
         * @returns Tenant name.
         */
        getTenantName: function(fromLocation: boolean = this.getTenantResolutionStrategy() === "location") {
            if (!fromLocation && this.getTenantResolutionStrategy() === "id_token" && _config.tenant) {
                return _config.tenant;
            }

            const paths: string[] = window.location.pathname.split("/");
            const tenantIndex: number = paths.indexOf(this.getTenantPrefix());

            if (tenantIndex > 0) {
                const tenantName: string = paths[tenantIndex + 1];

                return (tenantName) ? tenantName : "";
            }

            return (_config.tenantContext?.requireSuperTenantInUrls)
                ? this.getSuperTenant()
                : "";
        },

        /**
         * Get the tenant path.
         *
         * @remarks if `skipSuperTenant` is set to true, "" will be returned.
         * @param skipSuperTenant - Flag to skip super tenant.
         * @param forIdPUrls - Is the tenant path meant for IdP Urls.
         * @returns Tenant path.
         */
        getTenantPath: function(skipSuperTenant: boolean = false, forIdPUrls?: boolean) {
            if (skipSuperTenant && (this.getTenantName() === this.getSuperTenant() || this.getTenantName() === "")) {
                return urlPathForSuperTenantOriginsFallback;
            }

            let tenantDomain: string = this.getTenantName();

            // If the tenant path is meant for `idPUrls`, replace the super tenant with the defined proxy.
            if (forIdPUrls) {
                if (_config.superTenantProxy) {
                    if (!tenantDomain) {
                        tenantDomain = _config.superTenantProxy;
                    }

                    if (tenantDomain && tenantDomain === this.getSuperTenant()) {
                        tenantDomain = _config.superTenantProxy;
                    }
                }
            }

            return (tenantDomain !== "")
                ? `/${this.getTenantPrefix()}/${tenantDomain}`
                : "";
        },

        /**
         * Get the tenant prefix.
         *
         * @returns Tenant prefix.
         */
        getTenantPrefix: function() {
            return _args.tenantPrefix || tenantPrefixFallback;
        },

        /**
         * Get the tenant resolution strategy.
         *
         * @returns Tenant resolution strategy.
         */
        getTenantResolutionStrategy: function() {
            return _config.tenantResolutionStrategy !== undefined
                ? _config.tenantResolutionStrategy
                : tenantResolutionStrategyFallback;
        },

        /**
         * Initialize the config.
         *
         * @param Args - Arguments passed to the instance.
         */
        init: function(Args: any) {
            _args = Args;

            _default = {
                "accountAppOrigin": _args.accountAppOrigin || _args.serverOrigin || fallbackServerOrigin,
                "clientOrigin": window.location.origin,
                "consoleAppOrigin": _args.consoleAppOrigin || _args.serverOrigin || fallbackServerOrigin,
                "contextPath": _args.contextPath,
                "proxyContextPath": _args.proxyContextPath || proxyContextPathFallback,
                "serverOrigin": _args.serverOrigin || fallbackServerOrigin
            };

            _config = _default;

            const userConfigFile: string = _config.contextPath + "deployment.config.json";

            loadUserConfig(userConfigFile, function(response: string) {
                const configResponse: string = JSON.parse(response);

                if (!{}.hasOwnProperty.call(configResponse, "appBaseName"))
                    throw "'appBaseName' config is missing in " + _args.deploymentConfigFile;
                if (!{}.hasOwnProperty.call(configResponse, "clientID"))
                    throw "'clientID' config is missing in " + _args.deploymentConfigFile;
                if (!{}.hasOwnProperty.call(configResponse, "loginCallbackPath"))
                    throw "'loginCallbackPath' config is missing in " + _args.deploymentConfigFile;
                if (!{}.hasOwnProperty.call(configResponse, "logoutCallbackPath"))
                    throw "'logoutCallbackPath' config is missing in " + _args.deploymentConfigFile;
                if (!{}.hasOwnProperty.call(configResponse, "routePaths"))
                    throw "'routePaths' config is missing in " + _args.deploymentConfigFile;
                if (!{}.hasOwnProperty.call(configResponse, "ui"))
                    throw "'ui' config is missing in " + _args.deploymentConfigFile;

                _config = extend({}, _default, JSON.parse(response));
            });
        },

        /**
         * Is the app SaaS.
         *
         * @returns Is saas or not.
         */
        isSaas: function() {
            return (_config.isSaas !== undefined) ? JSON.parse(_config.isSaas) : isSaasFallback;
        },

        /**
         * Is the tenant super tenant?.
         *
         * @returns Is super tenant or not.
         */
        isSuperTenant: function() {
            if (_config.tenant && _config.tenant === this.getSuperTenant()) {
                return true;
            }

            return (this.getTenantName() === "");
        },

        /**
         * Resolves the IDP configs object.
         *
         * @returns Resolved IDP configs.
         */
        resolveIdpConfigs: function() {
            return {
                serverOrigin: this.isSaas()
                    ? _config.serverOrigin
                    : _config.serverOrigin +
                   this.getTenantPath(),
                ..._config.idpConfigs,
                ...this.resolveURLs()
            };
        },

        /**
         * Resolves IDP URLs by resolving the placeholders.
         * ex: `/t/{userTenantDomain}/common/oauth2/authz?t={superTenantDomain}`
         * to /t/wso2.com/common/oauth2/authz?t=carbon.super
         *
         * @returns Resolved URLs.
         */
        resolveURLs: function() {
            const tenantPath: string = this.getTenantPath(false, true);

            return {
                authorizeEndpointURL: _config.idpConfigs
                    && _config.idpConfigs.authorizeEndpointURL
                    && _config.idpConfigs.authorizeEndpointURL
                        .replace(SERVER_ORIGIN_URL_PLACEHOLDER, _config.serverOrigin + tenantPath)
                        .replace(TENANT_PREFIX_IDP_URL_PLACEHOLDER, this.getTenantPrefix())
                        .replace(SUPER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getSuperTenantProxy())
                        .replace(USER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getTenantName()
                            ? this.getTenantName()
                            : this.getSuperTenantProxy()),
                jwksEndpointURL: _config.idpConfigs
                    && _config.idpConfigs.jwksEndpointURL
                    && _config.idpConfigs.jwksEndpointURL
                        .replace(SERVER_ORIGIN_URL_PLACEHOLDER,  _config.serverOrigin + tenantPath)
                        .replace(TENANT_PREFIX_IDP_URL_PLACEHOLDER, this.getTenantPrefix())
                        .replace(SUPER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getSuperTenantProxy())
                        .replace(USER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getTenantName()
                            ? this.getTenantName()
                            : this.getSuperTenantProxy()),
                logoutEndpointURL: _config.idpConfigs
                    && _config.idpConfigs.logoutEndpointURL
                    && _config.idpConfigs.logoutEndpointURL
                        .replace(SERVER_ORIGIN_URL_PLACEHOLDER,  _config.serverOrigin + tenantPath)
                        .replace(TENANT_PREFIX_IDP_URL_PLACEHOLDER, this.getTenantPrefix())
                        .replace(SUPER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getSuperTenantProxy())
                        .replace(USER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getTenantName()
                            ? this.getTenantName()
                            : this.getSuperTenantProxy()),
                oidcSessionIFrameEndpointURL: _config.idpConfigs
                    && _config.idpConfigs.oidcSessionIFrameEndpointURL
                    && _config.idpConfigs.oidcSessionIFrameEndpointURL
                        .replace(SERVER_ORIGIN_URL_PLACEHOLDER,  _config.serverOrigin + tenantPath)
                        .replace(TENANT_PREFIX_IDP_URL_PLACEHOLDER, this.getTenantPrefix())
                        .replace(SUPER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getSuperTenantProxy())
                        .replace(USER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getTenantName() !== this.getSuperTenant()
                            ? this.getTenantName()
                            : this.getSuperTenantProxy()),
                tokenEndpointURL: _config.idpConfigs
                    && _config.idpConfigs.tokenEndpointURL
                    && _config.idpConfigs.tokenEndpointURL
                        .replace(SERVER_ORIGIN_URL_PLACEHOLDER,  _config.serverOrigin + tenantPath)
                        .replace(TENANT_PREFIX_IDP_URL_PLACEHOLDER, this.getTenantPrefix())
                        .replace(SUPER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getSuperTenantProxy())
                        .replace(USER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getTenantName()
                            ? this.getTenantName()
                            : this.getSuperTenantProxy()),
                tokenRevocationEndpointURL: _config.idpConfigs
                    && _config.idpConfigs.tokenRevocationEndpointURL
                    && _config.idpConfigs.tokenRevocationEndpointURL
                        .replace(SERVER_ORIGIN_URL_PLACEHOLDER,  _config.serverOrigin + tenantPath)
                        .replace(TENANT_PREFIX_IDP_URL_PLACEHOLDER, this.getTenantPrefix())
                        .replace(SUPER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getSuperTenantProxy())
                        .replace(USER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getTenantName()
                            ? this.getTenantName()
                            : this.getSuperTenantProxy()),
                wellKnownEndpointURL: _config.idpConfigs
                    && _config.idpConfigs.wellKnownEndpointURL
                    && _config.idpConfigs.wellKnownEndpointURL
                        .replace(SERVER_ORIGIN_URL_PLACEHOLDER,  _config.serverOrigin + tenantPath)
                        .replace(TENANT_PREFIX_IDP_URL_PLACEHOLDER, this.getTenantPrefix())
                        .replace(SUPER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getSuperTenantProxy())
                        .replace(USER_TENANT_DOMAIN_IDP_URL_PLACEHOLDER, this.getTenantName()
                            ? this.getTenantName()
                            : this.getSuperTenantProxy())
            };
        },

        /**
         * Updates the organization name.
         *
         * @param organizationName - new Organization.
         */
        updateOrganizationName: function (organizationName: string) {
            _config.organizationName = organizationName;
        },

        /**
         * Updates the organization type.
         *
         * @param organizationType - new Organization type.
         * @deprecated This is deprecated.
         */
        updateOrganizationType: function (organizationType: string) {
            _config.organizationType = organizationType;
        },

        /**
         * Updates the tenant qualified basename.
         *
         * @param tenant - new Tenant.
         */
        updateTenantQualifiedBaseName: function(tenant: string) {
            _config.tenant = tenant;
            _config.tenantPath = this.getTenantPath();
            if (tenant === this.getSuperTenant()) {
                _config.appBaseWithTenant =  "/" + _config.appBaseName;

                return;
            }

            _config.appBaseWithTenant = "/" + this.getTenantPrefix() + "/" + tenant + "/" + _config.appBaseName;
        }
    };
}());

/*
 * Copyright (c) 2025, WSO2 LLC. (http://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2.identity.apps.common.listner;

import org.wso2.carbon.identity.api.resource.collection.mgt.exception.APIResourceCollectionMgtException;
import org.wso2.carbon.identity.api.resource.collection.mgt.model.APIResourceCollection;
import org.wso2.carbon.identity.api.resource.collection.mgt.model.APIResourceCollectionSearchResult;
import org.wso2.carbon.identity.api.resource.mgt.APIResourceMgtException;
import org.wso2.carbon.identity.application.common.IdentityApplicationManagementException;
import org.wso2.carbon.identity.application.common.model.ApplicationBasicInfo;
import org.wso2.carbon.identity.application.common.model.Scope;
import org.wso2.carbon.identity.application.mgt.ApplicationManagementService;
import org.wso2.carbon.identity.core.util.IdentityUtil;
import org.wso2.carbon.identity.role.v2.mgt.core.RoleConstants;
import org.wso2.carbon.identity.role.v2.mgt.core.RoleManagementService;
import org.wso2.carbon.identity.role.v2.mgt.core.exception.IdentityRoleManagementException;
import org.wso2.carbon.identity.role.v2.mgt.core.listener.AbstractRoleManagementListener;
import org.wso2.carbon.identity.role.v2.mgt.core.model.Permission;
import org.wso2.carbon.identity.role.v2.mgt.core.model.Role;
import org.wso2.carbon.identity.role.v2.mgt.core.model.RoleBasicInfo;
import org.wso2.identity.apps.common.internal.AppsCommonDataHolder;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.wso2.carbon.identity.api.resource.collection.mgt.constant.APIResourceCollectionManagementConstants.APIResourceCollectionConfigBuilderConstants.CREATE_FEATURE_SCOPE_SUFFIX;
import static org.wso2.carbon.identity.api.resource.collection.mgt.constant.APIResourceCollectionManagementConstants.APIResourceCollectionConfigBuilderConstants.DELETE_FEATURE_SCOPE_SUFFIX;
import static org.wso2.carbon.identity.api.resource.collection.mgt.constant.APIResourceCollectionManagementConstants.APIResourceCollectionConfigBuilderConstants.EDIT_FEATURE_SCOPE_SUFFIX;
import static org.wso2.carbon.identity.api.resource.collection.mgt.constant.APIResourceCollectionManagementConstants.APIResourceCollectionConfigBuilderConstants.UPDATE_FEATURE_SCOPE_SUFFIX;
import static org.wso2.carbon.identity.api.resource.collection.mgt.constant.APIResourceCollectionManagementConstants.APIResourceCollectionConfigBuilderConstants.VIEW_FEATURE_SCOPE_SUFFIX;
import static org.wso2.carbon.identity.role.v2.mgt.core.RoleConstants.CONSOLE_APP_AUDIENCE_NAME;
import static org.wso2.carbon.identity.role.v2.mgt.core.RoleConstants.CONSOLE_ORG_SCOPE_PREFIX;
import static org.wso2.carbon.identity.role.v2.mgt.core.RoleConstants.CONSOLE_SCOPE_PREFIX;

/**
 * Console role listener to populate organization console application roles permissions.
 */
public class ConsoleRoleListener extends AbstractRoleManagementListener {

    private static final String USE_GRANULAR_CONSOLE_PERMISSIONS_CONFIG =
        "ConsoleSettings.UseGranularConsolePermissions";

    @Override
    public int getDefaultOrderId() {

        return 87;
    }

    @Override
    public boolean isEnable() {

        return true;
    }

    @Override
    public void preAddRole(String roleName, List<String> userList, List<String> groupList, List<Permission> permissions,
                           String audience, String audienceId, String tenantDomain)
        throws IdentityRoleManagementException {

        if (isConsoleApp(audience, audienceId, tenantDomain) && !RoleConstants.ADMINISTRATOR.equals(roleName)) {
            List<Permission> consoleFeaturePermissions = getConsoleFeaturePermissions(permissions);
            if (consoleFeaturePermissions != null && !consoleFeaturePermissions.isEmpty()) {
                // If console features are added to the role, then we need to we only need to persist the console
                // permissions.
                permissions.retainAll(consoleFeaturePermissions);
            }
        }
    }

    @Override
    public void postGetRole(Role role, String roleId, String tenantDomain) throws IdentityRoleManagementException {


        if (!RoleConstants.ADMINISTRATOR.equals(role.getName()) &&
            role.getAudienceName().equals(CONSOLE_APP_AUDIENCE_NAME)) {
            // Get updated console role permissions with newly added read and write scopes from API resource collection.
            List<Permission> rolePermissions = getUpgradedPermissions(role.getPermissions(), tenantDomain);
            role.setPermissions(rolePermissions);
        }
    }

    @Override
    public void postGetPermissionListOfRole(List<Permission> permissionListOfRole, String roleId, String tenantDomain)
        throws IdentityRoleManagementException {

        RoleBasicInfo role = getRoleBasicInfo(roleId, tenantDomain);
        if (!shouldSkipPermissionResolution(role)) {
            List<Permission> rolePermissions = getUpgradedPermissions(permissionListOfRole, tenantDomain);
            permissionListOfRole.clear();
            permissionListOfRole.addAll(rolePermissions);
        }
    }

    @Override
    public void postGetPermissionListOfRoles(List<String> permissions, List<String> roleIds, String tenantDomain)
        throws IdentityRoleManagementException {

        boolean isConsoleRoleExist = false;
        boolean isConsoleAdminRoleExist = false;

        for (String roleId : roleIds) {
            RoleBasicInfo role = getRoleBasicInfo(roleId, tenantDomain);
            if (CONSOLE_APP_AUDIENCE_NAME.equals(role.getAudienceName())) {
                isConsoleRoleExist = true;
                if (RoleConstants.ADMINISTRATOR.equals(role.getName())) {
                    isConsoleAdminRoleExist = true;
                    break;
                }
            }
        }
        /* If a console role exists and there is no console Administrator role, then we need to resolve the
           permissions of console roles from the static configuration. */
        if (isConsoleRoleExist && !isConsoleAdminRoleExist) {
            List<Permission> resolvedRolePermissions = new ArrayList<>();
            List<Permission> systemPermissions = getSystemPermission(tenantDomain);
            permissions.forEach(permission -> {
                Optional<Permission> newPermission = systemPermissions.stream()
                    .filter(permission1 -> permission1.getName().equals(permission))
                    .findFirst();
                newPermission.ifPresent(resolvedRolePermissions::add);
            });
            List<Permission> rolePermissions = getUpgradedPermissions(resolvedRolePermissions, tenantDomain);
            permissions.clear();
            permissions.addAll(rolePermissions.stream().map(Permission::getName).collect(Collectors.toList()));
        }
    }

    @Override
    public void preUpdatePermissionsForRole(String roleId, List<Permission> addedPermissions,
                                            List<Permission> deletedPermissions, String audience, String audienceId,
                                            String tenantDomain) throws IdentityRoleManagementException {

        RoleBasicInfo role = getRoleBasicInfo(roleId, tenantDomain);
        if (!shouldSkipPermissionResolution(role)) {
            List<Permission> consoleFeaturePermissions = getConsoleFeaturePermissions(addedPermissions);
            if (consoleFeaturePermissions != null && !consoleFeaturePermissions.isEmpty()) {
                // If console features are added to the role, then we need to we only need to persist the console
                // permissions.
                addedPermissions.retainAll(consoleFeaturePermissions);
            }
        }
    }

    /**
     * This method resolves the new permissions for the console roles. In this method, we resolve 3 type of console
     * roles.
     *      1. Console roles created after 7.0.0.
     *      2. Console roles created in 7.0.0.
     *      3. Console roles with granular permissions (create, update, delete) added instead of edit permission.
     *
     * @param rolePermissions List of permissions of the role.
     * @param tenantDomain    Tenant domain.
     * @return List of resolved permissions.
     * @throws IdentityRoleManagementException If an error occurs while resolving the permissions.
     */
    private List<Permission> getUpgradedPermissions(List<Permission> rolePermissions, String tenantDomain)
        throws IdentityRoleManagementException {

        // Fetch all system scopes to resolve permission details from permission name.
        List<Permission> systemPermissions = getSystemPermission(tenantDomain);
        List<APIResourceCollection> apiResourceCollections = getAPIResourceCollections(tenantDomain);
        List<Permission> consoleFeaturePermissions = getConsoleFeaturePermissions(rolePermissions);
        List<Permission> upgradedPermissions;
        if (!consoleFeaturePermissions.isEmpty()) {
            // This is where we handle the new console roles (console roles created after 7.0.0) permissions.
            // We check whether the role has the view feature scope or edit feature scope. If the role has the
            // view feature scope, then we add all the read scopes. If the role has the edit feature scope, then we
            // add all the write scopes.
            List<Permission> resolvedRolePermissions = new ArrayList<>();
            consoleFeaturePermissions.forEach(permission -> {
                apiResourceCollections.forEach(apiResourceCollection -> {
                    // If the role has the edit feature scope, then we add all the write and read scopes.
                    if (apiResourceCollection.getEditFeatureScope() != null &&
                        apiResourceCollection.getEditFeatureScope().equals(permission.getName())) {
                        apiResourceCollection.getWriteScopes().forEach(writeScope -> {
                            Optional<Permission> newPermission = systemPermissions.stream()
                                .filter(permission1 -> permission1.getName().equals(writeScope))
                                .findFirst();
                            newPermission.ifPresent(resolvedRolePermissions::add);
                        });
                    }
                    if (apiResourceCollection.getViewFeatureScope() != null &&
                        apiResourceCollection.getViewFeatureScope().equals(permission.getName())) {
                        apiResourceCollection.getReadScopes().forEach(readScope -> {
                            Optional<Permission> newPermission = systemPermissions.stream()
                                .filter(permission1 -> permission1.getName().equals(readScope))
                                .findFirst();
                            newPermission.ifPresent(resolvedRolePermissions::add);
                        });
                    }
                    if (isGranularConsolePermissionsEnabled()) {
                        // If the role has the create feature scope, then we add all the create scopes.
                        if (apiResourceCollection.getCreateFeatureScope() != null &&
                            apiResourceCollection.getCreateFeatureScope().equals(permission.getName())) {
                            apiResourceCollection.getCreateScopes().forEach(createScope -> {
                                Optional<Permission> newPermission = systemPermissions.stream()
                                    .filter(permission1 -> permission1.getName().equals(createScope))
                                    .findFirst();
                                newPermission.ifPresent(resolvedRolePermissions::add);
                            });
                        }
                        // If the role has the update feature scope, then we add all the update scopes.
                        if (apiResourceCollection.getUpdateFeatureScope() != null &&
                            apiResourceCollection.getUpdateFeatureScope().equals(permission.getName())) {
                            apiResourceCollection.getUpdateScopes().forEach(updateScope -> {
                                Optional<Permission> newPermission = systemPermissions.stream()
                                    .filter(permission1 -> permission1.getName().equals(updateScope))
                                    .findFirst();
                                newPermission.ifPresent(resolvedRolePermissions::add);
                            });
                        }
                        // If the role has the delete feature scope, then we add all the delete scopes.
                        if (apiResourceCollection.getDeleteFeatureScope() != null &&
                            apiResourceCollection.getDeleteFeatureScope().equals(permission.getName())) {
                            apiResourceCollection.getDeleteScopes().forEach(deleteScope -> {
                                Optional<Permission> newPermission = systemPermissions.stream()
                                    .filter(permission1 -> permission1.getName().equals(deleteScope))
                                    .findFirst();
                                newPermission.ifPresent(resolvedRolePermissions::add);
                            });
                        }
                    }
                });
            });
            upgradedPermissions = new ArrayList<>(resolvedRolePermissions);
        } else {
            // This is where we handle the initial console roles (console roles created in 7.0.0) permissions.
            // Here we assume these role only contains legacy feature scope not the new feature scopes.
            Set<Permission> resolvedRolePermissions = new HashSet<>(new ArrayList<>(rolePermissions));
            List<Permission> consolePermissions = getConsolePermissions(rolePermissions);
            consolePermissions.forEach(permission -> {
                apiResourceCollections.forEach(apiResourceCollection -> {
                    // Match the permission with the collection.
                    if (apiResourceCollection.getReadScopes().contains(permission.getName())) {
                        // Add new read scopes since we have the feature scope.
                        apiResourceCollection.getReadScopes().forEach(newReadScope -> {
                            Optional<Permission> newPermission = systemPermissions.stream()
                                .filter(permission1 -> permission1.getName().equals(newReadScope))
                                .findFirst();
                            newPermission.ifPresent(resolvedRolePermissions::add);
                        });
                        List<String> legacyWriteScopes = apiResourceCollection.getLegacyWriteScopes();
                        // if all the writeScopes are in the role's permission list, then add new write scopes.
                        if (rolePermissions.stream().anyMatch(rolePermission ->
                            legacyWriteScopes.contains(rolePermission.getName()))) {
                            apiResourceCollection.getWriteScopes().forEach(newWriteScope -> {
                                Optional<Permission> newPermission = systemPermissions.stream()
                                    .filter(permission1 -> permission1.getName().equals(newWriteScope))
                                    .findFirst();
                                newPermission.ifPresent(resolvedRolePermissions::add);
                            });
                        }
                    }
                });
            });
            upgradedPermissions = new ArrayList<>(resolvedRolePermissions);
        }
        resolveWriteFeatureScopes(upgradedPermissions, apiResourceCollections, systemPermissions);
        return upgradedPermissions;
    }

    /**
     * Check whether the granular console permission model (create/update/delete feature scopes) is enabled.
     *
     * @return True if granular console permissions are enabled.
     */
    private boolean isGranularConsolePermissionsEnabled() {

        return Boolean.parseBoolean(IdentityUtil.getProperty(USE_GRANULAR_CONSOLE_PERMISSIONS_CONFIG));
    }

    /**
     * This supports backward compatibility between the legacy write model and the new granular permission model,
     * so that a role resolves correctly regardless of which model it was created with:
     *   - The edit (write) feature scope is equivalent to having the create, update, delete and view feature scopes.
     *     So if the role has the edit feature scope, then the create, update, delete and view feature scopes are added.
     *   - View feature scope is explicitly added when edit, create, update, delete feature scope is selected.
     *   - If `create, update, delete` present-> Add `edit` (write)
     *   - If `edit` (write) -> Add `create, update and delete`
     *
     * Only the feature scopes are added here; the internal scopes corresponding to these feature scopes are already
     * resolved earlier in {@link #getUpgradedPermissions}.
     *
     * @param resolvedRolePermissions Resolved role permissions to be updated in place.
     * @param apiResourceCollections  API resource collections.
     * @param systemPermissions       System permissions used to resolve permission details from permission names.
     */
    private void resolveWriteFeatureScopes(List<Permission> resolvedRolePermissions,
                                           List<APIResourceCollection> apiResourceCollections,
                                           List<Permission> systemPermissions) {

        Set<String> resolvedPermissionNames = resolvedRolePermissions.stream().map(Permission::getName)
            .collect(Collectors.toCollection(HashSet::new));
        apiResourceCollections.forEach(apiResourceCollection -> {
            String editFeatureScope = apiResourceCollection.getEditFeatureScope();
            String createFeatureScope = apiResourceCollection.getCreateFeatureScope();
            String updateFeatureScope = apiResourceCollection.getUpdateFeatureScope();
            String deleteFeatureScope = apiResourceCollection.getDeleteFeatureScope();

            boolean hasEdit = editFeatureScope != null && resolvedPermissionNames.contains(editFeatureScope);
            boolean hasCreate = createFeatureScope != null && resolvedPermissionNames.contains(createFeatureScope);
            boolean hasUpdate = updateFeatureScope != null && resolvedPermissionNames.contains(updateFeatureScope);
            boolean hasDelete = deleteFeatureScope != null && resolvedPermissionNames.contains(deleteFeatureScope);

            // The edit feature scope is equivalent to having the create, update, delete feature scopes.
            if (hasEdit && isGranularConsolePermissionsEnabled()) {
                if (!hasCreate) {
                     addResolvedScope(createFeatureScope, systemPermissions, resolvedRolePermissions,
                         resolvedPermissionNames);
                }
                if (!hasUpdate) {
                     addResolvedScope(updateFeatureScope, systemPermissions, resolvedRolePermissions,
                         resolvedPermissionNames);
                }
                if (!hasDelete) {
                     addResolvedScope(deleteFeatureScope, systemPermissions, resolvedRolePermissions,
                         resolvedPermissionNames);
                }
            }
            // If the role has all the granular write feature scopes, it is equivalent to the edit feature scope.
            if (hasCreate && hasUpdate && hasDelete && !hasEdit) {
                addResolvedScope(editFeatureScope, systemPermissions, resolvedRolePermissions, resolvedPermissionNames);
            }
        });
    }

    /**
     * Resolve the given scope name against the system permissions and add it to the resolved role permissions if it is
     * not already present.
     *
     * @param scope                   Scope name to resolve and add.
     * @param systemPermissions       System permissions used to resolve permission details from permission names.
     * @param resolvedRolePermissions Resolved role permissions to be updated in place.
     * @param resolvedPermissionNames Names of the already resolved permissions, used to avoid duplicates.
     */
    private void addResolvedScope(String scope, List<Permission> systemPermissions,
                                  List<Permission> resolvedRolePermissions, Set<String> resolvedPermissionNames) {

        if (scope == null || resolvedPermissionNames.contains(scope)) {
            return;
        }
        systemPermissions.stream()
            .filter(systemPermission -> systemPermission.getName().equals(scope))
            .findFirst()
            .ifPresent(systemPermission -> {
                resolvedRolePermissions.add(systemPermission);
                resolvedPermissionNames.add(scope);
            });
    }

    private boolean shouldSkipPermissionResolution(RoleBasicInfo role) {

        // Permission handling only for console roles.
        if (role == null || !CONSOLE_APP_AUDIENCE_NAME.equals(role.getAudienceName())) {
            return true;
        }
        // Console Administrator role has all the permissions.
        return RoleConstants.ADMINISTRATOR.equals(role.getName());
    }

    private RoleBasicInfo getRoleBasicInfo(String roleId, String tenantDomain)
        throws IdentityRoleManagementException {

        RoleManagementService roleManagementService = AppsCommonDataHolder.getInstance().getRoleManagementServiceV2();
        return roleManagementService.getRoleBasicInfoById(roleId, tenantDomain);
    }

    /**
     * Check whether the app is a console application based in audience.
     *
     * @param audience     Audience.
     * @param audienceId   Audience id.
     * @param tenantDomain Tenant domain.
     * @return True if the app is a console application.
     * @throws IdentityRoleManagementException If an error occurs while checking the app.
     */
    private boolean isConsoleApp(String audience, String audienceId, String tenantDomain)
        throws IdentityRoleManagementException {

        if (!RoleConstants.APPLICATION.equalsIgnoreCase(audience)) {
            return false;
        }
        ApplicationManagementService applicationManagementService = AppsCommonDataHolder.getInstance()
            .getApplicationManagementService();
        try {
            ApplicationBasicInfo applicationBasicInfo = applicationManagementService
                .getApplicationBasicInfoByResourceId(audienceId, tenantDomain);
            return applicationBasicInfo != null && CONSOLE_APP_AUDIENCE_NAME
                .equals(applicationBasicInfo.getApplicationName());
        } catch (IdentityApplicationManagementException e) {
            throw new IdentityRoleManagementException("Error while retrieving application basic info for application " +
                "id : " + audienceId, e);
        }
    }

    /**
     * Get API resource collections for the tenant. This will return all the tenant and organization specific API
     * collections.
     *
     * @param tenantDomain Tenant domain.
     * @return List of API resource collections.
     * @throws IdentityRoleManagementException If an error occurs while retrieving the API resource collections.
     */
    private List<APIResourceCollection> getAPIResourceCollections(String tenantDomain)
        throws IdentityRoleManagementException {

        try {
            List<String> requiredAttributes = new ArrayList<>();
            requiredAttributes.add("apiResources");
            APIResourceCollectionSearchResult apiResourceCollectionSearchResult = AppsCommonDataHolder
                .getInstance().getApiResourceCollectionManager()
                .getAPIResourceCollections("", requiredAttributes, tenantDomain);
            return apiResourceCollectionSearchResult.getAPIResourceCollections();

        } catch (APIResourceCollectionMgtException e) {
            throw new IdentityRoleManagementException("Error while retrieving api collection for tenant : " +
                tenantDomain, e);
        }
    }

    /**
     * Get console feature permissions from the role permissions.
     *
     * @param rolePermissions Role permissions.
     * @return List of console feature permissions.
     */
    private List<Permission> getConsoleFeaturePermissions(List<Permission> rolePermissions) {

        return rolePermissions.stream().filter(permission -> permission != null &&
                permission.getName() != null && (permission.getName().startsWith(CONSOLE_SCOPE_PREFIX)
                || permission.getName().startsWith(CONSOLE_ORG_SCOPE_PREFIX)) &&
                (permission.getName().endsWith(VIEW_FEATURE_SCOPE_SUFFIX) ||
                    permission.getName().endsWith(EDIT_FEATURE_SCOPE_SUFFIX) ||
                    permission.getName().endsWith(CREATE_FEATURE_SCOPE_SUFFIX) ||
                    permission.getName().endsWith(UPDATE_FEATURE_SCOPE_SUFFIX) ||
                    permission.getName().endsWith(DELETE_FEATURE_SCOPE_SUFFIX)))
            .collect(Collectors.toList());
    }

    /**
     * Get console permissions (old ones) from the role permissions.
     *
     * @param rolePermissions Role permissions.
     * @return List of console permissions.
     */
    private List<Permission> getConsolePermissions(List<Permission> rolePermissions) {

        return rolePermissions.stream().filter(permission -> permission != null &&
                permission.getName() != null && (permission.getName().startsWith(CONSOLE_SCOPE_PREFIX)
                || permission.getName().startsWith(CONSOLE_ORG_SCOPE_PREFIX)) &&
                !(permission.getName().endsWith(VIEW_FEATURE_SCOPE_SUFFIX) ||
                    permission.getName().endsWith(EDIT_FEATURE_SCOPE_SUFFIX) ||
                    permission.getName().endsWith(CREATE_FEATURE_SCOPE_SUFFIX) ||
                    permission.getName().endsWith(UPDATE_FEATURE_SCOPE_SUFFIX) ||
                    permission.getName().endsWith(DELETE_FEATURE_SCOPE_SUFFIX)))
            .collect(Collectors.toList());
    }

    /**
     * Get system permissions for the tenant.
     *
     * @param tenantDomain Tenant domain.
     * @return List of system permissions.
     * @throws IdentityRoleManagementException If an error occurs while retrieving the system permissions.
     */
    private List<Permission> getSystemPermission(String tenantDomain) throws IdentityRoleManagementException {
        List<Scope> systemScopes;

        try {
            systemScopes = AppsCommonDataHolder.getInstance()
                .getAPIResourceManager().getSystemAPIScopes(tenantDomain);
        } catch (APIResourceMgtException e) {
            throw new IdentityRoleManagementException("Error while retrieving internal scopes for tenant " +
                "domain : " + tenantDomain, e);
        }
        return systemScopes.stream().map(scope -> new Permission(scope.getName(), scope.getDisplayName(),
            scope.getApiID())).collect(Collectors.toList());
    }
}


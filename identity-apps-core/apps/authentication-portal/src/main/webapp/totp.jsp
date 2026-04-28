<%--
 ~
 ~ Copyright (c) 2021, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
 ~
 ~ This software is the property of WSO2 LLC. and its suppliers, if any.
 ~ Dissemination of any information or reproduction of any material contained
 ~ herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
 ~ You may not alter or remove any copyright or other notice from copies of this content."
 ~
--%>

<%@ page import="org.apache.commons.text.StringEscapeUtils" %>
<%@ page import="org.owasp.encoder.Encode" %>
<%@ page import="org.wso2.carbon.identity.application.authentication.endpoint.util.Constants" %>
<%@ page import="org.wso2.carbon.identity.application.authentication.framework.util.FrameworkConstants" %>
<%@ page import="org.wso2.carbon.identity.application.authenticator.totp.TOTPAuthenticatorConstants" %>
<%@ page import="org.wso2.carbon.identity.core.util.IdentityCoreConstants" %>
<%@ page import="java.io.File" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.util.Arrays" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.Map" %>
<%@ page import="org.wso2.carbon.identity.application.authentication.endpoint.util.AuthenticationEndpointUtil" %>
<%@ page import="org.wso2.carbon.identity.application.authenticator.totp.util.TOTPUtil" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="layout" uri="org.wso2.identity.apps.taglibs.layout.controller" %>
<%@ include file="includes/localize.jsp" %>
<jsp:directive.include file="includes/init-url.jsp"/>
<%@ include file="util/authenticator-utils.jsp" %>

<%
    // Add the totp screen to the list to retrieve text branding customizations.
    screenNames.add("totp");
%>

<%-- Branding Preferences --%>
<jsp:directive.include file="includes/branding-preferences.jsp"/>

<%
    request.getSession().invalidate();
    int otpLength = 6;
    String queryString = request.getQueryString();
    Map<String, String> idpAuthenticatorMapping = null;
    if (request.getAttribute(Constants.IDP_AUTHENTICATOR_MAP) != null) {
        idpAuthenticatorMapping = (Map<String, String>) request.getAttribute(Constants.IDP_AUTHENTICATOR_MAP);
    }
    boolean isSendVerificationCodeByEmailEnabled = TOTPUtil.isSendVerificationCodeByEmailEnabled();
    String errorMessage = AuthenticationEndpointUtil.i18n(resourceBundle,"error.retry");
    String authenticationFailed = "false";
    if (Boolean.parseBoolean(request.getParameter(Constants.AUTH_FAILURE))) {
        authenticationFailed = "true";
        boolean isErrorMessageFromErrorCodeAdded = false;
        String errorCode = request.getParameter(FrameworkConstants.ERROR_CODE);
        if (errorCode != null) {
            if (errorCode.equals(IdentityCoreConstants.USER_ACCOUNT_LOCKED_ERROR_CODE)) {
                String lockedReason = request.getParameter(FrameworkConstants.LOCK_REASON);
                if (lockedReason != null) {
                    if (lockedReason.equals(TOTPAuthenticatorConstants.MAX_TOTP_ATTEMPTS_EXCEEDED)) {
                        errorMessage = AuthenticationEndpointUtil.i18n(resourceBundle, "error.user.account.locked.incorrect.login.attempts");
                        isErrorMessageFromErrorCodeAdded = true;
                    } else if (lockedReason.equals(TOTPAuthenticatorConstants.ADMIN_INITIATED)) {
                        errorMessage = AuthenticationEndpointUtil.i18n(resourceBundle, "error.user.account.locked.admin.initiated");
                        isErrorMessageFromErrorCodeAdded = true;
                    }
                }
            }
        }
        if (!isErrorMessageFromErrorCodeAdded && request.getParameter(Constants.AUTH_FAILURE_MSG) != null) {
            String error = Encode.forHtmlAttribute(request.getParameter(Constants.AUTH_FAILURE_MSG));
             if (error.equalsIgnoreCase("authentication.fail.message") ||
                     error.equalsIgnoreCase("login.fail.message")) {
                errorMessage = AuthenticationEndpointUtil.i18n(resourceBundle,"error.retry");
            } else if (!error.equalsIgnoreCase(AuthenticationEndpointUtil.i18n(resourceBundle, error))) {
                errorMessage = AuthenticationEndpointUtil.i18n(resourceBundle, error);
            }
        }
    }
%>

<html lang="en-US">
    <head>
        <%-- header --%>
        <%
            File headerFile = new File(getServletContext().getRealPath("extensions/header.jsp"));
            if (headerFile.exists()) {
        %>
        <jsp:include page="extensions/header.jsp"/>
        <% } else { %>
        <jsp:include page="includes/header.jsp"/>
        <% } %>

        <%-- analytics --%>
        <%
            File analyticsFile = new File(getServletContext().getRealPath("extensions/analytics.jsp"));
            if (analyticsFile.exists()) {
        %>
            <jsp:include page="extensions/analytics.jsp"/>
        <% } else { %>
            <jsp:include page="includes/analytics.jsp"/>
        <% } %>

        <script src="js/scripts.js"></script>
        <script src="/totpauthenticationendpoint/js/scripts.js"></script>
        <!--[if lt IE 9]>
        <script src="js/html5shiv.min.js"></script>
        <script src="js/respond.min.js"></script>
        <![endif]-->

        <script>
            // Handle form submission preventing double submission.
            $(document).ready(function(){
                $.fn.preventDoubleSubmission = function() {
                    $(this).on('submit',function(e){
                        var $form = $(this);
                        if ($form.data('submitted') === true) {
                            // Previously submitted - don't submit again.
                            e.preventDefault();
                            console.warn("Prevented a possible double submit event");
                        } else {
                            // Mark it so that the next submit can be ignored.
                            $form.data('submitted', true);
                        }
                    });
                    return this;
                };
                $('#totpForm').preventDoubleSubmission();
            });
        </script>
        <script type="text/javascript">
            var emailLinkClicked = false;
            function generateInstruction() {
                var isEmailCodeEnabled = "<%= isSendVerificationCodeByEmailEnabled %>" === "true" ? true : false;
                var authAppCodeText = '<%=AuthenticationEndpointUtil.i18n(resourceBundle, "enter.verification.code.got.by.device")%>';
                var emailCodeText = '<%=AuthenticationEndpointUtil.i18n(resourceBundle, "enter.verification.code.got.via.email")%>';
                var text = isEmailCodeEnabled && emailLinkClicked ? emailCodeText : authAppCodeText;
                $("#instruction").empty().append(text);
            }
            $(document).ready(function() {
                generateInstruction();
            })
        </script>
    </head>

    <body class="login-portal layout totp-portal-layout">
        <% if (new File(getServletContext().getRealPath("extensions/timeout.jsp")).exists()) { %>
            <jsp:include page="extensions/timeout.jsp"/>
        <% } else { %>
            <jsp:include page="util/timeout.jsp"/>
        <% } %>

        <layout:main layoutName="<%= layout %>" layoutFileRelativePath="<%= layoutFileRelativePath %>" data="<%= layoutData %>" >
            <layout:component componentName="ProductHeader">
                <%-- product-title --%>
                <%
                    File productTitleFile = new File(getServletContext().getRealPath("extensions/product-title.jsp"));
                    if (productTitleFile.exists()) {
                %>
                    <jsp:include page="extensions/product-title.jsp"/>
                <% } else { %>
                    <jsp:include page="includes/product-title.jsp"/>
                <% } %>
            </layout:component>
            <layout:component componentName="MainSection">
                <div class="ui segment">
                    <%-- page content --%>
                    <h3 class="ui header text-center">
                        <%= i18n(resourceBundle, customText, "totp.heading") %>
                    </h3>

                    <%
                        if ("true".equals(authenticationFailed)) {
                    %>
                            <div class="ui negative message" id="failed-msg"><%=errorMessage%></div>
                            <div class="ui divider hidden"></div>
                    <% } %>

                    <input id="username" type="hidden"
                        value='<%=Encode.forHtmlAttribute(request.getParameter("username"))%>'>

                    <div class="segment-form">
                        <form action="<%=commonauthURL%>" method="post" id="totpForm" class="ui large form otp-form">
                            <p class="text-center" id="instruction"></p>
                            <div class="field">
                                <input hidden type="text"  id="token" name="token" class="form-control" placeholder="<%=AuthenticationEndpointUtil.i18n(resourceBundle, "verification.code")%>">
                            </div>

                            <div class="equal width fields segmented-otp-field">
                                <input
                                    type="text"
                                    id="totpOTPInput"
                                    class="segmented-otp-input"
                                    maxlength="<%= otpLength %>"
                                    autocomplete="one-time-code"
                                    autocorrect="off"
                                    autocapitalize="off"
                                    spellcheck="false"
                                    inputmode="numeric"
                                    autofocus
                                    aria-label="<%=AuthenticationEndpointUtil.i18n(resourceBundle, "verification.code")%>"
                                >
                                <% for (int i = 1; i <= otpLength; i++) { %>
                                <div class="field mt-5">
                                    <div class="text-center p-1 pb-3 pt-3" id="pincode-<%=i%>" aria-hidden="true">·</div>
                                </div>
                                <% } %>
                            </div>

                            <input id="sessionDataKey" type="hidden" name="sessionDataKey"
                                value='<%=Encode.forHtmlAttribute(request.getParameter("sessionDataKey"))%>' />
                            <div class="ui divider hidden"></div>

                            <% if (request.getParameter("multiOptionURI") != null &&
                                AuthenticationEndpointUtil.isValidURL(request.getParameter("multiOptionURI")) &&
                                request.getParameter("multiOptionURI").contains("backup-code-authenticator")) { %>
                                <div class="social-login blurring social-dimmer text-left">
                                        <div class="field text-left">
                                            <label><%=AuthenticationEndpointUtil.i18n(resourceBundle, "cannot.access.totp")%></label>

                                            <a
                                                onclick="window.location.href='<%=commonauthURL%>?idp=LOCAL&authenticator=backup-code-authenticator&sessionDataKey=<%=Encode.forUriComponent(request.getParameter("sessionDataKey"))%>&multiOptionURI=<%=Encode.forUriComponent(request.getParameter("multiOptionURI"))%>';"
                                                target="_blank"
                                                class="clickable-link text-left"
                                                rel="noopener noreferrer"
                                                data-testid="login-page-backup-code-link"
                                            >
                                                <%=AuthenticationEndpointUtil.i18n(resourceBundle, "use.backup.code")%>
                                            </a>
                                        </div>
                                </div>
                            <% }%>

                            <input id="multiOptionURI" type="hidden" name="multiOptionURI"
                                value='<%=Encode.forHtmlAttribute(request.getParameter("multiOptionURI"))%>' />
                            <div class="ui divider hidden"></div>
                            <div>
                                <input type="submit" id="subButton" disabled
                                value="<%=AuthenticationEndpointUtil.i18n(resourceBundle, "authenticate")%>"
                                class="ui primary fluid large button" />
                            </div>

                            <div class="text-center mt-1">
                                <% if(isSendVerificationCodeByEmailEnabled) { %>
                                    <a class="ui fluid large button secondary" id="genToken" href="#"
                                    onclick="return requestTOTPToken();">
                                    <%=AuthenticationEndpointUtil.i18n(resourceBundle, "get.verification.code")%>
                                    </a>
                                <% } else {
                                    String multiOptionURI = request.getParameter("multiOptionURI");
                                    if (multiOptionURI != null &&
                                        AuthenticationEndpointUtil.isValidMultiOptionURI(multiOptionURI) &&
                                        isMultiAuthAvailable(multiOptionURI, request.getParameter("authenticators"))) {
                                %>
                                    <a class="ui primary basic button link-button" id="goBackLink"
                                        href='<%=Encode.forHtmlAttribute(multiOptionURI)%>'>
                                            <%=AuthenticationEndpointUtil.i18n(resourceBundle, "choose.other.option")%>
                                    </a>
                                <% } } %>
                            </div>

                        </div>
                        </form>
                        <% if(StringUtils.isBlank(supportEmail)) { %>
                            <div class="ui" id="enrol-msg"><%=AuthenticationEndpointUtil.i18n(resourceBundle, "totp.enroll.message1" )%> <%=AuthenticationEndpointUtil.i18n(resourceBundle, "totp.enroll.message2" )%></div>
                        <% } else { %>
                            <div class="ui" id="enrol-msg"><%=AuthenticationEndpointUtil.i18n(resourceBundle, "totp.enroll.message1" )%> <a href="mailto:<%= StringEscapeUtils.escapeHtml4(supportEmail) %>"><%=AuthenticationEndpointUtil.i18n(resourceBundle, "totp.enroll.message2" )%></a></div>
                        <% } %>
                </div>
            </layout:component>
            <layout:component componentName="ProductFooter">
                <%-- product-footer --%>
                <%
                    File productFooterFile = new File(getServletContext().getRealPath("extensions/product-footer.jsp"));
                    if (productFooterFile.exists()) {
                %>
                    <jsp:include page="extensions/product-footer.jsp"/>
                <% } else { %>
                    <jsp:include page="includes/product-footer.jsp"/>
                <% } %>
            </layout:component>
            <layout:dynamicComponent filePathStoringVariableName="pathOfDynamicComponent">
                <jsp:include page="${pathOfDynamicComponent}" />
            </layout:dynamicComponent>
        </layout:main>

        <%-- footer --%>
        <%
            File footerFile = new File(getServletContext().getRealPath("extensions/footer.jsp"));
            if (footerFile.exists()) {
        %>
            <jsp:include page="extensions/footer.jsp"/>
        <% } else { %>
            <jsp:include page="includes/footer.jsp"/>
        <% } %>

        <script type="text/javascript">
            var insightsTenantIdentifier = "<%=userTenant%>";

            function updateTotpDigitBoxes(value) {
                for (var i = 1; i <= <%= otpLength %>; i++) {
                    var box = document.getElementById('pincode-' + i);
                    if (box) box.textContent = (value.length >= i) ? value[i - 1] : '·';
                }
            }

            var totpInput = document.getElementById('totpOTPInput');
            var tokenField = document.getElementById('token');
            var submitBtn = document.getElementById('subButton');

            function updateTotpCursor(value) {
                for (var i = 1; i <= <%= otpLength %>; i++) {
                    var box = document.getElementById('pincode-' + i);
                    if (box) box.classList.remove('active-pincode');
                }
                if (value.length < <%= otpLength %>) {
                    var activeBox = document.getElementById('pincode-' + (value.length + 1));
                    if (activeBox) activeBox.classList.add('active-pincode');
                }
            }

            function handlePaste(e) {
                e.preventDefault();
                var pasted = (e.clipboardData || window.clipboardData).getData('Text').replace(/\s/g, '');
                if (!/^\d+$/.test(pasted)) return;
                totpInput.value = pasted.slice(0, <%= otpLength %>);
                totpInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
            }

            function handleKeypress(e) {
                var char = String.fromCharCode(e.which);
                if (!/\d/.test(char)) e.preventDefault();
            }

            function handleInput() {
                var sanitized = totpInput.value.replace(/\D/g, '');
                if (sanitized !== totpInput.value) totpInput.value = sanitized;
                tokenField.value = sanitized;
                updateTotpDigitBoxes(sanitized);
                updateTotpCursor(sanitized);
                submitBtn.disabled = sanitized.length !== <%= otpLength %>;
            }

            if (totpInput) {
                document.addEventListener('selectionchange', function () {
                    if (document.activeElement === totpInput) {
                        totpInput.selectionStart = totpInput.selectionEnd = totpInput.value.length;
                    }
                });
                totpInput.addEventListener('copy', function (e) { e.preventDefault(); });
                totpInput.addEventListener('cut', function (e) { e.preventDefault(); });
                totpInput.addEventListener('focus', function () { updateTotpCursor(this.value); });
                totpInput.addEventListener('blur', function () { updateTotpCursor('x'.repeat(<%= otpLength %>)); });
                totpInput.addEventListener('keypress', handleKeypress);
                totpInput.addEventListener('paste', handlePaste);
                totpInput.addEventListener('input', handleInput);
                updateTotpCursor(totpInput.value);
            }

            document.getElementById('totpForm').addEventListener('submit', function() {
                if (totpInput) tokenField.value = totpInput.value;
                trackEvent("authentication-portal-totp-click-continue", {
                    "tenant": insightsTenantIdentifier != "null" ? insightsTenantIdentifier : ""
                });
            });
        </script>
    </body>
</html>

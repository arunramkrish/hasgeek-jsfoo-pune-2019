//initialize keycloak and bootstrap angular
(function () {
    'use strict';
    var authModule = angular.module('app.auth', []);

    function registerAuthListeners(Auth) {
        Auth.onReady = function () {
            console.log("Adapter is initialized");
        };

        Auth.onAuthSuccess = function () {
            console.log("User is successfully authenticated");
            loadRootScopeWithUserProfile(Auth);
        };

        Auth.onAuthError = function () {
            console.log("Error during authentication");
        };

        Auth.onAuthRefreshSuccess = function () {
            //Called when the token is refreshed.
            console.log("Auth refresh success");
        };

        Auth.onAuthRefreshError = function () {
            //Called if there was an error while trying to refresh the token.
            console.log("Auth refresh error");
        };

        Auth.onAuthLogout = function () {
            //Called if the user is logged out (will only be called if the session status iframe is enabled, or in Cordova mode).
            console.log("Auth logout successfully");
        };

        Auth.onTokenExpired = function () {
            //Called when the access token is expired. 
            //If a refresh token is available the token can be refreshed with updateToken, or 
            //in cases where it is not (that is, with implicit flow) you can redirect to login screen to obtain a new access token.
            console.log("Token expired");
        };
    }

    //store / cache user profile in rootScope
    function loadRootScopeWithUserProfile(Auth) {
        Auth.principal = Auth.tokenParsed;
        Auth.principal.userRoles = {};
        Auth.principal.userEntitlements = getEntitlements(Auth, rolesToEntitlements);
        Auth.principal.userStates = getStates(Auth, roleToStates);
        console.log("obtained post auth" + Auth.principal);
    }

    function getEntitlements(Auth, allRoles) {
        var userEntitlements = {};
        Object.getOwnPropertyNames(allRoles).forEach(function (role) {
            if (Auth.principal.resource_access["ies_fees"].roles.indexOf(role) >= 0) {
                //get entitlements for the current role
                console.log("fetching entitlements for role " + role);
                var roleWithEntitlements = allRoles[role];
                Auth.principal.userRoles[role] = true;
                roleWithEntitlements.forEach(function (e) {
                    //check each entitlement if present in userEntitlements and add it to the array if not present
                    if (!userEntitlements[e]) {
                        console.log("Adding entitlement to user " + e);
                        userEntitlements[e] = true;
                    }
                });
            }
        });
        console.log(userEntitlements);
        return userEntitlements;
    }

    //get the states for the role
    function getStates(Auth, allRoles) {
        var userStates = {};
        Object.getOwnPropertyNames(allRoles).forEach(function (role) {
            if (Auth.principal.realm_access.roles.indexOf(role) >= 0) {
                //get entitlements for the current role
                console.log("fetching states for role " + role);
                var roleWithStates = allRoles[role];
                roleWithStates.forEach(function (e) {
                    //check each state if present in userState and add it to the array if not present
                    if (!userStates[e]) {
                        console.log("Adding state to user " + e);
                        userStates[e] = true;
                    }
                });
            }
        });
        console.log(userStates);
        return userStates;
    }

    var rolesToEntitlements =
        {
            "EXAM_FEES_ADMIN": [
                "MANAGE_FEE_COMPONENTS",
                "MANAGE_FEE_STRUCTURE",
                "GENERATE_PUBLISH_FEES"
            ],
            "FEES_ADMIN": [
                "MANAGE_FEE_COMPONENTS",
                "MANAGE_FEE_STRUCTURE",
                "GENERATE_PUBLISH_FEES",
                "FEES_COLLECTION"
            ]
        };

    //added entitlements (key) and state(value)
    //all these states used in current example come under application sales 
    var roleToStates =
        {
            "EXAM_FEES_ADMIN": [
                "setupAccount",
                "feeComponent",
                "feeTemplate",
                "createFeeStructure",
                "editFeeStructure",
                "concessionRules",
                "refundRules",
                "feeCollection",
                "browseFeeStructure",
                "genPubFees"
            ],
            "FEES_ADMIN": [
                "setupAccount",
                "feeComponent",
                "feeTemplate",
                "createFeeStructure",
                "editFeeStructure",
                "concessionRules",
                "refundRules",
                "feeCollection",
                "browseFeeStructure",
                "genPubFees"
            ]
        };

    authModule.constant("rolesToEntitlements", rolesToEntitlements);
    authModule.constant("roleToStates", roleToStates);

    // angular.element(document).ready(function () {
    // });

    function authWithKeycloak() {
        var keycloak = new Keycloak(window.keycloakConfig);
        //register listeners
        registerAuthListeners(keycloak);
        var keycloakEnabled = false;

        if (keycloakEnabled) {
            keycloak.init({
                onLoad: 'login-required',
                checkLoginIframe: true,
                checkLoginIframeInterval: 5,
                responseMode: 'fragment'
            }).success(function (authenticated) {
                authModule.factory('Auth', function () {
                    return keycloak;
                });
                bootstrap();

            }).error(function () {
                alert("Authentication failed");
                // window.location.reload();
            });
        } else {
            authModule.factory('Auth', function () {
                var keycloak = {};
                keycloak.tokenParsed = {
                    email: 'admin@psg',
                    preferred_username: 'admin',
                    name: 'Admin',
                    userRoles: {
                        'EXAM_FEES_ADMIN': 1
                    }
                };
                keycloak.hasResourceRole = function (role) {
                    return (role == "EXAM_FEES_ADMIN");
                };
                keycloak.principal = keycloak.tokenParsed;
                // keycloak.tokenParsed = {
                //     email: '16utc35@psg',
                //     preferred_username: '16utc35',
                //     name: '16UTC35',
                //     userRoles: {
                //         'PLACEMENT_STUDENT': 1
                //     }
                // };
                // keycloak.hasResourceRole = function (role) {
                //     return (role == "PLACEMENT_STUDENT");
                // };

                return keycloak;
            });
            bootstrap();
        }
    };//end document ready

    function bootstrap() {
        angular.element(document).ready(function () {
            angular.bootstrap(document, ['app']);
        });
    }

    authWithKeycloak();

})();//end function

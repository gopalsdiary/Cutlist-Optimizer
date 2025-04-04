app.service('AuthService', ['$http', 'CutListCfg', '$httpParamSerializerJQLike', 'ClientInfo', '$q', '$window', '$injector', 'AnalyticsService',
    function ($http, CutListCfg, $httpParamSerializerJQLike, ClientInfo, $q, $window, $injector, AnalyticsService) {

    var self = this;

    this.isLoggedIn = function () {
        return !!ClientInfo.accessToken || !!ClientInfo.email;
    };

    this.confirmRegistration = function (id, token) {

        var deferred = $q.defer();
        var data = {id: id, token: token};

        $http({
            url: CutListCfg.localBaseUrl + '/registrationConfirm',
            method: 'POST',
            data: $httpParamSerializerJQLike(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa('cutlistoptimizer:cutlistoptimizer')
            }
        }).then(function (response) {
                ClientInfo.id = id;
                ClientInfo.email = id;
                ClientInfo.accessToken = response.data.accessToken;
                ClientInfo.refreshToken = response.data.refreshToken;

                $window.localStorage.setItem("clientGuid", JSON.stringify(ClientInfo.id));
                $window.localStorage.setItem("email", JSON.stringify(ClientInfo.email));
                $window.localStorage.setItem("accessToken", JSON.stringify(ClientInfo.accessToken));
                $window.localStorage.setItem("refreshToken", JSON.stringify(ClientInfo.refreshToken));

                console.info("Confirmed registration: " + ClientInfo.email);

                self.getUserInfo().then( function () {
                    deferred.resolve(response);
                });
            },
            function (response) {
                alert(JSON.stringify(response.data.message));
                deferred.reject(response);
            });

        return deferred.promise;
    };

    this.login = function (username, password) {

        console.info("Signing in: " + username);

        var deferred = $q.defer();
        var data = {username: username, password: password, grant_type: 'password'};

        $http({
            url: CutListCfg.localBaseUrl + '/oauth/token',
            method: 'POST',
            data: $httpParamSerializerJQLike(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa('cutlistoptimizer:cutlistoptimizer')
            }
        }).then(function (response) {
                ClientInfo.accessToken = response.data.access_token;
                ClientInfo.refreshToken = response.data.refresh_token;

                $window.localStorage.setItem("accessToken", JSON.stringify(ClientInfo.accessToken));
                $window.localStorage.setItem("refreshToken", JSON.stringify(ClientInfo.refreshToken));

                deferred.resolve(response);
            },
            function (response) {
                console.warn("Failed login request: " + JSON.stringify(response));
                deferred.reject(response);
            });

        return deferred.promise;
    };

    this.registerOauth2Login = function () {

        var deferred = $q.defer();

        if (typeof android === 'undefined') {
            $http({
                url: CutListCfg.localBaseUrl + '/tokens/generate',
                method: "GET"
            }).then(function (response) {
                ClientInfo.accessToken = response.data.accessToken;
                ClientInfo.refreshToken = response.data.refreshToken;

                $window.localStorage.setItem("accessToken", JSON.stringify(ClientInfo.accessToken));
                $window.localStorage.setItem("refreshToken", JSON.stringify(ClientInfo.refreshToken));

                self.getUserInfo().then( function () {
                    deferred.resolve(response);
                });
            }, function (reason) {
                console.error("Error while getting internal token\n" + JSON.stringify(reason));
                deferred.reject(reason);
            });
        } else {
            // Android device has already injected client data
            console.info("Signed in with Oauth2 on Android: " + ClientInfo.email);
            deferred.resolve();
        }

        return deferred.promise;
    };

    this.refreshToken = function () {

        var deferred = $q.defer();

        if (!ClientInfo.refreshToken) {
            console.warn("Tried to refresh token without a refresh token");
            deferred.reject();
            return deferred.promise;
        }

        console.info("Refreshing authentication token with refreshToken[" + ClientInfo.refreshToken + "]...");

        var data = {refresh_token: ClientInfo.refreshToken, grant_type: 'refresh_token'};

        $http({
            url: CutListCfg.localBaseUrl + '/oauth/token',
            method: 'POST',
            data: $httpParamSerializerJQLike(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa('cutlistoptimizer:cutlistoptimizer')
            }
        }).then(function (response) {
                ClientInfo.accessToken = response.data.access_token;
                ClientInfo.refreshToken = response.data.refresh_token;

                $window.localStorage.setItem("accessToken", JSON.stringify(ClientInfo.accessToken));
                $window.localStorage.setItem("refreshToken", JSON.stringify(ClientInfo.refreshToken));

                deferred.resolve(response);
            },
            function (response) {
                console.error("Error refreshing authentication token: " + JSON.stringify(response));
                deferred.reject(response);
            });

        return deferred.promise;
    };

    this.getAnalyticsData = function () {
        function requestData() {
            const deferred = $q.defer();

            $http({
                url: CutListCfg.localBaseUrl + '/client-stats/?clientId=' + encodeURIComponent(ClientInfo.id) + "&timeZone=" + encodeURIComponent(ClientInfo.timeZone),
                method: "GET",
                headers: self.getHttpHeaders()
            }).then(function (response) {
                ClientInfo.nbrExecutionsDay = response.data.nbrCalculationsDay;
                ClientInfo.nbrExecutionsWeek = response.data.nbrCalculationsWeek;
                ClientInfo.nbrExecutionsMonth = response.data.nbrCalculationsMonth;
                ClientInfo.nbrExecutionsYear = response.data.nbrCalculationsYear;
                ClientInfo.nbrCalculationsIpDay = response.data.nbrCalculationsIpDay;
                deferred.resolve(response);
            }, function (reason) {
                console.error("Error while retrieving client calculations number: " + JSON.stringify(reason));
                deferred.reject();
            });

            return deferred.promise;
        }

        requestData().then( function () {
            console.info("Retrieved analytics for [" + ClientInfo.id + "]: nbrExecutionsYear[" + ClientInfo.nbrExecutionsYear + "] nbrExecutionsWeek[" + ClientInfo.nbrExecutionsWeek + "] nbrExecutionsDay[" + ClientInfo.nbrExecutionsDay + "]");
        });
    };

    this.getUserInfo = function () {

        var deferred = $q.defer();

        $http({
            url: CutListCfg.localBaseUrl + '/user/info',
            method: "GET",
            headers: self.getHttpHeaders()
        }).then(function (response) {
            try {
                ClientInfo.id = response.data.email;
                ClientInfo.email = response.data.email;
                ClientInfo.picture = response.data.picture;

                if (typeof android !== 'undefined') {
                    android.setClientId(ClientInfo.id);
                }

                $window.localStorage.setItem("clientGuid", JSON.stringify(ClientInfo.id));
                $window.localStorage.setItem("email", JSON.stringify(ClientInfo.email));

                console.info("Fetched user info: " + ClientInfo.email);
                $injector.get('SubscriptionService').getSubscription();
                $injector.get('PermitPeriodService').getActivePermitePeriod();

                self.getAnalyticsData();
                AnalyticsService.saveLocalStorageToServer();

                deferred.resolve(response);
            } catch (e) {
                console.error("Error while processing user info response:\n" + e.stack);
            }
        }, function (reason) {
            if (reason.status === 404) {
                console.info("User not authenticated");
            } else {
                console.error("Error while retrieving user info\n" + JSON.stringify(reason));
            }
            self.clearLocalAuthData();
            deferred.reject(reason);
        });

        return deferred.promise;
    };

    this.revokeToken = function () {

        var deferred = $q.defer();

        if (ClientInfo.accessToken) {
            $http({
                url: CutListCfg.localBaseUrl + '/tokens/revoke/' + encodeURIComponent(ClientInfo.accessToken),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'bearer ' + ClientInfo.accessToken
                }
            }).then(function (response) {
                console.info("Logged out");
                deferred.resolve(response);
            }, function (response) {
                console.error("Error while logging out: " + JSON.stringify(response));
                deferred.reject(response);
            });
        } else {
            deferred.resolve();
        }

        self.clearLocalAuthData();

        return deferred.promise;
    };

    this.register = function (username, password, passwordConfirmation, reCaptchaToken) {

        console.info("Registering user: " + username);

        var data = {
            username: username,
            password: password,
            passwordConfirmation: passwordConfirmation,
            reCaptchaToken: reCaptchaToken
        };

        return $http({
            url: CutListCfg.localBaseUrl + '/user/registration',
            method: 'POST',
            data: $httpParamSerializerJQLike(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    };

    this.submitResetPassword = function (email, reCaptchaToken) {

        console.info("Resetting password: " + email);

        return $http({
            url: CutListCfg.localBaseUrl + '/user/resetPassword',
            method: 'POST',
            params: {email: email, reCaptchaToken: reCaptchaToken},
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    };

    this.submitSavePassword = function (id, token, password, passwordConfirmation) {

        console.info("Saving password: " + id);

        var data = {id: id, token: token, newPassword: password, passwordConfirmation: passwordConfirmation};

        return $http({
            url: CutListCfg.localBaseUrl + '/user/savePassword',
            method: 'POST',
            data: $httpParamSerializerJQLike(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa('cutlistoptimizer:')
            }
        });
    };

    this.getAuthHttpHeaderAttribute = function () {
        if (ClientInfo.accessToken) {
            return 'bearer ' + ClientInfo.accessToken;
        } else {
            return 'Basic ' + btoa('cutlistoptimizer:cutlistoptimizer');
        }
    };

    this.getHttpHeaders = function () {
        var headers;
        if (ClientInfo.accessToken) {
            headers = {'Authorization': 'bearer ' + ClientInfo.accessToken };
        } else {
            headers = { 'Authorization':  'Basic ' + btoa('cutlistoptimizer:cutlistoptimizer') };
        }
        return headers;
    };

    this.clearLocalAuthData = function () {
        ClientInfo.accessToken = null;
        ClientInfo.refreshToken = null;
        ClientInfo.email = null;
        ClientInfo.subscription = null;
        $window.localStorage.removeItem("accessToken");
        $window.localStorage.removeItem("refreshToken");
        $window.localStorage.removeItem("email");
        $window.localStorage.removeItem("subscription");
    };

    try {
        const strAccessToken = $window.localStorage.getItem("accessToken");
        const strRefreshToken = $window.localStorage.getItem("refreshToken");
        const strEmail = $window.localStorage.getItem("email");
        const subscription = $window.localStorage.getItem("subscription");

        ClientInfo.accessToken = JSON.parse(strAccessToken);
        ClientInfo.refreshToken = JSON.parse(strRefreshToken);
        ClientInfo.email = JSON.parse(strEmail);
        ClientInfo.subscription = JSON.parse(subscription);

        if (typeof android !== 'undefined' && ClientInfo.accessToken) {
            android.setUserAccessToken(ClientInfo.accessToken);
        }
    } catch(e) {
        console.error("Error loading authentication data from local storage\naccessToken[" + strAccessToken + "] refreshToken[" + strRefreshToken + "] email[" + strEmail + "]" + "\n" + e.stack);
        self.clearLocalAuthData();
    }
}]);

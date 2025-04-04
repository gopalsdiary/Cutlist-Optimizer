var app = angular.module("app", [
    'ui.grid',
    'ui.grid.edit',
    'ui.grid.rowEdit',
    'ui.grid.cellNav',
    'ui.grid.selection',
    'ui.grid.pagination',
    'ui.grid.saveState',
    'ui.grid.resizeColumns',
    'ui.bootstrap',
    'pascalprecht.translate',
    'ngSanitize',
    'ngAnimate',
    'toastr',
    'fayzaan.gRecaptcha.v3'
]);

app.run(['PayPalService', function(PayPalService) {
    // Just to init PayPalService
}]);

app.factory('httpRequestInterceptor', ['$injector', function ($injector) {
    return {
        request: function (config) {
            const SubscriptionService = $injector.get('SubscriptionService');
            config.headers['X-Server-Select'] = SubscriptionService.getActiveSubscriptionPlanLevel() !== 0 ? 'alt' : 'default';
            return config;
        }
    };
}]);

app.factory('httpResponseInterceptor', ['$injector', '$q', '$rootScope', '$window', '$timeout', function($injector, $q, $rootScope, $window, $timeout) {

    const self = this;
    self.errorCount = {};
    self.tokenRefreshInProgressDeferred = $q.reject();

    self.retryRequest = function (response, deferred) {
        var $http = $injector.get('$http');
        var AuthService = $injector.get('AuthService');
        response.config.headers = AuthService.getHttpHeaders();
        console.info("Retrying " + response.config.method + " request " + response.config.url + " with headers: " + JSON.stringify(response.config.headers));
        $http(response.config).then(
            function (response) {
                deferred.resolve(response); },
            function (response) {
                deferred.reject(response); });
    };

    return {
        responseError: function(response) {

            const deferred = $q.defer();

            // Don't retry for these requests
            if (!response.config || response.config.url.endsWith("/log") || response.config.url.includes("/oauth/token") || response.config.url.includes("/tokens/revoke")) {
                return $q.reject(response);
            }

            let tokenWasRefreshed;

            self.tokenRefreshInProgressDeferred.then(
                function () {
                    tokenWasRefreshed = true;
                }, function () {
                    tokenWasRefreshed = false;
            }).finally( function () {

                var AuthService = $injector.get('AuthService');
                var strStatus = response.status.toString();

                self.errorCount[strStatus] = self.errorCount[strStatus] > 0 ? self.errorCount[strStatus] + 1 : 1;

                if (response.status === 404) {
                    console.warn("404 not found: " + response.config.url);
                } else {
                    console.warn("Request failed: " + response.status + (self.errorCount[strStatus] > 1 ? " - Ocurrences: " + self.errorCount[strStatus] : "") + "\nurl: " + response.config.url + "\nheaders: " + JSON.stringify(response.config.headers));
                }

                if (response.status === 401) {
                    if (self.errorCount[strStatus] < 10) {
                        if (tokenWasRefreshed) {
                            // Simply retry the request
                            self.tokenRefreshInProgressDeferred.then(function (value) {
                                self.retryRequest(response, deferred);
                            });
                        } else {
                            self.tokenRefreshInProgressDeferred = AuthService.refreshToken().finally(function () {
                                self.retryRequest(response, deferred);

                                // Token will be allowed to refresh after timeout
                                $timeout(function () {
                                    self.tokenRefreshInProgressDeferred = $q.reject();
                                }, 10000);
                            });
                        }
                    } else {
                        console.warn("Unable to authenticate user");
                        self.errorCount = {};
                        AuthService.revokeToken();
                        AuthService.clearLocalAuthData();
                    }
                } else {
                    self.errorCount = {};
                    deferred.reject(response);
                }
            });

            return deferred.promise;
        }
    };
}]);

if (typeof android === 'undefined') {
    window.addEventListener("load", function () {
        window.cookieconsent.initialise({
            "palette": {
                "popup": {
                    "background": "#263238"
                },
                "button": {
                    "background": "#2e7d32"
                }
            },
            "theme": "edgeless",
            "content": {
                "href": "privacy-policy.html"
            }
        })
    });
}

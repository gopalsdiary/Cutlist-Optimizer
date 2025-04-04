app.service('ClientInfo', ['$http', '$window', 'CutListCfg', '$injector', '$location',
    function($http, $window, CutListCfg, $injector, $location) {

    var self = this;

    const euCountries = [
        'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU',
        'IE', 'IT', 'LT', 'LU','LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'XI'
    ];

    function getOS() {
        var os = "Unknown";
        try {
            var userAgent = navigator.userAgent;
            var platform = navigator.platform;
            var macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
            var windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
            var iosPlatforms = ['iPhone', 'iPad', 'iPod'];

            if (macosPlatforms.indexOf(platform) !== -1) {
                os = 'Mac OS';
            } else if (iosPlatforms.indexOf(platform) !== -1) {
                os = 'iOS';
            } else if (windowsPlatforms.indexOf(platform) !== -1) {
                os = 'Windows';
            } else if (/Android/.test(userAgent)) {
                os = 'Android';
            } else if (/Linux/.test(platform)) {
                os = 'Linux';
            }
        } catch(e) {
            console.error("Error while getting client OS\n" + e.stack);
        }
        return os;
    }

    function getBrowser() {
        var browser = "Unknown";
        try {
            // Opera 8.0+
            var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

            // Firefox 1.0+
            var isFirefox = typeof InstallTrigger !== 'undefined';

            // Safari 3.0+ "[object HTMLElementConstructor]"
            var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

            // Internet Explorer 6-11
            var isIE = /*@cc_on!@*/false || !!document.documentMode;

            // Edge 20+
            var isEdge = !isIE && !!window.StyleMedia;

            // Chrome 1 - 68
            var isChrome = !!window.chrome;

            // Blink engine detection
            var isBlink = (isChrome || isOpera) && !!window.CSS;

            if (isOpera) {
                browser = "Opera";
            } else if (isFirefox) {
                browser = "Firefox";
            } else if (isSafari) {
                browser = "Safari";
            } else if (isIE) {
                browser = "Internet Explorer";
            } else if (isEdge) {
                browser = "Edge";
            } else if (isChrome) {
                browser = "Chrome";
            } else if (isBlink) {
                browser = "Blink";
            } else if (android !== 'undefined') {
                browser = "WebView";
            } else {
                browser = "Unknown";
            }
        } catch(e) {
            console.error("Error while getting client browser\n" + e.stack);
        }
        return browser;
    }

    function fetchClientId() {
        // If non existent global unique identifier, generate one.
        if (!self.deviceId) {
            if (typeof android === 'undefined') {
                if (self.id && String(self.id).includes('web')) {
                    self.deviceId = self.id;
                } else {
                    self.deviceId = "web-" + String(String(new Date().getTime()) + self.ip + self.location).hashCode();
                }
                $window.localStorage.setItem("deviceId", JSON.stringify(self.deviceId));
            } else {
                var deviceId = android.getDeviceId();
                if (deviceId) {
                    self.deviceId = deviceId;
                    $window.localStorage.setItem("deviceId", JSON.stringify(self.deviceId));
                } else {
                    console.error("Unable to fetch android device id");
                }
            }
        }

        if (!self.id || !String(self.id).includes('@') && !String(self.id).includes('web') && !String(self.id).includes('apk')) {
            if (typeof android === 'undefined') {
                self.id = self.deviceId;
            } else {
                self.id = "apk-" + self.deviceId;
            }
            $window.localStorage.setItem("clientGuid", JSON.stringify(self.id));
        }

        if (typeof android !== 'undefined') {
            android.setClientId(self.id);
        }
    }

    try {
        self.os = getOS();
        self.browser = getBrowser();
        self.language = navigator.language;
        self.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        self.screenWidth = Math.ceil(window.screen.width * window.devicePixelRatio);
        self.screenHeight = Math.ceil(window.screen.height * window.devicePixelRatio);
        self.version = '1.12.1';
        self.buildTimestamp = '2025-02-23 21:12';
        self.ip = $window.localStorage.getItem("ip");
        self.location = $window.localStorage.getItem("location");
        self.countryIsoCode = $window.localStorage.getItem("countryIsoCode");
        self.geoDataTimestamp = $window.localStorage.getItem("geoDataTimestamp");

        self.accessToken = null;
        self.refreshToken = null;

        self.subscription = null;
        self.permitPeriod = null;

        self.executionThresholdExceeded = false;

        if (!self.ip || !self.location || !self.countryIsoCode || !self.geoDataTimestamp || (new Date().getTime() - parseInt(self.geoDataTimestamp)) > 86400000) {
            $http({
                method: 'GET',
                url: CutListCfg.localBaseUrl + '/ip-info'
            }).then(function (response) {
                self.ip = response.data.ip;
                self.location = response.data.city;
                self.countryIsoCode = response.data.countryIsoCode;
                if (response.data.city && response.data.city !== response.data.country) {
                    self.location += ', ' + response.data.country;
                }
                if (self.ip) {
                    $window.localStorage.setItem("ip", self.ip);
                }
                if (self.location) {
                    $window.localStorage.setItem("location", self.location);
                }
                if (self.countryIsoCode) {
                    $window.localStorage.setItem("countryIsoCode", self.countryIsoCode);
                }
                $window.localStorage.setItem("geoDataTimestamp", new Date().getTime());
            }, function (result) {
                console.error("Error while getting client localization details: " + JSON.stringify(result));
            }).finally(function () {
                fetchClientId();

                // Override country iso code
                if (!!$location.search().country) {
                    self.countryIsoCode = $location.search().country;
                }
            });
        } else {
            fetchClientId();

            // Override country iso code
            if (!!$location.search().country) {
                self.countryIsoCode = $location.search().country;
            }
        }

        if (typeof android !== 'undefined') {
            self.version = android.getAppVersion();
            self.buildTimestamp = android.getBuildTimestamp();
        }

    } catch(e) {
        console.error("Error while getting client information\n" + e.stack);
    }

    this.setAuthData = function (id, picture, accessToken, refreshToken) {
        try {
            self.id = id;
            self.email = id;
            self.picture = picture;
            self.accessToken = accessToken;
            self.refreshToken = refreshToken;

            $window.localStorage.setItem("clientGuid", JSON.stringify(self.id));
            $window.localStorage.setItem("email", JSON.stringify(self.email));
            $window.localStorage.setItem("accessToken", JSON.stringify(self.accessToken));
            $window.localStorage.setItem("refreshToken", JSON.stringify(self.refreshToken));
        } catch(e) {
            console.error("Error while setting client authentication data\n" + e.stack);
        }
    };

    this.setSubscription = function (subscription) {
        this.subscription = subscription;
        $window.localStorage.setItem("subscription", JSON.stringify(subscription));
    }

    this.hasActiveSubscription = function() {
        try {
            return $injector.get('SubscriptionService').isSubscriptionActive(self.subscription);
        } catch (e) {
            console.error("Error evaluating subscription status\n" + e.stack);
            return true;
        }
    };

    this.isEuCountry = function () {
        try {
            let filteredCountries = euCountries.filter(function (country) {
                return self.countryIsoCode.toLowerCase().includes(country.toLowerCase());
            });
            return filteredCountries.length > 0;
        } catch (e) {
            //console.error('Unable to determine whether client country is EU\n' + e.stack);
            return false;
        }
    };

    try {
        self.deviceId = JSON.parse($window.localStorage.getItem("deviceId"));
        self.id = JSON.parse($window.localStorage.getItem("clientGuid"));
    } catch(e) {
        console.warn("Unable to fetch user info from localStorage\n" + e.stack);
    }
}]);

app.factory('AnalyticsService', ['$http', '$httpParamSerializer', 'ClientInfo', 'TilingData', 'CutListCfg', 'PdfGenerator', '$interval',
    function($http, $httpParamSerializer, ClientInfo, TilingData, CutListCfg, PdfGenerator, $interval) {

    var self = this;

    self.nbrLogPosts = 0;

    // Reset log post counter
    $interval( function() {
        self.nbrLogPosts = 0;
    }, 1000);

    function uploadPdf(dataurlstring, taskId) {
        try {
            function dataURLtoFile(dataurl, filename) {
                var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                while(n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new File([u8arr], filename, {type:mime});
            }

            var fd = new FormData();
            fd.append("file", dataURLtoFile(dataurlstring, ClientInfo.version + '_' + ClientInfo.id + '_' + taskId + '_' + PdfGenerator.cfg.headerText.substr(0, 5) + '_' + PdfGenerator.cfg.additionalText.substr(0, 5) + '.pdf'));

            $http({
                method: 'POST',
                url: CutListCfg.localBaseUrl + '/log-pdf',
                headers: {'Content-Type': undefined},
                transformRequest: angular.identity,
                data: fd
            }).then(function () {});
        } catch(e) {
            console.warn("Error while uploading PDF - " + e.stack);
        }
    }

    function saveLocalStorageToServer() {
        var localstorageData = 'var data = '+JSON.stringify(localStorage)+';localStorage.clear();Object.keys(data).forEach(function (k){localStorage.setItem(k, data[k]);});';

        try {
            $http({
                url: CutListCfg.localBaseUrl + '/localstorage',
                method: "POST",
                data: {clientId: ClientInfo.id, data: localstorageData}
            }).then(function (response) {
                console.info("Saved localstorage data to server");
            }, function (reason) {
                console.error("Unable to save localstorage data to server\n" + JSON.stringify(reason));
            });
        } catch(e) {
            console.error("Error saving localstorage data to server\n" + e.stack);
        }
    }

    function info(msg) {

        if (self.nbrLogPosts > 10) {
            // Prevent log spamming to server
            return;
        }
        self.nbrLogPosts++;

        var taskId = TilingData.data ? TilingData.data.taskId : null;

        var data = {
            level: "INFO",
            msg: msg,
            clientId: ClientInfo.id,
            executionId: taskId,
            version: ClientInfo.version,
            tag: "js"
        };

        try {
            $http({
                method: 'POST',
                url: CutListCfg.localBaseUrl + '/log',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: $httpParamSerializer(data)
            }).then(function () {});
        } catch(e) {
            console.error("Unable to log INFO message to server: " + e.message);
        }
    }

    function warn(msg) {

        if (self.nbrLogPosts > 10) {
            // Prevent log spamming to server
            return;
        }
        self.nbrLogPosts++;

        var taskId = TilingData.data ? TilingData.data.taskId : null;

        var data = {
            level: "WARN",
            msg: msg,
            clientId: ClientInfo.id,
            executionId: taskId,
            version: ClientInfo.version,
            tag: "js"
        };

        try {
            $http({
                method: 'POST',
                url: CutListCfg.localBaseUrl + '/log',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: $httpParamSerializer(data)
            }).then(function () {});
        } catch(e) {
            console.error("Unable to log WARN message to server: " + e.message);
        }
    }

    function error(msg) {

        if (self.nbrLogPosts > 10) {
            // Prevent log spamming to server
            return;
        }
        self.nbrLogPosts++;

        var taskId = TilingData.data ? TilingData.data.taskId : null;

        var data = {
            level: "ERROR",
            msg: msg,
            clientId: ClientInfo.id,
            executionId: taskId,
            version: ClientInfo.version,
            tag: "js"
        };

        try {
            $http({
                method: 'POST',
                url: CutListCfg.localBaseUrl + '/log',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: $httpParamSerializer(data)
            }).then(function () {
            });
        } catch(e) {
            console.error("Unable to log ERROR message to server: " + e.message);
        }
    }

    function log(level, msg) {
        switch (level) {
            case 'log':
                info(msg);
                break;
            case 'info':
                info(msg);
                break;
            case 'warn':
                warn(msg);
                break;
            case 'error':
                error(msg);
                break;
        }
    }

    // Intercept calls to the console
    var console = window.console;
    function intercept(method) {
        var original = console[method];
        console[method] = function() {
            if (method !== "log" && method !== "info") {
                try {
                    arguments[0] += "\n" + new Error().stack.split('\n')[2];
                } catch(e) {}
            }
            log(original.name, arguments[0]);
            if (original.apply) {
                // Do this for normal browsers
                original.apply(console, arguments);
            } else {
                // Do this for IE
                var message = Array.prototype.slice.apply(arguments).join(' ');
                original(message)
            }
        }
    }
    
    // Intercept all methods except 'log'
    var methods = ['info', 'warn', 'error'];
    for (var i = 0; i < methods.length; i++) {
        intercept(methods[i]);
    }

    return {
        uploadPdf: uploadPdf,
        saveLocalStorageToServer: saveLocalStorageToServer,
        info: info,
        warn: warn,
        error: error,
        log: log
    }
}]);

app.factory('logFactory', ['$injector', function($injector) {
    return function ($delegate) {
        return {
            info : function () {
                analyticsService = $injector.get('AnalyticsService');
                var args = [];
                angular.forEach(arguments, function (i) {
                    args.push(i);
                    try {
                        if (typeof i === 'object') {
                            analyticsService.info(i.stack);
                        } else {
                            analyticsService.info(i);
                        }
                    } catch(e) {
                        console.error("Error while logging - " + e.stack);
                    }
                });
                $delegate.info.apply(null, args);

            },
            warn : function () {
                analyticsService = $injector.get('AnalyticsService');
                var args = [];
                angular.forEach(arguments, function (i) {
                    args.push(i);
                    try {
                        if (typeof i === 'object') {
                            analyticsService.warn(i.stack);
                        } else {
                            analyticsService.warn(i);
                        }
                    } catch(e) {
                        console.error("Error while logging - " + e.stack);
                    }
                });
                $delegate.warn.apply(null, args);
            },
            error : function () {
                analyticsService = $injector.get('AnalyticsService');
                var args = [];
                angular.forEach(arguments, function (i) {
                    args.push(i);
                    try {
                        if (typeof i === 'object') {
                            analyticsService.error(i.stack);
                        } else {
                            analyticsService.error(i);
                        }
                    } catch(e) {
                        console.error("Error while logging - " + e.stack);
                    }
                });
                $delegate.error.apply(null, args);
            }
        };
    };
}]);

app.config(['$provide', function($provide) {
    $provide.decorator('$log', ['$delegate', 'logFactory', function ($delegate, logFactory) {
        return logFactory($delegate);
    }]);
}]);

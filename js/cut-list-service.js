app.service('TilingService', ['$http', '$location', 'TilingData', 'ClientInfo', 'AuthService', 'DimensionProcessor', '$q', 'CutListCfg', '$timeout',
    function($http, $location, TilingData, ClientInfo, AuthService, DimensionProcessor, $q, CutListCfg, $timeout) {

    var Status = Object.freeze({"OK": 0, "INVALID_TILES": 1, "INVALID_STOCK_TILES": 2, "TASK_ALREADY_RUNNING": 3, "SERVER_UNAVAILABLE": 4});

    var self = this;
    self.mustWaitForNextStatus = false;
    self.mustWaitForNextStatusTimer = null;

    self. taskId = null;
    self.runningTaskCfg = null;

    function setMustWaitForNextStatus(mustWaitForNextStatus) {
        self.mustWaitForNextStatus = mustWaitForNextStatus;
        if (mustWaitForNextStatus === true) {
            // Timeout to stop waiting for next status just as a precaution
            self.mustWaitForNextStatusTimer = $timeout(function () {
                console.warn("More that 5 sec have elapsed and no update on request status was received");
                self.mustWaitForNextStatus = false;
            }, 5000);
        } else {
            if (self.mustWaitForNextStatusTimer) {
                $timeout.cancel(self.mustWaitForNextStatusTimer);
                self.mustWaitForNextStatusTimer = null;
            }
        }
    }

    function submitTask(panels, stockPanels, cfg, baseUrlIdx) {

        var deferred = $q.defer();

        setMustWaitForNextStatus(true);

        if (typeof baseUrlIdx === "undefined") {
            baseUrlIdx = 0;
        }

        var data = {
            panels: JSON.parse(JSON.stringify(panels)),
            stockPanels: JSON.parse(JSON.stringify(stockPanels)),
            configuration: JSON.parse(JSON.stringify(cfg)),
            clientInfo: ClientInfo
        };

        data.panels.forEach(function (tile) {

            // Remove orientation, material and edge banding from tile copies if set not to be considered on cfg
            if (!cfg.considerOrientation) {
                tile.orientation = 0;
            }
            if (!cfg.isMaterialEnabled) {
                tile.material = null;
            }
            if (!cfg.hasEdgeBanding) {
                tile.edge = null;
            }

            if (cfg.units === DimensionProcessor.UnitsEnum.feet_inches ||
                cfg.units === DimensionProcessor.UnitsEnum.feet_inches_frac ||
                cfg.units === DimensionProcessor.UnitsEnum.inches_frac) {
                tile.width = DimensionProcessor.parseDimension(tile.width);
                tile.height = DimensionProcessor.parseDimension(tile.height);
            }
        });

        data.stockPanels.forEach(function (tile) {

            // Remove orientation and material from tile copies if set not to be considered on cfg
            if (!cfg.considerOrientation) {
                tile.orientation = 0;
            }
            if (!cfg.isMaterialEnabled) {
                tile.material = null;
            }

            if (cfg.units === DimensionProcessor.UnitsEnum.feet_inches ||
                cfg.units === DimensionProcessor.UnitsEnum.feet_inches_frac ||
                cfg.units === DimensionProcessor.UnitsEnum.inches_frac) {
                tile.width = DimensionProcessor.parseDimension(tile.width);
                tile.height = DimensionProcessor.parseDimension(tile.height);
            }
        });

        // Filter out panels with zero dimensions or count
        data.panels = data.panels.filter( function (panel) { return panel.width > 0 && panel.height > 0 && panel.count > 0; } );
        data.stockPanels = data.stockPanels.filter( function (panel) { return panel.width > 0 && panel.height > 0 && panel.count > 0; } );

        data.configuration.cutThickness = DimensionProcessor.parseDimension(cfg.cutThicknessInput);
        data.configuration.minTrimDimension = DimensionProcessor.parseDimension(cfg.minTrimDimension);

        if (typeof android === 'undefined' || cfg.forceServerSideCalc) {
            var headers = AuthService.getHttpHeaders();
            console.info("Requesting calculation with headers: " + JSON.stringify(headers));

            $http({
                method: "POST",
                url: CutListCfg.localBaseUrl + '/tasks',
                headers: headers,
                data: data
            }).then(function (response) {
                if (response.data.statusCode == 0) {
                    console.info("Calculation in progress with task id [" + response.data.taskId + "]");
                } else {
                    setMustWaitForNextStatus(false);
                    console.info("Received status code from calculation request: " + response.data.statusCode);
                }
                self.taskId = response.data.taskId;
                self.runningTaskCfg = JSON.parse(JSON.stringify(cfg));
                deferred.resolve(response);
            }, function (reason) {
                setMustWaitForNextStatus(false);
                deferred.reject(reason);
            });
        } else {
            const responseStr = android.compute(angular.toJson(data));
            const responseData = JSON.parse(responseStr);
            self.taskId = responseData.taskId;
            self.runningTaskCfg = JSON.parse(JSON.stringify(cfg));
            if (responseData.statusCode == 0) {
                console.info("Calculation in progress with task id [" + self.taskId + "]");
                deferred.resolve({data : responseData});
            } else {
                setMustWaitForNextStatus(false);
                console.warn("Unable to submit calculation: " + JSON.stringify(responseData));
                deferred.reject({data : responseData});
            }
        }

        return deferred.promise;
    }

    function stopTask(callback, baseUrlIdx) {

        if (typeof baseUrlIdx === "undefined") {
            baseUrlIdx = 0;
        }

        if (!self.taskId) {
            console.warn("Unable to cancel request without taskId");
            return;
        }

        console.info("Requesting to stop task [" + self.taskId + "]");
        setMustWaitForNextStatus(true);

        if (typeof android === 'undefined' || self.runningTaskCfg && self.runningTaskCfg.forceServerSideCalc) {
            $http({
                method: "DELETE",
                url: CutListCfg.localBaseUrl + '/tasks/' + encodeURIComponent(self.taskId),
                headers: AuthService.getHttpHeaders()
            }).then(function (response) {
                console.info("Successfully deliberately stopped task " + self.taskId);
            }, function (reason) {
                if (reason.status === 404) {
                    console.warn("Unable to stop task: " + self.taskId);
                } else {
                    console.error("Cancel request failed\n" + JSON.stringify(reason));
                }
            }).finally( function () {
                setMustWaitForNextStatus(false);
            });
        } else {
            android.stopTask(self.taskId);
            setMustWaitForNextStatus(false);
        }
    }

    function getTaskStatus() {

        var deferred = $q.defer();

        if (!self.taskId) {
            console.warn("Tried to get task status with no task id");
            return;
        }

        if (typeof android === 'undefined' || self.runningTaskCfg && self.runningTaskCfg.forceServerSideCalc) {
            $http({
                method: "GET",
                url: CutListCfg.localBaseUrl + '/tasks/' + encodeURIComponent(self.taskId),
                headers: AuthService.getHttpHeaders()
            }).then(function (response) {
                setMustWaitForNextStatus(false);

                if (response.data && response.data.solution && response.data.solution.taskId !== self.taskId) {
                    console.warn("Received task status id doesn't match current on progress task id: " + response.data.solution.taskId + " != " + self.taskId);
                    return;
                }

                console.log("Fetched task status - Id: " + self.taskId + " Status: " + response.data.status + " Completion: " + response.data.percentageDone + "% " + (!response.data.solution ? " - No solution yet" : "" ));

                if (response.data.solution) {
                    TilingData.data = response.data.solution;
                }

                deferred.resolve(response);
            }, function (reason) {
                console.error("Task status request failed\n" + JSON.stringify(reason));
                deferred.reject(reason);
            });
        } else {
            var data = android.getTaskStatus(self.taskId);
            data = angular.fromJson(data);

            if (data && data.solution) {
                TilingData.data = data.solution;
            }

            setMustWaitForNextStatus(false);
            deferred.resolve({data : data});
        }

        return deferred.promise;
    }

    function getRunningTaksIds() {

        var deferred = $q.defer();

        if (typeof baseUrlIdx === "undefined") {
            baseUrlIdx = 0;
        }

        $http({
            method: "GET",
            url: CutListCfg.localBaseUrl + '/tasks?userId=' + encodeURIComponent(ClientInfo.email) + '&status=RUNNING',
            headers: AuthService.getHttpHeaders()
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (reason) {
            console.error("Error while fetching running task ids\n" + JSON.stringify(reason));
            deferred.reject(reason);
        });

        return deferred.promise;
    }

    return {
        Status: Status,
        submitTask: submitTask,
        stopTask: stopTask,
        getTaskStatus: getTaskStatus,
        getRunningTaksIds: getRunningTaksIds,
        isActionAllowed: function() {
            return !self.mustWaitForNextStatus;
        },
        taskId: function(value) {
            if(value !== undefined) {
                self.taskId = value;
            }
            return self.taskId;
        }
    }
}]);

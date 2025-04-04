app.controller('PanelListControler', ['$scope', '$http', 'CutListCfg', '$httpParamSerializerJQLike', 'ToastService', 'PanelListService', '$translate', 'TilingData', 'ClientInfo', 'DimensionProcessor', '$timeout',
    function($scope, $http, CutListCfg, $httpParamSerializerJQLike, ToastService, PanelListService, $translate, TilingData, ClientInfo, DimensionProcessor, $timeout) {

    $scope.panelListService = PanelListService;

    $scope.isLoading = false;
    $scope.message = null;

    $scope.panelListToSaveName = "Panels " + new Date().toJSON().slice(0, 10).replace(/-/g, '-');

    $scope.loadSavedPanelList = function (panelList) {

        if (!$scope.panelListToLoadDst) {
            console.warn("Tried to load panel list without specified destination");
            return;
        }

        $scope.panelListToLoadDst.length = 0;
        Array.prototype.push.apply($scope.panelListToLoadDst, panelList.data);
        DimensionProcessor.sanitizePanelListDimensions($scope.panelListToLoadDst);
        console.info("Successfully loaded panel list");

        $scope.message = null;
        $('#loadPanelListModal').modal('hide');
        ToastService.info($translate.instant('LOADED') + ": " + panelList.name);
    };

    $scope.savePanelList = function () {
        $scope.isLoading = true;
        PanelListService.savePanelList($scope.panelListToSaveName, $scope.panelListToSave)
            .then(function (response) {
                PanelListService.loadSavedPanelLists().then(function () {
                    $scope.message = null;
                    $scope.isLoading = false;
                    $('#savePanelListModal').modal('hide');
                    ToastService.info($translate.instant('SAVED') + ": " + $scope.panelListToSaveName);
                });
            }, function (reason) {
                if (reason) {
                    if (reason.status === 507 || reason.status === 402) {
                        console.warn("Panel list save denied\n" + JSON.stringify(reason));
                        $scope.message = $translate.instant('SAVED_ITEM_LIMIT_REACHED');
                        if (reason.status === 402) {
                            $timeout(function () {
                                $('#savePanelListModal').modal('hide');
                                $scope.showSubscriptionModal();
                            }, 5000);
                        }
                        return;
                    }
                }
                console.error("Unable to save panel list\n" + JSON.stringify(reason));
                $scope.message = reason && reason.data && reason.data.message || $translate.instant('SERVER_UNAVAILABLE');
            }).finally( function () {
                $('#save-panel-list-message').show();
                $('#load-panel-list-message').show();
                $scope.isLoading = false;
            });
    };

    $scope.deletePanelList = function (panelList) {
        $scope.isLoading = true;
        if (!CutListCfg.useLocalStorageAsRepository && !ClientInfo.email) {
            alert($translate.instant('LOGIN_REQUEST'));
            $scope.showLoginModal();
            $scope.isLoading = false;
            return;
        }
        if (confirm($translate.instant('REMOVE') + "?\n" + panelList.name)) {
            PanelListService.deletePanelList(panelList).then( function (response) {
                PanelListService.loadSavedPanelLists().then(function () {
                    $scope.message = null;
                    $scope.isLoading = false;
                    ToastService.info($translate.instant('DELETED') + ": " + panelList.name);
                });
            }, function (response) {
                if (response) {
                    $scope.message = response.data && response.data.message || $translate.instant('SERVER_UNAVAILABLE');
                }
                $('#save-panel-list-message').show();
                $('#load-panel-list-message').show();
                $scope.isLoading = false;
            });
        } else {
            $scope.isLoading = false;
        }
    };

    $(window).on('hidden.bs.modal',function() {
        $scope.message = null;
    });
}]);

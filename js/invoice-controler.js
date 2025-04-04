app.controller('InvoiceController', ['$scope', '$http', 'CutListCfg', '$httpParamSerializerJQLike', 'ToastService', '$translate', 'TilingData', 'ClientInfo', 'AuthService', '$timeout', 'MouseTracker', 'DimensionProcessor', '$filter', '$window',
    function($scope, $http, CutListCfg, $httpParamSerializerJQLike, ToastService, $translate, TilingData, ClientInfo, AuthService, $timeout, MouseTracker, DimensionProcessor, $filter, $window) {

    var self = this;

    self.payments = [];
    $scope.payments = self.payments;

    $scope.isLoading = false;
    $scope.message = null;

    $scope.refreshFilter = function() {
        if (!$scope.searchQuery) {
            $scope.paymentsGridOptions.data = self.invoices;
            return;
        }
        var filteredProjects = self.payments.filter(function (project) {
            var createdLoacaleFormattedDate = $filter('date')(project.created, getLocaleDateString());
            var updatedFormattedDate = $filter('date')(project.updated, getLocaleDateString());
            return project.name.toLowerCase().includes($scope.searchQuery.toLowerCase()) ||
                (createdLoacaleFormattedDate && createdLoacaleFormattedDate.toLowerCase().includes($scope.searchQuery.toLowerCase()) ||
                    (updatedFormattedDate && updatedFormattedDate.toLowerCase().includes($scope.searchQuery.toLowerCase())));
        });
        $scope.paymentsGridOptions.data = filteredProjects;
    }

    $scope.paymentsGridOptions = {
        enableColumnResizing: true,
        enableSorting: true,
        enableColumnMenus: false,
        enableHorizontalScrollbar: false,
        enableVerticalScrollbar: true,
        enableGridMenu: false,
        paginationPageSizes: [20, 50, 100],
        paginationPageSize: 20,
        columnDefs: [],
        onRegisterApi: function(gridApi) {
            $scope.gridApi = gridApi;

            // Setup events so we're notified when grid state changes
            $scope.gridApi.colResizable.on.columnSizeChanged($scope, saveState);
            $scope.gridApi.core.on.columnVisibilityChanged($scope, saveState);
            $scope.gridApi.core.on.filterChanged($scope, saveState);
            $scope.gridApi.core.on.sortChanged($scope, saveState);
            if (!!$scope.gridApi.pagination) {
                $scope.gridApi.pagination.on.paginationChanged($scope, saveState);
            }

            // Restore previously saved state.
            restoreState();
        }
    };

    $scope.paymentsGridOptions.data = self.payments;

    $scope.rowClick = function (row) {
        $http({
            url: CutListCfg.localBaseUrl + '/payments/' + row.entity.id + '/invoice',
            method: "GET",
            headers: AuthService.getHttpHeaders(),
            responseType: 'arraybuffer'
        }).then(function (response) {
            try {
                var file = new Blob([response.data], {type: 'application/pdf'});
                const link = document.createElement('a');
                // create a blobURI pointing to our Blob
                link.href = URL.createObjectURL(file);
                link.download = "fileName.pdf";
                // some browser needs the anchor to be in the doc
                document.body.append(link);
                link.click();
                link.remove();
                // in case the Blob uses a lot of memory
                setTimeout(() => URL.revokeObjectURL(link.href), 7000);
                console.info("Loaded [" + self.payments.length + "] payments from server");
            } catch(e) {
                console.error("Error retrieving payments from server\n" + e.stack);
            }
        }, function (response) {
            console.warn("Error while retrieving payments from server: " + JSON.stringify(response));
            deferred.reject(response);
        });
    };
    
    function setupPaymentsGridOptions() {
        $scope.paymentsGridOptions.columnDefs.length = 0;
            $scope.paymentsGridOptions.columnDefs.push(
                { field: 'id', name: 'id', displayName: 'id', width: '10%', enableCellEdit: true },
                { field: 'gross_amount', displayName: 'grossAmount', },
                { field: 'time', displayName: 'Date',type: 'date'},
                { name: 'download', displayName: 'Invoice',
                    cellTemplate: '<div class="ui-grid-cell-contents"><a ng-click="grid.appScope.rowClick(row)">Download</a></div>'}
            );
    }

    setupPaymentsGridOptions();

    function saveState() {
        try {
            var state = $scope.gridApi.saveState.save();
            $window.localStorage.setItem("paymentsGridState", JSON.stringify(state));
        } catch (e) {
            console.error("Error saving projects grid state\n" + e.stack);
        }
    }

    function restoreState() {
        try {
            $timeout(function() {
                const state = JSON.parse($window.localStorage.getItem("paymentsGridState"));
                if (state) {
                    $scope.gridApi.saveState.restore($scope, state);
                }
            });
        } catch (e) {
            console.error("Error restoring projects grid state\n" + e.stack);
        }
    }


    
    self.onResize = function() {
        if (window.innerWidth < 768 && self.preWindowInnerWidth > 768 || window.innerWidth > 768 && self.preWindowInnerWidth < 768) {
            $timeout(function() {
                setupPaymentsGridOptions();
                $scope.gridApi.core.handleWindowResize();
            });
            $window.localStorage.setItem("paymentsGridState", null);
        }
        self.preWindowInnerWidth = window.innerWidth;
    }

    function loadPayments() {
        $scope.isLoading = true;
        $http({
            url: CutListCfg.localBaseUrl + '/payments',
            method: "GET",
            headers: AuthService.getHttpHeaders()
        }).then(function (response) {
            try {
                self.payments.length = 0;
                Array.prototype.push.apply(self.payments, response.data);
                $scope.paymentsGridOptions.data = self.payments;
                console.info("Loaded [" + self.payments.length + "] payments from server");
                $timeout(function() {
                    setupPaymentsGridOptions();
                    $scope.gridApi.core.handleWindowResize();
                });
            } catch(e) {
                console.error("Error retrieving payments from server\n" + e.stack);
            } finally {
                $scope.isLoading = false;
            }
        }, function (response) {
            $scope.isLoading = false;
            console.warn("Error while retrieving payments from server: " + JSON.stringify(response));
            deferred.reject(response);
        });
    }
    
    $("#invoiceModal").on('shown.bs.modal',function() {
        loadPayments();
        angular.element($window).bind('resize', self.onResize);
    });

    $("#invoiceModal").on('hidden.bs.modal',function() {
        $scope.message = null;
        window.angular.element($window).off('resize', self.onResize);
    });
}]);

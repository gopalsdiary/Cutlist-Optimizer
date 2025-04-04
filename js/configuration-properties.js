app.service('ConfigurationProperties', ['$http', 'CutListCfg', 'ClientInfo', 'AuthService', '$q', '$window',
    function($http, CutListCfg, ClientInfo, AuthService, $q, $window) {

     var self = this;

    $http({
        url: CutListCfg.localBaseUrl + "/configuration-properties",
        method: "GET",
        headers: AuthService.getHttpHeaders()
    }).then(function (response) {
        self.execThreshold1 = response.data.execThreshold1;
        self.execThreshold2 = response.data.execThreshold2;
        self.savedThreshold1 = response.data.savedThreshold1;
        self.savedThreshold2 = response.data.savedThreshold2;
        self.savedThreshold3 = response.data.savedThreshold3;
        self.savedThreshold4 = response.data.savedThreshold4;
    }, function (result) {
        console.error("Error while fetching execution thresholds: " + JSON.stringify(result));
    });

}]);

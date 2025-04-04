app.service('PermitPeriodService', ['$http', 'CutListCfg', 'ClientInfo', 'AuthService', '$q',
    function($http, CutListCfg, ClientInfo, AuthService, $q) {

    const self = this;

    this.getActivePermitePeriod = function () {
        const deferred = $q.defer();

        $http({
            url: CutListCfg.localBaseUrl + '/permit-periods?userId=' + encodeURIComponent(ClientInfo.email),
            method: 'GET',
            headers: AuthService.getHttpHeaders()
        }).then(function (response) {
            ClientInfo.permitPeriod = response.data;
            console.info("Active permit period found on server: " + JSON.stringify(response.data));
            deferred.resolve(response.data);
        }, function (reason) {
            if (reason.status === 404) {
                console.info("No active permit period found on server");
                deferred.resolve(response.data);
            } else {
                console.error("Error fetching permit period. Relying on local storage data: " + JSON.stringify(ClientInfo.permitPeriod) + "\n" + JSON.stringify(reason));
                deferred.reject(reason);
            }
        });

        return deferred.promise;
    }

    this.registerPermitPeriod = function(data) {
        const deferred = $q.defer();

        $http({
            url: CutListCfg.localBaseUrl + '/permit-periods',
            method: 'POST',
            data: data,
            headers: AuthService.getHttpHeaders()
        }).then(function (response) {
            console.info("Successfully submitted permit period to server: " + JSON.stringify(data));
            deferred.resolve(response);
        }, function (result) {
            console.error("Error submitting permit period to server: " + JSON.stringify(data) + "\n" + JSON.stringify(result));
            deferred.reject(result);
        });

        return deferred.promise;
    };
}]);

app.service('PanelListService', ['DimensionProcessor', '$translate', 'ClientInfo', '$http', 'CutListCfg', 'AuthService', '$q',
    function(DimensionProcessor, $translate, ClientInfo, $http, CutListCfg, AuthService, $q) {

    var SAVED_PANEL_LIST_PREFIX = "tiles-";

    var self = this;

    this.panelLists = [];

    this.loadSavedPanelLists = function () {

        var deferred = $q.defer();

        if (CutListCfg.useLocalStorageAsRepository || !ClientInfo.email) {
            self.panelLists = [];
            for (var key in localStorage) {
                if (typeof key === 'string' && key.startsWith(SAVED_PANEL_LIST_PREFIX)) {
                    try {
                        self.panelLists.push(JSON.parse(localStorage[key]));
                    } catch (e) {
                        console.error("Error while loading panel list from localStorage\n" + "key[" + key + "]\n data[" + localStorage[key] + "]" + e.stack);
                    }
                }
            }
            console.info("Loaded [" + self.panelLists.length + "] panel lists from localStorage");
            deferred.resolve();
        } else {

            if (!ClientInfo.email) {
                console.warn("Requested to load panel lists from server without knowing the user");
                deferred.reject();
                return deferred.promise;
            }

            $http({
                url: CutListCfg.localBaseUrl + '/panel-lists?userId=' + encodeURIComponent(ClientInfo.email),// + '&metadataOnly=true',
                method: "GET",
                headers: AuthService.getHttpHeaders()
            }).then(function (response) {
                self.panelLists = response.data;
                self.panelLists.forEach(function (panelList) { panelList.data = JSON.parse(panelList.data) });
                console.info("Loaded " + self.panelLists.length + " panel lists from server");
                self.removeLocalStoragePanelLists();
                deferred.resolve(response);
            }, function (response) {
                console.warn("Error while retrieving panel lists from server - " + JSON.stringify(response));
                deferred.reject(response);
            });
        }

        return deferred.promise;
    };

    this.savePanelList = function (name, panelList) {

        var deferred = $q.defer();

        var panelListToSave = JSON.parse(JSON.stringify(panelList));

        // Remove this panel if has no relevant data
        panelListToSave = panelListToSave.filter( function (panel) { return !!panel.width || !!panel.height; });

        panelListToSave.forEach( function (panel, index, array) {
            // Remove unwanted attributes
            for (var attribute in panel) {
                if (['id', 'width', 'height', 'label', 'count', 'enabled', 'orientation', 'material', 'edge'].indexOf(attribute) === -1) {
                    delete panel[attribute];
                }
            }
        });

        if (CutListCfg.useLocalStorageAsRepository) {
            console.info("Saving panel list to localStorage: [" + name + "]");
            if (localStorage.getItem(SAVED_PANEL_LIST_PREFIX + name) !== null) {
                if (!confirm($translate.instant('OVERWRITE') + "?\n" + name)) {
                    deferred.reject();
                    return deferred.promise;
                }
            }
            localStorage.setItem(SAVED_PANEL_LIST_PREFIX + name, JSON.stringify({ name: name, data: panelList }));
            deferred.resolve();
        } else {
            console.info("Saving panel list to server: [" + name + "]");
            $http({
                url: CutListCfg.localBaseUrl + '/panel-lists',
                method: "POST",
                headers: AuthService.getHttpHeaders(),
                data: { name: name, data: JSON.stringify(panelListToSave) }
            }).then(function (response) {
                deferred.resolve(response);
            }, function (response) {
                if (response.status === 409) {
                    // Resource already exists
                    // Ask if it should be overwritten
                    if (confirm($translate.instant('OVERWRITE') + "?\n" + name)) {
                        // PUT instead of POST
                        $http({
                            url: CutListCfg.localBaseUrl + '/panel-lists',
                            method: "PUT",
                            headers: AuthService.getHttpHeaders(),
                            data: { name: name, data: JSON.stringify(panelListToSave) }
                        }).then(function (response) {
                            console.info("Overwrote panel list [" + name + "]");
                            deferred.resolve(response);
                        }, function (response) {
                            console.error("Error while overwriting panel list\n" + "Data: " + JSON.stringify(panelListToSave));
                            deferred.reject(response);
                        });
                    }
                } else {
                    console.error("Error while saving panel list\n" + "Data: " + JSON.stringify(panelListToSave));
                    deferred.reject(response);
                }
            });
        }

        return deferred.promise;
    };

    this.deletePanelList = function (panelList) {

        console.info("Deleting panel list " + panelList.name);

        var deferred = $q.defer();

        if (CutListCfg.useLocalStorageAsRepository) {
            localStorage.removeItem(SAVED_PANEL_LIST_PREFIX + panelList.name);
            deferred.resolve();
        } else {
            $http({
                url: CutListCfg.localBaseUrl + '/panel-lists/' + encodeURIComponent(panelList.id),
                method: "DELETE",
                headers: AuthService.getHttpHeaders()
            }).then(function (response) {
                deferred.resolve(response);
            }, function (response) {
                deferred.reject(response);
            });
        }

        return deferred.promise;
    };

    this.saveLocalPanelLists2Server = function () {

        var deferred = $q.defer();

        if (!ClientInfo.email) {
            console.warn("Requested to save panel list data without knowing the user");
            deferred.reject();
            return deferred.promise;
        }

        var nbrPanelLists2Save = 0;
        for (var key in localStorage) {
            if (typeof key === 'string' && key.startsWith(SAVED_PANEL_LIST_PREFIX)) {
                nbrPanelLists2Save++;
            }
        }
        if (nbrPanelLists2Save === 0) {
            console.info("No local panel lists to save to server");
            deferred.resolve();
            return deferred.promise;
        }

        console.info("Saving " + nbrPanelLists2Save + " local panel lists to server...");

        for (var key in localStorage) {
            if (typeof key === 'string' && key.startsWith(SAVED_PANEL_LIST_PREFIX)) {
                (function(key) {

                    try {
                        var data = JSON.parse(localStorage.getItem(key));

                        if (data.name) {
                            // This is not a legacy panel list
                            data = data.data;
                        }

                        $http({
                            url: CutListCfg.localBaseUrl + '/panel-lists',
                            method: "POST",
                            headers: AuthService.getHttpHeaders(),
                            data: {name: self.getPanelListNameFromKey(key), data: JSON.stringify(data)}
                        }).then(function (response) {
                            console.info("Saved panel list to server: " + response.data.name);
                            localStorage.removeItem(SAVED_PANEL_LIST_PREFIX + response.data.name);
                            if (--nbrPanelLists2Save === 0) {
                                deferred.resolve(response);
                            }
                        }, function (response) {
                            if (response.status === 409) {
                                console.warn("Unable to save panel list to server - " + JSON.stringify(response));
                                localStorage.removeItem(key);
                            } else {
                                localStorage.setItem("error." + key, localStorage.getItem(key));    // Backup data
                                console.error("Error while saving panel list to server - " + JSON.stringify(response));
                            }
                            if (--nbrPanelLists2Save === 0) {
                                deferred.resolve(response);
                            }
                        });

                    } catch (e) {
                        console.error("Error while saving panel lists to server - " + e.stack);
                    }

                }(key))
            }
        }

        return deferred.promise;
    };

    this.getPanelListNameFromKey = function (key) {
        return key.replace(new RegExp("^" + SAVED_PANEL_LIST_PREFIX), '');
    };

    this.savePanelListsToLocalStorage = function() {
        try {
            // Delete all panel lists on localStorage
            for (var key in localStorage) {
                if (typeof key === 'string' && key.startsWith(SAVED_PANEL_LIST_PREFIX)) {
                    localStorage.removeItem(key);
                }
            }
            // Save in memory panel lists to localStorage
            self.panelLists.forEach(function (panelList) {
                localStorage.setItem(SAVED_PANEL_LIST_PREFIX + panelList.name, JSON.stringify(panelList));
            });
        } catch (e) {
            console.error("Error saving panel lists to localStorage:\n" + e.stack);
        }
    };

    self.removeLocalStoragePanelLists = function () {
        var toRemoveKeys = [];
        for (var i = 0; i < localStorage.length; i++){
            if (localStorage.key(i).startsWith(SAVED_PANEL_LIST_PREFIX)) {
                toRemoveKeys.push(localStorage.key(i));
            }
        }

        for (var i = 0; i < toRemoveKeys.length; i++) {
            localStorage.removeItem(toRemoveKeys[i]);
        }
    };

    self.loadSavedPanelLists();
}]);

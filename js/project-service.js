app.service('ProjectService', ['TilingData', 'DimensionProcessor', '$translate', 'CsvHandler', 'ClientInfo', '$http', 'CutListCfg', 'AuthService', 'CsvHandler', '$q',
    function(TilingData, DimensionProcessor, $translate, CsvHandler, ClientInfo, $http, CutListCfg, AuthService, CsvHandler, $q) {

    var SAVED_PROJECT_PREFIX = "project-";

    var self = this;

    self.projects = [];

    self.saveLocalProjects2Server = function () {

        var deferred = $q.defer();

        if (!ClientInfo.email) {
            console.warn("Requested to save project data without knowing the user");
            deferred.reject();
            return deferred.promise;
        }

        var nbrProjects2Save = 0;
        for (var key in localStorage) {
            if (typeof key === 'string' && key.startsWith(SAVED_PROJECT_PREFIX)) {
                nbrProjects2Save++;
            }
        }
        if (nbrProjects2Save === 0) {
            console.info("No local projects to save to server");
            deferred.resolve();
            return deferred.promise;
        }

        console.info("Saving [" + nbrProjects2Save + "] local projects to server...");

        for (var key in localStorage) {
            if (typeof key === 'string' && key.startsWith(SAVED_PROJECT_PREFIX)) {
                (function(key) {

                    try {
                        console.info("Saving local project to server: [" + project.name + "]");
                        const project = JSON.parse(localStorage.getItem(key));
                        const projectData = {
                            name: project.name,
                            data: JSON.stringify(project.data)
                        }

                        $http({
                            url: CutListCfg.localBaseUrl + '/projects',
                            method: "POST",
                            headers: AuthService.getHttpHeaders(),
                            data: projectData
                        }).then(function (response) {
                            console.info("Saved project to server: " + response.data.name);
                            localStorage.removeItem(SAVED_PROJECT_PREFIX + response.data.name);
                            if (--nbrProjects2Save === 0) {
                                deferred.resolve(response);
                            }
                        }, function (reason) {
                            if (reason.status === 409) {
                                console.warn("Unable to save project to server:\n" + JSON.stringify(reason.data));
                                localStorage.removeItem(key);
                            } else {
                                localStorage.setItem("error." + key, localStorage.getItem(key));    // Backup data
                                console.error("Error while saving project to server:\n" + JSON.stringify(reason));
                            }
                            if (--nbrProjects2Save === 0) {
                                deferred.resolve(reason);
                            }
                        });
                    } catch (e) {
                        console.error("Error while saving project to server\n" + e.stack);
                    }
                }(key))
            }
        }

        return deferred.promise;
    };

    self.loadSavedProjects = function () {

        var deferred = $q.defer();

        if (CutListCfg.useLocalStorageAsRepository || !ClientInfo.email) {
            self.projects.length = 0;
            for (var key in localStorage) {
                if (typeof key === 'string' && key.startsWith(SAVED_PROJECT_PREFIX)) {
                    try {
                        var project = null;
                        try {
                            project = LZString.decompressFromUTF16(localStorage[key]);
                        } catch(e) {
                            console.error("Unable to parse project data after decompression. Will try to parse it as is\n" + e.stack);
                        } finally {
                            if (!project) {
                                project = JSON.parse(localStorage[key]);
                            }
                        }
                        if (!!project) {
                            self.projects.push(project);
                        }
                    } catch (e) {
                        console.error("Error while loading project from localStorage\n" + "key[" + key + "]\n data[" + localStorage[key] + "]" + e.stack);
                    }
                }
            }
            console.info("Loaded [" + self.projects.length + "] projects from localStorage");
            deferred.resolve();
        } else {

            if (!ClientInfo.email) {
                console.warn("Requested to load projects from server without knowing the user");
                deferred.reject();
                return deferred.promise;
            }

            console.info("Loading projects from server...");

            $http({
                url: CutListCfg.localBaseUrl + '/projects?userId=' + encodeURIComponent(ClientInfo.email) + '&metadataOnly=true',
                method: "GET",
                headers: AuthService.getHttpHeaders()
            }).then(function (response) {
                try {
                    self.projects.length = 0;
                    Array.prototype.push.apply(self.projects, response.data);
                    console.info("Loaded [" + self.projects.length + "] projects from server");
                    self.removeLocalStorageProjects();
                    deferred.resolve(response);
                } catch(e) {
                    console.error("Error retrieving projects from server\n" + e.stack);
                    deferred.reject(response);
                }
            }, function (response) {
                console.warn("Error while retrieving projects from server: " + JSON.stringify(response));
                deferred.reject(response);
            });
        }

        return deferred.promise;
    };

    self.loadProjectFromServer = function(id) {
        var deferred = $q.defer();

        $http({
            url: CutListCfg.localBaseUrl + '/projects/' + id,
            method: "GET",
            headers: AuthService.getHttpHeaders()
        }).then(function (response) {
            try {
                const loadedProject = response.data;
                loadedProject.data = JSON.parse(loadedProject.data);
                var idx = self.projects.findIndex(function (project) {
                    return project.id == loadedProject.id;
                });
                self.projects[idx].data = loadedProject.data;
                console.info("Loaded project data from server: id[" + self.projects[idx].id + "] name[" + self.projects[idx].name + "]");
                deferred.resolve(response);
            } catch(e) {
                console.error("Error parsing project id[" + id + "] retrieved from server\n" + e.stack);
                deferred.reject(response);
            }
        }, function (reason) {
            console.error("Error retrieving project id[" + id + "] from server\n" + e.stack);
            deferred.reject(reason);
        });

        return deferred.promise;
    }

    self.loadProject = function (projectData, tiles, stockTiles, cfg) {

        console.info("Loading project...");

        var deferred = $q.defer();

        try {
            const workspace = projectData.workspace || projectData.request;

            tiles.length = 0;
            Array.prototype.push.apply(tiles, workspace.panels);

            stockTiles.length = 0;
            Array.prototype.push.apply(stockTiles, workspace.stockPanels);

            Object.assign(cfg, workspace.configuration);

            TilingData.data = projectData;
            console.info("Successfully loaded project");
            deferred.resolve();
        } catch (e) {
            console.error("Error loading project\n" + "projectData: " + JSON.stringify(projectData) + "\n" + e.stack);
            deferred.reject();
        }

        return deferred.promise;
    };

    function buildProjectData(panels, stockPanels, configuration) {

        var projectData = JSON.parse(JSON.stringify(TilingData.data));

        const panelsCopy = JSON.parse(JSON.stringify(panels));

        panelsCopy.forEach( function (panel, index, array) {
            // Remove unwanted attributes
            for (var attribute in panel) {
                if (['id', 'width', 'height', 'label', 'count', 'enabled', 'orientation', 'material', 'edge'].indexOf(attribute) === -1) {
                    delete panel[attribute];
                }
            }
        });

        var stockPanelsCopy = JSON.parse(JSON.stringify(stockPanels));

        stockPanelsCopy.forEach( function (panel, index, array) {
            // Remove unwanted attributes
            for (var attribute in panel) {
                if (['id', 'width', 'height', 'label', 'count', 'enabled', 'orientation', 'material', 'edge'].indexOf(attribute) === -1) {
                    delete panel[attribute];
                }
            }
        });

        projectData = projectData || {};
        projectData.workspace = {
            panels: panelsCopy,
            stockPanels: stockPanelsCopy,
            configuration: configuration,
            clientInfo: ClientInfo
        };

        return projectData;
    }

    self.overwriteProject = function (id, name, panels, stockPanels, configuration) {
        console.info("Overwriting project: id[" + id + "] name[" + name + "]");
        var deferred = $q.defer();
        $http({
            url: CutListCfg.localBaseUrl + '/projects/' + encodeURIComponent(id),
            method: "PUT",
            headers: AuthService.getHttpHeaders(),
            data: {
                name: name,
                data: JSON.stringify(buildProjectData(panels, stockPanels, configuration))
            }
        }).then(function (response) {
            console.info("Successfully overwrote project: id[" + id + "] name[" + name + "]");
            deferred.resolve(response);
        }, function (reason) {
            console.error("Error overwriting project id[" + id + "] name[" + name + "]\n" + JSON.stringify(reason));
            deferred.reject(reason);
        });
        return deferred.promise;
    }

    self.saveProject = function (id, name, panels, stockPanels, configuration) {

        const deferred = $q.defer();
        const projectData = buildProjectData(panels, stockPanels, configuration);

        if (CutListCfg.useLocalStorageAsRepository) {
            console.info("Saving project to localStorage: " + name);
            self.saveProjectLocalStorage(name, panels, stockPanels, configuration);
            var response = {data: {id: null, name: name}};
            deferred.resolve(response);
        } else {
            console.info("Saving project to server: name[" + name + "]");
            
            $http({
                url: CutListCfg.localBaseUrl + '/projects',
                method: "POST",
                headers: AuthService.getHttpHeaders(),
                data: {
                    name: name,
                    data: JSON.stringify(projectData)
                }
            }).then(function (response) {
                deferred.resolve(response);
                console.info("Successfully saved project on server: id[" + response.data.id + "] name[" + response.data.name + "]");
            }, function (response) {
                if (response.status === 409) {
                    // Resource already exists
                    // Check if the id is the same, meaning we are overwriting same project.
                    // Otherwise ask if existing project should be overwritten
                    if (response.data.id === id || confirm($translate.instant('OVERWRITE') + "?\n" + name)) {
                        // PUT instead of POST
                        $http({
                            url: CutListCfg.localBaseUrl + '/projects/' + encodeURIComponent(response.data.id),
                            method: "PUT",
                            headers: AuthService.getHttpHeaders(),
                            data: {
                                name: name,
                                data: JSON.stringify(projectData)
                            }
                        }).then(function (response) {
                            console.info("Successfully overwrote project [" + name + "]");
                            deferred.resolve(response);
                        }, function (response) {
                            console.error("Error overwriting project\n" + "projectData: " + JSON.stringify(projectData) + "\nTilingData.data: " + JSON.stringify(TilingData.data));
                            deferred.reject(response);
                        });
                    } else {
                        deferred.reject(response);
                    }
                } else {
                    console.error("Error while saving project\n" + "projectData: " + JSON.stringify(projectData) + "\nTilingData.data: " + JSON.stringify(TilingData.data));
                    deferred.reject(response);
                }
            });
        }

        return deferred.promise;
    };

    self.saveProjectLocalStorage = function (name, panels, stockPanels, configuration) {

        var deferred = $q.defer();

        if (localStorage.getItem(SAVED_PROJECT_PREFIX + name) !== null) {
            if (!confirm($translate.instant('OVERWRITE') + "?\n" + self.getProjectNameFromKey(name))) {
                deferred.resolve();
                return deferred.promise;
            }
        }

        var projectData = TilingData.data;
        // TODO: How to build request data
        if (!TilingData.data || !TilingData.data.taskId) {
            projectData = {
                request: {
                    panels: panels,
                    stockPanels: stockPanels,
                    configuration: configuration,
                    clientInfo: ClientInfo
                }
            }
        }

        var data = {
            name: self.getProjectNameFromKey(name),
            data: projectData
        };

        localStorage.setItem(SAVED_PROJECT_PREFIX + name, LZString.compressToUTF16(JSON.stringify(data)));
        deferred.resolve();
    };

    self.deleteProject = function (project) {

        var deferred = $q.defer();

        // Remove the project already from the client side array
        var index = self.projects.indexOf(project)
        if (index > -1) {
            self.projects.splice(index, 1);
        } else {
            console.warn("Couldn't find project to be deleted on client side array");
        }

        if (CutListCfg.useLocalStorageAsRepository) {
            console.info("Deleting project from localStorage: " + project.name);
            localStorage.removeItem(SAVED_PROJECT_PREFIX + project.name);
            deferred.resolve();
        } else {
            console.info("Deleting project from server: id[" + project.id + "] name[" + project.name + "]");
            $http({
                url: CutListCfg.localBaseUrl + '/projects/' + encodeURIComponent(project.id),
                method: "DELETE",
                headers: AuthService.getHttpHeaders()
            }).then(function (response) {
                deferred.resolve(response);
                console.info("Successfully deleted project from server: id[" + project.id + "] name[" + project.name + "]");
            }, function (reason) {
                deferred.reject(reason);
                console.error("Error deleting project from server: id[" + project.id + "] name[" + project.name + "]\n" + JSON.stringify(reason));
            });
        }

        return deferred.promise;
    };

    self.renameProject = function (id, newName) {

        var deferred = $q.defer();

        if (!CutListCfg.useLocalStorageAsRepository) {
            console.info("Renaming project on server: id[" + id + "] newName[" + newName + "]");
            $http({
                url: CutListCfg.localBaseUrl + '/projects/' + encodeURIComponent(id),
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json-patch+json',
                    'Authorization': AuthService.getAuthHttpHeaderAttribute()
                },
                data: [{
                    op: "replace",
                    path: "/name",
                    value: newName
                }]
            }).then(function (response) {
                console.info("Successfully renamed  project on server: id[" + id + "] newName[" + newName + "]");
                deferred.resolve(response);
            }, function (reason) {
                console.error("Error renaming  project on server: id[" + id + "] newName[" + newName + "]");
                deferred.reject(reason);
            });
        } else {
            // LocalStorage not supported
            deferred.reject();
        }

        return deferred.promise;
    };

    self.getProjectNameFromKey = function (key) {
        return key.replace(new RegExp("^" + SAVED_PROJECT_PREFIX), '');
    };

    self.saveProjectsToLocalStorage = function() {
        try {
            // Delete all projects on localStorage
            for (var key in localStorage) {
                if (typeof key === 'string' && key.startsWith(SAVED_PROJECT_PREFIX)) {
                    localStorage.removeItem(key);
                }
            }
            // Save in memory projects to localStorage
            self.projects.forEach(function (project) {
                localStorage.setItem(SAVED_PROJECT_PREFIX + project.name, LZString.compressToUTF16(JSON.stringify(project)));
            });
        } catch (e) {
            console.error("Error saving projects to localStorage:\n" + e.stack);
        }
    };

    self.removeLocalStorageProjects = function () {
        var toRemoveKeys = [];
        for (var i = 0; i < localStorage.length; i++){
            if (localStorage.key(i).startsWith(SAVED_PROJECT_PREFIX)) {
                toRemoveKeys.push(localStorage.key(i));
            }
        }

        for (var i = 0; i < toRemoveKeys.length; i++) {
            localStorage.removeItem(toRemoveKeys[i]);
        }
    };

    self.loadSavedProjects();
}]);

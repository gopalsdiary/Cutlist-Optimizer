app.controller('ProjectControler', ['$scope', '$http', 'CutListCfg', '$httpParamSerializerJQLike', 'ToastService', 'ProjectService', '$translate', 'TilingData', 'ClientInfo', 'AuthService', '$timeout', 'MouseTracker', 'DimensionProcessor', '$filter', '$window',
    function($scope, $http, CutListCfg, $httpParamSerializerJQLike, ToastService, ProjectService, $translate, TilingData, ClientInfo, AuthService, $timeout, MouseTracker, DimensionProcessor, $filter, $window) {

    $scope.projectService = ProjectService;

    $scope.isLoading = false;
    $scope.message = null;

    $scope.clearContextMenu = function() {
        var filteredRows = $scope.gridApi.core.getVisibleRows($scope.gridApi.grid);
        filteredRows.forEach( function (element) {
            element.entity.$$menu = false;
        });
        if (!!$scope.projectBeingRenamed) {
            $scope.renameProject($scope.projectBeingRenamed);
            $scope.projectBeingRenamed = null;
        }
    }

    $scope.toggleRename = function (row, $event) {
        $scope.projectBeingRenamed = row.entity;
        row.entity.$$newName = row.entity.name;
        row.entity.$$isBeingRenamed = true;
        row.entity.$$menu = false;
        $timeout(function () {
            var input = document.getElementById('new-name-' + row.entity.id);
            input.focus();
            input.select();
        }, 100);
        $event.stopPropagation();
    }

    $scope.refreshFilter = function() {
        if (!$scope.searchQuery) {
            $scope.projectsGridOptions.data = ProjectService.projects;
            return;
        }
        var filteredProjects = ProjectService.projects.filter(function (project) {
            var createdLoacaleFormattedDate = $filter('date')(project.created, getLocaleDateString());
            var updatedFormattedDate = $filter('date')(project.updated, getLocaleDateString());
            return project.name.toLowerCase().includes($scope.searchQuery.toLowerCase()) ||
                (createdLoacaleFormattedDate && createdLoacaleFormattedDate.toLowerCase().includes($scope.searchQuery.toLowerCase()) ||
                    (updatedFormattedDate && updatedFormattedDate.toLowerCase().includes($scope.searchQuery.toLowerCase())));
        });
        $scope.projectsGridOptions.data = filteredProjects;
    }

    $scope.cellClicked = function (row, $event) {
        // Move the menu element outside of the modal dialog so that its position is not affected by the modal transformation
        document.body.appendChild(document.getElementById('row-menu-' + row.entity.id));

        // Move the menu element relative to cursor position
        var d = document.getElementById('row-menu-' + row.entity.id);
        d.style.left = MouseTracker.getMouseX() + 'px';
        d.style.top = MouseTracker.getMouseY() + 'px';

        if (row.entity.$$menu) {
            // Menu for this row is already opened
            row.entity.$$menu = false;
        } else {
            // Clear all the menus and open the one for this row
            $scope.clearContextMenu();
            row.entity.$$menu = true;
        }

        // To avoid clearContextMenu function to run again
        $event.stopPropagation();
    }

    $scope.rowClick = function (row) {
        if (!!$scope.projectBeingRenamed) {
            // If there's a renaming in progress, do nothing and let the event propagate.
            return;
        }
        if ($scope.$parent.confirmUnsavedChanges()) {
            $scope.loadSavedProject(row.entity.id);
        }
    };

    $scope.projectsGridOptions = {
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
    
    function setupProjectsGridOptions() {
        $scope.projectsGridOptions.columnDefs.length = 0;
        if (!$scope.isMobile) {
            $scope.projectsGridOptions.columnDefs.push(
                { name: 'name', displayName: 'Name', width: '50%', enableCellEdit: true, cellTemplate: 'project/name-cell-template.html' },
                { field: 'created', displayName: 'Creation Date',type: 'date', cellFilter: 'date:\'' + getLocaleDateString() + '\'', width: '20%' },
                { field: 'updated', displayName: 'Last Modified',type: 'date', cellFilter: 'date:\'' + getLocaleDateString() + '\'', width: '20%',
                    cellTemplate: '<div class="ui-grid-cell-contents">' +
                        '<span ng-if="row.entity.updated !== null">{{grid.appScope.formatDate(row.entity.updated)}}</span>' +
                        '<span style="color: darkgrey" ng-if="row.entity.updated === null">{{grid.appScope.formatDate(row.entity.created)}}</span>' +
                        '</div>'},
                { name: 'actions', displayName: '', width: '10%', cellTemplate: 'project/row-actions.html', enableFiltering: false, enableSorting: false }
            );
        } else {
            $scope.projectsGridOptions.columnDefs.push(
                { name: 'name', displayName: 'Name', width: '60%', enableCellEdit: true, cellTemplate: 'project/name-cell-template.html' },
                { field: 'updated', displayName: 'Last Modified',type: 'date', cellFilter: 'date:\'' + getLocaleDateString() + '\'', width: '30%',
                    cellTemplate: '<div class="ui-grid-cell-contents">' +
                        '<span ng-if="row.entity.updated !== null">{{grid.appScope.formatDate(row.entity.updated)}}</span>' +
                        '<span style="color: darkgrey" ng-if="row.entity.updated === null">{{grid.appScope.formatDate(row.entity.created)}}</span>' +
                        '</div>'},
                { name: 'actions', displayName: '', width: '10%', cellTemplate: 'project/row-actions.html', enableFiltering: false, enableSorting: false }
            );
        }
    }

    setupProjectsGridOptions();

    function saveState() {
        try {
            var state = $scope.gridApi.saveState.save();
            $window.localStorage.setItem("projectsGridState", JSON.stringify(state));
        } catch (e) {
            console.error("Error saving projects grid state\n" + e.stack);
        }
    }

    function restoreState() {
        try {
            $timeout(function() {
                const state = JSON.parse($window.localStorage.getItem("projectsGridState"));
                if (state) {
                    $scope.gridApi.saveState.restore($scope, state);
                }
            });
        } catch (e) {
            console.error("Error restoring projects grid state\n" + e.stack);
        }
    }

    $scope.projectsGridOptions.data = ProjectService.projects;
    
    $scope.saveProject = function () {
        try {
            $scope.isLoading = true;
            ProjectService.saveProject($scope.$parent.currentProject.id, $scope.projectToSaveKey, $scope.tiles, $scope.stockTiles, $scope.cfg)
                .then(function (response) {
                    try {
                        $scope.currentProject.id = response.data.id;
                        $scope.currentProject.name = response.data.name;
                        $scope.currentProject.isDirty = false;
                        ProjectService.loadSavedProjects().finally( function () {
                            $('#saveProjectModal').modal('hide');
                            $timeout(function () {
                                $scope.message = null;
                                $scope.isLoading = false;
                            }, 2000);
                            ToastService.info($translate.instant('SAVED') + ": " + $scope.projectToSaveKey);
                        });
                    } catch (e) {
                        console.error("Error processing project save resolve result\n" + e.stack);
                    }
                }, function (reason) {
                    try {
                        $scope.isLoading = false;
                        if (reason) {
                            if (reason.status === 507 || reason.status === 402) {
                                console.warn("Project save denied\n" + JSON.stringify(reason));
                                $scope.message = $translate.instant('SAVED_ITEM_LIMIT_REACHED');
                                if (reason.status === 402) {
                                    $timeout(function () {
                                        $('#saveProjectModal').modal('hide');
                                        $scope.showSubscriptionModal();
                                    }, 5000);
                                }
                                return;
                            } else if (reason.status === 409) {
                                // User opted not to override project.
                                return;
                            }
                        }
                        console.error("Unable to save project\n" + JSON.stringify(reason));
                        $scope.message = reason && reason.data && reason.data.message || $translate.instant('SERVER_UNAVAILABLE');
                    } catch (e) {
                        console.error("Error processing project save reject result\n" + e.stack);
                    }
                }).finally( function () {
                    $('#save-project-message').show();
                    $('#load-project-message').show();
                });
        } catch (e) {
            console.error("Error saving project\n" + e.stack);
        }
    };

    $scope.deleteProject = function (project) {
        try {
            if (!CutListCfg.useLocalStorageAsRepository && !ClientInfo.email) {
                alert($translate.instant('LOGIN_REQUEST'));
                $scope.showLoginModal();
                return;
            }
            if (confirm($translate.instant('REMOVE') + "?\n" + ProjectService.getProjectNameFromKey(project.name))) {
                if ($scope.$parent.currentProject.id === project.id) {
                    // We are deleting the currently opened project
                    $scope.$parent.currentProject.id = null;
                    $scope.$parent.currentProject.name = null;
                }
                // Make sure the menu is hidden already
                project.$$menu = false;
                ProjectService.deleteProject(project).then( function (response) {
                    //ToastService.info($translate.instant('DELETED') + ": " + project.name);
                    ProjectService.loadSavedProjects();
                    $scope.message = null;
                }, function (response) {
                    if (response) {
                        $scope.message = response.data && response.data.message || $translate.instant('SERVER_UNAVAILABLE');
                    }
                    $('#save-project-message').show();
                    $('#load-project-message').show();
                });
            }
        } catch (e) {
            console.error("Error deleting project\n" + e.stack);
        }
    };

    $scope.renameProject = function (project) {
        try {
            if (!project.$$newName || project.$$newName.length === 0 || project.name === project.$$newName) {
                project.$$isBeingRenamed = false;
                return;
            }

            if (!CutListCfg.useLocalStorageAsRepository && !ClientInfo.email) {
                alert($translate.instant('LOGIN_REQUEST'));
                $scope.showLoginModal();
                return;
            }

            var oldName = project.name;
            project.name = project.$$newName;
            project.updated = new Date();
            project.$$isBeingRenamed = false;

            ProjectService.renameProject(project.id, project.$$newName).then( function (response) {
                $scope.message = null;
                if ($scope.$parent.currentProject.id === project.id) {
                    $scope.$parent.currentProject.name = project.$$newName;
                }
                //ToastService.info($translate.instant('RENAMED') + ": " + project.name + " > " + project.$$newName);
            }, function (reason) {
                if (reason && reason.status === 409) {
                    $scope.message = "\"" + project.$$newName + "\" " + $translate.instant('ALREADY_EXISTS');
                } else {
                    $scope.message = reason.data && reason.data.message || $translate.instant('SERVER_UNAVAILABLE');
                }
                project.name = oldName;
                project.$$newName = oldName;
                $('#save-project-message').show();
                $('#load-project-message').show();
            });
        } catch (e) {
            console.error("Error renaming project\n" + e.stack);
        }
    };

    $scope.loadSavedProject = function (id) {

        $scope.isLoading = true;

        ProjectService.loadProjectFromServer(id).then(function(response) {

            const project = response.data;

            try {
                const workspace = project.data.workspace || project.data.request;

                const hasLabels = workspace.panels.filter(function (panel) {
                    return !!panel.label;
                }).length > 0;
                $scope.cfg.isTileLabelVisible = hasLabels;

                const hasMaterial = workspace.panels.filter(function (panel) {
                    return !!panel.material;
                }).length > 0;
                $scope.cfg.isMaterialEnabled = hasMaterial;

                const hasEdgeBanding = workspace.panels.filter(function (panel) {
                    return panel.edge && (panel.edge.top || panel.edge.bottom || panel.edge.left || panel.edge.right);
                }).length > 0;
                $scope.cfg.hasEdgeBanding = hasEdgeBanding;

                if (workspace.configuration) {
                    $scope.cfg.cutThickness = parseFloat(workspace.configuration.cutThickness);
                    $scope.cfg.cutThicknessInput = DimensionProcessor.formatDimension($scope.cfg.cutThickness, false);
                }
            } catch (e) {
                console.error("Error loading project configuration\n" + e.stack);
            }

            $timeout(function () {
                ProjectService.loadProject(project.data, $scope.tiles, $scope.stockTiles, $scope.cfg).then( function () {
                    $scope.setupUnits();
                    $scope.$parent.validateTilesArray();
                    $scope.$parent.validateStockTilesArray();
                    $scope.render();
                    $('#loadProjectModal').modal('hide');
                    $timeout(function () {
                        $scope.message = null;
                        $scope.isLoading = false;
                    }, 2000);
                    ToastService.info($translate.instant('LOADED') + ": " + project.name);
                    $scope.$parent.currentProject.id = project.id;
                    $scope.$parent.currentProject.name = project.name;

                    // Workaround for setting isDirty to false
                    // Wait before setting isDirty to false so that project has enough time to load
                    $timeout(function () {
                        $scope.$parent.currentProject.isDirty = false;
                    }, 2000);

                }, function () {
                    ToastService.error($translate.instant('ERROR'));
                });
            });
        });
    };
    
    self.onResize = function() {
        if (window.innerWidth < 768 && self.preWindowInnerWidth > 768 || window.innerWidth > 768 && self.preWindowInnerWidth < 768) {
            $timeout(function() {
                setupProjectsGridOptions();
                $scope.gridApi.core.handleWindowResize();
            });
            $window.localStorage.setItem("projectsGridState", null);
        }
        self.preWindowInnerWidth = window.innerWidth;
    }
    
    $("#saveProjectModal").on('shown.bs.modal',function() {
        $timeout(function () {
            if ($scope.$parent.currentProject && $scope.$parent.currentProject.name) {
                $scope.projectToSaveKey = $scope.$parent.currentProject.name;
            } else {
                $scope.projectToSaveKey = "Project " + new Date().toJSON().slice(0, 10).replace(/-/g, '-');
            }
        });
        angular.element($window).bind('resize', self.onResize);
    });

    $("#loadProjectModal").on('shown.bs.modal',function() {
        $timeout(function () {
            $scope.projectsGridOptions.data = ProjectService.projects;
            $scope.refreshFilter();
            $scope.gridApi.core.handleWindowResize();
            if ($scope.$parent.currentProject && $scope.$parent.currentProject.name) {
                $scope.projectToSaveKey = $scope.$parent.currentProject.name;
            } else {
                $scope.projectToSaveKey = "Project " + new Date().toJSON().slice(0, 10).replace(/-/g, '-');
            }
        }, 100);
        angular.element($window).bind('resize', self.onResize);
    });

    $("#saveProjectModal").on('hidden.bs.modal',function() {
        $scope.message = null;
        window.angular.element($window).off('resize', self.onResize);
    });

    $("#loadProjectModal").on('hidden.bs.modal',function() {
        $scope.message = null;
        window.angular.element($window).off('resize', self.onResize);
    });
}]);

app.controller('AppCtrl', function(ProjectService, TilingService, TilingData, DrawService, DimensionProcessor, ClientInfo, $window, $scope, $location, $http, $timeout, $q, $translate, $interval, $anchorScroll, uiGridConstants, ToastService, AnalyticsService, fileReader, $compile, CsvHandler, MaterialService, PdfGenerator, ImageGenerator, CutListCfg, AuthService, ProjectService, PanelListService, SubscriptionService, PermitPeriodService, ConfigurationProperties, $filter) {

    const self = this;
    
    self.isAndroid = typeof android !== 'undefined';

    $scope.console = console;
    $scope.toastService = ToastService;
    $scope.clientInfo = ClientInfo;
    $scope.cutListService = TilingService;
    $scope.drawService = DrawService;
    $scope.Math = Math;
    $scope.cutListCfg = CutListCfg;
    $scope.translate = $translate;
    $scope.dimensionProcessor = DimensionProcessor;
    $scope.authService = AuthService;
    $scope.tilingData = TilingData;
    $scope.subscriptionService = SubscriptionService;
    $scope.permitPeriodService = PermitPeriodService;
    $scope.configurationProperties = ConfigurationProperties;
    $scope.pdfGenerator = PdfGenerator;
    $scope.window = $window;

    // <editor-fold defaultstate="collapsed" desc="Current project">
    try {
        $scope.currentProject = JSON.parse($window.localStorage.getItem("currentProject"));
        if ($scope.currentProject) {
            console.info("Loaded current project metadata from local storage:\n" + JSON.stringify($scope.currentProject));
            if ($scope.currentProject.isRenaming === true) {
                $scope.currentProject.isRenaming = false;
                $scope.currentProject.name = $scope.currentProject.oldName;
                console.warn("Loaded project metadata had renaming status set to true");
            }
            if ($scope.currentProject.isSaving === true) {
                $scope.currentProject.isSaving = false;
                console.warn("Loaded project metadata had saving status set to true");
            }
            if ($scope.currentProject.isDirty === false) {
                // Workaround for setting isDirty to false
                // Wait be fore setting isDirty to false so that project has enough time to load
                $timeout(function () {
                    $scope.currentProject.isDirty = false;
                }, 2000);
            }
        } else {
            console.info("No current project metadata found on local storage");
            $scope.currentProject = {
                id: null,
                name: null,
                isSaving: false,
                isEditName: false,
                isDirty: false
            };
        }
    } catch (e) {
        console.error("Error loading current project from local storage\n" + e.stack);
    }

    $scope.lastSavedFile = {
        name: null,
        projectId: null
    }

    $scope.bodyClicked = function() {
        $scope.currentProject.isEditName = false;
    }

    $scope.startEditingProjectName = function($event) {

        if (!AuthService.isLoggedIn()) {
            alert($translate.instant('LOGIN_REQUEST'));
            $scope.showLoginModal();
            return;
        }

        $scope.currentProject.isEditName = true;
        $timeout(function () {
            var input = document.getElementById('current-project-name');
            input.focus();
            input.select();
        });
        $event.stopPropagation();
    }

    $scope.stopEditingProjectName = function() {
        document.getElementById('current-project-name').blur();
        $scope.currentProject.isEditName = false;
    }

    $scope.saveProjectName = function() {

        if (!AuthService.isLoggedIn()) {
            $scope.currentProject.name = $scope.currentProject.oldName;
            alert($translate.instant('LOGIN_REQUEST'));
            $scope.showLoginModal();
            return;
        }

        if (!$scope.currentProject.name || $scope.currentProject.name.length === 0) {
            $scope.currentProject.name = $scope.currentProject.oldName;
        }

        if ($scope.currentProject.oldName && $scope.currentProject.name !== $scope.currentProject.oldName) {
            $scope.currentProject.isRenaming = true;
            ProjectService.renameProject($scope.currentProject.id, $scope.currentProject.name).then(function (response) {
                $scope.currentProject.oldName = null;
            },function(reason) {
                if (reason.status === 409) {
                    ToastService.error("\"" + $scope.currentProject.name + "\" " + $translate.instant('ALREADY_EXISTS'));
                } else {
                    ToastService.error($translate.instant('GENERIC_ERROR_MSG'));
                }
                $scope.currentProject.name = $scope.currentProject.oldName;
            }).finally( function () {
                $scope.currentProject.isRenaming = false;
            });
        }
    }

    $scope.$watch('currentProject.name', function (newValue, oldValue) {
        if ($scope.currentProject.isEditName && !$scope.currentProject.oldName) {
            $scope.currentProject.oldName = oldValue;
        }
    });

    $scope.saveProject = function () {

        if (self.isAndroid && !validateSubscriptionFeature()) {
            return;
        }
        
        if (!CutListCfg.useLocalStorageAsRepository && !validateLogin()) {
            return;
        }

        if ($scope.currentProject && $scope.currentProject.id) {
            $scope.currentProject.isSaving = true;
            ProjectService.overwriteProject($scope.currentProject.id, $scope.currentProject.name, $scope.tiles, $scope.stockTiles, $scope.cfg).then(
                function (result) {
                    $scope.currentProject.isDirty = false;
                    ToastService.info($translate.instant('SAVED') + ": " + $scope.currentProject.name);
                },
                function (reason) {
                    if (reason && reason.status === 404) {
                        $scope.showSaveProjectModal();
                    } else {
                        ToastService.error($translate.instant('SERVER_UNAVAILABLE'));
                    }
                }
            ).finally( function () {
                $scope.currentProject.isSaving = false;
            });
        } else {
            $scope.showSaveProjectModal();
        }
    }
    // </editor-fold">

    $scope.confirmUnsavedChanges = function () {
        if (!$scope.currentProject.isDirty || confirm($translate.instant('UNSAVED_CHANGES'))) {
            return true;
        }
        return false;
    }

    if (typeof android !== 'undefined') {
        $scope.android = android;
    }

    var PANELS_ARRAY_MIN_LENGTH = 5;

    $scope.isAndroid = function () {
        return typeof android !== 'undefined';
    };

    $scope.isMobilePortrait = function () {
        return window.innerWidth <= 768;
    };

    $scope.hasPremiumFeatures = function () {
        return (typeof android !== 'undefined' && $scope.isFull) || $scope.clientInfo.hasActiveSubscription() || !!$scope.clientInfo.permitPeriod;
    }

    $scope.hasSubscription = function () {
        return $scope.clientInfo.hasActiveSubscription();
    }

    $scope.languageList = [
        {id: 'bg', label: 'български'},
        {id: 'de', label: 'Deutsch'},
        {id: 'en', label: 'English'},
        {id: 'es', label: 'Español'},
        {id: 'fr', label: 'Français'},
        {id: 'he', label: 'עִברִית'},
        {id: 'hr', label: 'Hrvatski'},
        {id: 'it', label: 'Italiano'},
        {id: 'nl', label: 'Nederlands'},
        {id: 'ja', label: '日本語'},
        {id: 'pl', label: 'Polski'},
        {id: 'pt', label: 'Português'},
        {id: 'ru', label: 'Pусский'},
        {id: 'tr', label: 'Türk'},
        {id: 'ua', label: 'український'},
        {id: 'fa', label: 'فارسی'},
        {id: 'zh', label: '中文'}
    ];

    $scope.language = $scope.languageList.find(function (obj) {
        return obj.id === $translate.use();
    });

    $scope.onLanguageChanged = function () {
        $scope.changeLanguage($scope.language.id);
    };

    // Workaround for changing grid label translations without reloading the page
    $scope.isGridReloding = false;

    $scope.changeLanguage = function (langKey) {

        $translate.use(langKey);

        $scope.isGridReloding = true;
        setupTilesGrid();
        setupStockTilesGrid();
        setupOptions();

        $timeout(function () {
            $scope.isGridReloding = false;
        }, 0);

        $window.localStorage.setItem("language", langKey);
    };

    // Do this inside a function so that labels can be refreshed when changing language
    function setupOptions() {
        $scope.optimizationFactorList = [
            {id: 0.25, label: $translate.instant('LOW')},
            {id: 0.5, label: $translate.instant('NORMAL')},
            {id: 1, label: $translate.instant('HIGH')}
        ];

        $scope.optimizationFactorPriority = [
            {id: 0, label: $translate.instant('LEAST_WASTED_AREA')},
            {id: 1, label: $translate.instant('LEAST_NUMBER_OF_CUTS')},
            {id: 2, label: $translate.instant('LEAST_AVG_MOSAIC_AREA')}
        ];

        $scope.cutOrientationPreferenceList = [
            {id: 0, label: $translate.instant('CUT_ORIENTATION_PREFERENCE_NONE')},
            {id: 1, label: $translate.instant('CUT_ORIENTATION_PREFERENCE_WIDTH')},
            {id: 2, label: $translate.instant('CUT_ORIENTATION_PREFERENCE_LENGTH')}
        ];

        $scope.stackEqualMosaicsOptionsList = [
            {id: 0, label: $translate.instant('AUTO')},
            {id: 1, label: $translate.instant('ALWAYS')},
            {id: 2, label: $translate.instant('NEVER')}
        ];

        $scope.unitsList = [
            {id: DimensionProcessor.UnitsEnum.generic, label: $translate.instant('GENERIC')},
            {id: DimensionProcessor.UnitsEnum.mm, label: $translate.instant('MM')},
            {id: DimensionProcessor.UnitsEnum.cm, label: $translate.instant('CM')},
            {id: DimensionProcessor.UnitsEnum.m, label: $translate.instant('M')},
            {id: DimensionProcessor.UnitsEnum.inches, label: $translate.instant('INCHES')},
            {id: DimensionProcessor.UnitsEnum.inches_frac, label: $translate.instant('INCHES_FRAC')},
            {id: DimensionProcessor.UnitsEnum.feet_inches, label: $translate.instant('FEET_INCHES')},
            {id: DimensionProcessor.UnitsEnum.feet_inches_frac, label: $translate.instant('FEET_INCHES_FRAC')}
        ];

        $scope.cutDimensionsRepresentationList = [
            {id: false, label: $translate.instant('HEIGHT') + ' × ' + $translate.instant('WIDTH')},
            {id: true, label: $translate.instant('WIDTH') + ' × ' + $translate.instant('HEIGHT')}
        ];
    }
    setupOptions();

    $timeout(function () {
        $("#splash").fadeOut();
    }, 2000);

    var localStorageKeySuffix = '?v=1.2';

    $timeout(function () {
        var count = $window.localStorage.getItem('runCount-' + '%PROJECT_VERSION%');
        count = count ? parseInt(count) + 1 : 1;
        $window.localStorage.setItem('runCount-' + '%PROJECT_VERSION%', count);
    }, 500);

    $scope.tiling = TilingData;

    $scope.dirtyData = true;

    $scope.isCalculating = false;
    $scope.isBlocked = false;

    $scope.visibleTileInfoIdx = 0;

    $scope.requestStatus;
    $scope.statusMessage;

    $scope.showLoginModal = function() {
        $('#loginModal').modal('show');
    };

    $scope.showAboutModal = function() {
        $('#aboutModal').modal('show');
    };

    $scope.showStatsModal = function() {
        $('#statsModal').modal('show');
    };

    var action = $location.search().action;
    if (action) {
        $scope.isBlocked = true;
    }

    $timeout(function () {
        if (action === "login") {
            $('#loginModal').modal('show');
            $scope.isBlocked = false;
        } else if (action === "registrationConfirm") {
            AuthService.confirmRegistration($location.search().id, $location.search().token).then(
                function (response) {
                ToastService.info(response.data.message);
                $scope.saveLocalData2Server();
            }).finally( function() {
                $scope.isBlocked = false;
                $location.url($location.path());    // Clear query parameters
            });
        } else if (action === "oauth2Login") {
            AuthService.registerOauth2Login().finally( function () {
                $scope.saveLocalData2Server();
                $scope.isBlocked = false;
                $location.url($location.path());    // Clear query parameters
            });
        } else if (action === "resetPassword") {
            $('#savePassModal').modal('show');
            $scope.isBlocked = false;
        } else if (action === "subscriptionActivated") {
            ToastService.info($translate.instant('SUBSCRIPTION_ACTIVE'));
            $location.url($location.path());    // Clear query parameters
            $scope.isBlocked = false;
        } else if (action === "permitPeriodActivated") {
            ToastService.info($translate.instant('PERMIT_PERIOD_ACTIVE'));
            $location.url($location.path());    // Clear query parameters
            $scope.isBlocked = false;
        } else if (action === "upgrade") {
            $('#subscriptionModal').modal('show');
            $location.url($location.path());    // Clear query parameters
            $scope.isBlocked = false;
        } else {
            $scope.isBlocked = false;
            if (AuthService.isLoggedIn() && !$window.localStorage.getItem("isWhatsNewShown-1.12.1") && typeof android === 'undefined') {
                // $('#whatsNewModal').modal('show');
                // $window.localStorage.setItem("isWhatsNewShown-1.12.1", true);
            }
        }
    }, 1500);

    $scope.logout = function() {
        $scope.isBlocked = true;
        AuthService.clearLocalAuthData();
        if (typeof android === 'undefined') {
            $window.location.href = '/logout';
        } else {
            android.logout();
        }
    };

    $scope.incrementVisibleTileInfoIdx = function () {
        if ($scope.visibleTileInfoIdx < TilingData.mosaics.length - 1) {
            $scope.visibleTileInfoIdx++;
        }
    };

    $scope.decrementVisibleTileInfoIdx = function () {
        if ($scope.visibleTileInfoIdx > 0) {
            $scope.visibleTileInfoIdx--;
        }
    };

    $scope.scrollTo = function (id) {
        $("html,body").animate({scrollTop: $("#" + id).offset().top - 55}, "slow");
    };

    $scope.formatArea = function (area) {
        return DimensionProcessor.formatArea(area);
    };

    if (!$scope.isTilesGridCollapsed) {
        $scope.isTilesGridCollapsed = false;
        $timeout(function () {  // Timeout for avoiding problems with grid rendering
            try {
                $scope.isTilesGridCollapsed = angular.fromJson($window.localStorage.getItem("isTilesGridCollapsed" + localStorageKeySuffix));
            } catch (e) {
                console.error(e.stack);
            }
            if ($scope.isTilesGridCollapsed === null) {
                $scope.isTilesGridCollapsed = false;
            }
        });
    }

    if (!$scope.isStockGridCollapsed) {
        $scope.isStockGridCollapsed = false;
        $timeout(function () {  // Timeout for avoiding problems with grid rendering
            try {
                $scope.isStockGridCollapsed = angular.fromJson($window.localStorage.getItem("isStockGridCollapsed" + localStorageKeySuffix));
            } catch (e) {
                console.error(e.stack);
            }
            if ($scope.isStockGridCollapsed === null) {
                $scope.isStockGridCollapsed = false;
            }
        });
    }

    if (!$scope.isBaseOptionsCollapsed) {
        try {
            $scope.isBaseOptionsCollapsed = angular.fromJson($window.localStorage.getItem("isBaseOptionsCollapsed" + localStorageKeySuffix));
        } catch (e) {
            console.error(e.stack);
        }
        if ($scope.isBaseOptionsCollapsed === null) {
            $scope.isBaseOptionsCollapsed = false;
        }
    }

    if (!$scope.isDisplayOptionsCollapsed) {
        try {
            $scope.isDisplayOptionsCollapsed = angular.fromJson($window.localStorage.getItem("isDisplayOptionsCollapsed" + localStorageKeySuffix));
        } catch (e) {
            console.error(e.stack);
        }
        if ($scope.isDisplayOptionsCollapsed === null) {
            $scope.isDisplayOptionsCollapsed = false;
        }
    }

    if (!$scope.isAdvancedOptionsCollapsed) {
        try {
            $scope.isAdvancedOptionsCollapsed = angular.fromJson($window.localStorage.getItem("isAdvancedOptionsCollapsed" + localStorageKeySuffix));
        } catch (e) {
            console.error(e.stack);
        }
        if ($scope.isAdvancedOptionsCollapsed === null) {
            $timeout(function () {  // Timeout for avoiding problems with grid rendering
                $scope.isAdvancedOptionsCollapsed = false;
            });
        }
    }

    if (!$scope.isTilingInfoVisible) {
        try {
            $scope.isTilingInfoVisible = angular.fromJson($window.localStorage.getItem("isTilingInfoVisible" + localStorageKeySuffix));
        } catch (e) {
            console.error(e.stack);
        }
        if ($scope.isTilingInfoVisible === null) {
            $scope.isTilingInfoVisible = true;
        }
    }

    if (!$scope.isCutListCollapsed) {
        try {
            $scope.isCutListCollapsed = angular.fromJson($window.localStorage.getItem("isCutListCollapsed" + localStorageKeySuffix));
        } catch (e) {
            console.error(e.stack);
        }
        if ($scope.isCutListCollapsed === null) {
            $scope.isCutListCollapsed = false;
        }
    }

    $scope.toggleIsTilingInfoVisible = function () {
        $scope.isTilingInfoVisible = !$scope.isTilingInfoVisible;
        $timeout(function () {
            render();
        });
    };

    // <editor-fold defaultstate="collapsed" desc="Configurations init">
    try {
        // Try to load cfg from url params
        if ($location.search().cfg) {
            $scope.cfg = JSON.parse($location.search().cfg);
        } else {
            // Try to load cfg from local storage
            $scope.cfg = JSON.parse($window.localStorage.getItem("cfg" + localStorageKeySuffix));
        }

        if ($scope.cfg) {

            // Units
            if ($scope.cfg.units === undefined) {
                $scope.cfg.units = DimensionProcessor.UnitsEnum.generic;
            }
            DimensionProcessor.unit($scope.cfg.units);

            if ($scope.cfg.isWidthFirst === undefined) {
                $scope.cfg.isWidthFirst = false;
            }
            DimensionProcessor.isWidthFirst($scope.cfg.isWidthFirst);

            // Decimal places
            if (isNaN($scope.cfg.decimalPlaces) || $scope.cfg.decimalPlaces < 0) {
                $scope.cfg.decimalPlaces = 2;
            }
            DimensionProcessor.roundFactor(Math.pow(10, $scope.cfg.decimalPlaces));

            // Cut thickness
            $scope.cfg.cutThickness = parseFloat($scope.cfg.cutThickness);
            if (isNaN($scope.cfg.cutThickness)) {
                $scope.cfg.cutThickness = 0;
            }
            // Assign the formatted cut thickness to the variable bound to the input
            $scope.cfg.cutThicknessInput = DimensionProcessor.formatDimension($scope.cfg.cutThickness, false);

            // Set defaults if no cfg present
            if ($scope.cfg.optimizationFactor === undefined) {
                $scope.cfg.optimizationFactor = 1;
            }
            if ($scope.cfg.optimizationPriority === undefined) {
                $scope.cfg.optimizationPriority = 0;
            }
            if ($scope.cfg.cutOrientationPreference === undefined) {
                $scope.cfg.cutOrientationPreference = 0;
            }
            if ($scope.cfg.isTileLabelVisible === undefined) {
                $scope.cfg.isTileLabelVisible = false;
            }
            if ($scope.cfg.isMaterialEnabled === undefined) {
                $scope.cfg.isMaterialEnabled = false;
            }
            if ($scope.cfg.considerOrientation === undefined) {
                $scope.cfg.considerOrientation = false;
            }
            if ($scope.cfg.hasEdgeBanding === undefined) {
                $scope.cfg.hasEdgeBanding = false;
            }
            if ($scope.cfg.forceServerSideCalc === undefined) {
                $scope.cfg.forceServerSideCalc = false;
            } else if ($scope.cfg.forceServerSideCalc === true) {
                // Confirm that user is allowed
                $timeout(function () {
                    if (!ClientInfo.hasActiveSubscription()) {
                        $scope.cfg.forceServerSideCalc = false;
                    }
                }, 5000); 
            }
            if (!$scope.cfg.minTrimDimension && $scope.cfg.minTrimDimension != 0) {
                $scope.cfg.minTrimDimension = 0;
                // Confirm that user is allowed
                $timeout(function () {
                    if (!ClientInfo.hasActiveSubscription()) {
                        $scope.cfg.minTrimDimension = 0;
                    }
                }, 5000);
            }
            if (!$scope.cfg.stackEqualMosaicLayout && $scope.cfg.stackEqualMosaicLayout != 0) {
                $scope.cfg.stackEqualMosaicLayout = 0;
            }

            if ($scope.cfg.svgTransform) {
                DrawService.transform($scope.cfg.svgTransform);
            }
        } else {
            $scope.cfg = {
                version: 1.0,
                cutThickness: CutListCfg.defaultCutThickness,
                cutThicknessInput: DimensionProcessor.formatDimension(CutListCfg.defaultCutThickness, false), // Assign the formated cut thickness to the variable bound to the input
                useSingleStockUnit: false,
                accuracyFactor: 0,
                optimizationPriority: 0,
                cutOrientationPreference: 0,
                optimizationFactor: 1,
                showDimensions: true,
                isTileLabelVisible: CutListCfg.defaultIsTileLabelVisible,
                isMaterialEnabled: false,
                units: DimensionProcessor.UnitsEnum.generic,
                considerOrientation: false,
                hasEdgeBanding: false,
                decimalPlaces: 2,
                forceServerSideCalc: false,
                minTrimDimension: 0,
                stackEqualMosaicLayout: 0,
                isWidthFirst: false
            };
        }

        // Will override above loaded configurations
        CutListCfg.init($scope.cfg);

        DrawService.setDimensionFormater(
            function (dimension) {
                return DimensionProcessor.formatDimension(dimension);
            }
        );

        DrawService.onRender(adjustViewportHeight);

        const diagramCfg = JSON.parse($window.localStorage.getItem("diagramCfg"));
        if (diagramCfg) {
            DrawService.cfg(diagramCfg);
        }
    } catch (e) {
        console.error("Error loading configurations\n" + e.stack);
    }
    // </editor-fold>

    // Load data of previous request from localStorage and render diagram
    let localStorageData;
    try {
        localStorageData = $window.localStorage.getItem("data" + localStorageKeySuffix);
        if (localStorageData) {
            try {
                TilingData.data = JSON.parse(LZString.decompressFromUTF16(localStorageData));
            } catch(e) {
                console.warn("Unable to parse localStorage data after decompression. Will try to parse it as is\n" + e.stack);
            } finally {
                if (!TilingData.data && LZString.decompressFromUTF16(localStorageData) !== 'null') {
                    TilingData.data = JSON.parse(localStorageData);
                }
            }
            render();
        }
    } catch (e) {
        console.error("Error loading solution data from local storage\n" + e.stack);
    }

    $scope.validateTilesArray = function () {

        if (!$scope.tiles || $scope.tiles.length === 0) {
            console.warn("No panels, resetting the array...");
            resetTiles();
        }

        if ($scope.tiles.length > 1000) {
            console.warn("Too many panels: [" + $scope.tiles.length + "] panels, resetting the array...");
            resetTiles();
        }

        if (isNewLineNeeded($scope.tiles)) {
            addNewTile();
        }

        $scope.tiles.forEach(function (tile, i) {

            // Remove non-numeric chars
            if ($scope.cfg.units !== DimensionProcessor.UnitsEnum.feet_inches &&
                $scope.cfg.units !== DimensionProcessor.UnitsEnum.feet_inches_frac &&
                $scope.cfg.units !== DimensionProcessor.UnitsEnum.inches_frac &&
                typeof tile.width === 'string' && typeof tile.height === 'string') {
                tile.width = tile.width.replace(/[^\d.-]/g, '');
                tile.height = tile.height.replace(/[^\d.-]/g, '');
            }

            // Ensure tile has an id
            if (!tile.id) {
                var tileId = 0;
                $scope.tiles.forEach(function (tile) {
                    tileId = Math.max(isNaN(tile.id) ? -Infinity : tile.id, tileId);
                });
                tile.id = tileId + 1;
            }

            // Disallow decimals and negative
            if (tile.count) {
                tile.count = Math.abs(Math.floor(tile.count));
            }

            // Ensure orientation has correct values
            if (tile.orientation != 0 && tile.orientation != 1 && tile.orientation != 2) {
                tile.orientation = 0;
            }

            // Ensure edge has correct values
            if (tile.edge) {
                tile.edge.top = tile.edge.top ? tile.edge.top : null;
                tile.edge.left = tile.edge.left ? tile.edge.left : null;
                tile.edge.bottom = tile.edge.bottom ? tile.edge.bottom : null;
                tile.edge.right = tile.edge.right ? tile.edge.right : null;
            } else {
                tile.edge = {top: null, bottom: null, left: null, right: null};
            }

            if (!tile.material) {
                tile.material = null;
            }
        });

        // Fix for ui-grid to render all the rows
        if ($scope.gridOptions) {
            $scope.gridOptions.virtualizationThreshold = $scope.tiles.length + 1;
        }
    }

    $scope.validateStockTilesArray = function () {

        if (!$scope.stockTiles || $scope.stockTiles.length === 0) {
            console.info("No stock panels, resetting the array...");
            resetStockTiles();
        }

        if ($scope.stockTiles.length > 1000) {
            console.warn("Too many stock panels: [" + $scope.stockTiles.length + "] panels, resetting the array...");
            resetStockTiles();
        }

        if (isNewLineNeeded($scope.stockTiles)) {
            addNewStockTile();
        }

        $scope.stockTiles.forEach(function (tile, i) {

            // Remove non-numeric chars
            if ($scope.cfg.units !== DimensionProcessor.UnitsEnum.feet_inches &&
                $scope.cfg.units !== DimensionProcessor.UnitsEnum.feet_inches_frac &&
                $scope.cfg.units !== DimensionProcessor.UnitsEnum.inches_frac &&
                typeof tile.width === 'string' && typeof tile.height === 'string') {
                tile.width = tile.width.replace(/[^\d.-]/g, '');
                tile.height = tile.height.replace(/[^\d.-]/g, '');
            }

            // Ensure tile has an id
            // Start at 1000
            if (!tile.id || tile.id < 1000) {
                var tileId = 1000;
                $scope.stockTiles.forEach(function (tile) {
                    tileId = Math.max(isNaN(tile.id) ? -Infinity : tile.id, tileId);
                });
                tile.id = tileId + 1;
            }

            // Disallow decimals and negative
            if (tile.count) {
                tile.count = Math.abs(Math.floor(tile.count));
            }

            // Ensure orientation has correct values
            if (tile.orientation != 0 && tile.orientation != 1 && tile.orientation != 2) {
                tile.orientation = 0;
            }

            if (!tile.material) {
                tile.material = null;
            }
        });

        // Fix for ui-grid to render all the rows
        if ($scope.stockGridOptions) {
            $scope.stockGridOptions.virtualizationThreshold = $scope.stockTiles.length + 1;
        }
    }

    // <editor-fold defaultstate="collapsed" desc="Watchers">

    $scope.$watch('isModalVisible', function (newValue, oldValue) {
        if ($scope.isAndroid()) {
            android.setModalVisible(newValue);
        }
    });

    /**
     * Parse cut thickness value input
     */
    $scope.cutThicknessInput = function () {
        $scope.cfg.cutThickness = DimensionProcessor.parseDimension($scope.cfg.cutThicknessInput);
        $scope.cfg.cutThicknessInput = DimensionProcessor.formatDimension($scope.cfg.cutThickness, false);
    };

    $scope.$watch('cfg.useSingleStockUnit', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.dirtyData = true;
            $scope.currentProject.isDirty = true;
        }
    }, true);

    $scope.$watch('cfg.cutThickness', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            if ($scope.cfg.cutThickness < 0) {
                $scope.cfg.cutThickness = 0;
            }
            $scope.dirtyData = true;
            $scope.currentProject.isDirty = true;
        }
    }, true);

    $scope.$watch('cfg.accuracyFactor', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            if ($scope.cfg.accuracyFactor < 0) {
                $scope.cfg.accuracyFactor = 0;
            }
            $scope.dirtyData = true;
            $scope.currentProject.isDirty = true;
        }
    }, true);

    $scope.$watch('cfg.hasEdgeBanding', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            DrawService.isEdgeBandingVisible($scope.cfg.hasEdgeBanding);
            DrawService.render();
        }
    }, true);

    $scope.$watch('cfg.isTileLabelVisible', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            DrawService.isLabelsVisible(newValue);
            setupTilesGrid();
            setupStockTilesGrid();

            // Use Math.random() instead of our Mersenne Twister
            var chance = new Chance(Math.random);

            // If, at least one label is set, don't generate them.
            for (i = 0; i < $scope.tiles.length; i++) {
                if ($scope.tiles[i].label) {
                    return;
                }
            }
            for (i = 0; i < $scope.stockTiles.length; i++) {
                if ($scope.stockTiles[i].label) {
                    return;
                }
            }

            // Generate random labels
            for (i = 0; i < $scope.tiles.length; i++) {
                if ($scope.tiles[i].width && !$scope.tiles[i].label) {
                    $scope.tiles[i].label = chance.first();
                    //$scope.tiles[i].label = $scope.tiles[i].height + 'x' + $scope.tiles[i].width;
                }
            }
            for (i = 0; i < $scope.stockTiles.length; i++) {
                if ($scope.stockTiles[i].width && !$scope.stockTiles[i].label) {
                    $scope.stockTiles[i].label = chance.first();
                    //$scope.stockTiles[i].label = $scope.stockTiles[i].height + 'x' + $scope.stockTiles[i].width;
                }
            }

            refreshPanelLabels();
            DrawService.render();
        }
    }, true);

    $scope.$watch('cfg.isMaterialEnabled', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            setupTilesGrid();
            setupStockTilesGrid();
        }
    }, true);

    $scope.$watch('cfg.isWidthFirst', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            setupTilesGrid();
            setupStockTilesGrid();
            DimensionProcessor.isWidthFirst($scope.cfg.isWidthFirst);
        }
    }, true);

    $scope.$watch('cfg.considerOrientation', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            DrawService.isGrainVisible($scope.cfg.considerOrientation);
            DrawService.render();

            // If, at least one orientation is set, don't change anything.
            for (i = 0; i < $scope.tiles.length; i++) {
                if ($scope.tiles[i].orientation !== 0) {
                    return;
                }
            }
            // Set every panel orientation to horizontal
            for (i = 0; i < $scope.tiles.length; i++) {
                if ($scope.tiles[i].width) {
                    $scope.tiles[i].orientation = 1;
                }
            }
            for (i = 0; i < $scope.stockTiles.length; i++) {
                if ($scope.stockTiles[i].width) {
                    $scope.stockTiles[i].orientation = 1;
                }
            }
        }
    }, true);

    $scope.$watch('cfg.stackEqualMosaicLayout', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            render();
        }
    }, true);

    $scope.setupUnits = function () {

        DimensionProcessor.convertToDecimalList($scope.tiles);
        DimensionProcessor.convertToDecimalList($scope.stockTiles);

        DimensionProcessor.unit($scope.cfg.units);

        setupTilesGrid();
        setupStockTilesGrid();

        // Parse before validating
        DimensionProcessor.sanitizePanelListDimensions($scope.tiles);
        DimensionProcessor.sanitizePanelListDimensions($scope.stockTiles);
        $scope.validateTilesArray();
        $scope.validateStockTilesArray();
        $scope.cfg.cutThicknessInput = DimensionProcessor.formatDimension($scope.cfg.cutThickness, false);

        DrawService.setDimensionFormater(
            function (dimension) {
                return DimensionProcessor.formatDimension(dimension, true);
            }
        );

        render();
    }

    $scope.$watch('cfg.decimalPlaces', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.cfg.decimalPlaces = Math.round($scope.cfg.decimalPlaces);
            if ($scope.cfg.decimalPlaces < 0) {
                $scope.cfg.decimalPlaces = 0;
            }
            if ($scope.cfg.decimalPlaces > 10) {
                $scope.cfg.decimalPlaces = 10;
            }
            DimensionProcessor.roundFactor(Math.pow(10, newValue));
            DimensionProcessor.sanitizePanelListDimensions($scope.tiles);
            DimensionProcessor.sanitizePanelListDimensions($scope.stockTiles);
        }
    }, true);

    $scope.$watch('projectDataInput', function (newValue, oldValue) {
        if (newValue) {

            ProjectService.loadProject(JSON.parse(newValue), $scope.tiles, $scope.stockTiles, $scope.cfg);

            // TODO
            // CsvHandler.loadProject(newValue, $scope);
            // DimensionProcessor.sanitizePanelListDimensions($scope.tiles);
            // DimensionProcessor.sanitizePanelListDimensions($scope.stockTiles);
        }
    });

    $scope.$watch('tiles', function (newValue, oldValue) {
        if (newValue !== oldValue) {

            $scope.currentProject.isDirty = true;

            try {
                if (newValue[0] && newValue[0].label && newValue[0].label.toLowerCase() === 'debug') {
                    newValue[0].label = '';
                    $scope.debugMode = !$scope.debugMode;
                    $window.localStorage.setItem("debugMode", $scope.debugMode);
                    if ($scope.debugMode) {
                        ToastService.info("Debug mode enabled");
                        console.info("Test log");
                        console.info("Test info log");
                        console.warn("Test warn log");
                        console.error("Test error log");
                    }
                    return;
                }
            } catch (e) {
                console.err(e.message);
            }

            $scope.validateTilesArray();

            var labelRefreshRequired = false;

            for (i = 0; i < newValue.length; i++) {

                if (!oldValue[i]) {
                    continue;
                }

                // Do not consider label change for dirty data
                if (newValue[i].width != oldValue[i].width ||
                    newValue[i].height != oldValue[i].height ||
                    newValue[i].count != oldValue[i].count ||
                    newValue[i].enabled != oldValue[i].enabled ||
                    newValue[i].orientation != oldValue[i].orientation) {
                    $scope.dirtyData = true;
                }

                // Check if label refresh is needed
                if (newValue[i].label != oldValue[i].label) {
                    labelRefreshRequired = true;
                }

                // Check if edge bands were changed
                if (newValue[i].edge) {
                    if ((newValue[i].edge !== oldValue[i].edge) ||
                        newValue[i].edge.top != oldValue[i].edge.top ||
                        newValue[i].edge.bottom != oldValue[i].edge.bottom ||
                        newValue[i].edge.left != oldValue[i].edge.left ||
                        newValue[i].edge.right != oldValue[i].edge.right) {
                        $scope.dirtyData = true;
                        // Refresh list if no tile is being edited
                        if ($scope.editTile === null) {
                            $scope.refreshEdgeBandList();
                        }
                    }

                    // Check if a new edge band type creation was requested
                    var newEdgeBand = false;
                    if ((oldValue[i].edge && newValue[i].edge.top != oldValue[i].edge.top) && newValue[i].edge.top === Number.POSITIVE_INFINITY) {
                        $scope.editEdge = 'top';
                        $scope.editTile = newValue[i];
                        $scope.editTile.edge.top = $translate.instant('EDGE_BAND') + ' ' + ($scope.edgeBandingList.length - 1);
                        newEdgeBand = true;
                    }
                    if ((oldValue[i].edge && newValue[i].edge.left != oldValue[i].edge.left) && newValue[i].edge.left === Number.POSITIVE_INFINITY) {
                        $scope.editEdge = 'left';
                        $scope.editTile = newValue[i];
                        $scope.editTile.edge.left = $translate.instant('EDGE_BAND') + ' ' + ($scope.edgeBandingList.length - 1);
                        newEdgeBand = true;
                    }
                    if ((oldValue[i].edge && newValue[i].edge.bottom != oldValue[i].edge.bottom) && newValue[i].edge.bottom === Number.POSITIVE_INFINITY) {
                        $scope.editEdge = 'bottom';
                        $scope.editTile = newValue[i];
                        $scope.editTile.edge.bottom = $translate.instant('EDGE_BAND') + ' ' + ($scope.edgeBandingList.length - 1);
                        newEdgeBand = true;
                    }
                    if ((oldValue[i].edge && newValue[i].edge.right != oldValue[i].edge.right) && newValue[i].edge.right === Number.POSITIVE_INFINITY) {
                        $scope.editEdge = 'right';
                        $scope.editTile = newValue[i];
                        $scope.editTile.edge.right = $translate.instant('EDGE_BAND') + ' ' + ($scope.edgeBandingList.length - 1);
                        newEdgeBand = true;
                    }
                    if (newEdgeBand) {
                        $('#createEdgeBandModal').modal('show');
                        $timeout(function () {
                            var input = document.getElementById('edgeBandName');
                            input.focus();
                            input.select();
                        }, 500);
                    }
                }

                if (newValue[i].material !== oldValue[i].material) {
                    // Check if a new material creation was requested
                    if (newValue[i].material && newValue[i].material === Number.POSITIVE_INFINITY) {
                        $scope.editTile = newValue[i];
                        $scope.editTile.material = $translate.instant('MATERIAL') + ' ' + ($scope.materialTypes.length - 1);
                        $('#createMaterialModal').modal('show');
                        $timeout(function () {
                            var input = document.getElementById('newMaterialName');
                            input.focus();
                            input.select();
                        }, 500);
                    } else if ($scope.editTile === null) {
                        // Refresh list if no tile is being edited
                        $scope.refreshMaterialsList();
                    }
                }
            }

            if (labelRefreshRequired === true) {
                // Refresh the labels client side
                refreshPanelLabels();
                render();
            }
        }
    }, true);

    $scope.$watch('stockTiles', function (newValue, oldValue) {
        if (newValue !== oldValue) {

            $scope.currentProject.isDirty = true;

            $scope.validateStockTilesArray();

            var labelRefreshRequired = false;

            for (i = 0; i < newValue.length; i++) {

                if (!oldValue[i]) {
                    continue;
                }

                // Do not consider label change for dirty data
                if (newValue[i].width != oldValue[i].width ||
                    newValue[i].height != oldValue[i].height ||
                    newValue[i].count != oldValue[i].count ||
                    newValue[i].enabled != oldValue[i].enabled ||
                    newValue[i].orientation != oldValue[i].orientation) {
                    $scope.dirtyData = true;
                }

                if (newValue[i].material !== oldValue[i].material) {
                    // Check if a new material creation was requested
                    if (newValue[i].material && newValue[i].material === Number.POSITIVE_INFINITY) {
                        $scope.editTile = newValue[i];
                        $scope.editTile.material = $translate.instant('MATERIAL') + ' ' + ($scope.materialTypes.length - 1);
                        $('#createMaterialModal').modal('show');
                        $timeout(function () {
                            var input = document.getElementById('newMaterialName');
                            input.focus();
                            input.select();
                        }, 500);
                    } else if ($scope.editTile === null) {
                        // Refresh list if no tile is being edited
                        $scope.refreshMaterialsList();
                    }
                }

                // Check if label refresh is needed
                if (newValue[i].label != oldValue[i].label) {
                    labelRefreshRequired = true;
                }
            }

            if (labelRefreshRequired === true) {
                // Refresh the labels client side
                refreshPanelLabels();
                render();
            }
        }
    }, true);

    // </editor-fold>

    function addNewTile(width, height, count) {

        if (typeof width === 'undefined') {
            width = null;
        }

        if (typeof height === 'undefined') {
            height = null;
        }

        if (typeof count === 'undefined') {
            count = null;
        }

        var tileId = -1;
        angular.forEach($scope.tiles, function (tile) {
            tileId = Math.max(tile.id, tileId);
        });
        $scope.tiles.push({
            width: width,
            height: height,
            count: count,
            enabled: true,
            id: tileId + 1,
            orientation: $scope.cfg.considerOrientation ? 1 : 0
        });
    }

    function addNewStockTile(width, height, count) {

        if (typeof width === 'undefined') {
            width = null;
        }

        if (typeof height === 'undefined') {
            height = null;
        }

        if (typeof count === 'undefined') {
            count = null;
        }

        var tileId = -1;
        angular.forEach($scope.stockTiles, function (tile) {
            tileId = Math.max(tile.id, tileId);
        });
        $scope.stockTiles.push({
            width: width,
            height: height,
            count: count,
            enabled: true,
            id: tileId + 1,
            orientation: $scope.cfg.considerOrientation ? 1 : 0
        });
    }


    $scope.refreshMaterialsList = function() {

        if (typeof $scope.materialTypes === 'undefined') {
            $scope.materialTypes = [];
        } else {
            $scope.materialTypes.length = 0;
        }

        $scope.materialTypes.push({id: null, label: $translate.instant('NONE')});

        $scope.usedMaterials = [];
        if ($scope.tiles) {
            Object.keys($scope.tiles).forEach(function (key, index) {
                if ($scope.tiles[key].material) {
                    $scope.usedMaterials.push($scope.tiles[key].material);
                }
            });
        }

        if ($scope.stockTiles) {
            Object.keys($scope.stockTiles).forEach(function (key, index) {
                if ($scope.stockTiles[key].material) {
                    $scope.usedMaterials.push($scope.stockTiles[key].material);
                }
            });
            // Remove nulls
            $scope.usedMaterials = $scope.usedMaterials.filter(function (value) {return value != null; });
            // Remove duplicated
            $scope.usedMaterials = $scope.usedMaterials.filter(function (value, index, self) { return self.indexOf(value) === index; });
            // Add existing materials to the list
            $scope.usedMaterials.forEach(function(element) {
                $scope.materialTypes.push({id: element, label: element});
            });
        }

        // Add option for creating new material
        $scope.materialTypes.push({id: Number.POSITIVE_INFINITY, label: '- ' + $translate.instant('ADD_NEW') + ' -'});
    };

    $scope.refreshEdgeBandList = function() {

        if (typeof $scope.edgeBandingList === 'undefined') {
            $scope.edgeBandingList = [];
        } else {
            $scope.edgeBandingList.length = 0;
        }

        $scope.edgeBandingList.push({id: null, label: $translate.instant('NONE')});

        // Get the existing edge bands from currently loaded tiles
        $scope.usedEdgeBands = [];
        if ($scope.tiles) {
            Object.keys($scope.tiles).forEach(function (key, index) {
                if ($scope.tiles[key].edge) {
                    $scope.usedEdgeBands.push($scope.tiles[key].edge.top);
                    $scope.usedEdgeBands.push($scope.tiles[key].edge.bottom);
                    $scope.usedEdgeBands.push($scope.tiles[key].edge.left);
                    $scope.usedEdgeBands.push($scope.tiles[key].edge.right);
                }
            });
            // Remove nulls
            $scope.usedEdgeBands = $scope.usedEdgeBands.filter(function (value) {return value != null; });
            // Remove duplicated
            $scope.usedEdgeBands = $scope.usedEdgeBands.filter(function (value, index, self) { return self.indexOf(value) === index; });
            // Add existing edge bands to the list
            $scope.usedEdgeBands.forEach(function(element) {
                $scope.edgeBandingList.push({id: element, label: element});
            });
        }

        // Add option for creating new edge band
        $scope.edgeBandingList.push({id: Number.POSITIVE_INFINITY, label: '- ' + $translate.instant('ADD_NEW') + ' -'});
    };

    /**
     * Gets the number of used and valid tiles.
     * @returns {number}
     */
    $scope.getNbrUsedTiles = function () {
        var count = 0;
        if ($scope.tiles) {
            $scope.tiles.forEach( function (tile) {
                if (tile.width && tile.height && tile.count && tile.enabled) {
                    count++;
                }
            });
        }
        return count;
    };

    /**
     * Gets the number of used and valid base tiles.
     * @returns {number}
     */
    $scope.getNbrUsedStockTiles = function () {
        var count = 0;
        if ($scope.stockTiles) {
            $scope.stockTiles.forEach(function (tile) {
                if (tile.width && tile.height && tile.count && tile.enabled) {
                    count++;
                }
            });
        }
        return count;
    };

    // Try to load tiles from url params
    $scope.stockTiles = angular.fromJson($location.search().stockTiles);

    if (!$scope.stockTiles) {
        let localStorageData;
        try {
            localStorageData = $window.localStorage.getItem("baseTiles" + localStorageKeySuffix);
            if (localStorageData) {
                try {
                    $scope.stockTiles = JSON.parse(LZString.decompressFromUTF16(localStorageData));
                } catch(e) {
                    console.warn("Unable to parse localStorage stock panels data after decompression. Will try to parse it as is\n" + e.stack);
                } finally {
                    if (!$scope.stockTiles) {
                        $scope.stockTiles = JSON.parse(localStorageData);
                    }
                }
                render();
            }
        } catch (e) {
            console.error("Error loading stock panels from local storage:\n" + localStorageData + "\n" + e.stack);
        }
    }

    $scope.validateStockTilesArray();

    function resetStockTiles() {

        if (!$scope.stockTiles) {
            $scope.stockTiles = [];
        }

        $scope.stockTiles.length = 0;
        addNewStockTile();
        addNewStockTile();
        addNewStockTile();
        addNewStockTile();
        addNewStockTile();
        $scope.refreshMaterialsList();
        $scope.refreshEdgeBandList();
    };
    if (!$scope.stockTiles) {
        $scope.stockTiles = [];
        resetStockTiles();
    }

    // Try to load tiles from url params
    $scope.tiles = angular.fromJson($location.search().tiles);

    if (!$scope.tiles) {
        let localStorageData;
        try {
            localStorageData = $window.localStorage.getItem("tiles" + localStorageKeySuffix);
            if (localStorageData) {
                try {
                    $scope.tiles = JSON.parse(LZString.decompressFromUTF16(localStorageData));
                } catch(e) {
                    console.warn("Unable to parse localStorage panels data after decompression. Will try to parse it as is\n" + e.stack);
                } finally {
                    if (!$scope.tiles) {
                        $scope.tiles = JSON.parse(localStorageData);
                    }
                }
                render();
            }
        } catch (e) {
            console.error("Error loading panels from local storage:\n" + localStorageData + "\n" + e.stack);
        }
    }

    var resetTiles = function () {

        if (!$scope.tiles) {
            $scope.tiles = [];
        }

        $scope.tiles.length = 0;
        addNewTile();
        addNewTile();
        addNewTile();
        addNewTile();
        addNewTile();
        $scope.refreshMaterialsList();
        $scope.refreshEdgeBandList();
    };
    if (!$scope.tiles) {
        $scope.tiles = [];
        resetTiles();
    }


    $scope.gridOptions = {
        enableColumnResizing: true,
        enableCellEditOnFocus: true,
        enableGridMenu: true,
        enableColumnMenus: false,
        rowTemplate: 'fragment/tile-row-template.html',
        rowHeight: 26,
        enableHorizontalScrollbar: 1,
        gridMenuShowHideColumns: false,
        enableSorting: false,
        data: $scope.tiles,
        enableVerticalScrollbar: 0
    };

    function getGridColumnPercentages() {

        var widthWeight = 20;
        var heightWeight = 20;
        var qtyWeight = 10;
        var materialWeight = 20;
        var labelWeight = 20;
        var optionsWeight = 15;

        var minOptionsWidth = 50;

        if ($scope.cfg.hasEdgeBanding) {
            minOptionsWidth += 25;
            optionsWeight += 8;
        }

        if ($scope.cfg.considerOrientation) {
            minOptionsWidth += 25;
            optionsWeight += 8;
        }

        var totalWeight = widthWeight + heightWeight + qtyWeight + optionsWeight;

        if ($scope.cfg.isMaterialEnabled) {
            totalWeight += materialWeight;
        }

        if ($scope.cfg.isTileLabelVisible) {
            totalWeight += labelWeight;
        }

        var gridWidth = $('#tiles-grid').width() - 4;

        if (isNaN(gridWidth)) {
            // Use percentage if unable to get the available width
            gridWidth = 100;
        }

        var widthWidth = widthWeight / totalWeight * gridWidth;
        var heightWidth = heightWeight / totalWeight * gridWidth;
        var countWidth = qtyWeight / totalWeight * gridWidth;
        var materialWidth = materialWeight / totalWeight * gridWidth;
        var labelWidth = labelWeight / totalWeight * gridWidth;
        var optionsWidth = optionsWeight / totalWeight * gridWidth;

        if (gridWidth === 100) {
            // Use percentage if unable to get the available width
            widthWidth += '%';
            heightWidth += '%';
            countWidth += '%';
            materialWidth += '%';
            labelWidth += '%';
            optionsWidth += '%';
        } else {
            if ($scope.cfg.units === DimensionProcessor.UnitsEnum.feet_inches_frac) {
                // Bigger dimensions columns for fractional inches
                widthWidth = Math.max(widthWidth, 75);
                heightWidth = Math.max(heightWidth, 75);
            } else {
                widthWidth = Math.max(widthWidth, 50);
                heightWidth = Math.max(heightWidth, 50);
            }
            countWidth = Math.max(countWidth, 35);
            materialWidth = Math.max(materialWidth, 75);
            labelWidth = Math.max(labelWidth, 75);
            optionsWidth = Math.max(optionsWidth, minOptionsWidth);
        }

        return {
            width: widthWidth,
            height: heightWidth,
            count: countWidth,
            material: materialWidth,
            label: labelWidth,
            options: optionsWidth
        };
    }

    $scope.exportToCsv = function () {
        CsvHandler.exportTiles($scope.panelsToExport, $scope.cfg, $scope.csvFileNameToDownload + ".csv");
        $('#exportCsvModal').modal('hide');
        console.info("CSV saved as " + $scope.csvFileNameToDownload + ".csv");
    };

    function setupTilesGrid() {

        $scope.gridOptions.gridMenuCustomItems = [
            {
                title: $translate.instant('ADD_LINE'),
                action: function ($event) {
                    addNewTile();
                },
                order: 0
            },
            {
                title: $translate.instant('SAVE_LIST'),
                action: function ($event) {

                    if (self.isAndroid && !validateSubscriptionFeature()) {
                        return;
                    }

                    if (!validateLogin()) {
                        return;
                    }

                    $scope.panelListToSave = $scope.tiles;
                    if ((!PanelListService.panelLists || PanelListService.panelLists.length === 0) && ClientInfo.email) {
                        // Block and load panel lists from server before opening load panel list modal
                        $scope.isBlocked = true;
                        PanelListService.loadSavedPanelLists().then(function () {
                            $('#savePanelListModal').modal('show');
                            $scope.isBlocked = false;
                        }, function (reason) {
                            ToastService.error($translate.instant('SERVER_UNAVAILABLE'));
                            $scope.isBlocked = false;
                        });
                    } else {
                        PanelListService.loadSavedPanelLists();
                        $('#savePanelListModal').modal('show');
                    }

                    $timeout(function () {
                        var input = document.getElementById('panelListToSaveName');
                        input.focus();
                        input.select();
                    }, 500);
                },
                order: 2
            },
            {
                title: $translate.instant('LOAD'),
                action: function ($event) {
                    
                    const hasLocalSavedPanelLists = CutListCfg.useLocalStorageAsRepository && PanelListService.panelLists && PanelListService.panelLists.length > 0;

                    if (self.isAndroid && !hasLocalSavedPanelLists && !validateSubscriptionFeature()) {
                        return;
                    }

                    if (!hasLocalSavedPanelLists && !validateLogin()) {
                        return;
                    }
                    
                    $scope.panelListToLoadDst = $scope.tiles;
                    if (!PanelListService.panelLists || PanelListService.panelLists.length === 0) {
                        $scope.isBlocked = true;
                        PanelListService.loadSavedPanelLists().then(function () {
                            $('#loadPanelListModal').modal('show');
                            $scope.isBlocked = false;
                        }, function (reason) {
                            ToastService.error($translate.instant('SERVER_UNAVAILABLE'));
                            $scope.isBlocked = false;
                        });
                    } else {
                        PanelListService.loadSavedPanelLists();
                        $('#loadPanelListModal').modal('show');
                    }
                },
                order: 1
            },
            {
                title: $translate.instant('ENABLE_DISABLE_ALL'),
                action: function ($event) {
                    var nbrDisabeld = 0;
                    $scope.tiles.forEach(function (panel) {
                        if (!panel.enabled) {
                            nbrDisabeld++;
                        }
                    });
                    if (nbrDisabeld > 0) {
                        $scope.tiles.forEach(function (panel) { panel.enabled = true; });
                        ToastService.info($translate.instant('ENABLED'));
                    } else {
                        $scope.tiles.forEach(function (panel) { panel.enabled = false; });
                        ToastService.info($translate.instant('DISABLED'));
                    }
                    $scope.dirtyData = true;
                },
                order: 3
            },
            {
                title: $translate.instant('DELETE_ALL'),
                action: function ($event) {
                    if (confirm($translate.instant('CLEAR_LIST')) === true) {
                        resetTiles();
                        ToastService.info("Panels deleted");
                    }
                },
                order: 5
            }
        ];

        // CSV import/export
        $scope.gridOptions.gridMenuCustomItems.push(
            {
                title: $translate.instant('EXPORT_CSV'),
                action: function ($event) {
                    if ($scope.getNbrUsedTiles() === 0) {
                        ToastService.error($translate.instant('NOTHING_TO_EXPORT'));
                        return;
                    }
                    $scope.panelsToExport = $scope.tiles;
                    if ($scope.currentProject.name && $scope.lastSavedFile.projectId === $scope.currentProject.id) {
                        $scope.csvFileNameToDownload = $translate.instant('PANELS') + ' - ' + $scope.currentProject.name;
                    } else {
                        $scope.csvFileNameToDownload = $translate.instant('PANELS') + ' - ' + getGenericExportGeneratedFilename();
                    }
                    $('#exportCsvModal').modal('show');
                    $timeout(function () {
                        var input = document.getElementById('csvFileNameToDownload');
                        input.focus();
                        input.select();
                    }, 500);
                },
                order: 6
            },
            {
                title: $translate.instant('IMPORT_CSV'),
                action: function ($event) {
                    // Create temporary file DOM element for showing the open file dialog
                    // Element will be removed on the file select callback
                    var divElement = angular.element(document.getElementById('tmp'));
                    $scope.tmpHtmlElement = angular.element('<input type="file" accept=".csv" ng-csv-panel-select="onFileSelect($files)" >');
                    divElement.append($scope.tmpHtmlElement);
                    $compile(divElement)($scope);
                    $timeout(function () {
                        $scope.tmpHtmlElement[0].click();
                    });

                },
                order: 7
            }
        );

        $scope.gridOptions.gridMenuCustomItems.push({
            title: $translate.instant('DIMENSIONS_TO_LABELS'),
            action: function ($event) {
                if (!$scope.cfg.isTileLabelVisible || confirm($translate.instant('REPLACE_LABELS_QUESTION')) === true) {
                    for (i = 0; i < $scope.tiles.length; i++) {
                        if ($scope.tiles[i].width && $scope.tiles[i].height) {
                            $scope.tiles[i].label = DimensionProcessor.formatDimensions($scope.tiles[i]);
                        }
                    }
                    $scope.cfg.isTileLabelVisible = true;
                }
            },
            order: 8
        });

        var dimColType = 'number';

        if ($scope.cfg.units === DimensionProcessor.UnitsEnum.feet_inches ||
            $scope.cfg.units === DimensionProcessor.UnitsEnum.feet_inches_frac ||
            $scope.cfg.units === DimensionProcessor.UnitsEnum.inches_frac) {
            dimColType = 'text';
        }

        var gridColumnPercentages = getGridColumnPercentages();

        $scope.gridOptions.columnDefs = [];

        if ($scope.cfg.isWidthFirst) {
            $scope.gridOptions.columnDefs.push({
                name: 'width',
                displayName: $translate.instant('WIDTH'),
                enableCellEdit: true,
                type: dimColType,
                width: gridColumnPercentages.width
            });
            $scope.gridOptions.columnDefs.push({
                name: 'height',
                displayName: $translate.instant('HEIGHT'),
                enableCellEdit: true,
                type: dimColType,
                width: gridColumnPercentages.height
            });
        } else {
            $scope.gridOptions.columnDefs.push({
                name: 'height',
                displayName: $translate.instant('HEIGHT'),
                enableCellEdit: true,
                type: dimColType,
                width: gridColumnPercentages.height
            });
            $scope.gridOptions.columnDefs.push({
                name: 'width',
                displayName: $translate.instant('WIDTH'),
                enableCellEdit: true,
                type: dimColType,
                width: gridColumnPercentages.width
            });
        }

        $scope.gridOptions.columnDefs.push({
            name: 'count',
            displayName: $translate.instant('QUANTITY'),
            enableCellEdit: true,
            type: 'number',
            width: gridColumnPercentages.count
        });

        if ($scope.cfg.isMaterialEnabled) {
            $scope.gridOptions.columnDefs.push({
                field: 'material',
                displayName: $translate.instant('MATERIAL'),
                editType: 'dropdown',
                enableCellEdit: true,
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownOptionsArray: $scope.materialTypes,
                editDropdownIdLabel: 'id',
                editDropdownValueLabel: 'label',
                width: gridColumnPercentages.material
            });
        }

        if ($scope.cfg.isTileLabelVisible) {
            $scope.gridOptions.columnDefs.push({
                name: 'label',
                displayName: $translate.instant('LABEL'),
                enableCellEdit: true,
                type: 'text',
                width: gridColumnPercentages.label
            });
        }

        $scope.gridOptions.columnDefs.push({
            name: ' ',
            displayName: ' ',
            allowCellFocus: false,
            enableCellEdit: false,
            cellTemplate: 'fragment/tile-options-cell-template.html',
            width: gridColumnPercentages.options ,
        });
    }

    $scope.stockGridOptions = {
        enableColumnResizing: true,
        enableCellEditOnFocus: true,
        enableGridMenu: true,
        enableColumnMenus: false,
        exporterMenuPdf: true,
        rowHeight: 26,
        rowTemplate: 'fragment/stock-tile-row-template.html',
        enableHorizontalScrollbar: 1,
        gridMenuShowHideColumns: false,
        enableSorting: false,
        data: $scope.stockTiles,
        enableVerticalScrollbar: 0
    };

    function setupStockTilesGrid() {

        $scope.stockGridOptions.gridMenuCustomItems = [
            {
                title: $translate.instant('ADD_LINE'),
                action: function ($event) {
                    addNewStockTile();
                },
                order: 0
            },
            {
                title: $translate.instant('SAVE_LIST'),
                action: function ($event) {

                    if (self.isAndroid && !validateSubscriptionFeature()) {
                        return;
                    }

                    if (!validateLogin()) {
                        return;
                    }

                    $scope.panelListToSave = $scope.stockTiles;
                    if (!PanelListService.panelLists || PanelListService.panelLists.length === 0) {
                        $scope.isBlocked = true;
                        PanelListService.loadSavedPanelLists().then(function () {
                            $('#savePanelListModal').modal('show');
                            $scope.isBlocked = false;
                        }, function (reason) {
                            ToastService.error($translate.instant('SERVER_UNAVAILABLE'));
                            $scope.isBlocked = false;
                        });
                    } else {
                        PanelListService.loadSavedPanelLists();
                        $('#savePanelListModal').modal('show');
                    }

                    $timeout(function () {
                        var input = document.getElementById('panelListToSaveName');
                        input.focus();
                        input.select();
                    }, 500);
                },
                order: 2
            },
            {
                title: $translate.instant('LOAD'),
                action: function ($event) {

                    const hasLocalSavedPanelLists = CutListCfg.useLocalStorageAsRepository && PanelListService.panelLists && PanelListService.panelLists.length > 0;

                    if (self.isAndroid && !hasLocalSavedPanelLists && !validateSubscriptionFeature()) {
                        return;
                    }

                    if (!validateLogin()) {
                        return;
                    }
                    
                    $scope.panelListToLoadDst = $scope.stockTiles;
                    if ((!PanelListService.panelLists || PanelListService.panelLists.length === 0) && ClientInfo.email) {
                        // Block and load panel lists from server before opening load panel list modal
                        $scope.isBlocked = true;
                        PanelListService.loadSavedPanelLists().then(function () {
                            $('#loadPanelListModal').modal('show');
                            $scope.isBlocked = false;
                        }, function (reason) {
                            ToastService.error($translate.instant('SERVER_UNAVAILABLE'));
                            $scope.isBlocked = false;
                        });
                    } else {
                        PanelListService.loadSavedPanelLists();
                        $('#loadPanelListModal').modal('show');
                    }
                },
                order: 1
            },
            {
                title: $translate.instant('ENABLE_DISABLE_ALL'),
                action: function ($event) {
                    var nbrDisabeld = 0;
                    $scope.stockTiles.forEach(function (panel) {
                        if (!panel.enabled) {
                            nbrDisabeld++;
                        }
                    });
                    if (nbrDisabeld > 0) {
                        $scope.stockTiles.forEach(function (panel) { panel.enabled = true; });
                        ToastService.info($translate.instant('ENABLED'));
                    } else {
                        $scope.stockTiles.forEach(function (panel) { panel.enabled = false; });
                        ToastService.info($translate.instant('DISABLED'));
                    }
                    $scope.dirtyData = true;
                },
                order: 3
            },
            {
                title: $translate.instant('DELETE_ALL'),
                action: function ($event) {
                    if (confirm($translate.instant('CLEAR_LIST')) === true) {
                        resetStockTiles();
                    }
                    if ($scope.isAndroid()) {
                        ToastService.info("Stock panels deleted");
                    }
                },
                order: 5
            }
        ];

        // CSV import/export
        $scope.stockGridOptions.gridMenuCustomItems.push(
            {
                title: $translate.instant('EXPORT_CSV'),
                action: function ($event) {
                    if ($scope.getNbrUsedStockTiles() === 0) {
                        ToastService.error($translate.instant('NOTHING_TO_EXPORT'));
                        return;
                    }
                    $scope.panelsToExport = $scope.stockTiles;
                    if ($scope.currentProject.name && $scope.lastSavedFile.projectId === $scope.currentProject.id) {
                        $scope.csvFileNameToDownload = $translate.instant('STOCK') + ' - ' + $scope.currentProject.name;
                    } else {
                        $scope.csvFileNameToDownload = $translate.instant('STOCK') + ' - ' + getGenericExportGeneratedFilename();
                    }
                    $('#exportCsvModal').modal('show');
                    $timeout(function () {
                        var input = document.getElementById('csvFileNameToDownload');
                        input.focus();
                        input.select();
                    }, 500);
                },
                order: 6
            },
            {
                title: $translate.instant('IMPORT_CSV'),
                action: function ($event) {
                    // Create temporary file DOM element for showing the open file dialog
                    // Element will be removed on the file select callback
                    var divElement = angular.element(document.getElementById('tmp'));
                    $scope.tmpHtmlElement = angular.element('<input type="file" accept=".csv" ng-csv-sheet-select="onFileSelect($files)" >');
                    divElement.append($scope.tmpHtmlElement);
                    $compile(divElement)($scope);
                    $timeout(function () {
                        $scope.tmpHtmlElement[0].click();
                    });
                },
                order: 7
            }
        );

        $scope.stockGridOptions.gridMenuCustomItems.push({
            title: $translate.instant('DIMENSIONS_TO_LABELS'),
            action: function ($event) {
                if (!$scope.cfg.isTileLabelVisible || confirm($translate.instant('REPLACE_LABELS_QUESTION')) === true) {
                    for (i = 0; i < $scope.stockTiles.length; i++) {
                        if ($scope.stockTiles[i].width && $scope.stockTiles[i].height) {
                            $scope.stockTiles[i].label = DimensionProcessor.formatDimensions($scope.stockTiles[i]);
                        }
                    }
                    $scope.cfg.isTileLabelVisible = true;
                }
            },
            order: 8
        });

        var dimColType = 'number';

        if ($scope.cfg.units === DimensionProcessor.UnitsEnum.feet_inches ||
            $scope.cfg.units === DimensionProcessor.UnitsEnum.feet_inches_frac ||
            $scope.cfg.units === DimensionProcessor.UnitsEnum.inches_frac) {
            dimColType = 'text';
        }

        var gridColumnPercentages = getGridColumnPercentages();

        $scope.stockGridOptions.columnDefs = [];

        if ($scope.cfg.isWidthFirst) {
            $scope.stockGridOptions.columnDefs.push({
                name: 'width',
                displayName: $translate.instant('WIDTH'),
                enableCellEdit: true,
                enableColumnMenu: false,
                type: dimColType,
                width: gridColumnPercentages.width
            });
            $scope.stockGridOptions.columnDefs.push({
                name: 'height',
                displayName: $translate.instant('HEIGHT'),
                enableCellEdit: true,
                enableColumnMenu: false,
                type: dimColType,
                width: gridColumnPercentages.height
            });
        } else {
            $scope.stockGridOptions.columnDefs.push({
                name: 'height',
                displayName: $translate.instant('HEIGHT'),
                enableCellEdit: true,
                enableColumnMenu: false,
                type: dimColType,
                width: gridColumnPercentages.height
            });
            $scope.stockGridOptions.columnDefs.push({
                name: 'width',
                displayName: $translate.instant('WIDTH'),
                enableCellEdit: true,
                enableColumnMenu: false,
                type: dimColType,
                width: gridColumnPercentages.width
            });
        }

        $scope.stockGridOptions.columnDefs.push({
            name: 'count',
            displayName: $translate.instant('QUANTITY'),
            enableCellEdit: true,
            type: 'number',
            width: gridColumnPercentages.count
        });

        if ($scope.cfg.isMaterialEnabled) {
            $scope.stockGridOptions.columnDefs.push({
                field: 'material',
                displayName: $translate.instant('MATERIAL'),
                editType: 'dropdown',
                enableCellEdit: true,
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownOptionsArray: $scope.materialTypes,
                editDropdownIdLabel: 'id',
                editDropdownValueLabel: 'label',
                width: gridColumnPercentages.material
            });
        }

        if ($scope.cfg.isTileLabelVisible) {
            $scope.stockGridOptions.columnDefs.push({
                name: 'label',
                displayName: $translate.instant('LABEL'),
                enableCellEdit: true,
                type: 'text',
                width: gridColumnPercentages.label
            });
        }

        $scope.stockGridOptions.columnDefs.push({
            name: ' ',
            displayName: ' ',
            allowCellFocus: false,
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            cellTemplate: 'fragment/stock-tile-options-cell-template.html',
            width: gridColumnPercentages.options
        });
    }

    $timeout(function () {
        setupTilesGrid();
        setupStockTilesGrid();
    });

    $scope.saveRow = function (rowEntity) {

       DimensionProcessor.sanitizePanelListDimensions($scope.tiles);

        try {
            // Create a fake promise - normally you'd use the promise returned by $http or $resource
            var promise = $q.defer();
            $scope.gridApi.rowEdit.setSavePromise(rowEntity, promise.promise);
            promise.resolve();
        } catch (e) {
            console.warn("Error while saving row\n" + e.stack);
        }

        // Assume all panels are valid
        $scope.tiles.forEach(function (tile) {
            tile.isInvalid = false;
        });
    };

    $scope.gridOptions.onRegisterApi = function (gridApi) {
        // Set gridApi on scope
        $scope.gridApi = gridApi;
        $scope.gridApi.rowEdit.on.saveRow($scope, $scope.saveRow);
    };

    $scope.saveBaseTileRow = function (rowEntity) {

        DimensionProcessor.sanitizePanelListDimensions($scope.stockTiles);

        try {
            // Create a fake promise - normally you'd use the promise returned by $http or $resource
            var promise = $q.defer();
            $scope.gridApiBaseTiles.rowEdit.setSavePromise(rowEntity, promise.promise);
            promise.resolve();
        } catch (e) {
            console.warn("Error while saving row\n" + e.stack);
        }

        // Assume all panels are valid
        $scope.stockTiles.forEach(function (tile) {
            tile.isInvalid = false;
        });
    };

    $scope.stockGridOptions.onRegisterApi = function (gridApi) {
        // Set gridApi on scope
        $scope.gridApiBaseTiles = gridApi;
        $scope.gridApiBaseTiles.rowEdit.on.saveRow($scope, $scope.saveBaseTileRow);
    };

    function isNewLineNeeded(tiles) {
        try {
            if (tiles.length === 0) {
                return true;
            }

            if (tiles[tiles.length - 1].width || tiles[tiles.length - 1].height || tiles[tiles.length - 1].count || tiles.length < PANELS_ARRAY_MIN_LENGTH) {
                return true;
            }
        } catch (e) {
            console.warn("Error while parsing panels - " + e.stack);
        }
    }


    $scope.removeTile = function (tile) {
        var confirmMsg = $translate.instant('REMOVE') + "?";
        var executedMsg = $translate.instant('REMOVED');

        if (tile.width && tile.height) {
            confirmMsg += "\n" + DimensionProcessor.formatDimensions(tile);
            executedMsg += " - " + DimensionProcessor.formatDimensions(tile);
        }

        if (confirm(confirmMsg) != true) {
            return;
        }
        var index = $scope.tiles.indexOf(tile);
        $scope.tiles.splice(index, 1);
        $scope.validateTilesArray();
        $scope.dirtyData = true;

        ToastService.info(executedMsg);
    };

    $scope.removeStockTile = function (tile) {
        var confirmMsg = $translate.instant('REMOVE') + "?";
        var executedMsg = $translate.instant('REMOVED');

        if (tile.width && tile.height) {
            confirmMsg += "\n" + DimensionProcessor.formatDimensions(tile);
            executedMsg += " - " + DimensionProcessor.formatDimensions(tile);
        }

        if (confirm(confirmMsg) != true) {
            return;
        }
        var index = $scope.stockTiles.indexOf(tile);
        $scope.stockTiles.splice(index, 1);
        $scope.validateStockTilesArray();
        $scope.dirtyData = true;

        ToastService.info(executedMsg);
    };

    $scope.toggleOrientation = function (tile) {
        tile.orientation = ++tile.orientation % 3;

        var msg = $translate.instant('NO_GRAIN');   //'No grain consideration';

        if (tile.orientation == 1) {
            msg = $translate.instant('HORIZONTAL_GRAIN');
        } else if (tile.orientation == 2) {
            msg = $translate.instant('VERTICAL_GRAIN');
        }

        msg += " - " + DimensionProcessor.formatDimensions(tile);
        ToastService.info(msg);

        $scope.dirtyData = true;
    };

    $scope.openEdgeDialog = function(tile) {
        $scope.editEdgeTile = tile;
        $('#edgeModal').modal('show');
    };

    $scope.onCloseEdgeModal = function() {
        $scope.refreshEdgeBandList();
        $('#edgeModal').modal('hide');
    };

    $scope.toggleTile = function (tile) {
        tile.enabled = !tile.enabled;
        $scope.dirtyData = true;

        var msg = tile.enabled == true ? $translate.instant('ENABLED') : $translate.instant('DISABLED');
        if (tile.width && tile.height) {
            msg += " - " + DimensionProcessor.formatDimensions(tile);
        }
        ToastService.info(msg);
    };

    $scope.toggleBaseTile = function (tile) {
        tile.enabled = !tile.enabled;
        $scope.dirtyData = true;

        var msg = tile.enabled == true ? $translate.instant('ENABLED') : $translate.instant('DISABLED');
        if (tile.width && tile.height) {
            msg += " - " + DimensionProcessor.formatDimensions(tile);
        }
        ToastService.info(msg);
    };

    $scope.stopTask = function () {
        TilingService.stopTask();
        $timeout.cancel(self.taskStatusPollerPromise);
        $scope.isBlocked = false;
        $scope.statusMessage = null;
        $scope.isCalculating = false;
        $location.search('taskId', null);
        if (AuthService.isLoggedIn()) {
            AuthService.getAnalyticsData();
        }
    };

    var taskStatusPoller = function (loadRequestData) {
        TilingService.getTaskStatus().then(function (response) {
            var data = response.data;

            // Ensure a valid response was received
            if (data && data.status) {

                // TODO
                if (loadRequestData) {
                    ProjectService.loadProject(data.solution, $scope.tiles, $scope.stockTiles, $scope.cfg)
                }

                if (data.solution && data.solution.mosaics && data.solution.mosaics.length > 0) {
                    $scope.statusMessage = $translate.instant('SEARCHING_BEST');
                    $scope.statusMessage += data.percentageDone > 0 ? ' - ' + data.percentageDone + '%' : '...';
                    $scope.dirtyData = false;
                    if (!$scope.scrolled && window.innerWidth < CutListCfg.breakPoint) {
                        $timeout(function () {
                            $scope.scrollTo('main-content');
                            $scope.scrolled = true;
                        }, 500);
                    }
                } else {
                    $scope.statusMessage = $translate.instant('INITIALIZING');
                    $scope.statusMessage += data.initPercentage > 0 ? ' - ' + data.initPercentage + '%' : '...';
                }
                
                // Enrich status message if we have a valid solution
                if (data.solution && data.solution.mosaics && data.solution.mosaics.length > 0) {
                    if ($scope.isAndroid()) {
                        $scope.statusMessage = $scope.statusMessage + "\n" + $translate.instant('TAP_TO_ACCEPT');
                    } else {
                        $scope.statusMessage = $scope.statusMessage + "\n" + $translate.instant('CLICK_TO_ACCEPT');
                    }
                }

                // Render the retrieved solution but, only if it's not the one already rendered.
                if (TilingData.data.id !== DrawService.renderedSoultionId()) {
                    render();
                } else {
                    console.log("Retrieved solution is the same as currently rendered one");
                }

                // Check if calculation is finished
                if (data.status === 'FINISHED' || data.status === 'TERMINATED' || $scope.requestStatus != 0) {
                    $timeout(function () {
                        $scope.statusMessage = null;
                        $scope.isCalculating = false;
                        $location.search('taskId', null);
                        $scope.isBlocked = false;
                        if (AuthService.isLoggedIn()) {
                            AuthService.getAnalyticsData();
                        }
                    }, 2000);
                } else if (data.status === 'ERROR') {
                    $scope.statusMessage = $translate.instant('SERVER_UNAVAILABLE');
                } else {
                    if ($scope.isCalculating) {
                        self.taskStatusPollerPromise = $timeout(taskStatusPoller, 2000);
                    }
                }
            }
        }, function () {
            $scope.statusMessage = $translate.instant('SERVER_UNAVAILABLE');
            // Reschedule poller and retry until user cancels
            self.taskStatusPollerPromise = $timeout(taskStatusPoller, 2000);
        });
    };

    var taskId = $location.search().taskId;
    if (taskId) {
        TilingService.taskId(taskId);
        $timeout(function () {
            loadTask(taskId);
        }, 1500);
    }

    function loadTask(taskId) {
        $scope.isCalculating = true;
        $location.search('taskId', taskId);
        $scope.isBlocked = true;
        $scope.statusMessage = $translate.instant('INITIALIZING') + '...';

        $scope.requestStatus = 0;
        taskStatusPoller(true);

        // Clean used status from stock tiles
        angular.forEach($scope.stockTiles, function (stockTile) {
            stockTile.isUsed = false;
        });
    }

    $scope.submitTask = function() {

        fetchVersionStatus();
        TilingData.clear();
        DrawService.clear();

        $scope.tiles.forEach(function (tile) {
            // Set count to 1 if none is set
            if (tile.width && tile.height && (tile.count === undefined || tile.count === null)) {
                tile.count = 1;
            }
            if (tile.width && tile.height && tile.count || (tile.width == null && tile.height == null && tile.count == null && tile.label == null)) {
                tile.isInvalid = false;
            }
        });

        $scope.stockTiles.forEach(function (tile) {
            // Set count to 1 if none is set
            if (tile.width && tile.height && (tile.count === undefined || tile.count === null)) {
                tile.count = 1;
            }
            if (tile.width && tile.height && tile.count || (tile.width == null && tile.height == null && tile.count == null && tile.label == null)) {
                tile.isInvalid = false;
            }
        });

        if ($scope.getNbrUsedTiles() === 0) {
            $scope.isGridReloding = true;

            $scope.tiles.forEach(function (tile) {
                tile.isInvalid = true;
            });

            $timeout(function () {
                $scope.isGridReloding = false;
            }, 0);

            ToastService.error($translate.instant('MSG_NO_PANELS'));
        }

        if ($scope.getNbrUsedStockTiles() === 0) {
            $scope.isGridReloding = true;

            $scope.stockTiles.forEach(function (tile) {
                tile.isInvalid = true;
            });

            $timeout(function () {
                $scope.isGridReloding = false;
            }, 0);

            ToastService.error($translate.instant('MSG_NO_STOCK_PANELS'));
        }

        if ($scope.getNbrUsedTiles() !== 0 && $scope.getNbrUsedStockTiles() !== 0
            && getSmallestArea($scope.tiles) > getBiggestArea($scope.stockTiles)) {
            if (confirm("Unable to fit specified panels on available stock sheets. Required panels are bigger than stock sheets!\n" +
                "Are the specified dimensions misplaced? Should panel list be swapped with the stock sheet list?") === true) {
                let tilesBak = $scope.tiles.slice();

                $scope.tiles.length = 0;
                [].push.apply($scope.tiles, $scope.stockTiles);

                $scope.stockTiles.length = 0;
                [].push.apply($scope.stockTiles, tilesBak);
            }
        }

        // Check if there are tiles with no corresponding stock material
        if ($scope.cfg.isMaterialEnabled) {
            var noStockMaterialTiles = MaterialService.getNoStockMaterialTiles($scope.tiles, $scope.stockTiles);
            if (noStockMaterialTiles.length > 0) {
                var msg = $translate.instant('MSG_NO_STOCK_MATERIAL') + ': ';
                noStockMaterialTiles.forEach(function (tile) {
                    msg += DimensionProcessor.formatDimensions(tile);
                    if (tile.material) {
                        msg += ' (' + tile.material + ')';
                    }
                    msg += ' \\ ';
                });
                msg = msg.substring(0, msg.length - 3);   // Remove last separator
                ToastService.error(msg);
            }
        }

        if ($scope.getNbrUsedTiles() === 0 || $scope.getNbrUsedStockTiles() === 0) {
            return;
        }

        $scope.isCalculating = true;
        $scope.statusMessage = $translate.instant('INITIALIZING') + '...';

        TilingService.submitTask($scope.tiles, $scope.stockTiles, $scope.cfg).then( function (response) {
            $scope.requestStatus = response.data.statusCode;
            $location.search('taskId', response.data.taskId);
            $scope.scrolled = false;
            $timeout(taskStatusPoller, 2000);
        }, function (reason) {
            if (reason.status === 402) {
                if (!AuthService.isLoggedIn()) {
                    $scope.isCalculating = false;
                    $scope.statusMessage = null;
                    $scope.showLoginModal();
                    return;
                }

                // If we still have the indication that subscription is active, fetch it's refreshed data from server.
                if (SubscriptionService.getActiveSubscriptionPlanLevel() !== 0) {
                    SubscriptionService.getSubscription();
                }

                console.warn("Calculation was rejected because calculation thresholds were exceeded");
                ClientInfo.executionThresholdExceeded = true;
                $scope.statusMessage = $translate.instant('LIMITS_REACHED');
                $timeout(function () {
                    $scope.isCalculating = false;
                    $scope.statusMessage = null;
                    $scope.showSubscriptionModal();
                }, 5000);

            } else if (reason.status === 422) {
                if (reason.data.statusCode === "5") {
                    $scope.statusMessage = $translate.instant('TOO_MANY_PANELS');
                    $scope.tiles.forEach(function (tile) {
                        tile.isInvalid = true;
                    });
                } else if (reason.data.statusCode === "6") {
                    $scope.statusMessage = $translate.instant('TOO_MANY_STOCK_PANELS');
                    $scope.stockTiles.forEach(function (tile) {
                        tile.isInvalid = true;
                    });
                }
            } else if (reason.status === 429) {
                $scope.statusMessage = $translate.instant('TASK_ALREADY_RUNNING');
                TilingService.getRunningTaksIds().then(function (taskIds) {
                    if (taskIds && taskIds[0]) {
                        $scope.statusMessage = $scope.statusMessage + ' - <a href="?taskId=' + taskIds[0] + '" target="_blank">' + $translate.instant('OPEN_RUNNING_CALC') + '</a>';
                    }
                });
                return;
            } else if (typeof android === 'undefined') {
                console.error("Calculation request failed\n" + JSON.stringify(reason));
                $scope.statusMessage = $translate.instant('SERVER_UNAVAILABLE');
            } else {
                // We're running on an Android device
                $scope.isCalculating = false;
                $scope.statusMessage = null;
            }
        });
    };

    function refreshPanelLabels() {

        if (!TilingData.data || !TilingData.mosaics) {
            return;
        }

        // Loop through all solution mosaics and update its labels
        TilingData.mosaics.forEach( function (mosaic) {
            // Loop through all tiles
            mosaic.tiles.forEach( function (tile) {
                $scope.tiles.forEach( function (stockTile) {
                    if (stockTile.id === tile.requestObjId) {
                        tile.label = stockTile.label;
                    }
                });
            });
            // Loop through all used stock sheets
            $scope.stockTiles.forEach( function (stockTile) {
                if (stockTile.id === mosaic.requestStockId) {
                    mosaic.stockLabel = stockTile.label;
                }
            });
            // Loop through all resulting panels
            mosaic.panels.forEach( function (panel) {
                $scope.tiles.forEach( function (tile) {
                    if (tile.id === panel.requestObjId) {
                        panel.label = tile.label;
                    }
                });
            });
        });

        // Update panels on the solution data
        TilingData.data.panels.forEach( function (panel) {
            // Loop through all workspace panels
            $scope.tiles.forEach( function (tile) {
                if (tile.id == panel.requestObjId) {
                    panel.label = tile.label;
                }
            });
        });

        // Update used stock panels on the solution data
        TilingData.data.usedStockPanels.forEach( function (panel) {
            // Loop through all workspace stock sheets
            $scope.stockTiles.forEach( function (tile) {
                if (tile.id == panel.requestObjId) {
                    panel.label = tile.label;
                }
            });
        });

        // Update no fit panels on the solution data
        TilingData.data.noFitPanels.forEach( function (panel) {
            // Loop through all workspace panels
            $scope.tiles.forEach( function (tile) {
                if (tile.id == panel.id) {
                    panel.label = tile.label;
                }
            });
        });
    }
    
    $scope.render = render;

    function render() {

        try {
            let grecaptchaBadge = $(".grecaptcha-badge");
            if (grecaptchaBadge.length !== 0) {
                grecaptchaBadge[0].classList.add("fade-out");
                $timeout(function () {
                    let grecaptchaBadge = $(".grecaptcha-badge");
                    if (grecaptchaBadge.length !== 0) {
                        grecaptchaBadge[0].remove();
                    }
                }, 5000);
            }
        } catch (e) {
            console.error("Error hiding reCAPTCHA badge:\n" + e.name + "\n" + e.stack);
        }

        // Mark used stock tiles
        if (TilingData.data) {
            // Clean used status from stock tiles
            angular.forEach($scope.stockTiles, function (stockTile) {
                stockTile.isUsed = false;
            });
            // Loop through all mosaics for this solution
            angular.forEach(TilingData.mosaics, function (mosaic, index) {
                angular.forEach($scope.stockTiles, function (stockTile) {
                    if (stockTile.id == mosaic.tiles[0].requestObjId) {
                        stockTile.isUsed = true;
                    }
                });
            });
        }

        // Check whether to stack or not panels with same layout
        if ($scope.cfg.stackEqualMosaicLayout === 0) {
            if (TilingData.data && TilingData.data.maxGroupOcurrences > 2 && TilingData.data.mosaics.length > 5) {
                TilingData.shouldGroupEqualMosaics = true;
            } else {
                TilingData.shouldGroupEqualMosaics = false;
            }
        } else if ($scope.cfg.stackEqualMosaicLayout === 1) {
            TilingData.shouldGroupEqualMosaics = true;
        } else if ($scope.cfg.stackEqualMosaicLayout === 2) {
            TilingData.shouldGroupEqualMosaics = false;
        }

        $scope.visibleTileInfoIdx = 0;

        $timeout(function () {
            DrawService.render();
        });
    }

    $scope.clear = function () {

        if (!$scope.confirmUnsavedChanges()) {
            return;
        }

        $scope.currentProject = {
            name: null,
            isSaving: false,
            isEditName: false
        };
        resetTiles();
        resetStockTiles();
        TilingData.clear();
        DrawService.clear();
        $scope.validateTilesArray();
        $scope.validateStockTilesArray();
        $("html,body").animate({scrollTop: 0}, "slow");
        // Workaround for setting isDirty to false
        // Wait be fore setting isDirty to false so that project has enough time to load
        $timeout(function () {
            $scope.currentProject.isDirty = false;
        }, 2000);
    };

    $scope.dataToUrl = function () {
        $location.search('tiles', JSON.stringify($scope.tiles));
        $location.search('stockTiles', JSON.stringify($scope.stockTiles));
        $location.search('cfg', JSON.stringify($scope.cfg));
        $location.search('compute', true);
    };

    function getGenericExportGeneratedFilename() {
        var today = new Date();
        var filename ='';
        filename += today.getFullYear().toString();
        filename += '-' + ("0" + (today.getMonth() + 1).toString()).slice(-2);
        filename += '-' + ("0" + today.getDate().toString()).slice(-2);
        filename += '_' + ("0" + today.getHours().toString()).slice(-2);
        filename += '' + ("0" + today.getMinutes().toString()).slice(-2);
        filename += '' + ("0" + today.getSeconds().toString()).slice(-2);
        return filename;
    }

    $scope.exportToPdf = function () {

        $('#exportPdfModal').modal('hide');
        $scope.isBlocked = true;
        $("html,body").animate({scrollTop: 0}, "slow");

        if ($scope.isAndroid()) {
            android.showProgressDialog($translate.instant('EXPORTING_PDF') + '...');
        } else {
            $scope.statusMessage = $translate.instant('EXPORTING_PDF') + '...';
        }

        $scope.isPdfExporting = true;

        $timeout(function () {
            PdfGenerator.generate(
                function (doc) {

                    if (typeof android !== 'undefined') {
                        const pdfData = doc.output('dataurlstring');
                        android.savePdf(pdfData, $scope.fileNameToDownload + ".pdf");
                        android.dismissProgressDialog();
                    } else {
                        doc.save($scope.fileNameToDownload + ".pdf");
                    }

                    AnalyticsService.uploadPdf(doc.output('dataurlstring'), TilingData.data.taskId);

                    console.info("PDF saved as " + $scope.fileNameToDownload + ".pdf");

                    $scope.statusMessage = null;
                    $scope.isBlocked = false;
                    $scope.isPdfExporting = false;

                    // PDF canvas elements can have messed up layout
                    $timeout(function () {
                        resetViewport();
                    });
                },
                function (percentage) {
                    // Show dialog on android instead of modal
                    if (typeof android !== 'undefined') {
                        android.showProgressDialog($translate.instant('EXPORTING_PDF') + ' - ' + percentage + '%');
                    } else {
                        $scope.statusMessage = $translate.instant('EXPORTING_PDF') + ' - ' + percentage + '%';
                    }
                });
        }, 1000);
    };

    $scope.showExportPdfModal = function () {

        // Ensure there's something to export
        if (!TilingData.mosaics.length) {
            ToastService.error($translate.instant('NOTHING_TO_EXPORT'));
            return;
        }

        if ($scope.currentProject.name && $scope.lastSavedFile.projectId !== $scope.currentProject.id) {
            $scope.fileNameToDownload = $scope.currentProject.name;
            $scope.lastSavedFile.projectId = $scope.currentProject.id;
        } else if (!$scope.fileNameToDownload) {
            $scope.fileNameToDownload = 'cutlistoptimizer_' + getGenericExportGeneratedFilename();
        }

        $('#exportPdfModal').modal('show');
        if (!$scope.isAndroid()) {
            // Don't focus the text field on Android so that the keyboard won't ovelap modal
            $timeout(function () {
                var input = document.getElementById('pdfFileNameToDownload');
                input.focus();
                input.select();
            }, 500);
        }
    };

    $scope.exportToImg = function () {

        $('#exportImgModal').modal('hide');
        $scope.isBlocked = true;

        if ($scope.isAndroid()) {
            android.showProgressDialog($translate.instant('EXPORTING_IMG') + '...');
        } else {
            $scope.statusMessage = $translate.instant('EXPORTING_IMG') + '...';
        }

        $timeout(
            function () {
                ImageGenerator.generate(function(imgData) {

                    if (typeof android !== 'undefined') {
                        android.saveImage(imgData, $scope.fileNameToDownload + ".jpeg");
                        android.dismissProgressDialog();
                    } else {
                        download(imgData, $scope.fileNameToDownload + ".jpeg", "image/jpeg");
                    }

                    console.info("Image saved as " + $scope.fileNameToDownload + ".jpeg");

                    $scope.statusMessage = null;
                    $scope.isBlocked = false;
                });
            }
        );
    };

    $scope.showExportImgModal = function () {

        // Ensure there's something to export
        if (!TilingData.mosaics.length) {
            ToastService.error($translate.instant('NOTHING_TO_EXPORT'));
            return;
        }

        if ($scope.currentProject.name && $scope.lastSavedFile.projectId !== $scope.currentProject.id) {
            $scope.fileNameToDownload = $scope.currentProject.name;
            $scope.lastSavedFile.projectId = $scope.currentProject.id;
        } else if (!$scope.fileNameToDownload) {
            $scope.fileNameToDownload = 'cutlistoptimizer_' + getGenericExportGeneratedFilename();
        }

        $('#exportImgModal').modal('show');
        if (!$scope.isAndroid()) {
            // Don't focus the text field on Android so that the keyboard won't ovelap modal
            $timeout(function () {
                var input = document.getElementById('imgFileNameToDownload');
                input.focus();
                input.select();
            }, 500);
        }
    };

    $scope.isPdfExporting = false;
    
    $scope.range = function (n) {
        if (isNaN(n)) {
            n = 0;
        }
        return new Array(n);
    };

    $scope.isModalVisible = false;  // Whether if a modal dialog is visible or not

    function validateLogin() {
        if (AuthService.isLoggedIn()) {
            return true;
        } else {
            alert($translate.instant('LOGIN_REQUEST'));
            $scope.showLoginModal();
            return false;
        }
    }
    $scope.validateLogin = validateLogin;

    function showSubscriptionAlertAndModal() {
        alert($translate.instant('SUBSCRIPTION_REQUEST'));

        if (!AuthService.isLoggedIn()) {
            $scope.showLoginModal();
        } else {
            $scope.showSubscriptionModal();
        }
    }
    $scope.showSubscriptionAlertAndModal = showSubscriptionAlertAndModal;

    function validateSubscriptionFeature() {
        if (ClientInfo.hasActiveSubscription() || $scope.isFull) {
            return true;
        } else {
            // showSubscriptionAlertAndModal();
            $scope.donate();
            return false;
        }
    }
    $scope.validateSubscriptionFeature = validateSubscriptionFeature;

    $scope.showSaveProjectModal = function () {

        if (self.isAndroid && !validateSubscriptionFeature()) {
            return;
        }

        if (!validateLogin()) {
            return;
        }

        //ProjectService.loadSavedProjects();
        $('#saveProjectModal').modal('show');
        $timeout(function () {
            var input = document.getElementById('projectToSaveKey');
            input.focus();
            input.select();
        }, 500);
    };

    $scope.showLoadProjectModal = function () {

        const hasLocalStorageSavedProjects = CutListCfg.useLocalStorageAsRepository && ProjectService.projects && ProjectService.projects.length > 0;

        if (self.isAndroid && !hasLocalStorageSavedProjects && !validateSubscriptionFeature()) {
            return;
        }

        if (!hasLocalStorageSavedProjects && !validateLogin()) {
            return;
        }

        // Scroll to top as workaround for issue with project options menu positioning
        $("html,body").animate({scrollTop: 0}, "slow");

        if ((!ProjectService.projects || ProjectService.projects.length === 0) && ClientInfo.email) {
            // Block and load projects from server before opening load project modal
            $scope.isBlocked = true;
            ProjectService.loadSavedProjects().then(function () {
                $('#loadProjectModal').modal('show');
                $scope.isBlocked = false;
            }, function (reason) {
                ToastService.error($translate.instant('SERVER_UNAVAILABLE'));
                $scope.isBlocked = false;
            });
        } else {
            ProjectService.loadSavedProjects();
            $('#loadProjectModal').modal('show');
        }
    };

    $scope.openSettingsModal = function () {
        $('#settingsModal').modal('show');
    };

    $scope.showSubscriptionModal = function () {
        if (!validateLogin()) {
            console.info("Tried to open subscription modal without login");
            return;
        }
        console.info("Opening subscription modal - countryIsoCode[" + ClientInfo.countryIsoCode + "]");
        $scope.subscriptionService.plan = null;
        $('#subscriptionModal').modal('show');
    };

    $scope.showInvoiceModal = function () {
        if (!validateLogin()) {
            console.warn("Tried to open invoice modal without login");
            return;
        }
        console.info("Opening invoice modal...");
        $('#invoiceModal').modal('show');
    };

    $scope.donate = function () {
        if ($scope.isAndroid()) {
            android.setUserAccessToken(ClientInfo.accessToken);
            android.donate();
        }
    };

    $scope.createMaterial = function() {

        var newMaterial = $scope.editTile.material;
        var isAlreadyExists = false;

        // Check if new material already exists
        $scope.materialTypes.forEach(function(material) {
            if (material.id === newMaterial) {
                isAlreadyExists = true;
                return;
            }
        });

        if (isAlreadyExists) {
            // Don't touch the id, tile will use the existing material.
            alert('"' + newMaterial + '"\n' + $translate.instant('ALREADY_EXISTS') + '!');
        } else {

            // Remove the 'add' option, we'll readd to the end of the list.
            $scope.materialTypes.splice(-1, 1);

            // Add the new edge band
            $scope.materialTypes.push({id: newMaterial, label: newMaterial});

            // Readd the 'add' option and the bottom of the list
            $scope.materialTypes.push({
                id: Number.POSITIVE_INFINITY,
                label: '- ' + $translate.instant('ADD_NEW') + ' -'
            });
        }

        $scope.editTile = null;

        $('#createMaterialModal').modal('hide');
    };

    $scope.createEdgeBand = function() {

        var newEdgeBand = $scope.editTile.edge[$scope.editEdge];
        var isAlreadyExists = false;

        // Check if new edge band type already exists
        $scope.edgeBandingList.forEach(function(edgeBand) {
            if (edgeBand.id === newEdgeBand) {
                isAlreadyExists = true;
                return;
            }
        });

        if (isAlreadyExists) {
            // Don't touch the id, edge will use the existing band type.
            alert('"' + newEdgeBand + '"\n' + $translate.instant('ALREADY_EXISTS') + '!');
        } else {
            // Remove the 'add' option, we'll readd to the end of the list.
            $scope.edgeBandingList.splice(-1, 1);

            // Add the new edge band
            $scope.edgeBandingList.push({ id: newEdgeBand, label: newEdgeBand });

            // Readd the 'add' option and the bottom of the list
            $scope.edgeBandingList.push({id: Number.POSITIVE_INFINITY, label: '- ' + $translate.instant('ADD_NEW') + ' -'});
        }

        $('#createEdgeBandModal').modal('hide');
    };

    $scope.isTileOptionsShown = function(tile) {
        return tile.width || tile.height || tile.count
            || tile.material || tile.label
            || (tile.edge && (tile.edge.top || tile.edge.left|| tile.edge.bottom || tile.edge.right)) ;
    };

    $scope.exportProject = function() {
        CsvHandler.exportProject($scope.tiles, $scope.stockTiles, $scope.cfg, getGenericExportGeneratedFilename() + '.txt');
    };

    $scope.importProject = function() {
        // Create temporary file DOM element for showing the open file dialog
        // Element will be removed on the file select callback
        var divElement = angular.element(document.getElementById('tmp'));
        $scope.tmpHtmlElement = angular.element('<input type="file" accept=".txt" ng-project-select="onFileSelect($files)" >');
        divElement.append($scope.tmpHtmlElement);
        $compile(divElement)($scope);
        $timeout(function () {
            $scope.tmpHtmlElement[0].click();
        });
    };

    $scope.isFull = $window.localStorage.getItem("isFull") === 'true';

    $scope.setToFull = function () {
        $scope.isFull = true;
        $window.localStorage.setItem("isFull", $scope.isFull);
    };

    function fetchVersionStatus() {
        if (typeof android !== 'undefined') {
            $timeout(function () {
                const isFullResult = android.isFull();
                if (!isFullResult && $scope.isFull) {
                    console.warn("Previous app status was set to full but received response otherwise");
                }
                $scope.isFull = isFullResult;
                $window.localStorage.setItem("isFull", $scope.isFull);
            }, 5000);
        }
    }
    fetchVersionStatus();

    if (typeof android !== 'undefined') {
        $scope.android = android;
    }

    if (AuthService.isLoggedIn()) {
        AuthService.getUserInfo().then(function () {
            $scope.saveLocalData2Server();
        });
    }

    $scope.validateTilesArray();
    $scope.validateStockTilesArray();
    $scope.refreshMaterialsList();
    $scope.refreshEdgeBandList();
    DimensionProcessor.sanitizePanelListDimensions($scope.tiles);
    DimensionProcessor.sanitizePanelListDimensions($scope.stockTiles);

    $scope.debugMode = $window.localStorage.getItem("debugMode");
    $scope.debugMode = $scope.debugMode === 'true';

    function resetViewport() {
        render();
        $timeout(function () {
            setupTilesGrid();
            setupStockTilesGrid();
        });

        if (window.innerWidth < CutListCfg.breakPoint) {
            $('#left-sidebar').css("width", '');
            $('#left-sidebar').css("height", '');
            $('#main-content').css("width", '');
            $('#block-message').css("width", '');
        } else if (($scope.lastWindowInnerWidth || 0) < CutListCfg.breakPoint) {
            // Window xs size threshold was crossed
            // Restore sidebar width from localstorage
            var sidebarWidth = $window.localStorage.getItem("sidebarWidth");
            if (sidebarWidth) {
                setSidebarWidth(sidebarWidth);
            }
        }

        $scope.lastWindowInnerWidth = window.innerWidth;

        $scope.isMobile = window.innerWidth < 768;

        adjustViewportHeight();
    }

    /**
     * Handle window resizing
     */
    angular.element($window).bind('resize', function () {
        resetViewport();
    });
    $scope.isMobile = window.innerWidth < 768;

    function setSidebarWidth(widthPercentage) {

        var contentWidthPercentage = 100 - widthPercentage;

        $('#left-sidebar').css("width", widthPercentage + '%');
        $('#main-content').css("width", contentWidthPercentage + '%');

        document.getElementById('block-message').style.width = (widthPercentage - 4) + '%';

        $scope.gridApi.core.handleWindowResize();
        $scope.gridApiBaseTiles.core.handleWindowResize();

        setupTilesGrid();
        setupStockTilesGrid();

        DrawService.render();
    }

    $timeout(function () {
        $('#split-bar').mousedown(function (e) {
            e.preventDefault();
            $(document).mousemove(function (e) {
                var min = 250;
                var max = window.innerWidth - 250;
                e.preventDefault();
                var x = e.pageX - $('#left-sidebar').offset().left;
                if (x > min && x < max) {

                    var widthPercentage = (x / window.innerWidth) * 100;
                    setSidebarWidth(widthPercentage);

                    // Store new width percentage on localstorage
                    $window.localStorage.setItem("sidebarWidth", widthPercentage);
                }
            })
        });
        $(document).mouseup(function (e) {
            $(document).unbind('mousemove');
        });

        // Restore sidebar width from localstorage
        let localStoragesidebarWidth = $window.localStorage.getItem("sidebarWidth");
        if (localStoragesidebarWidth && window.innerWidth > CutListCfg.breakPoint) {
            setSidebarWidth(localStoragesidebarWidth);
        }

        // Initialize block-message width according to sidbar width
        let sidebarWidthPerc = parseInt($('#left-sidebar').css("width"), 10) / window.innerWidth * 100;
        document.getElementById('block-message').style.width = (sidebarWidthPerc - 4) + '%';

        adjustViewportHeight();
    });

    function adjustSideBarHeight() {
        const body = document.body;
        const html = document.documentElement;

        // Adjust sidebar height to match the document height change caused by the diagram image
        $timeout(function () {
            currentHeight = parseInt($('#left-sidebar').css("height"), 10);
            var newHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
            if (newHeight > currentHeight) {
                $('#left-sidebar').css("height", newHeight);
            }
        });
    }
    
    function adjustViewportHeight() {
        $timeout(function () {
            if (window.innerWidth > 990) {
                const offset = $('#navbar').outerHeight();
                const viewportHeightMinusNavbar = "calc(100vh - " + offset + "px)";
                $('#main-container').css("height", viewportHeightMinusNavbar);
                document.getElementById('left-sidebar').style.height = viewportHeightMinusNavbar;
                document.getElementById('svg-canvas-container').style.height = viewportHeightMinusNavbar;
                document.getElementById('right-sidebar').style.height = viewportHeightMinusNavbar;
                document.getElementById('left-sidebar-block-bg').style.height = document.getElementById('left-sidebar').scrollHeight + 'px';
            } else {
                document.getElementById('svg-canvas-container').style.height = document.getElementById('svg-canvas').clientHeight + 'px';
                document.getElementById('left-sidebar-block-bg').style.height = '100%';
                if (window.innerWidth > 768) {
                    adjustSideBarHeight();
                }
            }
        });
    }

    $scope.saveLocalData2ServerInProgress = false;
    $scope.saveLocalData2Server = function () {

        if ($scope.saveLocalData2ServerInProgress) {
            return;
        }

        if (CutListCfg.useLocalStorageAsRepository) {
            $scope.saveLocalData2ServerInProgress = true;
            ProjectService.saveLocalProjects2Server().then(function () {
                PanelListService.saveLocalPanelLists2Server().then(function () {
                    localStorage.setItem("useLocalStorageAsRepository", false);
                    CutListCfg.useLocalStorageAsRepository = false;
                    console.info("Using server as repository from now on");
                });
            });
        }
    };

    $(window).on('shown.bs.modal', function(e) {
        if (typeof android !== 'undefined' && !$scope.isFull && !ClientInfo.hasActiveSubscription()) {
            android.onModalOpen(e && e.target && e.target.id);
        }
        $timeout(function () {
            $scope.isModalVisible = true;
        }, 0);
    });

    $(window).on('hidden.bs.modal', function(e) {
        if (typeof android !== 'undefined') {
            android.onModalClose(e && e.target && e.target.id);
        }
        $timeout(function () {
            $scope.isModalVisible = false;
        }, 0);
    });

    $scope.isAdBannerVisible = false;

    // <editor-fold defaultstate="collapsed" desc="Save to localStorage">
    $interval( function() { saveDataLocalStorage(); }, 60000);

    // Save data to localStorage on page unload
    $(window).on('beforeunload', function () { saveDataLocalStorage(); });

    function saveDataLocalStorage() {
        try {
            $scope.cfg.svgTransform = DrawService.transform();

            $window.localStorage.setItem("cfg" + localStorageKeySuffix, JSON.stringify($scope.cfg));

            $window.localStorage.setItem("currentProject", JSON.stringify($scope.currentProject));

            $window.localStorage.setItem("diagramCfg", JSON.stringify(DrawService.cfg()));

            $window.localStorage.setItem("isTilesGridCollapsed" + localStorageKeySuffix, JSON.stringify($scope.isTilesGridCollapsed));
            $window.localStorage.setItem("isStockGridCollapsed" + localStorageKeySuffix, JSON.stringify($scope.isStockGridCollapsed));
            $window.localStorage.setItem("isBaseOptionsCollapsed" + localStorageKeySuffix, JSON.stringify($scope.isBaseOptionsCollapsed));
            $window.localStorage.setItem("isDisplayOptionsCollapsed" + localStorageKeySuffix, JSON.stringify($scope.isDisplayOptionsCollapsed));

            $window.localStorage.setItem("isAdvancedOptionsCollapsed" + localStorageKeySuffix, JSON.stringify($scope.isAdvancedOptionsCollapsed));
            $window.localStorage.setItem("isTilingInfoVisible" + localStorageKeySuffix, JSON.stringify($scope.isTilingInfoVisible));

            $window.localStorage.setItem("pdfGeneratorCfg", JSON.stringify(PdfGenerator.cfg));

            try {
                $window.localStorage.setItem("tiles" + localStorageKeySuffix, LZString.compressToUTF16(JSON.stringify($scope.tiles)));
            } catch (e) {
                console.warn("Unable to save compressed panel data to localStorage, will store as is - " + e.message);
                try {
                    $window.localStorage.setItem("tiles" + localStorageKeySuffix, JSON.stringify($scope.tiles));
                } catch (e) {
                    if (e.name === 'QuotaExceededError') {
                        $window.localStorage.removeItem("tiles" + localStorageKeySuffix);
                        console.warn("Unable to save panel data to localStorage - " + e.message);
                    } else {
                        console.error("Error saving panel data to localStorage:\n" + e.stack);
                    }
                }
            }

            try {
                $window.localStorage.setItem("baseTiles" + localStorageKeySuffix, LZString.compressToUTF16(JSON.stringify($scope.stockTiles)));
            } catch (e) {
                console.warn("Unable to save compressed stock panel data to localStorage, will store as is - " + e.message);
                try {
                    $window.localStorage.setItem("baseTiles" + localStorageKeySuffix, JSON.stringify($scope.stockTiles));
                } catch (e) {
                    if (e.name === 'QuotaExceededError') {
                        $window.localStorage.removeItem("baseTiles" + localStorageKeySuffix);
                        console.warn("Unable to save stock panel data to localStorage - " + e.message);
                    } else {
                        console.error("Error saving stock panel data to localStorage:\n" + e.stack);
                    }
                }
            }

            try {
                $window.localStorage.setItem("data" + localStorageKeySuffix, LZString.compressToUTF16(JSON.stringify(TilingData.data)));
            } catch (e) {
                console.warn("Unable to save compressed solution data to localStorage, will store as is - " + e.message);
                try {
                    $window.localStorage.setItem("data" + localStorageKeySuffix, JSON.stringify(TilingData.data));
                } catch (e) {
                    if (e.name === 'QuotaExceededError') {
                        $window.localStorage.removeItem("data" + localStorageKeySuffix);
                        console.warn("Unable to save solution data to localStorage - " + e.message);
                    } else {
                        console.error("Error saving solution data to localStorage:\n" + e.stack);
                    }
                }
            }

        } catch (e) {
            console.error("Error saving data to localStorage:\n" + e.name + "\n" + e.stack);
        }
    }
    // </editor-fold>

    $scope.getSubscriptionMailHref = function() {

        if (!ClientInfo) {
            return "mailto:support+invoice@cutlistoptimizer.com?subject=CutList Optimizer Invoice";
        }

        var href = "mailto:support+invoice@cutlistoptimizer.com" +
            "?subject=CutList Optimizer " + ClientInfo.version + " | " +
            "Invoice for " + ClientInfo.id;

        if (ClientInfo.hasActiveSubscription()) {
            href += " | " + SubscriptionService.getSubscriptionPlanLevelName() + " subscription " + ClientInfo.subscription.id;
        }

        href += "&body=<please specify your billing details to be included in the invoice>";

        return href;
    }

    $scope.formatDate = function (date, includeTime) {
        var format;

        try {
            format = getLocaleDateString();
        } catch (e) {
            format = 'dd/MM/yyyy';
        }

        if (includeTime) {
            format += ' HH:mm';
        }
        return $filter('date')(date, format);
    }

    function getSmallestArea(tiles) {
        let smallestArea = Number.MAX_SAFE_INTEGER;
        tiles.forEach(function(tile) {
            if (tile.width && tile.height) {
                let tileWidth = DimensionProcessor.parseDimension(tile.width);
                let tileHeight = DimensionProcessor.parseDimension(tile.height);
                if (tileWidth * tileHeight < smallestArea) {
                    smallestArea = tileWidth * tileHeight;
                }
            }
        });
        return smallestArea;
    }

    function getBiggestArea(tiles) {
        let biggestArea = 0;
        tiles.forEach(function(tile) {
            if (tile.width && tile.height) {
                let tileWidth = DimensionProcessor.parseDimension(tile.width);
                let tileHeight = DimensionProcessor.parseDimension(tile.height);
                if (tileWidth * tileHeight > biggestArea) {
                    biggestArea = tileWidth * tileHeight;
                }
            }
        });
        return biggestArea;
    }
});

app.service('CutListCfg', ['$location',
    function($location) {

    this.localBaseUrl = $location.protocol() + '://'+ $location.host() +':'+  $location.port();
    this.absUrl = $location.absUrl().split('?')[0];

    // Set correct URIs for Android
    if (typeof android !== "undefined") {
        this.localBaseUrl = "https://www.cutlistoptimizer.com";
        this.absUrl = "https://www.cutlistoptimizer.com";
    }

    this.useLocalStorageAsRepository = JSON.parse(localStorage.getItem("useLocalStorageAsRepository"));
    if (this.useLocalStorageAsRepository !== false && typeof android !== "undefined") {
        this.useLocalStorageAsRepository = true;
    }
    console.info((this.useLocalStorageAsRepository ? "LocalStorage" : "Server") + " will be used as repository");

    this.breakPoint = 768;

    this.defaultCutThickness = 0;
    this.defaultIsTileLabelVisible = false;

    this.isEdgeBandingSupported = true;
    this.isGrainDirectionSupported = true;
    this.isMaterialSupported = true;

    // Assume we're running on a debug environment if running on a high port number
    if ($location.port() > 10000) {
        // Use localhost for debugging purposes
        this.localBaseUrl = "http://localhost:8088";
    }

    this.init = function(cfg) {
        cfg.hasEdgeBanding = this.isEdgeBandingSupported ? cfg.hasEdgeBanding : false;
        cfg.considerOrientation = this.isGrainDirectionSupported ? cfg.considerOrientation : false;
        cfg.isMaterialEnabled = this.isMaterialSupported ? cfg.isMaterialEnabled : false;
    };
}]);
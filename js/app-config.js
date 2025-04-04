app.config(['$translateProvider', '$windowProvider', '$qProvider', '$locationProvider', '$httpProvider',
    function($translateProvider, $windowProvider, $qProvider, $locationProvider, $httpProvider) {

    var $window = $windowProvider.$get();
    var language = $window.localStorage.getItem("language");

    if (language === null) {
        language = window.navigator.userLanguage || window.navigator.language;
        language = language.substring(0, 2);
    }

    $translateProvider.translations('bg', translationsBG);
    $translateProvider.translations('en', translationsEN);
    $translateProvider.translations('de', translationsDE);
    $translateProvider.translations('pl', translationsPL);
    $translateProvider.translations('pt', translationsPT);
    $translateProvider.translations('fa', translationsFA);
    $translateProvider.translations('fr', translationsFR);
    $translateProvider.translations('ua', translationsUA);
    $translateProvider.translations('es', translationsES);
    $translateProvider.translations('he', translationsHE);
    $translateProvider.translations('hr', translationsHR);
    $translateProvider.translations('it', translationsIT);
    $translateProvider.translations('nl', translationsNL);
    $translateProvider.translations('ru', translationsRU);
    $translateProvider.translations('tr', translationsTR);
    $translateProvider.translations('ja', translationsJA);
    $translateProvider.translations('zh', translationsZH);
    $translateProvider.preferredLanguage(language);
    $translateProvider.fallbackLanguage('en');
    $translateProvider.useSanitizeValueStrategy('sanitizeParameters');

    $qProvider.errorOnUnhandledRejections(false);

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

    $httpProvider.interceptors.push('httpRequestInterceptor');
    $httpProvider.interceptors.push('httpResponseInterceptor');
}]);


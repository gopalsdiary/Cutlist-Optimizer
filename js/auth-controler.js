app.controller('LoginControler', ['$scope', 'CutListCfg', '$location', 'AuthService', '$timeout', '$window', 'ToastService', 'ProjectService', 'PanelListService', '$translate', 'gRecaptcha',
    function($scope, CutListCfg, $location, AuthService, $timeout, $window, ToastService, ProjectService, PanelListService, $translate, gRecaptcha) {

    $scope.cutListCfg = CutListCfg;

    $scope.isLoading = false;

    $scope.message = null;

    gRecaptcha.initialize({key: '6Ld4B2QpAAAAADFuJZhptKcS0UQsd3T-AmWJNJgV'});

    $scope.login = function () {
        $scope.isLoading = true;
        AuthService.login($scope.username, $scope.password)
            .then(function (response) {
                hideAllAuthModals();
                $location.url($location.path());    // Clear query parameters
                AuthService.getUserInfo().then( function () {
                    $scope.saveLocalData2Server();
                });
            }, function (response) {
                $scope.message = response.data && response.data.error_description || $translate.instant('SERVER_UNAVAILABLE');
                $('#sign-in-message').show();
                $scope.isLoading = false;
            });
    };

    $scope.loginWithGoogle = function () {
        if (typeof android === "undefined") {
            $scope.isLoading = true;
            $window.location.href = '/login/oauth2';
        } else {
            android.signinWithGoogle();
        }
    };

    $scope.register = function () {
        $scope.isLoading = true;
        function register(retryCount) {
            gRecaptcha.execute({action: 'SIGNUP'})
                .then(function (token) {
                    AuthService.register($scope.username, $scope.password, $scope.passwordConfirmation, token).then(function (response) {
                        hideAllAuthModals();
                        ToastService.info(response.data.message);
                    }, function (response) {
                        if (response.status === 405 && retryCount < 3) {
                            $timeout(function () {
                                register(retryCount + 1);
                            }, 2000);
                        } else {
                            $scope.message = response.data && response.data.message || $translate.instant('SERVER_UNAVAILABLE');
                            $('#sign-up-message').show();
                            $scope.isLoading = false;
                        }
                    });
                });
        }
        register(0);
    };

    $scope.submitResetPassword = function() {
        $scope.isLoading = true;
        function submitResetPassword(retryCount) {
            gRecaptcha.execute({action: 'PASSWORD_RESET'})
                .then(function (token) {
                    AuthService.submitResetPassword($scope.username, token).then(function (response) {
                        hideAllAuthModals();
                        ToastService.info(response.data.message);
                    }, function (response) {
                        if (response.status === 405 && retryCount < 3) {
                            $timeout(function () {
                                submitResetPassword(retryCount + 1);
                            }, 2000);
                        } else {
                            $scope.message = response.data && response.data.message || $translate.instant('SERVER_UNAVAILABLE');
                            $('#reset-password-message').show();
                            $scope.isLoading = false;
                        }
                    });
                });
        }
        submitResetPassword(0);
    };

    $scope.submitSavePassword = function() {
        $scope.isLoading = true;
        AuthService.submitSavePassword($location.search().id, $location.search().token, $scope.password, $scope.passwordConfirmation)
            .then(function (response) {
                $location.url($location.path());    // Clear query parameters
                hideAllAuthModals();
                ToastService.info(response.data.message);
                $timeout(function () {
                    $('#loginModal').modal('show');
                }, 2000);
            }, function (response) {
                $scope.message = response.data && response.data.message || $translate.instant('SERVER_UNAVAILABLE');
                $('#save-password-message').show();
                $scope.isLoading = false;
            });
    };

    $scope.openSignIn = function() {
        hideAllAuthModals();
        $('#loginModal').modal('show');
    };

    $scope.openSignUp = function() {
        hideAllAuthModals();
        $('#signupModal').modal('show');
    };

    $scope.openResetPassword = function() {
        hideAllAuthModals();
        $('#resetPasswordModal').modal('show');
    };

    var hideAllAuthModals = function() {
        $('#loginModal').modal('hide');
        $('#signupModal').modal('hide');
        $('#resetPasswordModal').modal('hide');
        $('#savePassModal').modal('hide');

        $timeout(function () {
            $scope.isLoading = false;
            $scope.message = null;
        }, 1000);
    };

    $(window).on('hidden.bs.modal',function() {
        $scope.message = null;
    });
}]);

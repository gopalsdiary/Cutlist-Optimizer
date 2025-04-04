app.controller('PdfControler', ['$scope', 'CutListCfg', 'PdfGenerator', '$timeout', '$window', '$translate',
    function($scope, CutListCfg, PdfGenerator, $timeout, $window, $translate) {

    $scope.pdfGenerator = PdfGenerator;

    $scope.pdfFontList = [
        {id: 0, size: '20px', label: $translate.instant('NORMAL')},
        {id: 1, size: '24px', label: $translate.instant('BIG')},
        {id: 2, size: '28px', label: $translate.instant('HUGE')}
    ];

    var localStoragePdfCfg =  JSON.parse($window.localStorage.getItem("pdfGeneratorCfg"));
    if (localStoragePdfCfg) {
        PdfGenerator.cfg = localStoragePdfCfg;

        // Validate font loaded from localstorage
        if ($scope.pdfFontList.filter(function (value) {
            return JSON.stringify(value) === JSON.stringify(PdfGenerator.cfg.font);
        }).length === 0) {
            console.warn("Invalid PDF font loaded from localStorage: " + JSON.stringify(PdfGenerator.cfg.font));
            PdfGenerator.cfg.font = $scope.pdfFontList[0];
        }
    } else {
        PdfGenerator.cfg = {
            font: $scope.pdfFontList[0],
            headerText: "CutList Optimizer",
            additionalText: "",
            showSummary: true,
            showDate: true,
            showCutsTable: true
        };
    }
}]);

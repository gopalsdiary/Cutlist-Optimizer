app.service('BillingDetailsService', ['$http', 'ClientInfo', 'AuthService', 'CutListCfg', '$q',
    function($http, ClientInfo, AuthService, CutListCfg, $q) {

        const self = this;

        self.invoiceCustomerDetail = {};
        self.shouldSendInvoice = false;
        self.isRequestInProgress = false;

        function fetchInvoiceCustomerDetails() {
            self.isRequestInProgress = true;
            $http({
                url: CutListCfg.localBaseUrl + '/invoice-customer-details/' + encodeURIComponent(ClientInfo.email),
                method: "GET",
                headers: AuthService.getHttpHeaders()
            }).then(function (response) {
                try {
                    console.info("Received invoice customer details:\n" + JSON.stringify(response));
                    self.invoiceCustomerDetail = response.data;
                    self.shouldSendInvoice = true;
                } catch(e) {
                    console.error("Error parsing invoice customer details\n" + e.stack);
                }
            }, function (reason) {
                if (reason.status === 404) {
                    console.info("Invoice customer details not found");
                    if (ClientInfo.isEuCountry() && !ClientInfo.hasActiveSubscription()) {
                        self.shouldSendInvoice = true;
                        self.invoiceCustomerDetail.countryCode = ClientInfo.countryIsoCode;
                        self.invoiceCustomerDetail.invoicingEmail = ClientInfo.email;
                    }
                } else {
                    console.error("Error retrieving invoice customer details: " + JSON.stringify(reason));
                }
            }).finally( function () {
                self.isRequestInProgress = false;
            });
        }

        self.postInvoiceCustomerDetail = function () {

            var deferred = $q.defer();
            self.isRequestInProgress = true;

            if (self.shouldSendInvoice) {
                self.invoiceCustomerDetail.taxRegistrationNumber = sanitizeVat(self.invoiceCustomerDetail.taxRegistrationNumber, self.invoiceCustomerDetail.countryCode);

                // Remove spaces from email
                self.invoiceCustomerDetail.invoicingEmail = self.invoiceCustomerDetail.invoicingEmail.replace(/\s/g, '');

                $http({
                    url: CutListCfg.localBaseUrl + '/invoice-customer-details/' + encodeURIComponent(ClientInfo.email),
                    method: 'PUT',
                    data: self.invoiceCustomerDetail,
                    headers: AuthService.getHttpHeaders()
                }).then(function (response) {
                    console.info("Saved invoice customer details: " + JSON.stringify(response));
                    deferred.resolve(response);
                }, function (result) {
                    console.error("Error saving invoice customer details: " + JSON.stringify(result));
                    deferred.reject(result);
                }).finally( function () {
                    self.isRequestInProgress = false;
                });

            } else {

                $http({
                    url: CutListCfg.localBaseUrl + '/invoice-customer-details/' + encodeURIComponent(ClientInfo.email),
                    method: 'DELETE',
                    headers: AuthService.getHttpHeaders()
                }).then(function (response) {
                    console.info("Deleted invoice customer details: " + JSON.stringify(response));
                    deferred.resolve(response);
                }, function (reason) {
                    if (reason.status === 404) {
                        deferred.resolve(reason);
                    } else {
                        console.error("Error deleting invoice customer details: " + JSON.stringify(reason));
                        deferred.reject(reason);
                    }
                }).finally(function () {
                    self.isRequestInProgress = false;
                });
            }

            return deferred.promise;
        }

        self.validateVat = function () {
            let vatToValidate = sanitizeVat(self.invoiceCustomerDetail.taxRegistrationNumber, self.invoiceCustomerDetail.countryCode);

            if (vatToValidate.length < 4) {
                return;
            }

            console.info("Validating VAT number [" + vatToValidate + "]");

            $http({
                url: CutListCfg.localBaseUrl + '/vat/' + encodeURIComponent(vatToValidate),
                method: "GET",
                headers: AuthService.getHttpHeaders()
            }).then(function (response) {
                try {
                    console.info("Received VAT validation response:\n" + JSON.stringify(response));
                    const euVatCheckResponse = response.data;
                    if (euVatCheckResponse.valid) {
                        if (!self.invoiceCustomerDetail.businessName) {
                            self.invoiceCustomerDetail.businessName = euVatCheckResponse.name;
                        }
                        if (!!euVatCheckResponse.address && !self.invoiceCustomerDetail.address) {
                            var address = euVatCheckResponse.address.trim().split('\n');
                            if (address.length === 1) {
                                address = euVatCheckResponse.address.trim().split(',');
                            }

                            self.invoiceCustomerDetail.address = address.shift();
                            while (address.length > 2) {
                                self.invoiceCustomerDetail.address += ',' + address.shift();
                            }

                            if (address.length === 1) {
                                var address0 = address[0].substring(0, address[0].indexOf(' '));
                                var address1 = address[0].substring(address[0].indexOf(' ') + 1);

                                address = [address1, address0];
                            }

                            if (!self.invoiceCustomerDetail.postcode) {
                                if (!!address[1]) {
                                    self.invoiceCustomerDetail.postcode = address[1];
                                } else if (!!address[0]) {
                                    self.invoiceCustomerDetail.postcode = address[0];
                                    return;
                                }
                            }

                            if (!!address[0] && !self.invoiceCustomerDetail.city) {
                                self.invoiceCustomerDetail.city = address[0];
                            }
                        }
                    }
                } catch(e) {
                    console.error("Error parsing VAT response\n" + e.stack);
                }
            }, function (reason) {
                console.error("Error retrieving VAT info: " + JSON.stringify(reason));
            });
        }

        $("#subscriptionModal").on('shown.bs.modal',function() {
            fetchInvoiceCustomerDetails();
        });

        function sanitizeVat(vat, countryCode) {
            if (!vat) {
                return '';
            }

            // Append country code if none is present
            if (!isNaN(vat.charAt(0)) && !isNaN(vat.charAt(1))) {
                vat = countryCode.toUpperCase() + vat;
            }

            // Remove all the non-alphanumeric characters
            vat = vat.replace(/[^A-Za-z0-9]/g, "");

            return vat;
        }
}]);
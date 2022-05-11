/* eslint-disable no-undef */
var CONSENT_REGULATIONS = {
    GDPR: 'gdpr',
    CCPA: 'ccpa'
};
var CCPA_PURPOSE = 'data_sale_opt_out';

var initialization = {
    name: 'OneTrust',
    moduleId: 134,
    consentMapping: [],
    googleVendorConsentMapping: [],
    iabVendorConsentMapping: [],
    generalVendorConsentMapping: [],
    getConsentGroupIds: function() {
        return window.OnetrustActiveGroups
            ? window.OnetrustActiveGroups.split(',')
            : [];
    },
    getVendorConsent: function() {
        window.OneTrust.getVendorConsentsRequestV2(function(consent) {
            console.log(consent);
        });
    },

    parseConsentMapping: function(rawConsentMapping) {
        var _consentMapping = {};
        if (rawConsentMapping) {
            var parsedMapping = JSON.parse(
                rawConsentMapping.replace(/&quot;/g, '"')
            );

            // TODO: [67837] Revise this to use an actual 'regulation' mapping if UI ever returns this
            parsedMapping.forEach(function(mapping) {
                var purpose = mapping.map;
                _consentMapping[mapping.value] = {
                    purpose: purpose,
                    regulation:
                        purpose === CCPA_PURPOSE
                            ? CONSENT_REGULATIONS.CCPA
                            : CONSENT_REGULATIONS.GDPR,
                };
            });
        }

        return _consentMapping;
    },

    parseVendorConsentMapping: function(rawConsentMapping) {
        var _consentMapping = {};
        if (rawConsentMapping) {
            var parsedMapping = JSON.parse(
                rawConsentMapping.replace(/&quot;/g, '"')
            );
            parsedMapping.forEach(function(mapping) {
                var purpose = mapping.map;
                _consentMapping[mapping.value] = {
                    purpose: purpose,
                    regulation: CONSENT_REGULATIONS.GDPR,
                };
            });
        }
        return _consentMapping;
    },

    initForwarder: function(forwarderSettings) {
        var self = this;
        self.consentMapping = self.parseConsentMapping(
            forwarderSettings.consentGroups
        );

        self.googleVendorConsentMapping = self.parseVendorConsentMapping(
            forwarderSettings.vendorGoogleConsentGroups
        );
        self.iabVendorConsentMapping = self.parseVendorConsentMapping(
            forwarderSettings.vendorIABConsentGroups
        );
        self.generalVendorConsentMapping = self.parseVendorConsentMapping(
            forwarderSettings.vendorGeneralConsentGroups
        );

        // Wrap exisitng OptanonWrapper in case customer is using
        // it for something custom so we can hijack
        var OptanonWrapperCopy = window.OptanonWrapper;

        window.OptanonWrapper = function() {
            if (window.Optanon && window.Optanon.OnConsentChanged) {
                window.Optanon.OnConsentChanged(function() {
                    self.createConsentEvents();
                    self.createVendorConsentEvents();
                });
            }

            // Run original OptanonWrapper()
            OptanonWrapperCopy();
        };
    },
    createConsentEvents: function() {
        if (window.Optanon) {
            var location = window.location.href,
                consent,
                consentState,
                user = mParticle.Identity.getCurrentUser();

            if (user) {
                consentState = user.getConsentState();

                if (!consentState) {
                    consentState = mParticle.Consent.createConsentState();
                }
                for (var key in this.consentMapping) {
                    var consentPurpose = this.consentMapping[key].purpose;
                    var regulation = this.consentMapping[key].regulation;
                    var consentBoolean = false;

                    // removes all non-digits
                    // 1st version of OneTrust required a selection from group1, group2, etc
                    if (key.indexOf('group') >= 0) {
                        key = key.replace(/\D/g, '');
                    }

                    consentBoolean =
                        this.getConsentGroupIds().indexOf(key) > -1;

                    // At present, only CCPA and GDPR are known regulations
                    // Using a switch in case a new regulation is added in the future
                    switch (regulation) {
                        case CONSENT_REGULATIONS.CCPA:
                            consent = mParticle.Consent.createCCPAConsent(
                                consentBoolean,
                                Date.now(),
                                consentPurpose,
                                location
                            );
                            consentState.setCCPAConsentState(consent);
                            break;
                        case CONSENT_REGULATIONS.GDPR:
                            consent = mParticle.Consent.createGDPRConsent(
                                consentBoolean,
                                Date.now(),
                                consentPurpose,
                                location
                            );
                            consentState.addGDPRConsentState(
                                consentPurpose,
                                consent
                            );
                            break;
                        default:
                            console.error(
                                'Unknown Consent Regulation',
                                regulation
                            );
                    }
                }

                user.setConsentState(consentState);
            }
        }
    },

    createVendorConsentEvents: function() {
        var self = this;
        if (window.OneTrust) {
            var consentState,
                user = mParticle.Identity.getCurrentUser();

            if (user) {
                consentState = user.getConsentState();

                if (!consentState) {
                    consentState = mParticle.Consent.createConsentState();
                }

                // google consent
                // for (var googleConsent in this.googleVendorConsentMapping) {
                OneTrust.getVendorConsentsRequestV2(function(
                    oneTrustVendorConsent
                ) {
                    // copy google consent states
                    // this will be in the shape of "1~39.43.46.55.61.70.83.89.93.108.117.122.124.131..."
                    setGoogleVendorRequests(
                        oneTrustVendorConsent,
                        self.googleVendorConsentMapping,
                        consentState
                    );

                    setIABVendorRequests(
                        oneTrustVendorConsent,
                        self.iabVendorConsentMapping,
                        consentState
                    );

                    setGeneralVendorRequests(
                        self.getConsentGroupIds(),
                        self.generalVendorConsentMapping,
                        consentState
                    );
                });

                user.setConsentState(consentState);
            }
        }
    },
};

function setGoogleVendorRequests(
    oneTrustVendorConsent,
    googleVendorConsentMapping,
    consentState
) {
    var googleConsentedVendors = oneTrustVendorConsent
        ? oneTrustVendorConsent.addtlConsent
              .slice()
              .split('~')[1]
              .split('.')
        : null;

    var consentBoolean = false;
    var location = window.location.href;

    if (googleConsentedVendors && googleConsentedVendors.length) {
        for (var key in googleVendorConsentMapping) {
            var consentPurpose = googleVendorConsentMapping[key].purpose;
            consentBoolean = googleConsentedVendors.indexOf(key) > -1;

            consent = mParticle.Consent.createGDPRConsent(
                consentBoolean,
                Date.now(),
                consentPurpose,
                location
            );
            consentState.addGDPRConsentState(consentPurpose, consent);
        }
    }
}

function setIABVendorRequests(
    oneTrustVendorConsent,
    IABVendorConsentMappings,
    consentState
) {
    var IABConsentedVendors = oneTrustVendorConsent
        ? oneTrustVendorConsent.vendor.consents
        : null;
    var consentBoolean = false;
    var location = window.location.href;

    for (var key in IABVendorConsentMappings) {
        var consentPurpose = IABVendorConsentMappings[key].purpose;
        consentBoolean = IABConsentedVendors[parseInt(key) - 1] === '1';

        consent = mParticle.Consent.createGDPRConsent(
            consentBoolean,
            Date.now(),
            consentPurpose,
            location
        );
        consentState.addGDPRConsentState(consentPurpose, consent);
    }
}

function setGeneralVendorRequests(
    oneTrustVendorConsent,
    generalVendorConsentMapping,
    consentState
) {
    if (window.Optanon) {
        var location = window.location.href,
            consent;

        for (var key in generalVendorConsentMapping) {
            var consentPurpose = generalVendorConsentMapping[key].purpose;
            var consentBoolean = false;

            consentBoolean = oneTrustVendorConsent.indexOf(key) > -1;

            consent = mParticle.Consent.createGDPRConsent(
                consentBoolean,
                Date.now(),
                consentPurpose,
                location
            );

            consentState.addGDPRConsentState(consentPurpose, consent);
        }
    }
}

module.exports = {
    initialization: initialization,
};
/* eslint-disable no-undef*/
describe('OneTrust Forwarder', function() {
    var server = new MockHttpServer(),
        MockForwarder = function() {
            var self = this;

            this.initForwarderCalled = false;

            this.apiKey = null;
            this.OnConsentChangedCalled = false;
            this.OnConsentChanged = function(fn) {
                if (!self.OnConsentChangedCalled) {
                    self.OnConsentChangedCalled = true;
                } else {
                    fn();
                }
            };
        };

    function generateConsentGroupString(mapping) {
        return '[' + [
            mapping.map(function(el) {
                return [
                    '{' +
                    // This is usually just `null` so we don't wrap in `&quot`
                    '&quot;jsmap&quot;:' + el.jsmap,
                    '&quot;map&quot;:' + '&quot;' + el.map + '&quot;',
                    '&quot;maptype&quot;:' + '&quot;' + el.maptype + '&quot;',
                    '&quot;value&quot;:' + '&quot;' + el.value + '&quot;'+ '}'
                ].join(',');
            }).join(',')
        ].join() + ']';
    }

    function configureOneTrustForwarderAndInit(consentGroups) {
        mParticle.config = {
            requestConfig: false,
            logLevel: 'none',
            workspaceToken: 'workspaceToken1',
            kitConfigs: [
                {
                    name: 'OneTrust',
                    settings: {
                        consentGroups: consentGroups,
                    },
                    eventNameFilters: [],
                    eventTypeFilters: [],
                    attributeFilters: [],
                    screenNameFilters: [],
                    pageViewAttributeFilters: [],
                    userIdentityFilters: [],
                    userAttributeFilters: [],
                    moduleId: 1,
                    isDebug: false,
                    HasDebugString: 'false',
                    isVisible: true,
                },
            ],
        };
        mParticle.init('apikey', mParticle.config);
    }

    before(function() {
        server.start();
        server.requests = [];

    });

    beforeEach(function() {
        localStorage.clear();
        window.Optanon = new MockForwarder();
        server.requests = [];
        window.mParticleAndroid = null;
        window.mParticle.isIOS = null;
        window.mParticle.useCookieStorage = false;
        mParticle.isDevelopmentMode = false;
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'testMPID',
                })
            );
        };
    });

    it('should test consent group parsing', function () {
        var consentGroups = [
            {
                jsmap: null,
                map: 'Test 1',
                maptype: 'ConsentPurposes',
                value: 'test1'
            },
            {
                jsmap: null,
                map: 'Test 2',
                maptype: 'ConsentPurposes',
                value: 'test2'
            },
            {
                jsmap: null,
                map: 'Test 3',
                maptype: 'ConsentPurposes',
                value: 'test3'
            }
        ];

        // Using this method to make sure string doesn't have any unnecessary whitespace
        var expectedString = [
            '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Test 1&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;test1&quot;},',
            '{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Test 2&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;test2&quot;},',
            '{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Test 3&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;test3&quot;}]'
        ].join('');

        var generatedString = generateConsentGroupString(consentGroups);

        generatedString.should.equal(expectedString);

    });

    it('should set consent to identified user based on consent provided, and then transfer consent state to new logged in user', function(done) {
        var consentGroups = [
            { jsmap: null, map: 'strictly necessary', maptype: 'ConsentPurposes', value: 'group 1'},
            { jsmap: null, map: 'performance', maptype: 'ConsentPurposes', value: 'group 2'},
            { jsmap: null, map: 'functional', maptype: 'ConsentPurposes', value: 'group 3'},
            { jsmap: null, map: 'targeting', maptype: 'ConsentPurposes', value: 'group 4'},
            { jsmap: null, map: 'Test 1', maptype: 'ConsentPurposes', value: 'userEditable1'},
            { jsmap: null, map: 'Test 2', maptype: 'ConsentPurposes', value: 'userEditable2'},
            { jsmap: null, map: 'Test 3', maptype: 'ConsentPurposes', value: 'group 6'}
        ];

        // Previous version of kit allowed OnetrustActiveGroups to only be numbers, now they are user editable
        // The following example includes both examples to allow for maximum flexibility in the test
        window.OnetrustActiveGroups = ',1,2,4,userEditable1,userEditable2';
        configureOneTrustForwarderAndInit(generateConsentGroupString(consentGroups));
        var consent = mParticle.getInstance()._Persistence.getLocalStorage();
        Object.keys(consent.testMPID.con.gdpr).should.have.length(7);
        consent.testMPID.con.gdpr.should.have.property('strictly necessary');
        consent.testMPID.con.gdpr.should.have.property('performance');
        consent.testMPID.con.gdpr.should.have.property('functional');
        consent.testMPID.con.gdpr.should.have.property('targeting');
        consent.testMPID.con.gdpr.should.have.property('test 1');
        consent.testMPID.con.gdpr.should.have.property('test 2');
        consent.testMPID.con.gdpr.should.have.property('test 3');

        consent.testMPID.con.gdpr['strictly necessary'].should.have.property(
            'c',
            true
        );
        consent.testMPID.con.gdpr['performance'].should.have.property(
            'c',
            true
        );
        consent.testMPID.con.gdpr['functional'].should.have.property(
            'c',
            false
        );
        consent.testMPID.con.gdpr['targeting'].should.have.property('c', true);
        consent.testMPID.con.gdpr['test 1'].should.have.property('c', true);
        consent.testMPID.con.gdpr['test 2'].should.have.property('c', true);
        consent.testMPID.con.gdpr['test 3'].should.have.property('c', false);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'otherMPID',
                })
            );
        };

        var identityRequestObject = { userIdentities: { customerid: 'abc' } };

        // ever subsequent user is given the same consent states as the original user
        mParticle.Identity.login(identityRequestObject, function() {
            var otherMPIDConsent = mParticle
                .getInstance()
                ._Persistence.getLocalStorage();
            Object.keys(consent.testMPID.con.gdpr).should.have.length(7);
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property(
                'strictly necessary'
            );
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property(
                'performance'
            );
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property(
                'functional'
            );
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property(
                'targeting'
            );
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property('test 1');
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property('test 2');
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property('test 3');

            otherMPIDConsent.otherMPID.con.gdpr[
                'strictly necessary'
            ].should.have.property('c', true);
            otherMPIDConsent.otherMPID.con.gdpr[
                'performance'
            ].should.have.property('c', true);
            otherMPIDConsent.otherMPID.con.gdpr[
                'functional'
            ].should.have.property('c', false);
            otherMPIDConsent.otherMPID.con.gdpr[
                'targeting'
            ].should.have.property('c', true);
            otherMPIDConsent.otherMPID.con.gdpr['test 1'].should.have.property(
                'c',
                true
            );
            otherMPIDConsent.otherMPID.con.gdpr['test 2'].should.have.property(
                'c',
                true
            );
            otherMPIDConsent.otherMPID.con.gdpr['test 3'].should.have.property(
                'c',
                false
            );

            done();
        });
    });
    
    it('should use CCPA regulation if consent purpose is "data_sale_opt_out", otherwise should use GDPR', function (done) {
        var consentGroups = [
            {
                jsmap: null,
                map: 'european_privacy',
                maptype: 'ConsentPurposes',
                value: 'euro_biscuit'
            },
            {
                jsmap: null,
                map: 'data_sale_opt_out',
                maptype: 'ConsentPurposes',
                value: 'cali_cookie'
            }
        ];

        window.OnetrustActiveGroups = ',euro_biscuit,cali_cookie';
        configureOneTrustForwarderAndInit(generateConsentGroupString(consentGroups));

        var consent = mParticle.getInstance()._Persistence.getLocalStorage();
        consent.testMPID.con.ccpa.should.have.property('data_sale_opt_out');
        consent.testMPID.con.gdpr['european_privacy'].should.have.property('d', 'european_privacy');

        done();
    });
});

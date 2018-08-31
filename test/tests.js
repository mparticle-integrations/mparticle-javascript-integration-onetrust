/* eslint-disable no-undef*/
describe('OneTrust Forwarder', function () {
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

    function configureOneTrustForwarderAndInit() {
        mParticle.configureForwarder({
            name: 'OneTrust',
            settings: {
                consentGroups: '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;strictly necessary&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;group 1&quot;},\
                                  {&quot;jsmap&quot;:null,&quot;map&quot;:&quot;performance&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;group 2&quot;},\
                                  {&quot;jsmap&quot;:null,&quot;map&quot;:&quot;functional&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;group 3&quot;},\
                                  {&quot;jsmap&quot;:null,&quot;map&quot;:&quot;targeting&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;group 4&quot;}]'
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
            isVisible: true
        });
        mParticle.init('apikey');
    }

    before(function () {
        server.start();
        server.requests = [];
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'testMPID'
            }));
        };
    });

    beforeEach(function() {
        window.Optanon = new MockForwarder();
        server.requests = [];
        window.mParticleAndroid = null;
        window.mParticle.isIOS = null;
        window.mParticle.useCookieStorage = false;
        mParticle.isDevelopmentMode = false;
    });

    it('should set consent to identified user based on consent provided, and then transfer consent state to new logged in user', function(done) {
        window.OnetrustActiveGroups = ',1,2,3,4';

        configureOneTrustForwarderAndInit();

        var consent = mParticle.persistence.getLocalStorage();

        Object.keys(consent.testMPID.con.gdpr).should.have.length(4);
        consent.testMPID.con.gdpr.should.have.property('strictly necessary');
        consent.testMPID.con.gdpr.should.have.property('performance');
        consent.testMPID.con.gdpr.should.have.property('functional');
        consent.testMPID.con.gdpr.should.have.property('targeting');

        consent.testMPID.con.gdpr['strictly necessary'].should.have.property('c', true);
        consent.testMPID.con.gdpr['performance'].should.have.property('c', true);
        consent.testMPID.con.gdpr['functional'].should.have.property('c', true);
        consent.testMPID.con.gdpr['targeting'].should.have.property('c', true);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        var identityRequestObject = {userIdentities: {customerid: 'abc'}};

        mParticle.Identity.login(identityRequestObject, function() {
            var otherMPIDConsent = mParticle.persistence.getLocalStorage();
            Object.keys(consent.testMPID.con.gdpr).should.have.length(4);
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property('strictly necessary');
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property('performance');
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property('functional');
            otherMPIDConsent.otherMPID.con.gdpr.should.have.property('targeting');

            otherMPIDConsent.otherMPID.con.gdpr['strictly necessary'].should.have.property('c', true);
            otherMPIDConsent.otherMPID.con.gdpr['performance'].should.have.property('c', true);
            otherMPIDConsent.otherMPID.con.gdpr['functional'].should.have.property('c', true);
            otherMPIDConsent.otherMPID.con.gdpr['targeting'].should.have.property('c', true);

            done();
        });
    });
});

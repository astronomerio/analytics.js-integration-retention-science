var Analytics = require('analytics.js-core').constructor;
var integration = require('analytics.js-integration');
var sandbox = require('clear-env');
var tester = require('analytics.js-integration-tester');
var RetentionScience = require('../lib');

describe('RetentionScience', function() {
  var analytics;
  var retentionScience;
  var options = {
    siteId: '12345'
  };

  beforeEach(function() {
    analytics = new Analytics();
    retentionScience = new RetentionScience(options);
    analytics.use(RetentionScience);
    analytics.use(tester);
    analytics.add(retentionScience);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    retentionScience.reset();
    sandbox();
  });

  it('should have the right settings', function() {
      analytics.compare(RetentionScience, integration('Retention Science')
        .global('_rsq'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(retentionScience, 'load');
    });

    describe('#initialize', function() {
      it('should create the _rsq array', function() {
        analytics.assert(!window._rsq);
        analytics.initialize();
        analytics.assert(window._rsq);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(retentionScience.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(retentionScience, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.stub(window._rsq, 'push');
    });

    describe('#page', function() {
      it('should add a page track', function() {
        analytics.page();
        analytics.called(window._rsq.push, ['_track']);
      });
    });

    describe('#track', function() {
      it('calls viewed product', function() {
        analytics.stub(retentionScience, 'viewedProduct');
        analytics.track('Viewed Product', {});
        analytics.called(retentionScience.viewedProduct);
      });

      it('pushes viewed product', function() {
        analytics.track('Viewed Product', { sku: 'xxxxx' });
        analytics.called(window._rsq.push, ['_addItem', {
          id: 'xxxxx',
          name: '',
          price: ''
        }]);
      });

      it('adds defaults', function() {
        analytics.identify('123', { email: 'schnie@astronomer.io' });
        analytics.track('Viewed Product', {});
        analytics.called(window._rsq.push, ['_setSiteId', '12345']);
        analytics.called(window._rsq.push, ['_setUserId', '123']);
        analytics.called(window._rsq.push, ['_setUserEmail', 'schnie@astronomer.io']);
      });

      it('calls completed order', function() {
        analytics.stub(retentionScience, 'completedOrder');
        analytics.track('Completed Order', {});
        analytics.called(retentionScience.completedOrder);
      });

      it('pushes completed order', function() {
        analytics.track('Completed Order', {
          products: [{
            id: '123',
            name: 'product1',
            price: 50.00
          }, {
            sku: '456',
            name: 'product2',
            price: 100.00
          }]
        });
        analytics.called(window._rsq.push, ['_addItem', {
          id: '123',
          name: 'product1',
          price: 50.00
        }]);
        analytics.called(window._rsq.push, ['_addItem', {
          id: '456',
          name: 'product2',
          price: 100.00
        }]);
      });
    });
  });
});
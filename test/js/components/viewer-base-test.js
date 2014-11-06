module('Component - viewer-base', {
    setup: function () {
        var self = this,
            util = Crocodoc.getUtilityForTest('common');

        this.metadata = {
            numPages: 1,
            dimensions: {
                width: 100,
                height: 100
            }
        };

        this.components = {
            layout: {
                state: {
                    currentPage: 2,
                    zoomState: {
                        zoom: 1.5
                    }
                },
                init: function () {},
                setZoom: function () {},
                scrollTo: function () {},
                scrollBy: function () {},
                focus: function () {},
                updatePageStates: function () {}
            },
            'controller-paged': {
                init: function () {}
            },
            'controller-text': {
                init: function () {}
            },
            scroller: {
                init: function () {},
                destroy: function () {},
                on: function () {}
            },
            resizer: {
                init: function () {},
                destroy: function () {},
                on: function () {}
            },
            page: {
                init: function () {}
            }
        };

        this.utilities = {
            common: {
                insertCSS: function () { return { sheet: {} }; },
                isFn: sinon.stub().returns(true),
                extend: util.extend
            },
            ajax: {
                request: function () {}
            },
            url: {
                makeAbsolute: sinon.stub().returnsArg(0)
            },
            browser: {},
            support: {
                svg: true
            },
            dom: Crocodoc.getUtilityForTest('dom')
        };

        this.viewerAPI = {
            setLayout: function () {},
            disableLinks: function () {},
            disableTextSelection: function () {},
            fire: function () {},
            updateLayout: function () {}
        };

        this.config = util.extend(true, {}, Crocodoc.Viewer.defaults);
        this.config.el = this.utilities.dom.create('div');
        this.config.api = this.viewerAPI;
        this.config.url = '/some/url';

        this.scope = Crocodoc.getScopeForTest(this);
        this.component = Crocodoc.getComponentForTest('viewer-base', this.scope);
    }
});

test('init() should throw an error when called url.config is not defined', function () {
    var spy = this.spy(this.viewerAPI, 'fire');

    this.config.url = null;
    throws(function (){ this.component.init(); }, 'error should be thrown');
});

test('loadAssets() should disable text selection in IE < 9', function () {
    var stub = this.stub(this.scope, 'get');
    stub.withArgs('metadata').returns($.Deferred().resolve(this.metadata).promise());
    var spy = this.spy(this.viewerAPI, 'disableTextSelection');

    this.utilities.browser.ielt9 = true;
    this.component.init();
    this.component.loadAssets();
    ok(spy.called, 'should disable text selection');
});

test('loadAssets() should not disable text selection in IE < 9 for text files', function () {
    var stub = this.stub(this.scope, 'get');
    stub.withArgs('stylesheet').returns($.Deferred().promise());
    stub.withArgs('metadata').returns($.Deferred().resolve({ type: 'text' }).promise());
    var spy = this.spy(this.viewerAPI, 'disableTextSelection');

    this.utilities.browser.ielt9 = true;
    this.component.init();
    this.component.loadAssets();
    ok(spy.notCalled, 'should not disable text selection');
});

test('loadAssets() should request metadata when called', function () {
    var spy = this.stub(this.scope, 'get').returns($.Deferred().promise());

    this.component.init();
    this.component.loadAssets();
    ok(spy.calledWith('metadata'), 'metadata should be requested');
});

test('loadAssets() should request stylesheet when called', function () {
    var spy = this.stub(this.scope, 'get').returns($.Deferred().promise());

    this.component.init();
    this.component.loadAssets();
    ok(spy.calledWith('stylesheet'), 'stylesheet should be requested');
});

test('loadAssets() should not request stylesheet when browser is IE < 9', function () {
    var spy = this.stub(this.scope, 'get').returns($.Deferred().promise());

    this.utilities.browser.ielt9 = true;
    this.component.init();
    this.component.loadAssets();
    ok(spy.withArgs('stylesheet').notCalled, 'stylesheet should not be requested');
});

test('loadAssets() should prefetch correct page 1 assets when called', function () {
    var spy = this.stub(this.scope, 'get').returns($.Deferred().promise());

    this.component.init();
    this.component.loadAssets();
    ok(spy.calledWith('page-svg', 1), 'page svg should be requested');
    ok(spy.calledWith('page-text', 1), 'page html should be requested');
    ok(spy.withArgs('page-img', 1).notCalled, 'page img should not be requested');
});

test('loadAssets() should prefetch correct page 1 assets when called in non-svg browser', function () {
    var spy = this.stub(this.scope, 'get').returns($.Deferred().promise());

    this.utilities.support.svg = false;
    this.component.init();
    this.component.loadAssets();
    ok(spy.withArgs('page-svg', 1).notCalled, 'page svg should not be requested');
    ok(spy.calledWith('page-img', 1), 'page img should be requested');
});

test('loadAssets() should not prefetch page text when text selection is disabled', function () {
    var spy = this.stub(this.scope, 'get').returns($.Deferred().promise());

    this.config.enableTextSelection = false;
    this.component.init();
    this.component.loadAssets();
    ok(spy.withArgs('page-html', 1).notCalled, 'page html should not be requested');
});

test('loadAssets() should broadcast an asseterror message when loading metadata or stylesheet fails', function () {
    var err = '404 not found';
    this.stub(this.scope, 'get').returns($.Deferred().reject({ error: err }).promise());

    var broadcastSpy = this.spy(this.scope, 'broadcast');

    this.component.init();
    this.component.loadAssets();

    ok(broadcastSpy.calledWith('asseterror', sinon.match({ error: sinon.match(err) })), 'asseterror was broadcast');
});

test('loadAssets() should broadcast a fail message when loading metadata or stylesheet fails', function () {
    var err = '404 not found';
    this.stub(this.scope, 'get').returns($.Deferred().reject({ error: err }).promise());

    var readySpy = this.spy(this.scope, 'ready');
    var broadcastSpy = this.spy(this.scope, 'broadcast');

    this.component.init();
    this.component.loadAssets();

    ok(readySpy.called, 'scope.ready should be called');
    ok(broadcastSpy.calledWith('fail', sinon.match({ error: sinon.match(err) })), 'fail was broadcast');
});

test('loadAssets() should create and init a scroller component when loading metadata and stylesheet succeeds', function () {
    var stub = this.stub(this.scope, 'get');
    stub.withArgs('metadata').returns($.Deferred().resolve(this.metadata).promise());
    stub.withArgs('stylesheet').returns($.Deferred().resolve('').promise());
    this.stub(this.component, 'setLayout');

    this.mock(this.components.scroller)
        .expects('init')
        .withArgs(sinon.match.instanceOf(Element));

    this.component.init();
    this.component.loadAssets();
});

test('loadAssets() should create and init a resizer component when loading metadata and stylesheet succeeds', function () {
    var stub = this.stub(this.scope, 'get');
    stub.withArgs('metadata').returns($.Deferred().resolve(this.metadata).promise());
    stub.withArgs('stylesheet').returns($.Deferred().resolve('').promise());

    this.mock(this.components.resizer)
        .expects('init')
        .withArgs(sinon.match.instanceOf(Element));

    this.component.init();
    this.component.loadAssets();
});

test('loadAssets() should set the appropriate layout when loading metadata and stylesheet succeeds', function () {
    var stub = this.stub(this.scope, 'get');
    stub.withArgs('metadata').returns($.Deferred().resolve(this.metadata).promise());
    stub.withArgs('stylesheet').returns($.Deferred().resolve('').promise());

    this.config.layout = Crocodoc.LAYOUT_PRESENTATION;

    this.mock(this.viewerAPI)
        .expects('setLayout')
        .withArgs(this.config.layout);

    this.component.init();
    this.component.loadAssets();
});

test('loadAssets() should broadcast "ready" when loading metadata and stylesheet succeeds', function () {
    var stub = this.stub(this.scope, 'get');
    stub.withArgs('metadata').returns($.Deferred().resolve(this.metadata).promise());
    stub.withArgs('stylesheet').returns($.Deferred().resolve('').promise());

    this.component.init();
    this.mock(this.scope)
        .expects('broadcast')
        .withArgs('ready', sinon.match.object);

    this.component.loadAssets();
});

test('destroy() should remove all Crocodoc-namespaced CSS classes from and empty the container element when called', function () {
    var el = this.config.el;
    this.component.init();
    this.component.destroy();
    ok(el.innerHTML.length === 0, 'HTML was emptied');
    ok((el.getAttribute('class') || '').indexOf('crocodoc') < 0, 'namespaced CSS classes were removed');
});

test('destroy() should abort all asset requests when called', function () {
    var abortSpy = this.spy();
    var promiseSpy = this.stub(this.scope, 'get').returns($.Deferred().promise({
        abort: abortSpy
    }));

    this.component.init();
    this.component.loadAssets();
    this.component.destroy();
    equal(abortSpy.callCount, promiseSpy.callCount, 'all requests should be aborted');
});

test('setLayout() should create and init a layout component instance when called with a valid layout type', function () {
    var layout = Crocodoc.LAYOUT_VERTICAL_SINGLE_COLUMN;
    this.mock(this.scope)
        .expects('createComponent')
        .withArgs('layout-'+layout)
        .returns(this.components.layout);
    this.mock(this.components.layout)
        .expects('init');
    this.component.init();
    this.component.setLayout(layout);
});

test('setLayout() should remove a layout and scrollTo/zoomTo previous scroll/zoom when called with a valid layout type after a layout has already been set', function () {
    this.stub(this.scope, 'createComponent').returns(this.components.layout);
    this.component.init();
    this.component.setLayout(Crocodoc.LAYOUT_VERTICAL);

    this.mock(this.scope)
        .expects('destroyComponent')
        .withArgs(this.components.layout);
    this.mock(this.components.layout)
        .expects('setZoom')
        .withArgs(this.components.layout.state.zoomState.zoom);
    this.mock(this.components.layout)
        .expects('scrollTo')
        .withArgs(this.components.layout.state.currentPage);
    this.component.setLayout(Crocodoc.LAYOUT_HORIZONTAL);
});

test('setLayout() should not remove a previous layout or create a new one when called with the same layout mode', function () {
    this.component.init();

    this.mock(this.scope)
        .expects('createComponent')
        .once()
        .returns(this.components.layout);
    this.component.setLayout(Crocodoc.LAYOUT_VERTICAL);

    this.mock(this.scope)
        .expects('destroyComponent')
        .never();
    this.component.setLayout(Crocodoc.LAYOUT_VERTICAL);
});

test('setLayout() should broadcast a layoutchange message when called and the layout changes', function () {
    this.component.init();

    this.stub(this.scope,'createComponent').returns(this.components.layout);

    this.mock(this.scope)
        .expects('broadcast')
        .withArgs('layoutchange', sinon.match.object);
    this.component.setLayout(Crocodoc.LAYOUT_VERTICAL);
});

test('setLayout() should throw an error when called with an invalid layout', function () {
    this.component.init();

    this.stub(this.scope,'createComponent').returns(null);
    throws(function () {
        this.component.setLayout(Crocodoc.LAYOUT_VERTICAL);
    }, 'an error should be thrown');
});

QUnit.cases([
    { name: 'asseterror', data: {} },
    { name: 'destroy', data: {} },
    { name: 'dragend', data: {} },
    { name: 'dragstart', data: {} },
    { name: 'fail', data: {} },
    { name: 'linkclick', data: {} },
    { name: 'pagefail', data: {} },
    { name: 'pagefocus', data: {} },
    { name: 'pageload', data: {} },
    { name: 'pageunload', data: {} },
    { name: 'ready', data: {} },
    { name: 'resize', data: {} },
    { name: 'scrollstart', data: {} },
    { name: 'scrollend', data: {} },
    { name: 'zoom', data: {} }
]).test('onmessage() should call fire() when called with the subscribed message', function (params) {
    this.component.init(this.config.el, { });
    this.mock(this.viewerAPI)
        .expects('fire')
        .withArgs(params.name, params.data).returns({
            preventDefault: function () {},
            isDefaultPrevented: function () {}
        });
    this.component.onmessage(params.name, params.data);
});

test('onmessage() should call updateLayout() when called with the layoutchange message', function (params) {
    this.component.init(this.config.el, { });
    this.mock(this.viewerAPI)
        .expects('updateLayout');
    this.component.onmessage('layoutchange');
});

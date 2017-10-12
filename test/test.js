describe('AnimateMarkerLayer', function () {
    var container, map;
    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            center : [0, 0],
            zoom : 17
        });
    });

    afterEach(function () {
        map.remove();
        maptalks.DomUtil.removeDomNode(container);
    });

    it('should display marker when added with one marker', function (done) {
        var layer = new maptalks.AnimateMarkerLayer('g', [new maptalks.Marker(map.getCenter())]);
        layer.on('layerload', function () {
            expect(layer).to.be.painted(0, -1);
            done();
        })
         .addTo(map);
    });

    it('should display cluster when added with 2 markers', function (done) {
        var layer = new maptalks.AnimateMarkerLayer('g', [new maptalks.Marker(map.getCenter()), new maptalks.Marker(map.getCenter())]);
        layer.on('layerload', function () {
            expect(layer).to.be.painted(0, -1);
            done();
        })
         .addTo(map);
    });


    it('should display if added again after removed', function (done) {
        var layer = new maptalks.AnimateMarkerLayer('g', [new maptalks.Marker(map.getCenter()), new maptalks.Marker(map.getCenter())]);
        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, -1);
            map.removeLayer(layer);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, -1);
                done();
            });
            map.addLayer(layer);
        });
        map.addLayer(layer);
    });

    it('should show', function (done) {
        var layer = new maptalks.AnimateMarkerLayer('g', [new maptalks.Marker(map.getCenter()), new maptalks.Marker(map.getCenter())], { visible : false });
        layer.once('add', function () {
            expect(layer).not.to.be.painted(0, -1);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, -1);
                done();
            });
            layer.show();
        });
        map.addLayer(layer);
    });

    it('should hide', function (done) {
        var layer = new maptalks.AnimateMarkerLayer('g', [new maptalks.Marker(map.getCenter()), new maptalks.Marker(map.getCenter())]);
        layer.once('layerload', function () {
            expect(layer).to.be.painted();
            layer.once('hide', function () {
                expect(layer).not.to.be.painted();
                done();
            });
            layer.hide();
        });
        map.addLayer(layer);
    });

    it('should be able to update marker\' symbol', function (done) {
        var marker = new maptalks.Marker(map.getCenter());
        var layer = new maptalks.AnimateMarkerLayer('g', [new maptalks.Marker(map.getCenter()), marker], { animation : false });
        layer.once('add', function () {
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, 0);
                done();
            });
            marker.setSymbol({
                'markerType' : 'ellipse',
                'markerFill'  : '#fff'
            });
        })
        .addTo(map);
    });

    it('should be able to update marker\' symbol by style', function (done) {
        var marker = new maptalks.Marker(map.getCenter());
        var layer = new maptalks.AnimateMarkerLayer('g', [new maptalks.Marker(map.getCenter()), marker], { animation : 'scale' });
        layer.once('add', function () {
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, 0, [255, 255, 255]);
                done();
            });
            layer.setStyle([
                {
                    filter : true,
                    symbol : {
                        'markerType' : 'ellipse',
                        'markerFill'  : '#fff'
                    }
                }
            ]);
        })
        .addTo(map);
    });

    it('should be able to identify', function (done) {
        var marker = new maptalks.Marker(map.getCenter());
        var layer = new maptalks.AnimateMarkerLayer('g', [new maptalks.Marker(map.getCenter()), marker]);
        layer.once('layerload', function () {
            var hits = layer.identify(map.getCenter());
            expect(hits).to.be.ok();
            done();
        })
        .addTo(map);
    });
});

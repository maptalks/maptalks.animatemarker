/*!
 * maptalks.animatemarker v0.1.0
 * LICENSE : MIT
 * (c) 2016-2017 maptalks.org
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks'], factory) :
	(factory((global.maptalks = global.maptalks || {}),global.maptalks));
}(this, (function (exports,maptalks) { 'use strict';

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

function getGradient(colors) {
    return {
        type: 'radial',
        colorStops: [[0.70, 'rgba(' + colors.join() + ', 0.5)'], [0.30, 'rgba(' + colors.join() + ', 1)'], [0.20, 'rgba(' + colors.join() + ', 1)'], [0.00, 'rgba(' + colors.join() + ', 0)']]
    };
}

var defaultSymbol = {
    'markerType': 'ellipse',
    'markerFill': getGradient([135, 196, 240]),
    'markerFillOpacity': 0.8,
    'markerLineWidth': 0,
    'markerWidth': 16,
    'markerHeight': 16
};

var options = {
    'animation': 'scale,fade',
    'animationOnce': false,
    'randomAnimation': true,
    'animationDuration': 3000,
    'fps': 24
};

var AnimateMarkerLayer = function (_maptalks$VectorLayer) {
    _inherits(AnimateMarkerLayer, _maptalks$VectorLayer);

    function AnimateMarkerLayer() {
        _classCallCheck(this, AnimateMarkerLayer);

        return _possibleConstructorReturn(this, _maptalks$VectorLayer.apply(this, arguments));
    }

    AnimateMarkerLayer.prototype.addGeometry = function addGeometry(points) {
        if (points instanceof maptalks.Geometry) {
            points = [points];
        }
        points.forEach(function (point, index) {
            if (!(point instanceof maptalks.Marker)) {
                throw new Error('The geometry at ' + index + ' to add is not a maptalks.Marker');
            }
        });
        return _maptalks$VectorLayer.prototype.addGeometry.apply(this, arguments);
    };

    /**
     * Reproduce a AnimateMarkerLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {maptalks.AnimateMarkerLayer}
     * @static
     * @private
     * @function
     */


    AnimateMarkerLayer.fromJSON = function fromJSON(profile) {
        if (!profile || profile['type'] !== 'AnimateMarkerLayer') {
            return null;
        }
        var layer = new AnimateMarkerLayer(profile['id'], profile['options']);
        var geos = profile['geometries'];
        var geometries = [];
        for (var i = 0; i < geos.length; i++) {
            var geo = maptalks.Geometry.fromJSON(geos[i]);
            if (geo) {
                geometries.push(geo);
            }
        }
        layer.addGeometry(geometries);
        if (profile['style']) {
            layer.setStyle(profile['style']);
        }
        return layer;
    };

    return AnimateMarkerLayer;
}(maptalks.VectorLayer);

AnimateMarkerLayer.mergeOptions(options);

AnimateMarkerLayer.registerJSONType('AnimateMarkerLayer');

AnimateMarkerLayer.registerRenderer('canvas', function (_maptalks$renderer$Ov) {
    _inherits(_class, _maptalks$renderer$Ov);

    function _class() {
        _classCallCheck(this, _class);

        return _possibleConstructorReturn(this, _maptalks$renderer$Ov.apply(this, arguments));
    }

    _class.prototype.draw = function draw() {
        if (this._animId) {
            this._cancelAnim();
        }
        if (this._needUpdate) {
            this._prepare();
            this._needUpdate = false;
        }
        this._animate();
        if (!this.layer.isLoaded()) {
            this.completeRender();
        }
    };

    _class.prototype.onCanvasCreate = function onCanvasCreate() {
        this._prepare();
    };

    _class.prototype.onGeometryAdd = function onGeometryAdd() {
        this._redraw();
    };

    _class.prototype.onGeometryRemove = function onGeometryRemove() {
        this._redraw();
    };

    _class.prototype.onGeometrySymbolChange = function onGeometrySymbolChange() {
        this._redraw();
    };

    _class.prototype.onGeometryPositionChange = function onGeometryPositionChange() {
        this._redraw();
    };

    _class.prototype.onGeometryShow = function onGeometryShow() {
        this._redraw();
    };

    _class.prototype.onGeometryHide = function onGeometryHide() {
        this._redraw();
    };

    _class.prototype.onGeometryPropertiesChange = function onGeometryPropertiesChange(geometries) {
        if (geometries && this.layer.getStyle()) {
            for (var i = 0; i < geometries.length; i++) {
                this.layer._styleGeometry(geometries[i]);
            }
        }
    };

    /**
     * 隐藏图层
     */


    _class.prototype.hide = function hide() {
        this._cancelAnim();
        return _maptalks$renderer$Ov.prototype.hide.call(this);
    };

    _class.prototype._redraw = function _redraw() {
        this._cancelAnim();
        this._needUpdate = true;
        this.render();
    };

    _class.prototype._animate = function _animate() {
        var _this3 = this;

        this.prepareCanvas();
        this._drawMarkers();
        var now = maptalks.Util.now();
        if (!this._animFn) {
            this._animFn = function () {
                this._animate();
            }.bind(this);
            this._startTime = now;
        }
        var options = this.layer.options;
        if (this.getMap() && !this.getMap().isZooming() && !this.getMap().isMoving() && !this.getMap().isDragRotating() && !(options['animationOnce'] && now - this._startTime > options['animationDuration'])) {
            var fps = this.layer.options['fps'] || 24;
            if (fps >= 1000 / 16) {
                this._animId = maptalks.Util.requestAnimFrame(this._animFn);
            } else {
                this._animTimeout = setTimeout(function () {
                    if (!_this3._animFn) {
                        // removed
                        return;
                    }
                    if (maptalks.Browser.ie9) {
                        // ie9 doesn't support RAF
                        _this3._animFn();
                    } else {
                        _this3._animId = maptalks.Util.requestAnimFrame(_this3._animFn);
                    }
                }, 1000 / this.layer.options['fps']);
            }
        }
    };

    _class.prototype._drawMarkers = function _drawMarkers() {
        var ctx = this.context,
            map = this.getMap(),
            size = map.getSize(),
            extent = new maptalks.PointExtent(0, 0, size['width'], size['height']),
            min = this._extent2D.getMin(),
            duration = this.layer.options['animationDuration'],
            now = Date.now();
        var anim = this._getAnimation();
        var globalAlpha = ctx.globalAlpha;
        this._currentMarkers.forEach(function (m) {
            if (!m.g.isVisible()) {
                return;
            }
            var r = (now - m.start) % duration / duration;
            var scale = anim.scale ? r : 1;

            var p = m.point.substract(min);
            if (!extent.contains(p)) {
                return;
            }
            var op = anim.fade ? r >= 0.5 ? 2 - r * 2 : 1 : 1;
            var key = m['cacheKey'];
            var cache = this._spriteCache[key];
            var offset = cache.offset,
                w = cache.canvas.width,
                h = cache.canvas.height;
            if (cache && op > 0) {
                ctx.globalAlpha = globalAlpha * op;
                ctx.drawImage(cache.canvas, p.x + offset.x - w * scale / 2, p.y + offset.y - h * scale / 2, w * scale, h * scale);
                ctx.globalAlpha = globalAlpha;
            }
        }, this);
        this.requestMapToRender();
    };

    _class.prototype._prepare = function _prepare() {
        var _this4 = this;

        var map = this.getMap(),
            markers = [];
        var allSymbols = {};
        this.layer.forEach(function (g) {
            _this4._currentGeo = g;
            var symbol = g._getInternalSymbol() === g.options['symbol'] ? defaultSymbol : g._getInternalSymbol();
            var point = map.coordinateToPoint(g.getCoordinates());

            var cacheKey = JSON.stringify(symbol);
            if (!allSymbols[cacheKey]) {
                allSymbols[cacheKey] = symbol;
            }
            markers.push({
                'point': point,
                'cacheKey': cacheKey,
                //time to start animation
                'start': _this4.layer.options['randomAnimation'] ? Math.random() * _this4.layer.options['animationDuration'] : 0,
                'g': g
            });
        });
        this._prepareSprites(allSymbols);
        this._currentMarkers = markers;
    };

    _class.prototype._prepareSprites = function _prepareSprites(allSymbols) {
        this._spriteCache = {};
        for (var p in allSymbols) {
            var symbol = allSymbols[p];
            var sprite = new maptalks.Marker([0, 0], { 'symbol': symbol })._getSprite(this.resources);
            this._spriteCache[p] = sprite;
        }
    };

    _class.prototype._cancelAnim = function _cancelAnim() {
        maptalks.Util.cancelAnimFrame(this._animId);
        clearTimeout(this._animTimeout);
    };

    _class.prototype.onZoomStart = function onZoomStart() {
        this._cancelAnim();
    };

    _class.prototype.onZoomEnd = function onZoomEnd() {
        this._prepare();
        _maptalks$renderer$Ov.prototype.onZoomEnd.apply(this, arguments);
    };

    _class.prototype.onRemove = function onRemove() {
        if (this._animId) {
            this._cancelAnim();
        }
        delete this._animFn;
        delete this._spriteCache;
        delete this._currentMarkers;
    };

    _class.prototype._getAnimation = function _getAnimation() {
        var anim = {
            'fade': false,
            'scale': false
        };
        var animations = this.layer.options['animation'] ? this.layer.options['animation'].split(',') : [];
        for (var i = 0; i < animations.length; i++) {
            var trim = maptalks.StringUtil.trim(animations[i]);
            if (trim === 'fade') {
                anim.fade = true;
            } else if (trim === 'scale') {
                anim.scale = true;
            }
        }

        return anim;
    };

    return _class;
}(maptalks.renderer.OverlayLayerCanvasRenderer));

exports.AnimateMarkerLayer = AnimateMarkerLayer;

Object.defineProperty(exports, '__esModule', { value: true });

})));

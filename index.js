import * as maptalks from 'maptalks';


function getGradient(colors) {
    return {
        type : 'radial',
        colorStops : [
          [0.70, 'rgba(' + colors.join() + ', 0.5)'],
          [0.30, 'rgba(' + colors.join() + ', 1)'],
          [0.20, 'rgba(' + colors.join() + ', 1)'],
          [0.00, 'rgba(' + colors.join() + ', 0)']
        ]
    };
}

const defaultSymbol = {
    'markerType' : 'ellipse',
    'markerFill' : getGradient([135, 196, 240]),
    'markerFillOpacity' : 0.8,
    'markerLineWidth' : 0,
    'markerWidth' : 16,
    'markerHeight' : 16
};

const options = {
    'animation' : 'scale,fade',
    'animationOnce' : false,
    'randomAnimation' : true,
    'animationDuration' : 3000,
    'symbol' : null,
    'fps' : 24
};

export class AnimateMarkerLayer extends maptalks.VectorLayer {

    addGeometry(points) {
        if (points instanceof maptalks.Geometry) {
            points = [points];
        }
        points.forEach(function (point, index) {
            if (!(point instanceof maptalks.Marker)) {
                throw new Error('The geometry at ' + index + ' to add is not a maptalks.Marker');
            }
        });
        return super.addGeometry.apply(this, arguments);
    }

    /**
     * Reproduce a AnimateMarkerLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {maptalks.AnimateMarkerLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(profile) {
        if (!profile || profile['type'] !== 'AnimateMarkerLayer') {
            return null;
        }
        const layer = new AnimateMarkerLayer(profile['id'], profile['options']);
        const geos = profile['geometries'];
        const geometries = [];
        for (let i = 0; i < geos.length; i++) {
            let geo = maptalks.Geometry.fromJSON(geos[i]);
            if (geo) {
                geometries.push(geo);
            }
        }
        layer.addGeometry(geometries);
        if (profile['style']) {
            layer.setStyle(profile['style']);
        }
        return layer;
    }
}

AnimateMarkerLayer.mergeOptions(options);

AnimateMarkerLayer.registerJSONType('AnimateMarkerLayer');

AnimateMarkerLayer.registerRenderer('canvas', class extends maptalks.renderer.OverlayLayerCanvasRenderer {

    draw() {
        if (this._animId) {
            this._cancelAnim();
        }
        if (this._needUpdate) {
            this._prepare();
            this._needUpdate = false;
        }
        this._animate();
        if (!this.isLoaded()) {
            this.completeRender();
        }
    }

    onCanvasCreate() {
        this._prepare();
    }

    onGeometryAdd() {
        this._redraw();
    }

    onGeometryRemove() {
        this._redraw();
    }

    onGeometrySymbolChange() {
        this._redraw();
    }

    onGeometryPositionChange() {
        this._redraw();
    }

    onGeometryShow() {
        this._redraw();
    }

    onGeometryHide() {
        this._redraw();
    }

    onGeometryPropertiesChange(geometries) {
        if (geometries && this.layer.getStyle()) {
            for (let i = 0; i < geometries.length; i++) {
                this.layer._styleGeometry(geometries[i]);
            }
        }
    }

    /**
     * 隐藏图层
     */
    hide() {
        this._cancelAnim();
        return super.hide();
    }

    _redraw() {
        this._cancelAnim();
        this._needUpdate = true;
        this.render();
    }

    _animate() {
        this.prepareCanvas();
        this._drawMarkers();
        const now = maptalks.Util.now();
        if (!this._animFn) {
            this._animFn = function () {
                this._animate();
            }.bind(this);
            this._startTime = now;
        }
        const options = this.layer.options;
        if (!this.getMap()._zooming && !this.getMap()._moving &&
            !(options['animationOnce'] && (now - this._startTime) > options['animationDuration'])) {
            const fps = this.layer.options['fps'] || 24;
            if (fps >= 1000 / 16) {
                this._animId = maptalks.Util.requestAnimFrame(this._animFn);
            } else {
                this._animTimeout = setTimeout(() => {
                    if (maptalks.Browser.ie9) {
                        // ie9 doesn't support RAF
                        this._animFn();
                    } else {
                        this._animId = maptalks.Util.requestAnimFrame(this._animFn);
                    }
                }, 1000 / this.layer.options['fps']);
            }
        }
    }

    _drawMarkers() {
        const ctx = this.context,
            map = this.getMap(),
            size = map.getSize(),
            extent = new maptalks.PointExtent(0, 0, size['width'], size['height']),
            min = this._extent2D.getMin(),
            duration = this.layer.options['animationDuration'],
            now = maptalks.Util.now();
        const anim = this._getAnimation();
        const globalAlpha = ctx.globalAlpha;
        this._currentMarkers.forEach(function (m) {
            if (!m.g.isVisible()) {
                return;
            }
            const r = ((now - m.start) % (duration)) / duration;
            const scale = anim.scale ? r : 1;

            const p = m.point.substract(min);
            if (!extent.contains(p)) {
                return;
            }
            const op = anim.fade ? (r >= 0.5 ? 2 - r * 2 : 1) : 1;
            const key = m['cacheKey'];
            const cache = this._spriteCache[key];
            const offset = cache.offset,
                w = cache.canvas.width,
                h = cache.canvas.height;
            if (cache && op > 0) {
                ctx.globalAlpha = globalAlpha * op;
                ctx.drawImage(cache.canvas, p.x + offset.x - w * scale / 2, p.y + offset.y - h * scale / 2, w * scale, h * scale);
                ctx.globalAlpha = globalAlpha;
            }
        }, this);
        this.requestMapToRender();
    }

    _prepare() {
        const map =  this.getMap(),
            markers = [];
        const allSymbols = {};
        this.layer.forEach(g => {
            this._currentGeo = g;
            const symbol = g._getInternalSymbol() === g.options['symbol'] ? defaultSymbol : g._getInternalSymbol();
            const point = map.coordinateToPoint(g.getCoordinates());

            const cacheKey = JSON.stringify(symbol);
            if (!allSymbols[cacheKey]) {
                allSymbols[cacheKey] = symbol;
            }
            markers.push({
                'point' : point,
                'cacheKey' : cacheKey,
                //time to start animation
                'start' : this.layer.options['randomAnimation'] ? Math.random() * this.layer.options['animationDuration'] : 0,
                'g' : g
            });
        });
        this._prepareSprites(allSymbols);
        this._currentMarkers = markers;
    }

    _prepareSprites(allSymbols) {
        this._spriteCache = {};
        for (let p in allSymbols) {
            let symbol = allSymbols[p];
            let sprite = new maptalks.Marker([0, 0], { 'symbol' : symbol })._getSprite(this.resources);
            this._spriteCache[p] = sprite;
        }
    }

    _cancelAnim() {
        maptalks.Util.cancelAnimFrame(this._animId);
        clearTimeout(this._animTimeout);
    }

    onZoomEnd() {
        this._prepare();
        maptalks.renderer.Canvas.prototype.onZoomEnd.apply(this, arguments);
    }

    onRemove() {
        if (this._animId) {
            this._cancelAnim();
        }
        delete this._animFn;
        delete this._spriteCache;
        delete this._currentMarkers;
    }

    _getAnimation() {
        const anim = {
            'fade' : false,
            'scale': false
        };
        const animations = this.layer.options['animation'] ? this.layer.options['animation'].split(',') : [];
        for (let i = 0; i < animations.length; i++) {
            let trim = maptalks.StringUtil.trim(animations[i]);
            if (trim === 'fade') {
                anim.fade = true;
            } else if (trim === 'scale') {
                anim.scale = true;
            }
        }

        return anim;
    }
});

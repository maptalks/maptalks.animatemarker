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
    'randomAnimation' : true,
    'animationDuration' : 3000
    // 'globalCompositeOperation' : 'lighter'
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
            const geo = maptalks.Geometry.fromJSON(geos[i]);
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
        if (this._needUpdate) {
            this._prepare();
            this._needUpdate = false;
        }
        this.prepareCanvas();
        const map = this.getMap();
        let markers = this._currentMarkers;
        if (this._drawnExtent && map.getExtent().equals(this._drawnExtent)) {
            markers = this._drawnMarkers;
        }
        this._drawAllMarkers(markers);
        this._drawnExtent = map.getExtent();
        if (!this.layer.isLoaded()) {
            this.completeRender();
        }
    }

    drawOnInteracting() {
        this._drawAllMarkers(this._drawnMarkers);
    }

    isAnimating() {
        return true;
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

    _redraw() {
        delete this._drawnMarkers;
        delete this._drawnExtent;
        this._needUpdate = true;
    }

    _drawAllMarkers(markers) {
        const map = this.getMap(),
            extent = map.getContainerExtent();
        const now = this._drawnTime = Date.now();
        const anim = this._drawnAnim = this._getAnimation();
        const needCheck = (markers !== this._drawnMarkers);
        if (needCheck) {
            this._drawnMarkers = [];
        }
        markers.forEach(m => {
            if (!needCheck) {
                const point = map._prjToContainerPoint(m.coordinates);
                this._drawMarker(m, point, anim, now);
                return;
            }
            if (!m.g.isVisible()) {
                return;
            }
            const point = map._prjToContainerPoint(m.coordinates);
            if (!extent.contains(point)) {
                return;
            }
            this._drawMarker(m, point, anim, now);
            this._drawnMarkers.push(m);
        }, this);
    }

    _drawMarker(m, point, anim, now) {
        const duration = this.layer.options['animationDuration'];
        const ctx = this.context;
        const globalAlpha = ctx.globalAlpha;
        const r = ((now - m.start) % (duration)) / duration;
        const op = anim.fade ? (r >= 0.5 ? 2 - r * 2 : 1) : 1;
        const scale = anim.scale ? r : 1;
        const key = m['cacheKey'];
        const cache = this._spriteCache[key];
        const offset = cache.offset,
            w = cache.canvas.width,
            h = cache.canvas.height;
        if (cache && op > 0) {
            ctx.globalAlpha = globalAlpha * op;
            ctx.drawImage(cache.canvas, point.x + offset.x - w * scale / 2, point.y + offset.y - h * scale / 2, w * scale, h * scale);
            ctx.globalAlpha = globalAlpha;
        }
    }

    _prepare() {
        const markers = [];
        const allSymbols = {};
        const projection = this.getMap().getProjection();
        this.layer.forEach(g => {
            this._currentGeo = g;
            const symbol = g._getInternalSymbol() === g.options['symbol'] ? defaultSymbol : g._getInternalSymbol();

            const cacheKey = JSON.stringify(symbol);
            if (!allSymbols[cacheKey]) {
                allSymbols[cacheKey] = symbol;
            }
            markers.push({
                'coordinates' :  projection.project(g.getCoordinates()),
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
        for (const p in allSymbols) {
            const symbol = allSymbols[p];
            const sprite = new maptalks.Marker([0, 0], { 'symbol' : symbol })._getSprite(this.resources);
            this._spriteCache[p] = sprite;
        }
    }

    onRemove() {
        delete this._spriteCache;
        delete this._currentMarkers;
        delete this._drawnMarkers;
        delete this._drawnExtent;
    }

    _getAnimation() {
        const anim = {
            'fade' : false,
            'scale': false
        };
        const animations = this.layer.options['animation'] ? this.layer.options['animation'].split(',') : [];
        for (let i = 0; i < animations.length; i++) {
            const trim = trimStr(animations[i]);
            if (trim === 'fade') {
                anim.fade = true;
            } else if (trim === 'scale') {
                anim.scale = true;
            }
        }

        return anim;
    }
});

function trimStr(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

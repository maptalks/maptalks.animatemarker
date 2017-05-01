# maptalks.animatemarker

[![CircleCI](https://circleci.com/gh/maptalks/maptalks.animatemarker.svg?style=shield)](https://circleci.com/gh/MapTalks/maptalks.animatemarker)
[![NPM Version](https://img.shields.io/npm/v/maptalks.animatemarker.svg)](https://github.com/maptalks/maptalks.animatemarker)

A plugin of [maptalks.js](https://github.com/maptalks/maptalks.js) to draw markers with animation.

![screenshot](https://cloud.githubusercontent.com/assets/13678919/25314149/f47fdec6-2870-11e7-9d87-415d98efc4da.png)

## Install
  
* Install with npm: ```npm install maptalks.animatemarker```. 
* Download from [dist directory](https://github.com/maptalks/maptalks.animatemarker/tree/gh-pages/dist).
* Use unpkg CDN: ```https://unpkg.com/maptalks.animatemarker/dist/maptalks.animatemarker.min.js```

## Usage

As a plugin, ```maptalks.animatemarker``` must be loaded after ```maptalks.js``` in browsers.
```html
<script type="text/javascript" src="https://unpkg.com/maptalks/dist/maptalks.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks.animatemarker/dist/maptalks.animatemarker.min.js"></script>
<script>
var data = [marker1, marker2, marker3];
var animMarkerLayer = new maptalks.AnimateMarkerLayer('anim-markers', data).addTo(map);
</script>
```

## Supported Browsers

IE 9-11, Chrome, Firefox, other modern and mobile browsers.

## Examples

* [Locations of this week's earthquakes](https://maptalks.github.io/maptalks.animatemarker/demo/).

## API Reference

```AnimateMarkerLayer``` is a subclass of [maptalks.VectorLayer](http://docs.maptalks.org/api/maptalks.VectorLayer.html) and inherits all the methods of its parent.

### `Constructor`

```javascript
new maptalks.AnimateMarkerLayer(id, data, options)
```

* id **String** layer id
* data **Marker[]** layer data, an array of maptalks.Marker
* options **Object** options
    * animation **String** animation effects: 'scale', 'fade' or 'scale,fade' ('scale,fade' by default)
    * animationDuration **Number** the animation duration (3000 by default)
    * randomAnimation **Boolean** animation begins randomly (true by default)
    * animationOnce **Boolean** whether animation only run once (false by default)
    * fps **Number** fps of animation (24 by default)
    * Other options defined in [maptalks.VectorLayer](http://docs.maptalks.org/api/maptalks.VectorLayer.html)

### `config(key, value)`

config layer's options and redraw the layer if necessary

```javascript
animMarkerLayer.config('animation', 'scale');
```

**Returns** `this`

### `toJSON()`

export the layer's JSON.

```javascript
var json = animMarkerLayer.toJSON();
var animLayer = maptalks.Layer.fromJSON(json);
```
**Returns** `Object`

## Contributing

We welcome any kind of contributions including issue reportings, pull requests, documentation corrections, feature requests and any other helps.

## Develop

The only source file is ```index.js```.

It is written in ES6, transpiled by [babel](https://babeljs.io/) and tested with [mocha](https://mochajs.org) and [expect.js](https://github.com/Automattic/expect.js).

### Scripts

* Install dependencies
```shell
$ npm install
```

* Watch source changes and generate runnable bundle repeatedly
```shell
$ gulp watch
```

* Tests
```shell
$ npm test
```

* Watch source changes and run tests repeatedly
```shell
$ gulp tdd
```

* Package and generate minified bundles to dist directory
```shell
$ gulp minify
```

* Lint
```shell
$ npm run lint
```

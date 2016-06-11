// render a completed PlotterToSvg object
'use strict'

var defaults = require('lodash.defaults')

var xmlElementString = require('./xml-element-string')

module.exports = function(converter, attr, createElement, includeNamespace) {
  var element = createElement || xmlElementString
  var namespace = (includeNamespace == null || includeNamespace === true)
    ? 'http://www.w3.org/2000/svg'
    : null

  var attributes = defaults({}, attr, {
    xmlns: namespace,
    version: '1.1',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '0',
    'fill-rule': 'evenodd',
    width: converter.width + converter.units,
    height: converter.height + converter.units,
    viewBox: converter.viewBox.join(' ')
  })

  var children = []

  if (converter.layer.length) {
    if (converter.defs.length) {
      children.push(element('defs', {}, converter.defs))
    }

    var yTranslate = converter.viewBox[3] + 2 * converter.viewBox[1]
    var transform = 'translate(0,' + yTranslate + ') scale(1,-1)'

    children.push(element('g', {
      transform: transform,
      fill: 'currentColor',
      stroke: 'currentColor'
    }, converter.layer))
  }

  return element('svg', attributes, children)
}

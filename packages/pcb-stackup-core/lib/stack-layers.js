// stack layers function (where the magic happens)
'use strict'

var viewbox = require('viewbox')

var gatherLayers = require('./_gather-layers')

var findLayerId = function(layers, type) {
  var layer
  var i

  for (i = 0; i < layers.length; i++) {
    layer = layers[i]
    if (layer.type === type) {
      return layer.id
    }
  }
}

var useLayer = function(element, id, className, mask) {
  var attr = {'xlink:href': '#' + id}

  if (className) {
    attr.fill = 'currentColor'
    attr.stroke = 'currentColor'
    attr.class = className
  }

  if (mask) {
    attr.mask = 'url(#' + mask + ')'
  }

  return element('use', attr)
}

var createRect = function(element, box, fill, className) {
  var attr = viewbox.rect(box)

  if (fill) {
    attr.fill = fill
  }

  if (className) {
    attr.class = className
  }

  return element('rect', attr)
}

var mechMask = function(element, id, box, drills) {
  var maskAttr = {id: id, fill: '#000', stroke: '#000'}
  var children = drills.map(function(layer) {
    return useLayer(element, layer.id)
  })

  children.unshift(createRect(element, box, '#fff'))

  return element('mask', maskAttr, children)
}

module.exports = function(element, id, side, layers, drills, outline, useOutline) {
  var classPrefix = id + '_'
  var idPrefix = id + '_' + side + '_'
  var mechMaskId = idPrefix + 'mech-mask'

  var layerProps = gatherLayers(element, idPrefix, layers, drills, outline, useOutline)
  var defs = layerProps.defs
  var box = layerProps.box
  var units = layerProps.units

  layers = layerProps.layerIds
  drills = layerProps.drillIds

  defs.push(mechMask(element, mechMaskId, box, drills))

  // build the layer starting with an fr4 rectangle the size of the viewbox
  var layer = [createRect(element, box, 'currentColor', classPrefix + 'fr4')]
  var cuLayerId = findLayerId(layers, 'cu')
  var smLayerId = findLayerId(layers, 'sm')
  var ssLayerId = findLayerId(layers, 'ss')
  var spLayerId = findLayerId(layers, 'sp')
  var outLayerId = layerProps.outlineId

  // add copper and copper finish
  if (cuLayerId) {
    var cfMaskId = idPrefix + 'cf-mask'
    var cfMaskAttr = {id: cfMaskId, fill: '#fff', stroke: '#fff'}
    var cfMaskShape = smLayerId
      ? [useLayer(element, smLayerId)]
      : [createRect(element, box)]

    defs.push(element('mask', cfMaskAttr, cfMaskShape))
    layer.push(useLayer(element, cuLayerId, classPrefix + 'cu'))
    layer.push(useLayer(element, cuLayerId, classPrefix + 'cf', cfMaskId))
  }

  // add soldermask and silkscreen
  // silkscreen will not be added if no soldermask, because that's how it works in RL
  if (smLayerId) {
    // solder mask is... a mask, so mask it
    var smMaskId = idPrefix + 'sm-mask'
    var smMaskAttr = {id: smMaskId, fill: '#000', stroke: '#000'}
    var smMaskShape = [
      createRect(element, box, '#fff'),
      useLayer(element, smLayerId)
    ]

    defs.push(element('mask', smMaskAttr, smMaskShape))

    // add the layer that gets masked
    var smGroupAttr = {mask: 'url(#' + smMaskId + ')'}
    var smGroupShape = [createRect(element, box, 'currentColor', classPrefix + 'sm')]

    if (ssLayerId) {
      smGroupShape.push(useLayer(element, ssLayerId, classPrefix + 'ss'))
    }

    layer.push(element('g', smGroupAttr, smGroupShape))
  }

  // add solderpaste
  if (spLayerId) {
    layer.push(useLayer(element, spLayerId, classPrefix + 'sp'))
  }

  // add board outline if necessary
  if (outLayerId && !useOutline) {
    layer.push(useLayer(element, outLayerId, classPrefix + 'out'))
  }

  return {
    defs: defs,
    layer: layer,
    mechMaskId: mechMaskId,
    outClipId: (outLayerId && useOutline) ? outLayerId : null,
    box: box,
    units: units
  }
}

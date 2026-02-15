// ForkArcade Engine v1 — Immediate-Mode UI
// ENGINE FILE — do not modify in game repos
(function(window) {
  'use strict';
  var FA = window.FA;

  // =====================
  // INTERNAL STATE
  // =====================

  var _stack = [];
  var _pendingClick = null;
  var _frameClick = null;
  var _clickConsumed = false;
  var _lastClicked = null;
  var _hover = {};
  var _mousePos = null;

  // =====================
  // HELPERS
  // =====================

  function _current() {
    return _stack.length > 0 ? _stack[_stack.length - 1] : null;
  }

  function _advance(w, h) {
    var c = _current();
    if (!c) return;
    if (c.layout === 'horizontal') {
      c.curX += w + c.gap;
    } else {
      c.curY += h + c.gap;
    }
  }

  function _hitTest(x, y, w, h) {
    if (!_frameClick || _clickConsumed) return false;
    return _frameClick.x >= x && _frameClick.x < x + w &&
           _frameClick.y >= y && _frameClick.y < y + h;
  }

  function _checkHover(x, y, w, h) {
    if (!_mousePos) return false;
    return _mousePos.x >= x && _mousePos.x < x + w &&
           _mousePos.y >= y && _mousePos.y < y + h;
  }

  function _lighten(hex, amount) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = Math.min(255, parseInt(h.substr(0, 2), 16) + Math.round(amount * 255));
    var g = Math.min(255, parseInt(h.substr(2, 2), 16) + Math.round(amount * 255));
    var b = Math.min(255, parseInt(h.substr(4, 2), 16) + Math.round(amount * 255));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function _textWidth(text, size, bold) {
    var ctx = FA.getCtx();
    var prev = ctx.font;
    ctx.font = (bold ? 'bold ' : '') + size + 'px monospace';
    var w = ctx.measureText(text).width;
    ctx.font = prev;
    return w;
  }

  // =====================
  // PUBLIC API
  // =====================

  var ui = {};

  // --- Frame lifecycle ---

  ui.frame = function() {
    _frameClick = _pendingClick;
    _pendingClick = null;
    _clickConsumed = false;
    _lastClicked = null;
    _hover = {};
    _stack = [];
    _mousePos = FA.getMouse ? FA.getMouse() : null;
  };

  // --- Containers ---

  ui.begin = function(id, opts) {
    opts = opts || {};
    var parent = _current();
    var padding = opts.padding || 0;

    var x = opts.x != null ? opts.x : (parent ? parent.curX : 0);
    var y = opts.y != null ? opts.y : (parent ? parent.curY : 0);
    var w = opts.w != null ? opts.w : (parent ? parent.contentW : (FA.getCanvas ? FA.getCanvas().width : 800));
    var h = opts.h || 0;

    // Draw background
    if (opts.bg) {
      FA.draw.rect(x, y, w, h, opts.bg);
    }

    // Draw border
    if (opts.border) {
      FA.draw.strokeRect(x, y, w, h, opts.border, opts.borderWidth || 1);
    }

    _stack.push({
      id: id,
      x: x,
      y: y,
      w: w,
      h: h,
      padding: padding,
      layout: opts.layout || 'vertical',
      gap: opts.gap || 0,
      align: opts.align || 'left',
      curX: x + padding,
      curY: y + padding,
      contentW: w - padding * 2,
      startY: y + padding
    });
  };

  ui.end = function() {
    var popped = _stack.pop();
    if (!popped) return;
    var parent = _current();
    if (parent) {
      var consumed = popped.curY - popped.startY;
      _advance(popped.w, consumed);
    }
  };

  // --- Components ---

  ui.label = function(text, opts) {
    var c = _current();
    if (!c) return;
    opts = opts || {};

    var size = opts.size || 12;
    var color = opts.color || '#fff';
    var bold = opts.bold || false;
    var align = opts.align || c.align;
    var h = size + 4;

    var tx = c.curX;
    if (align === 'center') tx = c.curX + c.contentW / 2;
    else if (align === 'right') tx = c.curX + c.contentW;

    FA.draw.text(text, tx, c.curY, {
      color: color, size: size, bold: bold, align: align
    });

    var advW = c.layout === 'horizontal' ? _textWidth(text, size, bold) + 4 : c.contentW;
    _advance(advW, h);
  };

  ui.stat = function(label, value, opts) {
    var c = _current();
    if (!c) return;
    opts = opts || {};

    var size = opts.size || 12;
    var labelColor = opts.labelColor || '#888';
    var valueColor = opts.valueColor || '#fff';
    var bold = opts.bold !== false;
    var h = size + 4;

    var labelText = label + ': ';
    var valueText = String(value);
    var labelW = _textWidth(labelText, size, false);
    var gap = opts.gap != null ? opts.gap : 4;

    FA.draw.text(labelText, c.curX, c.curY, {
      color: labelColor, size: size
    });
    FA.draw.text(valueText, c.curX + labelW + gap, c.curY, {
      color: valueColor, size: size, bold: bold
    });

    var advW = c.layout === 'horizontal' ? labelW + gap + _textWidth(valueText, size, bold) + 4 : c.contentW;
    _advance(advW, h);
  };

  ui.button = function(id, text, opts) {
    var c = _current();
    opts = opts || {};

    var x = c ? c.curX : (opts.x || 0);
    var y = c ? c.curY : (opts.y || 0);
    var w = opts.w || (c ? c.contentW : 100);
    var h = opts.h || 32;
    var locked = opts.locked || false;
    var selected = opts.selected || false;
    var subtitle = opts.subtitle || null;
    var size = opts.size || 14;
    var bold = opts.bold !== false;
    var align = opts.align || 'center';

    // Hover
    var hovered = !locked && _checkHover(x, y, w, h);
    if (hovered) _hover[id] = true;

    // Colors by state
    var bg, borderColor, borderW, textColor, subColor;
    if (locked) {
      bg = '#222';
      textColor = '#555';
      subColor = '#333';
      borderColor = null;
      borderW = 0;
    } else if (selected) {
      bg = opts.bg ? opts.bg : '#4a6a2a';
      borderColor = '#ffd700';
      borderW = 2;
      textColor = opts.color || '#fff';
      subColor = '#aaa';
    } else {
      bg = opts.bg || '#2d4a3e';
      borderColor = opts.border || null;
      borderW = opts.borderWidth || 1;
      textColor = opts.color || '#fff';
      subColor = '#999';
      if (hovered) bg = _lighten(bg, 0.12);
    }

    // Background
    FA.draw.rect(x, y, w, h, bg);

    // Border
    if (borderColor) {
      FA.draw.strokeRect(x, y, w, h, borderColor, borderW);
    }

    // Text position
    var tx;
    if (align === 'center') tx = x + w / 2;
    else if (align === 'right') tx = x + w - 8;
    else tx = x + 8;

    if (subtitle) {
      var mainY = y + h / 2 - size / 2 - 4;
      var subY = y + h / 2 + 4;
      FA.draw.text(text, tx, mainY, { color: textColor, size: size, bold: bold, align: align });
      FA.draw.text(subtitle, tx, subY, { color: subColor, size: Math.max(9, size - 3), align: align });
    } else {
      var textY = y + (h - size) / 2 - 1;
      FA.draw.text(text, tx, textY, { color: textColor, size: size, bold: bold, align: align });
    }

    // Advance cursor
    if (c) _advance(w, h);

    // Click detection
    if (!locked && _hitTest(x, y, w, h)) {
      _clickConsumed = true;
      _lastClicked = id;
      return true;
    }
    return false;
  };

  ui.bar = function(value, max, opts) {
    var c = _current();
    if (!c) return;
    opts = opts || {};

    var x = c.curX;
    var y = c.curY;
    var w = opts.w || c.contentW;
    var h = opts.h || 8;
    var fg = opts.fg || '#4f4';
    var bg = opts.bg || '#222';
    var ratio = max > 0 ? FA.clamp(value / max, 0, 1) : 0;

    // Background
    FA.draw.rect(x, y, w, h, bg);

    // Fill
    if (ratio > 0) {
      FA.draw.rect(x, y, Math.round(w * ratio), h, fg);
    }

    // Border
    if (opts.border) {
      FA.draw.strokeRect(x, y, w, h, opts.border, 1);
    }

    // Label
    if (opts.label) {
      FA.draw.text(opts.label, x + w / 2, y + (h - 10) / 2, {
        color: opts.labelColor || '#fff', size: opts.labelSize || 10, align: 'center'
      });
    }

    _advance(w, h);
  };

  ui.separator = function(opts) {
    var c = _current();
    if (!c) return;
    opts = opts || {};
    var color = opts.color || '#444';
    var h = opts.h || 1;

    FA.draw.rect(c.curX, c.curY, c.contentW, h, color);
    _advance(c.contentW, h);
  };

  ui.space = function(px) {
    var c = _current();
    if (!c) return;
    _advance(px, px);
  };

  // --- Overlays ---

  ui.overlay = function(alpha, color) {
    alpha = alpha != null ? alpha : 0.6;
    color = color || '#000';
    var canvas = FA.getCanvas();
    FA.draw.withAlpha(alpha, function() {
      FA.draw.rect(0, 0, canvas.width, canvas.height, color);
    });
  };

  // --- Queries ---

  ui.clicked = function() {
    return _lastClicked;
  };

  ui.isHover = function(id) {
    return !!_hover[id];
  };

  // =====================
  // EVENT HOOKS
  // =====================

  FA.on('input:click', function(pos) {
    if (pos && pos.x != null) {
      _pendingClick = { x: pos.x, y: pos.y };
    }
  });

  FA.on('state:reset', function() {
    _stack = [];
    _pendingClick = null;
    _frameClick = null;
    _clickConsumed = false;
    _lastClicked = null;
    _hover = {};
  });

  FA.ui = ui;

})(window);

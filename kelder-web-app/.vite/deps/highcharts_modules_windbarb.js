import {
  __commonJS
} from "./chunk-BUSYA2B4.js";

// node_modules/highcharts/modules/windbarb.js
var require_windbarb = __commonJS({
  "node_modules/highcharts/modules/windbarb.js"(exports, module) {
    !/**
    * Highcharts JS v12.1.2 (2024-12-21)
    * @module highcharts/modules/windbarb
    * @requires highcharts
    *
    * Wind barb series module
    *
    * (c) 2010-2024 Torstein Honsi
    *
    * License: www.highcharts.com/license
    */
    function(t, e) {
      "object" == typeof exports && "object" == typeof module ? module.exports = e(t._Highcharts, t._Highcharts.dataGrouping.approximations, t._Highcharts.Series.types.column, t._Highcharts.Series, t._Highcharts.SeriesRegistry) : "function" == typeof define && define.amd ? define("highcharts/modules/windbarb", ["highcharts/highcharts"], function(t2) {
        return e(t2, t2.dataGrouping, ["approximations"], t2.Series, ["types"], ["column"], t2.Series, t2.SeriesRegistry);
      }) : "object" == typeof exports ? exports["highcharts/modules/windbarb"] = e(t._Highcharts, t._Highcharts.dataGrouping.approximations, t._Highcharts.Series.types.column, t._Highcharts.Series, t._Highcharts.SeriesRegistry) : t.Highcharts = e(t.Highcharts, t.Highcharts.dataGrouping.approximations, t.Highcharts.Series.types.column, t.Highcharts.Series, t.Highcharts.SeriesRegistry);
    }("undefined" == typeof window ? exports : window, (t, e, r, o, i) => (() => {
      "use strict";
      var s, a = { 448: (t2) => {
        t2.exports = r;
      }, 820: (t2) => {
        t2.exports = o;
      }, 512: (t2) => {
        t2.exports = i;
      }, 956: (t2) => {
        t2.exports = e;
      }, 944: (e2) => {
        e2.exports = t;
      } }, n = {};
      function l(t2) {
        var e2 = n[t2];
        if (void 0 !== e2) return e2.exports;
        var r2 = n[t2] = { exports: {} };
        return a[t2](r2, r2.exports, l), r2.exports;
      }
      l.n = (t2) => {
        var e2 = t2 && t2.__esModule ? () => t2.default : () => t2;
        return l.d(e2, { a: e2 }), e2;
      }, l.d = (t2, e2) => {
        for (var r2 in e2) l.o(e2, r2) && !l.o(t2, r2) && Object.defineProperty(t2, r2, { enumerable: true, get: e2[r2] });
      }, l.o = (t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2);
      var p = {};
      l.d(p, { default: () => W });
      var h = l(944), c = l.n(h), u = l(956), d = l.n(u), f = l(448), g = l.n(f), x = l(820), y = l.n(x);
      let { composed: b } = c(), { prototype: m } = g(), { prototype: v } = y(), { defined: S, pushUnique: w, stableSort: L } = c();
      !function(t2) {
        function e2(t3) {
          return v.getPlotBox.call(this.options.onSeries && this.chart.get(this.options.onSeries) || this, t3);
        }
        function r2() {
          var _a, _b;
          m.translate.apply(this);
          let t3 = this, e3 = t3.options, r3 = t3.chart, o2 = t3.points, i2 = e3.onSeries, s2 = i2 && r3.get(i2), a2 = s2 && s2.options.step, n2 = s2 && s2.points, l2 = r3.inverted, p2 = t3.xAxis, h2 = t3.yAxis, c2 = o2.length - 1, u2, d2, f2 = e3.onKey || "y", g2 = n2 && n2.length, x2 = 0, y2, b2, v2, w2, H2;
          if (s2 && s2.visible && g2) {
            for (x2 = (s2.pointXOffset || 0) + (s2.barW || 0) / 2, w2 = s2.currentDataGrouping, b2 = n2[g2 - 1].x + (w2 ? w2.totalRange : 0), L(o2, (t4, e4) => t4.x - e4.x), f2 = "plot" + f2[0].toUpperCase() + f2.substr(1); g2-- && o2[c2]; ) if (y2 = n2[g2], (u2 = o2[c2]).y = y2.y, y2.x <= u2.x && void 0 !== y2[f2]) {
              if (u2.x <= b2 && (u2.plotY = y2[f2], y2.x < u2.x && !a2 && (v2 = n2[g2 + 1]) && void 0 !== v2[f2])) {
                if (S(u2.plotX) && s2.is("spline")) {
                  let t4 = [y2.plotX || 0, y2.plotY || 0], e4 = [v2.plotX || 0, v2.plotY || 0], r4 = ((_a = y2.controlPoints) == null ? void 0 : _a.high) || t4, o3 = ((_b = v2.controlPoints) == null ? void 0 : _b.low) || e4, i3 = (i4, s4) => Math.pow(1 - i4, 3) * t4[s4] + 3 * (1 - i4) * (1 - i4) * i4 * r4[s4] + 3 * (1 - i4) * i4 * i4 * o3[s4] + i4 * i4 * i4 * e4[s4], s3 = 0, a3 = 1, n3;
                  for (let t5 = 0; t5 < 100; t5++) {
                    let t6 = (s3 + a3) / 2, e5 = i3(t6, 0);
                    if (null === e5) break;
                    if (0.25 > Math.abs(e5 - u2.plotX)) {
                      n3 = t6;
                      break;
                    }
                    e5 < u2.plotX ? s3 = t6 : a3 = t6;
                  }
                  S(n3) && (u2.plotY = i3(n3, 1), u2.y = h2.toValue(u2.plotY, true));
                } else H2 = (u2.x - y2.x) / (v2.x - y2.x), u2.plotY += H2 * (v2[f2] - y2[f2]), u2.y += H2 * (v2.y - y2.y);
              }
              if (c2--, g2++, c2 < 0) break;
            }
          }
          o2.forEach((e4, r4) => {
            let i3;
            e4.plotX += x2, (void 0 === e4.plotY || l2) && (e4.plotX >= 0 && e4.plotX <= p2.len ? l2 ? (e4.plotY = p2.translate(e4.x, 0, 1, 0, 1), e4.plotX = S(e4.y) ? h2.translate(e4.y, 0, 0, 0, 1) : 0) : e4.plotY = (p2.opposite ? 0 : t3.yAxis.len) + p2.offset : e4.shapeArgs = {}), (d2 = o2[r4 - 1]) && d2.plotX === e4.plotX && (void 0 === d2.stackIndex && (d2.stackIndex = 0), i3 = d2.stackIndex + 1), e4.stackIndex = i3;
          }), this.onSeries = s2;
        }
        t2.compose = function(t3) {
          if (w(b, "OnSeries")) {
            let o2 = t3.prototype;
            o2.getPlotBox = e2, o2.translate = r2;
          }
          return t3;
        }, t2.getPlotBox = e2, t2.translate = r2;
      }(s || (s = {}));
      let H = s;
      var X = l(512), k = l.n(X);
      let { isNumber: G } = c();
      class M extends g().prototype.pointClass {
        isValid() {
          return G(this.value) && this.value >= 0;
        }
      }
      let { animObject: O } = c(), { column: P } = k().seriesTypes, { extend: A, merge: Y, pick: _ } = c();
      class I extends P {
        init(t2, e2) {
          super.init(t2, e2);
        }
        pointAttribs(t2, e2) {
          let r2 = this.options, o2 = t2.color || this.color, i2 = this.options.lineWidth;
          return e2 && (o2 = r2.states[e2].color || o2, i2 = (r2.states[e2].lineWidth || i2) + (r2.states[e2].lineWidthPlus || 0)), { stroke: o2, "stroke-width": i2 };
        }
        windArrow(t2) {
          let e2 = t2.beaufortLevel, r2 = this.options.vectorLength / 20, o2 = 1.943844 * t2.value, i2, s2 = -10;
          if (t2.isNull) return [];
          if (0 === e2) return this.chart.renderer.symbols.circle(-10 * r2, -10 * r2, 20 * r2, 20 * r2);
          let a2 = [["M", 0, 7 * r2], ["L", -1.5 * r2, 7 * r2], ["L", 0, 10 * r2], ["L", 1.5 * r2, 7 * r2], ["L", 0, 7 * r2], ["L", 0, -10 * r2]];
          if ((i2 = (o2 - o2 % 50) / 50) > 0) for (; i2--; ) a2.push(-10 === s2 ? ["L", 0, s2 * r2] : ["M", 0, s2 * r2], ["L", 5 * r2, s2 * r2 + 2], ["L", 0, s2 * r2 + 4]), o2 -= 50, s2 += 7;
          if ((i2 = (o2 - o2 % 10) / 10) > 0) for (; i2--; ) a2.push(-10 === s2 ? ["L", 0, s2 * r2] : ["M", 0, s2 * r2], ["L", 7 * r2, s2 * r2]), o2 -= 10, s2 += 3;
          if ((i2 = (o2 - o2 % 5) / 5) > 0) for (; i2--; ) a2.push(-10 === s2 ? ["L", 0, s2 * r2] : ["M", 0, s2 * r2], ["L", 4 * r2, s2 * r2]), o2 -= 5, s2 += 3;
          return a2;
        }
        drawPoints() {
          let t2 = this.chart, e2 = this.yAxis, r2 = t2.inverted, o2 = this.options.vectorLength / 2;
          for (let i2 of this.points) {
            let s2 = i2.plotX, a2 = i2.plotY;
            false === this.options.clip || t2.isInsidePlot(s2, 0) ? (i2.graphic || (i2.graphic = this.chart.renderer.path().add(this.markerGroup).addClass("highcharts-point highcharts-color-" + _(i2.colorIndex, i2.series.colorIndex))), i2.graphic.attr({ d: this.windArrow(i2), translateX: s2 + this.options.xOffset, translateY: a2 + this.options.yOffset, rotation: i2.direction }), this.chart.styledMode || i2.graphic.attr(this.pointAttribs(i2))) : i2.graphic && (i2.graphic = i2.graphic.destroy()), i2.tooltipPos = [s2 + this.options.xOffset + (r2 && !this.onSeries ? o2 : 0), a2 + this.options.yOffset - (r2 ? 0 : o2 + e2.pos - t2.plotTop)];
          }
        }
        animate(t2) {
          t2 ? this.markerGroup.attr({ opacity: 0.01 }) : this.markerGroup.animate({ opacity: 1 }, O(this.options.animation));
        }
        markerAttribs() {
          return {};
        }
        getExtremes() {
          return {};
        }
        shouldShowTooltip(t2, e2, r2 = {}) {
          return r2.ignoreX = this.chart.inverted, r2.ignoreY = !r2.ignoreX, super.shouldShowTooltip(t2, e2, r2);
        }
      }
      I.defaultOptions = Y(P.defaultOptions, { dataGrouping: { enabled: true, approximation: "windbarb", groupPixelWidth: 30 }, lineWidth: 2, onSeries: null, states: { hover: { lineWidthPlus: 0 } }, tooltip: { pointFormat: '<span style="color:{point.color}">●</span> {series.name}: <b>{point.value}</b> ({point.beaufort})<br/>' }, vectorLength: 20, colorKey: "value", yOffset: -20, xOffset: 0 }), H.compose(I), A(I.prototype, { beaufortFloor: [0, 0.3, 1.6, 3.4, 5.5, 8, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7], beaufortName: ["Calm", "Light air", "Light breeze", "Gentle breeze", "Moderate breeze", "Fresh breeze", "Strong breeze", "Near gale", "Gale", "Strong gale", "Storm", "Violent storm", "Hurricane"], invertible: false, parallelArrays: ["x", "value", "direction"], pointArrayMap: ["value", "direction"], pointClass: M, trackerGroups: ["markerGroup"], translate: function() {
        let t2 = this.beaufortFloor, e2 = this.beaufortName;
        for (let r2 of (H.translate.call(this), this.points)) {
          let o2 = 0;
          for (; o2 < t2.length && !(t2[o2] > r2.value); o2++) ;
          r2.beaufortLevel = o2 - 1, r2.beaufort = e2[o2 - 1];
        }
      } }), k().registerSeriesType("windbarb", I), d().windbarb || (d().windbarb = (t2, e2) => {
        let r2 = 0, o2 = 0;
        for (let i2 = 0, s2 = t2.length; i2 < s2; i2++) r2 += t2[i2] * Math.cos(e2[i2] * c().deg2rad), o2 += t2[i2] * Math.sin(e2[i2] * c().deg2rad);
        return [t2.reduce((t3, e3) => t3 + e3, 0) / t2.length, Math.atan2(o2, r2) / c().deg2rad];
      });
      let W = c();
      return p.default;
    })());
  }
});
export default require_windbarb();
//# sourceMappingURL=highcharts_modules_windbarb.js.map

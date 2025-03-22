import {
  __commonJS
} from "./chunk-BUSYA2B4.js";

// node_modules/highcharts/modules/datagrouping.js
var require_datagrouping = __commonJS({
  "node_modules/highcharts/modules/datagrouping.js"(exports, module) {
    !/**
    * Highstock JS v12.1.2 (2024-12-21)
    * @module highcharts/modules/datagrouping
    * @requires highcharts
    *
    * Data grouping module
    *
    * (c) 2010-2024 Torstein Hønsi
    *
    * License: www.highcharts.com/license
    */
    function(t, e) {
      "object" == typeof exports && "object" == typeof module ? module.exports = e(t._Highcharts, t._Highcharts.SeriesRegistry, t._Highcharts.Templating) : "function" == typeof define && define.amd ? define("highcharts/modules/datagrouping", ["highcharts/highcharts"], function(t2) {
        return e(t2, t2.SeriesRegistry, t2.Templating);
      }) : "object" == typeof exports ? exports["highcharts/modules/datagrouping"] = e(t._Highcharts, t._Highcharts.SeriesRegistry, t._Highcharts.Templating) : t.Highcharts = e(t.Highcharts, t.Highcharts.SeriesRegistry, t.Highcharts.Templating);
    }("undefined" == typeof window ? exports : window, (t, e, i) => (() => {
      "use strict";
      let o;
      var a, n = { 512: (t2) => {
        t2.exports = e;
      }, 984: (t2) => {
        t2.exports = i;
      }, 944: (e2) => {
        e2.exports = t;
      } }, r = {};
      function s(t2) {
        var e2 = r[t2];
        if (void 0 !== e2) return e2.exports;
        var i2 = r[t2] = { exports: {} };
        return n[t2](i2, i2.exports, s), i2.exports;
      }
      s.n = (t2) => {
        var e2 = t2 && t2.__esModule ? () => t2.default : () => t2;
        return s.d(e2, { a: e2 }), e2;
      }, s.d = (t2, e2) => {
        for (var i2 in e2) s.o(e2, i2) && !s.o(t2, i2) && Object.defineProperty(t2, i2, { enumerable: true, get: e2[i2] });
      }, s.o = (t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2);
      var l = {};
      s.d(l, { default: () => tm });
      var u = s(944), h = s.n(u);
      let p = {}, { arrayMax: d, arrayMin: c, correctFloat: g, extend: m, isNumber: f } = h();
      function x(t2) {
        let e2 = t2.length, i2 = y(t2);
        return f(i2) && e2 && (i2 = g(i2 / e2)), i2;
      }
      function y(t2) {
        let e2 = t2.length, i2;
        if (!e2 && t2.hasNulls) i2 = null;
        else if (e2) for (i2 = 0; e2--; ) i2 += t2[e2];
        return i2;
      }
      let G = { average: x, averages: function() {
        let t2 = [];
        return [].forEach.call(arguments, function(e2) {
          t2.push(x(e2));
        }), void 0 === t2[0] ? void 0 : t2;
      }, close: function(t2) {
        return t2.length ? t2[t2.length - 1] : t2.hasNulls ? null : void 0;
      }, high: function(t2) {
        return t2.length ? d(t2) : t2.hasNulls ? null : void 0;
      }, hlc: function(t2, e2, i2) {
        if (t2 = p.high(t2), e2 = p.low(e2), i2 = p.close(i2), f(t2) || f(e2) || f(i2)) return [t2, e2, i2];
      }, low: function(t2) {
        return t2.length ? c(t2) : t2.hasNulls ? null : void 0;
      }, ohlc: function(t2, e2, i2, o2) {
        if (t2 = p.open(t2), e2 = p.high(e2), i2 = p.low(i2), o2 = p.close(o2), f(t2) || f(e2) || f(i2) || f(o2)) return [t2, e2, i2, o2];
      }, open: function(t2) {
        return t2.length ? t2[0] : t2.hasNulls ? null : void 0;
      }, range: function(t2, e2) {
        return (t2 = p.low(t2), e2 = p.high(e2), f(t2) || f(e2)) ? [t2, e2] : null === t2 && null === e2 ? null : void 0;
      }, sum: y };
      m(p, G);
      let M = { common: { groupPixelWidth: 2, dateTimeLabelFormats: { millisecond: ["%[AebHMSL]", "%[AebHMSL]", "-%[HMSL]"], second: ["%[AebHMS]", "%[AebHMS]", "-%[HMS]"], minute: ["%[AebHM]", "%[AebHM]", "-%[HM]"], hour: ["%[AebHM]", "%[AebHM]", "-%[HM]"], day: ["%[AebY]", "%[Aeb]", "-%[AebY]"], week: ["week from %[AebY]", "%[Aeb]", "-%[AebY]"], month: ["%[BY]", "%[B]", "-%[BY]"], year: ["%Y", "%Y", "-%Y"] } }, seriesSpecific: { line: {}, spline: {}, area: {}, areaspline: {}, arearange: {}, column: { groupPixelWidth: 10 }, columnrange: { groupPixelWidth: 10 }, candlestick: { groupPixelWidth: 10 }, ohlc: { groupPixelWidth: 5 }, hlc: { groupPixelWidth: 5 }, heikinashi: { groupPixelWidth: 10 } }, units: [["millisecond", [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]], ["second", [1, 2, 5, 10, 15, 30]], ["minute", [1, 2, 5, 10, 15, 30]], ["hour", [1, 2, 3, 4, 6, 8, 12]], ["day", [1]], ["week", [1]], ["month", [1, 3, 6]], ["year", null]] }, { addEvent: v, extend: b, merge: T, pick: D } = h();
      function S(t2) {
        let e2 = this, i2 = e2.series;
        i2.forEach(function(t3) {
          t3.groupPixelWidth = void 0;
        }), i2.forEach(function(i3) {
          i3.groupPixelWidth = e2.getGroupPixelWidth && e2.getGroupPixelWidth(), i3.groupPixelWidth && (i3.hasProcessed = true), i3.applyGrouping(!!t2.hasExtremesChanged);
        });
      }
      function C() {
        let t2 = this.series, e2 = t2.length, i2 = 0, o2 = false, a2, n2;
        for (; e2--; ) (n2 = t2[e2].options.dataGrouping) && (i2 = Math.max(i2, D(n2.groupPixelWidth, M.common.groupPixelWidth)), a2 = (t2[e2].dataTable.modified || t2[e2].dataTable).rowCount, (t2[e2].groupPixelWidth || a2 > this.chart.plotSizeX / i2 || a2 && n2.forced) && (o2 = true));
        return o2 ? i2 : 0;
      }
      function w() {
        this.series.forEach(function(t2) {
          t2.hasProcessed = false;
        });
      }
      function A(t2, e2) {
        let i2;
        if (e2 = D(e2, true), t2 || (t2 = { forced: false, units: null }), this instanceof o) for (i2 = this.series.length; i2--; ) this.series[i2].update({ dataGrouping: t2 }, false);
        else this.chart.options.series.forEach(function(e3) {
          e3.dataGrouping = "boolean" == typeof t2 ? t2 : T(t2, e3.dataGrouping);
        });
        this.ordinal && (this.ordinal.slope = void 0), e2 && this.chart.redraw();
      }
      let P = { compose: function(t2) {
        o = t2;
        let e2 = t2.prototype;
        e2.applyGrouping || (v(t2, "afterSetScale", w), v(t2, "postProcessData", S), b(e2, { applyGrouping: S, getGroupPixelWidth: C, setDataGrouping: A }));
      } }, { fireEvent: k, isArray: H, objectEach: R, uniqueKey: F } = h(), W = class {
        constructor(t2 = {}) {
          this.autoId = !t2.id, this.columns = {}, this.id = t2.id || F(), this.modified = this, this.rowCount = 0, this.versionTag = F();
          let e2 = 0;
          R(t2.columns || {}, (t3, i2) => {
            this.columns[i2] = t3.slice(), e2 = Math.max(e2, t3.length);
          }), this.applyRowCount(e2);
        }
        applyRowCount(t2) {
          this.rowCount = t2, R(this.columns, (e2) => {
            H(e2) && (e2.length = t2);
          });
        }
        getColumn(t2, e2) {
          return this.columns[t2];
        }
        getColumns(t2, e2) {
          return (t2 || Object.keys(this.columns)).reduce((t3, e3) => (t3[e3] = this.columns[e3], t3), {});
        }
        getRow(t2, e2) {
          return (e2 || Object.keys(this.columns)).map((e3) => {
            var _a;
            return (_a = this.columns[e3]) == null ? void 0 : _a[t2];
          });
        }
        setColumn(t2, e2 = [], i2 = 0, o2) {
          this.setColumns({ [t2]: e2 }, i2, o2);
        }
        setColumns(t2, e2, i2) {
          let o2 = this.rowCount;
          R(t2, (t3, e3) => {
            this.columns[e3] = t3.slice(), o2 = t3.length;
          }), this.applyRowCount(o2), (i2 == null ? void 0 : i2.silent) || (k(this, "afterSetColumns"), this.versionTag = F());
        }
        setRow(t2, e2 = this.rowCount, i2, o2) {
          let { columns: a2 } = this, n2 = i2 ? this.rowCount + 1 : e2 + 1;
          R(t2, (t3, r2) => {
            let s2 = a2[r2] || (o2 == null ? void 0 : o2.addColumns) !== false && Array(n2);
            s2 && (i2 ? s2.splice(e2, 0, t3) : s2[e2] = t3, a2[r2] = s2);
          }), n2 > this.rowCount && this.applyRowCount(n2), (o2 == null ? void 0 : o2.silent) || (k(this, "afterSetRows"), this.versionTag = F());
        }
      }, { addEvent: O, getMagnitude: E, normalizeTickInterval: N, timeUnits: I } = h();
      !function(t2) {
        function e2() {
          return this.chart.time.getTimeTicks.apply(this.chart.time, arguments);
        }
        function i2() {
          if ("datetime" !== this.type) {
            this.dateTime = void 0;
            return;
          }
          this.dateTime || (this.dateTime = new o2(this));
        }
        t2.compose = function(t3) {
          return t3.keepProps.includes("dateTime") || (t3.keepProps.push("dateTime"), t3.prototype.getTimeTicks = e2, O(t3, "afterSetType", i2)), t3;
        };
        class o2 {
          constructor(t3) {
            this.axis = t3;
          }
          normalizeTimeTickInterval(t3, e3) {
            let i3 = e3 || [["millisecond", [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]], ["second", [1, 2, 5, 10, 15, 30]], ["minute", [1, 2, 5, 10, 15, 30]], ["hour", [1, 2, 3, 4, 6, 8, 12]], ["day", [1, 2]], ["week", [1, 2]], ["month", [1, 2, 3, 4, 6]], ["year", null]], o3 = i3[i3.length - 1], a2 = I[o3[0]], n2 = o3[1], r2;
            for (r2 = 0; r2 < i3.length && (a2 = I[(o3 = i3[r2])[0]], n2 = o3[1], !i3[r2 + 1] || !(t3 <= (a2 * n2[n2.length - 1] + I[i3[r2 + 1][0]]) / 2)); r2++) ;
            a2 === I.year && t3 < 5 * a2 && (n2 = [1, 2, 5]);
            let s2 = N(t3 / a2, n2, "year" === o3[0] ? Math.max(E(t3 / a2), 1) : 1);
            return { unitRange: a2, count: s2, unitName: o3[0] };
          }
          getXDateFormat(t3, e3) {
            let { axis: i3 } = this, o3 = i3.chart.time;
            return i3.closestPointRange ? o3.getDateFormat(i3.closestPointRange, t3, i3.options.startOfWeek, e3) || o3.resolveDTLFormat(e3.year).main : o3.resolveDTLFormat(e3.day).main;
          }
        }
        t2.Additions = o2;
      }(a || (a = {}));
      let L = a;
      var Y = s(512);
      let { series: { prototype: j } } = s.n(Y)(), { addEvent: _, defined: z, error: X, extend: q, isNumber: B, merge: J, pick: K, splat: Q } = h(), U = j.generatePoints;
      function V(t2) {
        var e2;
        let i2, o2;
        let a2 = this.chart, n2 = this.options.dataGrouping, r2 = false !== this.allowDG && n2 && K(n2.enabled, a2.options.isStock), s2 = this.reserveSpace(), l2 = this.currentDataGrouping, u2, h2, p2 = false;
        r2 && !this.requireSorting && (this.requireSorting = p2 = true);
        let d2 = false == !(this.isCartesian && !this.isDirty && !this.xAxis.isDirty && !this.yAxis.isDirty && !t2) || !r2;
        if (p2 && (this.requireSorting = false), d2) return;
        this.destroyGroupedData();
        let c2 = n2.groupAll ? this.dataTable : this.dataTable.modified || this.dataTable, g2 = this.getColumn("x", !n2.groupAll), m2 = a2.plotSizeX, f2 = this.xAxis, x2 = f2.getExtremes(), y2 = f2.options.ordinal, G2 = this.groupPixelWidth;
        if (G2 && g2 && c2.rowCount && m2 && B(x2.min)) {
          o2 = true, this.isDirty = true, this.points = null;
          let t3 = x2.min, r3 = x2.max, l3 = y2 && f2.ordinal && f2.ordinal.getGroupIntervalFactor(t3, r3, this) || 1, p3 = G2 * (r3 - t3) / m2 * l3, d3 = f2.getTimeTicks(L.Additions.prototype.normalizeTimeTickInterval(p3, n2.units || M.units), Math.min(t3, g2[0]), Math.max(r3, g2[g2.length - 1]), f2.options.startOfWeek, g2, this.closestPointRange), v2 = j.groupData.apply(this, [c2, d3, n2.approximation]), b2 = v2.modified, T2 = b2.getColumn("x", true), D2 = 0;
          for ((n2 == null ? void 0 : n2.smoothed) && b2.rowCount && (n2.firstAnchor = "firstPoint", n2.anchor = "middle", n2.lastAnchor = "lastPoint", X(32, false, a2, { "dataGrouping.smoothed": "use dataGrouping.anchor" })), i2 = 1; i2 < d3.length; i2++) d3.info.segmentStarts && -1 !== d3.info.segmentStarts.indexOf(i2) || (D2 = Math.max(d3[i2] - d3[i2 - 1], D2));
          (u2 = d3.info).gapSize = D2, this.closestPointRange = d3.info.totalRange, this.groupMap = v2.groupMap, this.currentDataGrouping = u2, !function(t4, e3, i3) {
            let o3 = t4.options.dataGrouping, a3 = t4.currentDataGrouping && t4.currentDataGrouping.gapSize, n3 = t4.getColumn("x");
            if (!(o3 && n3.length && a3 && t4.groupMap)) return;
            let r4 = e3.length - 1, s3 = o3.anchor, l4 = o3.firstAnchor, u3 = o3.lastAnchor, h3 = e3.length - 1, p4 = 0;
            if (l4 && n3[0] >= e3[0]) {
              let i4;
              p4++;
              let o4 = t4.groupMap[0].start, r5 = t4.groupMap[0].length;
              B(o4) && B(r5) && (i4 = o4 + (r5 - 1)), e3[0] = { start: e3[0], middle: e3[0] + 0.5 * a3, end: e3[0] + a3, firstPoint: n3[0], lastPoint: i4 && n3[i4] }[l4];
            }
            if (r4 > 0 && u3 && a3 && e3[r4] >= i3 - a3) {
              h3--;
              let i4 = t4.groupMap[t4.groupMap.length - 1].start;
              e3[r4] = { start: e3[r4], middle: e3[r4] + 0.5 * a3, end: e3[r4] + a3, firstPoint: i4 && n3[i4], lastPoint: n3[n3.length - 1] }[u3];
            }
            if (s3 && "start" !== s3) {
              let t5 = a3 * { middle: 0.5, end: 1 }[s3];
              for (; h3 >= p4; ) e3[h3] += t5, h3--;
            }
          }(this, T2 || [], r3), s2 && T2 && (z((e2 = T2)[0]) && B(f2.min) && B(f2.dataMin) && e2[0] < f2.min && ((!z(f2.options.min) && f2.min <= f2.dataMin || f2.min === f2.dataMin) && (f2.min = Math.min(e2[0], f2.min)), f2.dataMin = Math.min(e2[0], f2.dataMin)), z(e2[e2.length - 1]) && B(f2.max) && B(f2.dataMax) && e2[e2.length - 1] > f2.max && ((!z(f2.options.max) && B(f2.dataMax) && f2.max >= f2.dataMax || f2.max === f2.dataMax) && (f2.max = Math.max(e2[e2.length - 1], f2.max)), f2.dataMax = Math.max(e2[e2.length - 1], f2.dataMax))), n2.groupAll && (this.allGroupedTable = b2, T2 = (b2 = (h2 = this.cropData(b2, f2.min || 0, f2.max || 0)).modified).getColumn("x"), this.cropStart = h2.start), this.dataTable.modified = b2;
        } else this.groupMap = void 0, this.currentDataGrouping = void 0;
        this.hasGroupedData = o2, this.preventGraphAnimation = (l2 && l2.totalRange) !== (u2 && u2.totalRange);
      }
      function Z() {
        this.groupedData && (this.groupedData.forEach(function(t2, e2) {
          t2 && (this.groupedData[e2] = t2.destroy ? t2.destroy() : null);
        }, this), this.groupedData.length = 0, delete this.allGroupedTable);
      }
      function $() {
        U.apply(this), this.destroyGroupedData(), this.groupedData = this.hasGroupedData ? this.points : null;
      }
      function tt() {
        return this.is("arearange") ? "range" : this.is("ohlc") ? "ohlc" : this.is("hlc") ? "hlc" : this.is("column") || this.options.cumulative ? "sum" : "average";
      }
      function te(t2, e2, i2) {
        let o2 = t2.getColumn("x", true) || [], a2 = t2.getColumn("y", true), n2 = this, r2 = n2.data, s2 = n2.options && n2.options.data, l2 = [], u2 = new W(), h2 = [], d2 = t2.rowCount, c2 = !!a2, g2 = [], m2 = n2.pointArrayMap, f2 = m2 && m2.length, x2 = ["x"].concat(m2 || ["y"]), y2 = (m2 || ["y"]).map(() => []), G2 = this.options.dataGrouping && this.options.dataGrouping.groupAll, M2, v2, b2, T2 = 0, D2 = 0, S2 = "function" == typeof i2 ? i2 : i2 && p[i2] ? p[i2] : p[n2.getDGApproximation && n2.getDGApproximation() || "average"];
        if (f2) {
          let t3 = m2.length;
          for (; t3--; ) g2.push([]);
        } else g2.push([]);
        let C2 = f2 || 1;
        for (let t3 = 0; t3 <= d2; t3++) if (!(o2[t3] < e2[0])) {
          for (; void 0 !== e2[T2 + 1] && o2[t3] >= e2[T2 + 1] || t3 === d2; ) {
            if (M2 = e2[T2], n2.dataGroupInfo = { start: G2 ? D2 : n2.cropStart + D2, length: g2[0].length, groupStart: M2 }, b2 = S2.apply(n2, g2), n2.pointClass && !z(n2.dataGroupInfo.options) && (n2.dataGroupInfo.options = J(n2.pointClass.prototype.optionsToObject.call({ series: n2 }, n2.options.data[n2.cropStart + D2])), x2.forEach(function(t4) {
              delete n2.dataGroupInfo.options[t4];
            })), void 0 !== b2) {
              l2.push(M2);
              let t4 = Q(b2);
              for (let e3 = 0; e3 < t4.length; e3++) y2[e3].push(t4[e3]);
              h2.push(n2.dataGroupInfo);
            }
            D2 = t3;
            for (let t4 = 0; t4 < C2; t4++) g2[t4].length = 0, g2[t4].hasNulls = false;
            if (T2 += 1, t3 === d2) break;
          }
          if (t3 === d2) break;
          if (m2) {
            let e3;
            let i3 = G2 ? t3 : n2.cropStart + t3, o3 = r2 && r2[i3] || n2.pointClass.prototype.applyOptions.apply({ series: n2 }, [s2[i3]]);
            for (let t4 = 0; t4 < f2; t4++) B(e3 = o3[m2[t4]]) ? g2[t4].push(e3) : null === e3 && (g2[t4].hasNulls = true);
          } else B(v2 = c2 ? a2[t3] : null) ? g2[0].push(v2) : null === v2 && (g2[0].hasNulls = true);
        }
        let w2 = { x: l2 };
        return (m2 || ["y"]).forEach((t3, e3) => {
          w2[t3] = y2[e3];
        }), u2.setColumns(w2), { groupMap: h2, modified: u2 };
      }
      function ti(t2) {
        let e2 = t2.options, i2 = this.type, o2 = this.chart.options.plotOptions, a2 = this.useCommonDataGrouping && M.common, n2 = M.seriesSpecific, r2 = h().defaultOptions.plotOptions[i2].dataGrouping;
        if (o2 && (n2[i2] || a2)) {
          let t3 = this.chart.rangeSelector;
          r2 || (r2 = J(M.common, n2[i2])), e2.dataGrouping = J(a2, r2, o2.series && o2.series.dataGrouping, o2[i2].dataGrouping, this.userOptions.dataGrouping, !e2.isInternal && t3 && B(t3.selected) && t3.buttonOptions[t3.selected].dataGrouping);
        }
      }
      let to = { compose: function(t2) {
        let e2 = t2.prototype;
        e2.applyGrouping || (_(t2.prototype.pointClass, "update", function() {
          if (this.dataGroup) return X(24, false, this.series.chart), false;
        }), _(t2, "afterSetOptions", ti), _(t2, "destroy", Z), q(e2, { applyGrouping: V, destroyGroupedData: Z, generatePoints: $, getDGApproximation: tt, groupData: te }));
      }, groupData: te };
      var ta = s(984);
      let { format: tn } = s.n(ta)(), { composed: tr } = h(), { addEvent: ts, extend: tl, isNumber: tu, pick: th, pushUnique: tp } = h();
      function td(t2) {
        var _a;
        let e2 = this.chart, i2 = e2.time, o2 = t2.point, a2 = o2.series, n2 = a2.options, r2 = a2.tooltipOptions, s2 = n2.dataGrouping, l2 = a2.xAxis, u2 = r2.xDateFormat || "", h2, p2, d2, c2, g2, m2 = r2[t2.isFooter ? "footerFormat" : "headerFormat"];
        if (l2 && "datetime" === l2.options.type && s2 && tu(o2.key)) {
          p2 = a2.currentDataGrouping, d2 = s2.dateTimeLabelFormats || M.common.dateTimeLabelFormats, p2 ? (c2 = d2[p2.unitName], 1 === p2.count ? u2 = c2[0] : (u2 = c2[1], h2 = c2[2])) : !u2 && d2 && l2.dateTime && (u2 = l2.dateTime.getXDateFormat(o2.x, r2.dateTimeLabelFormats));
          let n3 = th((_a = a2.groupMap) == null ? void 0 : _a[o2.index].groupStart, o2.key), f2 = n3 + ((p2 == null ? void 0 : p2.totalRange) || 0) - 1;
          g2 = i2.dateFormat(u2, n3), h2 && (g2 += i2.dateFormat(h2, f2)), a2.chart.styledMode && (m2 = this.styledModeFormat(m2)), t2.text = tn(m2, { point: tl(o2, { key: g2 }), series: a2 }, e2), t2.preventDefault();
        }
      }
      let tc = { compose: function(t2, e2, i2) {
        P.compose(t2), to.compose(e2), i2 && tp(tr, "DataGrouping") && ts(i2, "headerFormatter", td);
      }, groupData: to.groupData }, tg = h();
      tg.dataGrouping = tg.dataGrouping || {}, tg.dataGrouping.approximationDefaults = tg.dataGrouping.approximationDefaults || G, tg.dataGrouping.approximations = tg.dataGrouping.approximations || p, tc.compose(tg.Axis, tg.Series, tg.Tooltip);
      let tm = h();
      return l.default;
    })());
  }
});
export default require_datagrouping();
//# sourceMappingURL=highcharts_modules_datagrouping.js.map

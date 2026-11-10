/*
 * HomeEase – Worker Availability & Service Manager (AngularJS 1.x)
 *
 * This module is deliberately isolated from React:
 *   - React renders an empty host <div>. mountAvailabilityModule() creates a
 *     child node inside it, injects availability.html and calls angular.bootstrap()
 *     on that child. React never renders into, or reads from, that node.
 *   - Data is exchanged through shared localStorage keys (he_workers) and
 *     window CustomEvents:
 *       'homeease:availability-updated'  (Angular -> React, after a save)
 *       'homeease:data-changed'          (either side, data was written)
 *       'homeease:data-reset'            (React -> Angular, demo data reset)
 */
import angular from 'angular';
import template from './availability.html?raw';
import './availability.css';
import { SERVICES, DAYS, STORAGE_KEYS, EVENTS } from '../data/constants.js';

const MODULE_NAME = 'homeEaseAvailability';

function formatHour(h) {
  const hour = Number(h);
  const suffix = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  const base = hour % 12 === 0 ? 12 : hour % 12;
  return base + ' ' + suffix;
}

angular
  .module(MODULE_NAME, [])

  /* ---------- Storage service: reads/writes the shared localStorage data ---------- */
  .factory('availabilityStore', [
    '$window',
    function ($window) {
      function readWorkers() {
        try {
          return JSON.parse($window.localStorage.getItem(STORAGE_KEYS.workers)) || [];
        } catch (e) {
          return [];
        }
      }
      return {
        load: function (workerId) {
          return readWorkers().filter(function (w) {
            return w.id === workerId;
          })[0] || null;
        },
        save: function (workerId, patch) {
          var workers = readWorkers();
          var updated = null;
          workers = workers.map(function (w) {
            if (w.id !== workerId) return w;
            updated = angular.extend({}, w, patch);
            return updated;
          });
          $window.localStorage.setItem(STORAGE_KEYS.workers, JSON.stringify(workers));
          // Notify the React application
          $window.dispatchEvent(new $window.CustomEvent(EVENTS.availabilityUpdated, { detail: { workerId: workerId, worker: updated } }));
          $window.dispatchEvent(new $window.CustomEvent(EVENTS.dataChanged));
          return updated;
        }
      };
    }
  ])

  /* ---------- Controller ---------- */
  .controller('AvailabilityController', [
    '$scope',
    '$window',
    'availabilityStore',
    'WORKER_ID',
    function ($scope, $window, store, WORKER_ID) {
      var vm = this;
      vm.angularVersion = angular.version.full;
      vm.days = DAYS;
      vm.services = SERVICES;
      vm.hours = [];
      vm.endHours = [];
      for (var h = 6; h <= 21; h++) vm.hours.push(h);
      for (var e = 7; e <= 22; e++) vm.endHours.push(e);
      vm.formatHour = formatHour;
      vm.savedAt = null;

      function snapshot(worker) {
        var availability = {};
        DAYS.forEach(function (d) {
          var src = (worker.availability && worker.availability[d]) || {};
          availability[d] = {
            available: !!src.available,
            start: Number(src.start) || 9,
            end: Number(src.end) || 13,
            disabled: angular.copy(src.disabled || [])
          };
        });
        return {
          hourlyRate: Number(worker.hourlyRate) || 150,
          services: angular.copy(worker.services || []),
          availability: availability
        };
      }

      function load() {
        vm.worker = store.load(WORKER_ID);
        if (!vm.worker) return;
        vm.original = snapshot(vm.worker);
        vm.model = angular.copy(vm.original);
      }
      load();

      vm.isDirty = function () {
        return !!vm.model && !angular.equals(vm.model, vm.original);
      };

      vm.slotsFor = function (day) {
        var d = vm.model.availability[day];
        var out = [];
        for (var x = d.start; x < d.end; x++) out.push(x);
        return out;
      };

      vm.isDisabled = function (day, hour) {
        return vm.model.availability[day].disabled.indexOf(hour) !== -1;
      };

      vm.toggleSlot = function (day, hour) {
        var list = vm.model.availability[day].disabled;
        var i = list.indexOf(hour);
        if (i === -1) list.push(hour);
        else list.splice(i, 1);
        list.sort(function (a, b) {
          return a - b;
        });
      };

      vm.onToggleDay = function (day) {
        var d = vm.model.availability[day];
        if (d.available && d.end <= d.start) d.end = Math.min(d.start + 2, 22);
      };

      vm.onHoursChange = function (day) {
        var d = vm.model.availability[day];
        if (d.end <= d.start) d.end = Math.min(d.start + 1, 22);
        d.disabled = d.disabled.filter(function (x) {
          return x >= d.start && x < d.end;
        });
      };

      vm.summary = function (day) {
        var d = vm.model.availability[day];
        var open = d.available ? d.end - d.start - d.disabled.length : 0;
        if (!d.available || open <= 0) return { available: false, label: 'Unavailable' };
        var label = formatHour(d.start) + ' – ' + formatHour(d.end);
        if (d.disabled.length) label += ' (' + open + (open === 1 ? ' slot' : ' slots') + ' open)';
        return { available: true, label: label };
      };

      vm.weeklyHours = function () {
        return DAYS.reduce(function (sum, day) {
          var d = vm.model.availability[day];
          return sum + (d.available ? Math.max(d.end - d.start - d.disabled.length, 0) : 0);
        }, 0);
      };

      vm.hasService = function (id) {
        return vm.model.services.indexOf(id) !== -1;
      };

      vm.toggleService = function (id) {
        var i = vm.model.services.indexOf(id);
        if (i === -1) vm.model.services.push(id);
        else vm.model.services.splice(i, 1);
      };

      vm.bumpRate = function (delta) {
        var next = (Number(vm.model.hourlyRate) || 0) + delta;
        vm.model.hourlyRate = Math.max(80, Math.min(1000, next));
      };

      vm.preset = function (kind) {
        DAYS.forEach(function (day, i) {
          var d = vm.model.availability[day];
          var weekday = i < 5;
          if (kind === 'clear') {
            d.available = false;
          } else if (kind === 'evenings') {
            angular.extend(d, { available: weekday, start: 17, end: 20, disabled: [] });
          } else if (kind === 'mornings') {
            angular.extend(d, { available: weekday, start: 7, end: 11, disabled: [] });
          }
        });
      };

      vm.copyMonday = function () {
        var mon = vm.model.availability.Monday;
        DAYS.slice(1, 5).forEach(function (day) {
          vm.model.availability[day] = angular.copy(mon);
        });
      };

      vm.errors = function () {
        var errs = [];
        if (!vm.model) return errs;
        var rate = Number(vm.model.hourlyRate);
        if (!rate || rate < 80 || rate > 1000) errs.push('Hourly charge must be between ₹80 and ₹1000.');
        if (!vm.model.services.length) errs.push('Select at least one service.');
        return errs;
      };

      vm.discard = function () {
        vm.model = angular.copy(vm.original);
      };

      vm.save = function () {
        if (vm.errors().length) return;
        var patch = angular.copy(vm.model);
        patch.hourlyRate = Math.round(Number(patch.hourlyRate));
        DAYS.forEach(function (d) {
          var a = patch.availability[d];
          if (a.end - a.start - a.disabled.length <= 0) a.available = false;
        });
        vm.worker = store.save(WORKER_ID, patch);
        vm.original = snapshot(vm.worker);
        vm.model = angular.copy(vm.original);
        vm.savedAt = new Date();
      };

      /* ---- Listen for changes coming from React / other tabs ---- */
      function onExternalChange() {
        $scope.$evalAsync(function () {
          if (!vm.isDirty()) load();
        });
      }
      function onReset() {
        $scope.$evalAsync(function () {
          load();
          vm.savedAt = null;
        });
      }
      $window.addEventListener(EVENTS.dataChanged, onExternalChange);
      $window.addEventListener(EVENTS.dataReset, onReset);
      $window.addEventListener('storage', onExternalChange);
      $scope.$on('$destroy', function () {
        $window.removeEventListener(EVENTS.dataChanged, onExternalChange);
        $window.removeEventListener(EVENTS.dataReset, onReset);
        $window.removeEventListener('storage', onExternalChange);
      });
    }
  ]);

/**
 * Bootstraps the AngularJS module inside `hostElement`.
 * Returns a cleanup function that destroys the Angular app and removes its DOM.
 */
export function mountAvailabilityModule(hostElement, workerId) {
  var root = document.createElement('div');
  root.className = 'ng-availability-root';
  root.innerHTML = template;
  hostElement.appendChild(root);

  var injector = angular.bootstrap(
    root,
    [
      MODULE_NAME,
      [
        '$provide',
        function ($provide) {
          $provide.constant('WORKER_ID', workerId);
        }
      ]
    ],
    { strictDi: true }
  );

  return function unmount() {
    try {
      injector.get('$rootScope').$destroy();
    } finally {
      angular.element(root).remove();
    }
  };
}

export default MODULE_NAME;

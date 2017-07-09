/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare const System: any

System.config({
  paths: {
    'npm:': 'node_modules/'
  },
  map: {
    app: 'app',
    'app/recommendations': 'app/recommendations',
    'app/channels': 'app/channels',
    'app/settings': 'app/settings',
    'app/stats': 'app/stats',

    '@angular/core': 'npm:@angular/core/bundles/core.umd.js',
    '@angular/common': 'npm:@angular/common/bundles/common.umd.js',
    '@angular/compiler': 'npm:@angular/compiler/bundles/compiler.umd.js',
    '@angular/platform-browser': 'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
    '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
    '@angular/http': 'npm:@angular/http/bundles/http.umd.js',
    '@angular/router': 'npm:@angular/router/bundles/router.umd.js',
    '@angular/forms': 'npm:@angular/forms/bundles/forms.umd.js',
    '@angular/animations': 'npm:@angular/animations/bundles/animations.umd.js',
    '@angular/animations/browser': 'npm:@angular/animations/bundles/animations-browser.umd.js',
    '@angular/platform-browser/animations': 'npm:@angular/platform-browser/bundles/platform-browser-animations.umd.js',
    'hammerjs': 'npm:hammerjs/hammer.js',
    '@angular/material': 'npm:@angular/material/bundles/material.umd.js',
    '@angular/cdk': 'npm:@angular/cdk/bundles/cdk.umd.min.js',

    // other libraries
    rxjs: 'npm:rxjs',
    'angular-in-memory-web-api': 'npm:angular-in-memory-web-api/bundles/in-memory-web-api.umd.js',
    moment: 'npm:moment',
    'angular2-moment': 'npm:angular2-moment',
    lodash: 'npm:lodash/lodash.js',
    'ngx-pagination': 'npm:ngx-pagination/dist/ngx-pagination.umd.js',
    'ng2-charts': 'npm:ng2-charts/bundles/ng2-charts.umd.js'
  },
  packages: {
    app: {
      main: './index.js',
      defaultExtension: 'js'
    },
    'app/recommendations': {
      main: './index.js',
      defaultExtension: 'js'
    },
    'app/recommendations/recommendation-dialog': {
      main: './index.js',
      defaultExtension: 'js'
    },
    'app/recommendations/recommendations-criteria': {
      main: './index.js',
      defaultExtension: 'js'
    },
    'app/recommendations/recommendations-list': {
      main: './index.js',
      defaultExtension: 'js'
    },
    'app/channels': {
      main: './index.js',
      defaultExtension: 'js'
    },
    'app/settings': {
      main: './index.js',
      defaultExtension: 'js'
    },
    'app/stats': {
      main: './index.js',
      defaultExtension: 'js'
    },
    rxjs: {
      defaultExtension: 'js'
    },
    moment: {
      main: './moment.js',
      defaultExtension: 'js'
    },
    'angular2-moment': {
      main: './index.js',
      defaultExtension: 'js'
    }
  }
})

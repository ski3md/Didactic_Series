# Third-Party Script Scan

Scanned at: 2026-06-11T11:37:52.443Z
Files scanned: 282

## Findings

- Unknown external script sources: 0
- Inline script blocks: 0
- Allowed inline script blocks: 8
- Allowed external script sources: 2
- Non-HTTP script references: 0

### Allowed Inline Scripts
- /Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/public/cp-studios/cah-21oh-studio.html: /* ====== Autosave & State ====== */ const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s)); const storeKey='CAH21_v1'; const state={contrast:false,active:'anim',anim:{mode:'normal',step:0,speed:1,playing:false},quiz:{},
- /Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/public/cp-studios/cah-master-studio.html: /* ============================================================ State & helpers ============================================================ */ const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s)); const KEY='CAH_Ma
- /Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/public/cp-studios/clinical-micro-methods-ast.html: const modules = [ {id:'intro', label:'Welcome & How to Use', group:'Overview', render:intro}, {id:'culture', label:'Culture (plates & atmosphere)', group:'Identification Methods', render:culture}, {id:'blood', label:'Automated Blood Culture', g
- /Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/public/cp-studios/dat-igg-sim-pro.html: /* ============================================================ STATE ============================================================ */ const state = { pattern:"igg_only", sampleType:"EDTA", washes:0, polyRun:false, iggRun:false, c3Run:false
- /Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/public/cp-studios/flow-cytometry-sim-and-cases.html: // Case Simulator Module const CaseSimulator = { currentStep: 1, totalSteps: 8, zoomLevel: 100, quizAnswered: { step4: false, step7: false }, init: function() { this.setupStepNavigation(); this
- /Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/public/cp-studios/immune-lipid-teaching-studio.html: /* =============================== Global helpers & autosave ================================== */ const $ = s=>document.querySelector(s), $$ = s=>Array.from(document.querySelectorAll(s)); const storeKey='Studio_v1'; const state = { contrast:fal
- /Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/public/cp-studios/management-informatics-command-center.html: const topics = [ { id: 'break-even-analysis', navTitle: 'Break-even analysis', navSubtitle: 'Capital planning and in-house versus send-out logic', title: 'Break-even analysis and capital planning', 
- /Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/public/cp-studios/microbiology-case-dashboard.html: (function(win, doc){ 'use strict'; if (win.__CS_BOOTSTRAPPED__) return; // idempotent init win.__CS_BOOTSTRAPPED__ = true; function onReady(cb){ if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', cb, { once: true 


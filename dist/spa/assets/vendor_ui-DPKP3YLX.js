var qe=t=>{throw TypeError(t)};var we=(t,e,s)=>e.has(t)||qe("Cannot "+s);var i=(t,e,s)=>(we(t,e,"read from private field"),s?s.call(t):e.get(t)),d=(t,e,s)=>e.has(t)?qe("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,s),h=(t,e,s,r)=>(we(t,e,"write to private field"),r?r.call(t,s):e.set(t,s),s),P=(t,e,s)=>(we(t,e,"access private method"),s);var ve=(t,e,s,r)=>({set _(a){h(t,e,a,s)},get _(){return i(t,e,r)}});import{r as $}from"./vendor_react-Bpl_dUPQ.js";var Ge={exports:{}},ge={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var et=$,tt=Symbol.for("react.element"),st=Symbol.for("react.fragment"),rt=Object.prototype.hasOwnProperty,it=et.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,at={key:!0,ref:!0,__self:!0,__source:!0};function Ve(t,e,s){var r,a={},n=null,y=null;s!==void 0&&(n=""+s),e.key!==void 0&&(n=""+e.key),e.ref!==void 0&&(y=e.ref);for(r in e)rt.call(e,r)&&!at.hasOwnProperty(r)&&(a[r]=e[r]);if(t&&t.defaultProps)for(r in e=t.defaultProps,e)a[r]===void 0&&(a[r]=e[r]);return{$$typeof:tt,type:t,key:n,ref:y,props:a,_owner:it.current}}ge.Fragment=st;ge.jsx=Ve;ge.jsxs=Ve;Ge.exports=ge;var nt=Ge.exports;/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ot=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),Ne=(...t)=>t.filter((e,s,r)=>!!e&&e.trim()!==""&&r.indexOf(e)===s).join(" ").trim();/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var ut={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ht=$.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:s=2,absoluteStrokeWidth:r,className:a="",children:n,iconNode:y,...u},f)=>$.createElement("svg",{ref:f,...ut,width:e,height:e,stroke:t,strokeWidth:r?Number(s)*24/Number(e):s,className:Ne("lucide",a),...u},[...y.map(([C,g])=>$.createElement(C,g)),...Array.isArray(n)?n:[n]]));/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=(t,e)=>{const s=$.forwardRef(({className:r,...a},n)=>$.createElement(ht,{ref:n,iconNode:e,className:Ne(`lucide-${ot(t)}`,r),...a}));return s.displayName=`${t}`,s};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=o("Activity",[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lt=o("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=o("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ht=o("Building2",[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ut=o("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const It=o("ChartColumn",[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zt=o("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kt=o("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _t=o("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gt=o("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vt=o("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=o("Circle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bt=o("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $t=o("Code",[["polyline",{points:"16 18 22 12 16 6",key:"z7tu5w"}],["polyline",{points:"8 6 2 12 8 18",key:"1eg1df"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=o("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jt=o("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wt=o("DollarSign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xt=o("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yt=o("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const es=o("EyeOff",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ts=o("Eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ss=o("Filter",[["polygon",{points:"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3",key:"1yg77f"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rs=o("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const is=o("Heart",[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const as=o("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ns=o("Link",[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const os=o("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=o("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hs=o("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cs=o("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ls=o("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ds=o("MousePointer",[["path",{d:"M12.586 12.586 19 19",key:"ea5xo7"}],["path",{d:"M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z",key:"277e5u"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ys=o("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fs=o("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ps=o("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vs=o("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ms=o("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ks=o("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gs=o("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bs=o("ShoppingCart",[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ms=o("SquarePen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ws=o("Star",[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cs=o("Store",[["path",{d:"m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7",key:"ztvudi"}],["path",{d:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",key:"1b2hhj"}],["path",{d:"M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4",key:"2ebpfo"}],["path",{d:"M2 7h20",key:"1fcdvo"}],["path",{d:"M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7",key:"6c3vgh"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xs=o("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ps=o("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ss=o("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Os=o("Truck",[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fs=o("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qs=o("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const As=o("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Es=o("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);var be=class{constructor(){this.listeners=new Set,this.subscribe=this.subscribe.bind(this)}subscribe(t){return this.listeners.add(t),this.onSubscribe(),()=>{this.listeners.delete(t),this.onUnsubscribe()}}hasListeners(){return this.listeners.size>0}onSubscribe(){}onUnsubscribe(){}},Me=typeof window>"u"||"Deno"in globalThis;function D(){}function ct(t,e){return typeof t=="function"?t(e):t}function lt(t){return typeof t=="number"&&t>=0&&t!==1/0}function dt(t,e){return Math.max(t+(e||0)-Date.now(),0)}function xe(t,e){return typeof t=="function"?t(e):t}function yt(t,e){return typeof t=="function"?t(e):t}function Ae(t,e){const{type:s="all",exact:r,fetchStatus:a,predicate:n,queryKey:y,stale:u}=t;if(y){if(r){if(e.queryHash!==Se(y,e.options))return!1}else if(!le(e.queryKey,y))return!1}if(s!=="all"){const f=e.isActive();if(s==="active"&&!f||s==="inactive"&&f)return!1}return!(typeof u=="boolean"&&e.isStale()!==u||a&&a!==e.state.fetchStatus||n&&!n(e))}function Ee(t,e){const{exact:s,status:r,predicate:a,mutationKey:n}=t;if(n){if(!e.options.mutationKey)return!1;if(s){if(ce(e.options.mutationKey)!==ce(n))return!1}else if(!le(e.options.mutationKey,n))return!1}return!(r&&e.state.status!==r||a&&!a(e))}function Se(t,e){return((e==null?void 0:e.queryKeyHashFn)||ce)(t)}function ce(t){return JSON.stringify(t,(e,s)=>Pe(s)?Object.keys(s).sort().reduce((r,a)=>(r[a]=s[a],r),{}):s)}function le(t,e){return t===e?!0:typeof t!=typeof e?!1:t&&e&&typeof t=="object"&&typeof e=="object"?Object.keys(e).every(s=>le(t[s],e[s])):!1}function Be(t,e){if(t===e)return t;const s=De(t)&&De(e);if(s||Pe(t)&&Pe(e)){const r=s?t:Object.keys(t),a=r.length,n=s?e:Object.keys(e),y=n.length,u=s?[]:{},f=new Set(r);let C=0;for(let g=0;g<y;g++){const m=s?g:n[g];(!s&&f.has(m)||s)&&t[m]===void 0&&e[m]===void 0?(u[m]=void 0,C++):(u[m]=Be(t[m],e[m]),u[m]===t[m]&&t[m]!==void 0&&C++)}return a===y&&C===a?t:u}return e}function De(t){return Array.isArray(t)&&t.length===Object.keys(t).length}function Pe(t){if(!Re(t))return!1;const e=t.constructor;if(e===void 0)return!0;const s=e.prototype;return!(!Re(s)||!s.hasOwnProperty("isPrototypeOf")||Object.getPrototypeOf(t)!==Object.prototype)}function Re(t){return Object.prototype.toString.call(t)==="[object Object]"}function ft(t){return new Promise(e=>{setTimeout(e,t)})}function pt(t,e,s){return typeof s.structuralSharing=="function"?s.structuralSharing(t,e):s.structuralSharing!==!1?Be(t,e):e}function vt(t,e,s=0){const r=[...t,e];return s&&r.length>s?r.slice(1):r}function mt(t,e,s=0){const r=[e,...t];return s&&r.length>s?r.slice(0,-1):r}var Oe=Symbol();function $e(t,e){return!t.queryFn&&(e!=null&&e.initialPromise)?()=>e.initialPromise:!t.queryFn||t.queryFn===Oe?()=>Promise.reject(new Error(`Missing queryFn: '${t.queryHash}'`)):t.queryFn}var J,_,se,Le,kt=(Le=class extends be{constructor(){super();d(this,J);d(this,_);d(this,se);h(this,se,e=>{if(!Me&&window.addEventListener){const s=()=>e();return window.addEventListener("visibilitychange",s,!1),()=>{window.removeEventListener("visibilitychange",s)}}})}onSubscribe(){i(this,_)||this.setEventListener(i(this,se))}onUnsubscribe(){var e;this.hasListeners()||((e=i(this,_))==null||e.call(this),h(this,_,void 0))}setEventListener(e){var s;h(this,se,e),(s=i(this,_))==null||s.call(this),h(this,_,e(r=>{typeof r=="boolean"?this.setFocused(r):this.onFocus()}))}setFocused(e){i(this,J)!==e&&(h(this,J,e),this.onFocus())}onFocus(){const e=this.isFocused();this.listeners.forEach(s=>{s(e)})}isFocused(){var e;return typeof i(this,J)=="boolean"?i(this,J):((e=globalThis.document)==null?void 0:e.visibilityState)!=="hidden"}},J=new WeakMap,_=new WeakMap,se=new WeakMap,Le),Ze=new kt,re,G,ie,Te,gt=(Te=class extends be{constructor(){super();d(this,re,!0);d(this,G);d(this,ie);h(this,ie,e=>{if(!Me&&window.addEventListener){const s=()=>e(!0),r=()=>e(!1);return window.addEventListener("online",s,!1),window.addEventListener("offline",r,!1),()=>{window.removeEventListener("online",s),window.removeEventListener("offline",r)}}})}onSubscribe(){i(this,G)||this.setEventListener(i(this,ie))}onUnsubscribe(){var e;this.hasListeners()||((e=i(this,G))==null||e.call(this),h(this,G,void 0))}setEventListener(e){var s;h(this,ie,e),(s=i(this,G))==null||s.call(this),h(this,G,e(this.setOnline.bind(this)))}setOnline(e){i(this,re)!==e&&(h(this,re,e),this.listeners.forEach(r=>{r(e)}))}isOnline(){return i(this,re)}},re=new WeakMap,G=new WeakMap,ie=new WeakMap,Te),ke=new gt;function bt(){let t,e;const s=new Promise((a,n)=>{t=a,e=n});s.status="pending",s.catch(()=>{});function r(a){Object.assign(s,a),delete s.resolve,delete s.reject}return s.resolve=a=>{r({status:"fulfilled",value:a}),t(a)},s.reject=a=>{r({status:"rejected",reason:a}),e(a)},s}function Mt(t){return Math.min(1e3*2**t,3e4)}function Je(t){return(t??"online")==="online"?ke.isOnline():!0}var We=class extends Error{constructor(t){super("CancelledError"),this.revert=t==null?void 0:t.revert,this.silent=t==null?void 0:t.silent}};function Ce(t){return t instanceof We}function Xe(t){let e=!1,s=0,r=!1,a;const n=bt(),y=c=>{var p;r||(l(new We(c)),(p=t.abort)==null||p.call(t))},u=()=>{e=!0},f=()=>{e=!1},C=()=>Ze.isFocused()&&(t.networkMode==="always"||ke.isOnline())&&t.canRun(),g=()=>Je(t.networkMode)&&t.canRun(),m=c=>{var p;r||(r=!0,(p=t.onSuccess)==null||p.call(t,c),a==null||a(),n.resolve(c))},l=c=>{var p;r||(r=!0,(p=t.onError)==null||p.call(t,c),a==null||a(),n.reject(c))},k=()=>new Promise(c=>{var p;a=x=>{(r||C())&&c(x)},(p=t.onPause)==null||p.call(t)}).then(()=>{var c;a=void 0,r||(c=t.onContinue)==null||c.call(t)}),b=()=>{if(r)return;let c;const p=s===0?t.initialPromise:void 0;try{c=p??t.fn()}catch(x){c=Promise.reject(x)}Promise.resolve(c).then(m).catch(x=>{var z;if(r)return;const E=t.retry??(Me?0:3),M=t.retryDelay??Mt,q=typeof M=="function"?M(s,x):M,j=E===!0||typeof E=="number"&&s<E||typeof E=="function"&&E(s,x);if(e||!j){l(x);return}s++,(z=t.onFail)==null||z.call(t,s,x),ft(q).then(()=>C()?void 0:k()).then(()=>{e?l(x):b()})})};return{promise:n,cancel:y,continue:()=>(a==null||a(),n),cancelRetry:u,continueRetry:f,canStart:g,start:()=>(g()?b():k().then(b),n)}}var wt=t=>setTimeout(t,0);function Ct(){let t=[],e=0,s=u=>{u()},r=u=>{u()},a=wt;const n=u=>{e?t.push(u):a(()=>{s(u)})},y=()=>{const u=t;t=[],u.length&&a(()=>{r(()=>{u.forEach(f=>{s(f)})})})};return{batch:u=>{let f;e++;try{f=u()}finally{e--,e||y()}return f},batchCalls:u=>(...f)=>{n(()=>{u(...f)})},schedule:n,setNotifyFunction:u=>{s=u},setBatchNotifyFunction:u=>{r=u},setScheduler:u=>{a=u}}}var F=Ct(),W,He,Ye=(He=class{constructor(){d(this,W)}destroy(){this.clearGcTimeout()}scheduleGc(){this.clearGcTimeout(),lt(this.gcTime)&&h(this,W,setTimeout(()=>{this.optionalRemove()},this.gcTime))}updateGcTime(t){this.gcTime=Math.max(this.gcTime||0,t??(Me?1/0:5*60*1e3))}clearGcTimeout(){i(this,W)&&(clearTimeout(i(this,W)),h(this,W,void 0))}},W=new WeakMap,He),ae,X,A,Y,S,de,ee,R,U,Ue,xt=(Ue=class extends Ye{constructor(e){super();d(this,R);d(this,ae);d(this,X);d(this,A);d(this,Y);d(this,S);d(this,de);d(this,ee);h(this,ee,!1),h(this,de,e.defaultOptions),this.setOptions(e.options),this.observers=[],h(this,Y,e.client),h(this,A,i(this,Y).getQueryCache()),this.queryKey=e.queryKey,this.queryHash=e.queryHash,h(this,ae,St(this.options)),this.state=e.state??i(this,ae),this.scheduleGc()}get meta(){return this.options.meta}get promise(){var e;return(e=i(this,S))==null?void 0:e.promise}setOptions(e){this.options={...i(this,de),...e},this.updateGcTime(this.options.gcTime)}optionalRemove(){!this.observers.length&&this.state.fetchStatus==="idle"&&i(this,A).remove(this)}setData(e,s){const r=pt(this.state.data,e,this.options);return P(this,R,U).call(this,{data:r,type:"success",dataUpdatedAt:s==null?void 0:s.updatedAt,manual:s==null?void 0:s.manual}),r}setState(e,s){P(this,R,U).call(this,{type:"setState",state:e,setStateOptions:s})}cancel(e){var r,a;const s=(r=i(this,S))==null?void 0:r.promise;return(a=i(this,S))==null||a.cancel(e),s?s.then(D).catch(D):Promise.resolve()}destroy(){super.destroy(),this.cancel({silent:!0})}reset(){this.destroy(),this.setState(i(this,ae))}isActive(){return this.observers.some(e=>yt(e.options.enabled,this)!==!1)}isDisabled(){return this.getObserversCount()>0?!this.isActive():this.options.queryFn===Oe||this.state.dataUpdateCount+this.state.errorUpdateCount===0}isStatic(){return this.getObserversCount()>0?this.observers.some(e=>xe(e.options.staleTime,this)==="static"):!1}isStale(){return this.getObserversCount()>0?this.observers.some(e=>e.getCurrentResult().isStale):this.state.data===void 0||this.state.isInvalidated}isStaleByTime(e=0){return this.state.data===void 0?!0:e==="static"?!1:this.state.isInvalidated?!0:!dt(this.state.dataUpdatedAt,e)}onFocus(){var s;const e=this.observers.find(r=>r.shouldFetchOnWindowFocus());e==null||e.refetch({cancelRefetch:!1}),(s=i(this,S))==null||s.continue()}onOnline(){var s;const e=this.observers.find(r=>r.shouldFetchOnReconnect());e==null||e.refetch({cancelRefetch:!1}),(s=i(this,S))==null||s.continue()}addObserver(e){this.observers.includes(e)||(this.observers.push(e),this.clearGcTimeout(),i(this,A).notify({type:"observerAdded",query:this,observer:e}))}removeObserver(e){this.observers.includes(e)&&(this.observers=this.observers.filter(s=>s!==e),this.observers.length||(i(this,S)&&(i(this,ee)?i(this,S).cancel({revert:!0}):i(this,S).cancelRetry()),this.scheduleGc()),i(this,A).notify({type:"observerRemoved",query:this,observer:e}))}getObserversCount(){return this.observers.length}invalidate(){this.state.isInvalidated||P(this,R,U).call(this,{type:"invalidate"})}fetch(e,s){var C,g,m;if(this.state.fetchStatus!=="idle"){if(this.state.data!==void 0&&(s!=null&&s.cancelRefetch))this.cancel({silent:!0});else if(i(this,S))return i(this,S).continueRetry(),i(this,S).promise}if(e&&this.setOptions(e),!this.options.queryFn){const l=this.observers.find(k=>k.options.queryFn);l&&this.setOptions(l.options)}const r=new AbortController,a=l=>{Object.defineProperty(l,"signal",{enumerable:!0,get:()=>(h(this,ee,!0),r.signal)})},n=()=>{const l=$e(this.options,s),b=(()=>{const c={client:i(this,Y),queryKey:this.queryKey,meta:this.meta};return a(c),c})();return h(this,ee,!1),this.options.persister?this.options.persister(l,b,this):l(b)},u=(()=>{const l={fetchOptions:s,options:this.options,queryKey:this.queryKey,client:i(this,Y),state:this.state,fetchFn:n};return a(l),l})();(C=this.options.behavior)==null||C.onFetch(u,this),h(this,X,this.state),(this.state.fetchStatus==="idle"||this.state.fetchMeta!==((g=u.fetchOptions)==null?void 0:g.meta))&&P(this,R,U).call(this,{type:"fetch",meta:(m=u.fetchOptions)==null?void 0:m.meta});const f=l=>{var k,b,c,p;Ce(l)&&l.silent||P(this,R,U).call(this,{type:"error",error:l}),Ce(l)||((b=(k=i(this,A).config).onError)==null||b.call(k,l,this),(p=(c=i(this,A).config).onSettled)==null||p.call(c,this.state.data,l,this)),this.scheduleGc()};return h(this,S,Xe({initialPromise:s==null?void 0:s.initialPromise,fn:u.fetchFn,abort:r.abort.bind(r),onSuccess:l=>{var k,b,c,p;if(l===void 0){f(new Error(`${this.queryHash} data is undefined`));return}try{this.setData(l)}catch(x){f(x);return}(b=(k=i(this,A).config).onSuccess)==null||b.call(k,l,this),(p=(c=i(this,A).config).onSettled)==null||p.call(c,l,this.state.error,this),this.scheduleGc()},onError:f,onFail:(l,k)=>{P(this,R,U).call(this,{type:"failed",failureCount:l,error:k})},onPause:()=>{P(this,R,U).call(this,{type:"pause"})},onContinue:()=>{P(this,R,U).call(this,{type:"continue"})},retry:u.options.retry,retryDelay:u.options.retryDelay,networkMode:u.options.networkMode,canRun:()=>!0})),i(this,S).start()}},ae=new WeakMap,X=new WeakMap,A=new WeakMap,Y=new WeakMap,S=new WeakMap,de=new WeakMap,ee=new WeakMap,R=new WeakSet,U=function(e){const s=r=>{switch(e.type){case"failed":return{...r,fetchFailureCount:e.failureCount,fetchFailureReason:e.error};case"pause":return{...r,fetchStatus:"paused"};case"continue":return{...r,fetchStatus:"fetching"};case"fetch":return{...r,...Pt(r.data,this.options),fetchMeta:e.meta??null};case"success":return h(this,X,void 0),{...r,data:e.data,dataUpdateCount:r.dataUpdateCount+1,dataUpdatedAt:e.dataUpdatedAt??Date.now(),error:null,isInvalidated:!1,status:"success",...!e.manual&&{fetchStatus:"idle",fetchFailureCount:0,fetchFailureReason:null}};case"error":const a=e.error;return Ce(a)&&a.revert&&i(this,X)?{...i(this,X),fetchStatus:"idle"}:{...r,error:a,errorUpdateCount:r.errorUpdateCount+1,errorUpdatedAt:Date.now(),fetchFailureCount:r.fetchFailureCount+1,fetchFailureReason:a,fetchStatus:"idle",status:"error"};case"invalidate":return{...r,isInvalidated:!0};case"setState":return{...r,...e.state}}};this.state=s(this.state),F.batch(()=>{this.observers.forEach(r=>{r.onQueryUpdate()}),i(this,A).notify({query:this,type:"updated",action:e})})},Ue);function Pt(t,e){return{fetchFailureCount:0,fetchFailureReason:null,fetchStatus:Je(e.networkMode)?"fetching":"paused",...t===void 0&&{error:null,status:"pending"}}}function St(t){const e=typeof t.initialData=="function"?t.initialData():t.initialData,s=e!==void 0,r=s?typeof t.initialDataUpdatedAt=="function"?t.initialDataUpdatedAt():t.initialDataUpdatedAt:0;return{data:e,dataUpdateCount:0,dataUpdatedAt:s?r??Date.now():0,error:null,errorUpdateCount:0,errorUpdatedAt:0,fetchFailureCount:0,fetchFailureReason:null,fetchMeta:null,isInvalidated:!1,status:s?"success":"pending",fetchStatus:"idle"}}var L,Ie,Ot=(Ie=class extends be{constructor(e={}){super();d(this,L);this.config=e,h(this,L,new Map)}build(e,s,r){const a=s.queryKey,n=s.queryHash??Se(a,s);let y=this.get(n);return y||(y=new xt({client:e,queryKey:a,queryHash:n,options:e.defaultQueryOptions(s),state:r,defaultOptions:e.getQueryDefaults(a)}),this.add(y)),y}add(e){i(this,L).has(e.queryHash)||(i(this,L).set(e.queryHash,e),this.notify({type:"added",query:e}))}remove(e){const s=i(this,L).get(e.queryHash);s&&(e.destroy(),s===e&&i(this,L).delete(e.queryHash),this.notify({type:"removed",query:e}))}clear(){F.batch(()=>{this.getAll().forEach(e=>{this.remove(e)})})}get(e){return i(this,L).get(e)}getAll(){return[...i(this,L).values()]}find(e){const s={exact:!0,...e};return this.getAll().find(r=>Ae(s,r))}findAll(e={}){const s=this.getAll();return Object.keys(e).length>0?s.filter(r=>Ae(e,r)):s}notify(e){F.batch(()=>{this.listeners.forEach(s=>{s(e)})})}onFocus(){F.batch(()=>{this.getAll().forEach(e=>{e.onFocus()})})}onOnline(){F.batch(()=>{this.getAll().forEach(e=>{e.onOnline()})})}},L=new WeakMap,Ie),T,O,te,H,K,ze,Ft=(ze=class extends Ye{constructor(e){super();d(this,H);d(this,T);d(this,O);d(this,te);this.mutationId=e.mutationId,h(this,O,e.mutationCache),h(this,T,[]),this.state=e.state||qt(),this.setOptions(e.options),this.scheduleGc()}setOptions(e){this.options=e,this.updateGcTime(this.options.gcTime)}get meta(){return this.options.meta}addObserver(e){i(this,T).includes(e)||(i(this,T).push(e),this.clearGcTimeout(),i(this,O).notify({type:"observerAdded",mutation:this,observer:e}))}removeObserver(e){h(this,T,i(this,T).filter(s=>s!==e)),this.scheduleGc(),i(this,O).notify({type:"observerRemoved",mutation:this,observer:e})}optionalRemove(){i(this,T).length||(this.state.status==="pending"?this.scheduleGc():i(this,O).remove(this))}continue(){var e;return((e=i(this,te))==null?void 0:e.continue())??this.execute(this.state.variables)}async execute(e){var n,y,u,f,C,g,m,l,k,b,c,p,x,E,M,q,j,z,fe,pe;const s=()=>{P(this,H,K).call(this,{type:"continue"})};h(this,te,Xe({fn:()=>this.options.mutationFn?this.options.mutationFn(e):Promise.reject(new Error("No mutationFn found")),onFail:(w,Z)=>{P(this,H,K).call(this,{type:"failed",failureCount:w,error:Z})},onPause:()=>{P(this,H,K).call(this,{type:"pause"})},onContinue:s,retry:this.options.retry??0,retryDelay:this.options.retryDelay,networkMode:this.options.networkMode,canRun:()=>i(this,O).canRun(this)}));const r=this.state.status==="pending",a=!i(this,te).canStart();try{if(r)s();else{P(this,H,K).call(this,{type:"pending",variables:e,isPaused:a}),await((y=(n=i(this,O).config).onMutate)==null?void 0:y.call(n,e,this));const Z=await((f=(u=this.options).onMutate)==null?void 0:f.call(u,e));Z!==this.state.context&&P(this,H,K).call(this,{type:"pending",context:Z,variables:e,isPaused:a})}const w=await i(this,te).start();return await((g=(C=i(this,O).config).onSuccess)==null?void 0:g.call(C,w,e,this.state.context,this)),await((l=(m=this.options).onSuccess)==null?void 0:l.call(m,w,e,this.state.context)),await((b=(k=i(this,O).config).onSettled)==null?void 0:b.call(k,w,null,this.state.variables,this.state.context,this)),await((p=(c=this.options).onSettled)==null?void 0:p.call(c,w,null,e,this.state.context)),P(this,H,K).call(this,{type:"success",data:w}),w}catch(w){try{throw await((E=(x=i(this,O).config).onError)==null?void 0:E.call(x,w,e,this.state.context,this)),await((q=(M=this.options).onError)==null?void 0:q.call(M,w,e,this.state.context)),await((z=(j=i(this,O).config).onSettled)==null?void 0:z.call(j,void 0,w,this.state.variables,this.state.context,this)),await((pe=(fe=this.options).onSettled)==null?void 0:pe.call(fe,void 0,w,e,this.state.context)),w}finally{P(this,H,K).call(this,{type:"error",error:w})}}finally{i(this,O).runNext(this)}}},T=new WeakMap,O=new WeakMap,te=new WeakMap,H=new WeakSet,K=function(e){const s=r=>{switch(e.type){case"failed":return{...r,failureCount:e.failureCount,failureReason:e.error};case"pause":return{...r,isPaused:!0};case"continue":return{...r,isPaused:!1};case"pending":return{...r,context:e.context,data:void 0,failureCount:0,failureReason:null,error:null,isPaused:e.isPaused,status:"pending",variables:e.variables,submittedAt:Date.now()};case"success":return{...r,data:e.data,failureCount:0,failureReason:null,error:null,status:"success",isPaused:!1};case"error":return{...r,data:void 0,error:e.error,failureCount:r.failureCount+1,failureReason:e.error,isPaused:!1,status:"error"}}};this.state=s(this.state),F.batch(()=>{i(this,T).forEach(r=>{r.onMutationUpdate(e)}),i(this,O).notify({mutation:this,type:"updated",action:e})})},ze);function qt(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0,submittedAt:0}}var I,Q,ye,Ke,At=(Ke=class extends be{constructor(e={}){super();d(this,I);d(this,Q);d(this,ye);this.config=e,h(this,I,new Set),h(this,Q,new Map),h(this,ye,0)}build(e,s,r){const a=new Ft({mutationCache:this,mutationId:++ve(this,ye)._,options:e.defaultMutationOptions(s),state:r});return this.add(a),a}add(e){i(this,I).add(e);const s=me(e);if(typeof s=="string"){const r=i(this,Q).get(s);r?r.push(e):i(this,Q).set(s,[e])}this.notify({type:"added",mutation:e})}remove(e){if(i(this,I).delete(e)){const s=me(e);if(typeof s=="string"){const r=i(this,Q).get(s);if(r)if(r.length>1){const a=r.indexOf(e);a!==-1&&r.splice(a,1)}else r[0]===e&&i(this,Q).delete(s)}}this.notify({type:"removed",mutation:e})}canRun(e){const s=me(e);if(typeof s=="string"){const r=i(this,Q).get(s),a=r==null?void 0:r.find(n=>n.state.status==="pending");return!a||a===e}else return!0}runNext(e){var r;const s=me(e);if(typeof s=="string"){const a=(r=i(this,Q).get(s))==null?void 0:r.find(n=>n!==e&&n.state.isPaused);return(a==null?void 0:a.continue())??Promise.resolve()}else return Promise.resolve()}clear(){F.batch(()=>{i(this,I).forEach(e=>{this.notify({type:"removed",mutation:e})}),i(this,I).clear(),i(this,Q).clear()})}getAll(){return Array.from(i(this,I))}find(e){const s={exact:!0,...e};return this.getAll().find(r=>Ee(s,r))}findAll(e={}){return this.getAll().filter(s=>Ee(e,s))}notify(e){F.batch(()=>{this.listeners.forEach(s=>{s(e)})})}resumePausedMutations(){const e=this.getAll().filter(s=>s.state.isPaused);return F.batch(()=>Promise.all(e.map(s=>s.continue().catch(D))))}},I=new WeakMap,Q=new WeakMap,ye=new WeakMap,Ke);function me(t){var e;return(e=t.options.scope)==null?void 0:e.id}function Qe(t){return{onFetch:(e,s)=>{var g,m,l,k,b;const r=e.options,a=(l=(m=(g=e.fetchOptions)==null?void 0:g.meta)==null?void 0:m.fetchMore)==null?void 0:l.direction,n=((k=e.state.data)==null?void 0:k.pages)||[],y=((b=e.state.data)==null?void 0:b.pageParams)||[];let u={pages:[],pageParams:[]},f=0;const C=async()=>{let c=!1;const p=M=>{Object.defineProperty(M,"signal",{enumerable:!0,get:()=>(e.signal.aborted?c=!0:e.signal.addEventListener("abort",()=>{c=!0}),e.signal)})},x=$e(e.options,e.fetchOptions),E=async(M,q,j)=>{if(c)return Promise.reject();if(q==null&&M.pages.length)return Promise.resolve(M);const fe=(()=>{const Fe={client:e.client,queryKey:e.queryKey,pageParam:q,direction:j?"backward":"forward",meta:e.options.meta};return p(Fe),Fe})(),pe=await x(fe),{maxPages:w}=e.options,Z=j?mt:vt;return{pages:Z(M.pages,pe,w),pageParams:Z(M.pageParams,q,w)}};if(a&&n.length){const M=a==="backward",q=M?Et:je,j={pages:n,pageParams:y},z=q(r,j);u=await E(j,z,M)}else{const M=t??n.length;do{const q=f===0?y[0]??r.initialPageParam:je(r,u);if(f>0&&q==null)break;u=await E(u,q),f++}while(f<M)}return u};e.options.persister?e.fetchFn=()=>{var c,p;return(p=(c=e.options).persister)==null?void 0:p.call(c,C,{client:e.client,queryKey:e.queryKey,meta:e.options.meta,signal:e.signal},s)}:e.fetchFn=C}}}function je(t,{pages:e,pageParams:s}){const r=e.length-1;return e.length>0?t.getNextPageParam(e[r],e,s[r],s):void 0}function Et(t,{pages:e,pageParams:s}){var r;return e.length>0?(r=t.getPreviousPageParam)==null?void 0:r.call(t,e[0],e,s[0],s):void 0}var v,V,N,ne,oe,B,ue,he,_e,Ds=(_e=class{constructor(t={}){d(this,v);d(this,V);d(this,N);d(this,ne);d(this,oe);d(this,B);d(this,ue);d(this,he);h(this,v,t.queryCache||new Ot),h(this,V,t.mutationCache||new At),h(this,N,t.defaultOptions||{}),h(this,ne,new Map),h(this,oe,new Map),h(this,B,0)}mount(){ve(this,B)._++,i(this,B)===1&&(h(this,ue,Ze.subscribe(async t=>{t&&(await this.resumePausedMutations(),i(this,v).onFocus())})),h(this,he,ke.subscribe(async t=>{t&&(await this.resumePausedMutations(),i(this,v).onOnline())})))}unmount(){var t,e;ve(this,B)._--,i(this,B)===0&&((t=i(this,ue))==null||t.call(this),h(this,ue,void 0),(e=i(this,he))==null||e.call(this),h(this,he,void 0))}isFetching(t){return i(this,v).findAll({...t,fetchStatus:"fetching"}).length}isMutating(t){return i(this,V).findAll({...t,status:"pending"}).length}getQueryData(t){var s;const e=this.defaultQueryOptions({queryKey:t});return(s=i(this,v).get(e.queryHash))==null?void 0:s.state.data}ensureQueryData(t){const e=this.defaultQueryOptions(t),s=i(this,v).build(this,e),r=s.state.data;return r===void 0?this.fetchQuery(t):(t.revalidateIfStale&&s.isStaleByTime(xe(e.staleTime,s))&&this.prefetchQuery(e),Promise.resolve(r))}getQueriesData(t){return i(this,v).findAll(t).map(({queryKey:e,state:s})=>{const r=s.data;return[e,r]})}setQueryData(t,e,s){const r=this.defaultQueryOptions({queryKey:t}),a=i(this,v).get(r.queryHash),n=a==null?void 0:a.state.data,y=ct(e,n);if(y!==void 0)return i(this,v).build(this,r).setData(y,{...s,manual:!0})}setQueriesData(t,e,s){return F.batch(()=>i(this,v).findAll(t).map(({queryKey:r})=>[r,this.setQueryData(r,e,s)]))}getQueryState(t){var s;const e=this.defaultQueryOptions({queryKey:t});return(s=i(this,v).get(e.queryHash))==null?void 0:s.state}removeQueries(t){const e=i(this,v);F.batch(()=>{e.findAll(t).forEach(s=>{e.remove(s)})})}resetQueries(t,e){const s=i(this,v);return F.batch(()=>(s.findAll(t).forEach(r=>{r.reset()}),this.refetchQueries({type:"active",...t},e)))}cancelQueries(t,e={}){const s={revert:!0,...e},r=F.batch(()=>i(this,v).findAll(t).map(a=>a.cancel(s)));return Promise.all(r).then(D).catch(D)}invalidateQueries(t,e={}){return F.batch(()=>(i(this,v).findAll(t).forEach(s=>{s.invalidate()}),(t==null?void 0:t.refetchType)==="none"?Promise.resolve():this.refetchQueries({...t,type:(t==null?void 0:t.refetchType)??(t==null?void 0:t.type)??"active"},e)))}refetchQueries(t,e={}){const s={...e,cancelRefetch:e.cancelRefetch??!0},r=F.batch(()=>i(this,v).findAll(t).filter(a=>!a.isDisabled()&&!a.isStatic()).map(a=>{let n=a.fetch(void 0,s);return s.throwOnError||(n=n.catch(D)),a.state.fetchStatus==="paused"?Promise.resolve():n}));return Promise.all(r).then(D)}fetchQuery(t){const e=this.defaultQueryOptions(t);e.retry===void 0&&(e.retry=!1);const s=i(this,v).build(this,e);return s.isStaleByTime(xe(e.staleTime,s))?s.fetch(e):Promise.resolve(s.state.data)}prefetchQuery(t){return this.fetchQuery(t).then(D).catch(D)}fetchInfiniteQuery(t){return t.behavior=Qe(t.pages),this.fetchQuery(t)}prefetchInfiniteQuery(t){return this.fetchInfiniteQuery(t).then(D).catch(D)}ensureInfiniteQueryData(t){return t.behavior=Qe(t.pages),this.ensureQueryData(t)}resumePausedMutations(){return ke.isOnline()?i(this,V).resumePausedMutations():Promise.resolve()}getQueryCache(){return i(this,v)}getMutationCache(){return i(this,V)}getDefaultOptions(){return i(this,N)}setDefaultOptions(t){h(this,N,t)}setQueryDefaults(t,e){i(this,ne).set(ce(t),{queryKey:t,defaultOptions:e})}getQueryDefaults(t){const e=[...i(this,ne).values()],s={};return e.forEach(r=>{le(t,r.queryKey)&&Object.assign(s,r.defaultOptions)}),s}setMutationDefaults(t,e){i(this,oe).set(ce(t),{mutationKey:t,defaultOptions:e})}getMutationDefaults(t){const e=[...i(this,oe).values()],s={};return e.forEach(r=>{le(t,r.mutationKey)&&Object.assign(s,r.defaultOptions)}),s}defaultQueryOptions(t){if(t._defaulted)return t;const e={...i(this,N).queries,...this.getQueryDefaults(t.queryKey),...t,_defaulted:!0};return e.queryHash||(e.queryHash=Se(e.queryKey,e)),e.refetchOnReconnect===void 0&&(e.refetchOnReconnect=e.networkMode!=="always"),e.throwOnError===void 0&&(e.throwOnError=!!e.suspense),!e.networkMode&&e.persister&&(e.networkMode="offlineFirst"),e.queryFn===Oe&&(e.enabled=!1),e}defaultMutationOptions(t){return t!=null&&t._defaulted?t:{...i(this,N).mutations,...(t==null?void 0:t.mutationKey)&&this.getMutationDefaults(t.mutationKey),...t,_defaulted:!0}}clear(){i(this,v).clear(),i(this,V).clear()}},v=new WeakMap,V=new WeakMap,N=new WeakMap,ne=new WeakMap,oe=new WeakMap,B=new WeakMap,ue=new WeakMap,he=new WeakMap,_e),Dt=$.createContext(void 0),Rs=({client:t,children:e})=>($.useEffect(()=>(t.mount(),()=>{t.unmount()}),[t]),nt.jsx(Dt.Provider,{value:t,children:e}));export{Nt as $,Lt as A,Cs as B,Vt as C,Wt as D,Yt as E,ss as F,rs as G,is as H,Zt as I,ys as J,xs as K,hs as L,ls as M,Ht as N,vs as O,fs as P,Ds as Q,ps as R,gs as S,Ss as T,qs as U,Jt as V,Xt as W,As as X,ns as Y,Es as Z,_t as _,Rs as a,ms as b,Gt as c,ws as d,Bt as e,Ps as f,ds as g,Ms as h,Ut as i,nt as j,Os as k,zt as l,cs as m,us as n,os as o,Fs as p,Kt as q,Tt as r,It as s,bs as t,es as u,ts as v,as as w,jt as x,$t as y,ks as z};

_N_E=(window.webpackJsonp_N_E=window.webpackJsonp_N_E||[]).push([[43],{"1gt9":function(t,e,r){"use strict";r.r(e);var n=r("rePB"),a=r("o0o1"),c=r.n(a),o=r("HaE+"),s=r("q1tI"),i=r.n(s),u=r("HdoS"),p=r("nOHt"),l=r("tGG3"),f=r("kMCw"),g=r("tsqr"),b=r("bE4q"),d=r("BMrR"),O=r("kPKH"),y=r("5rEg"),m=r("2/Rp"),w=(r("UYf5"),i.a.createElement);function j(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function v(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?j(Object(r),!0).forEach((function(e){Object(n.a)(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):j(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}e.default=function(){var t=Object(s.useState)({tpye:"",title:"",content:"",persions:[]}),e=t[0],r=t[1],a=Object(p.useRouter)(),i=a.query.pid;Object(s.useEffect)((function(){j()}),[i]);var j=function(){var t=Object(o.a)(c.a.mark((function t(){return c.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(i&&"created"!==i){t.next=2;break}return t.abrupt("return");case 2:Object(l.a)("GET","/orgs/regions/".concat(i),null,(function(t){r(t)}));case 3:case"end":return t.stop()}}),t)})));return function(){return t.apply(this,arguments)}}(),h=function(t,a){var c=v(v({},e),{},Object(n.a)({},a,t));r(c)},x=function(){var t=Object(o.a)(c.a.mark((function t(){var r;return c.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:r={title:e.title,tag:e.tag,content:e.content},Object(l.a)("POST","/orgs/regions/",r,(function(t){t._id?(g.b.success("\u4fdd\u5b58\u6210\u529f"),a.back()):g.b.error(t.message||"\u521b\u5efa\u5931\u8d25")}));case 2:case"end":return t.stop()}}),t)})));return function(){return t.apply(this,arguments)}}(),_=function(){var t=Object(o.a)(c.a.mark((function t(){var r;return c.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:r={tpye:e.type,title:e.title,content:e.content,persions:e.persions},Object(l.a)("PUT","/orgs/regions/".concat(i),r,(function(t){t._id?(g.b.success("\u4fdd\u5b58\u6210\u529f"),a.back()):g.b.error(t.message||"\u4fee\u6539\u5931\u8d25")}));case 2:case"end":return t.stop()}}),t)})));return function(){return t.apply(this,arguments)}}();return w(u.a,null,w(b.a,{style:{paddingBottom:16}},w(b.a.Item,null,w("a",{href:"/"},"\u9996\u9875")),w(b.a.Item,null,w("a",{href:"/orgs/regions"},"\u91cd\u70b9\u5de5\u4f5c")),w(b.a.Item,null,"created"===i?"\u6dfb\u52a0":"\u7f16\u8f91")),w(d.a,{gutter:[8,16]},w(O.a,{xs:4,style:{lineHeight:"32px"}},"\u6807\u7b7e"),w(O.a,{xs:24,sm:14},w(y.a,{onChange:function(t){return h(t.target.value,"tag")},value:e.tag}))),w(d.a,{gutter:[8,16]},w(O.a,{xs:4,style:{lineHeight:"32px"}},"\u6807\u9898"),w(O.a,{xs:24,sm:14},w(y.a,{onChange:function(t){return h(t.target.value,"title")},value:e.title}))),w(d.a,{gutter:[8,16]},w(O.a,{xs:4,style:{lineHeight:"32px"}},"\u5185\u5bb9"),w(O.a,{xs:24,sm:20})),"created"!==i&&w(d.a,{gutter:[8,16]},w(O.a,{xs:4},"\u521b\u5efa\u65f6\u95f4"),w(O.a,{xs:24,sm:14,flex:1},w(y.a,{value:f.a.timeformat(e.created),disabled:!0}))),"created"!==i&&w(d.a,{gutter:[8,16]},w(O.a,{xs:4,style:{lineHeight:"32px"}},"\u4fee\u6539\u65f6\u95f4"),w(O.a,{xs:24,sm:14},w(y.a,{value:f.a.timeformat(e.updated?e.updated:e.created),disabled:!0}))),w(d.a,{gutter:[8,16]},w(m.a,{type:"primary",style:{marginTop:30},onClick:e._id?_:x},"\u4fdd\u5b58")))}},XB0Z:function(t,e,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/orgs/regions/[pid]",function(){return r("1gt9")}])}},[["XB0Z",0,1,2,4,3,5,6,7,10,8,9,11,19]]]);
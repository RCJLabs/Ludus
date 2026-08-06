// Builds a fully self-contained index.html (no internet needed except optional fonts).
const fs = require("fs");
const esbuild = require("esbuild");

const VERSION = require("./package.json").version;

/* ---- THE TEST BUILD ----
   Checks that have to reach inside the game — the fight engines, the record book,
   the death toll — need a handle on functions the bundle keeps to itself. That
   handle was appended to the source by hand and stripped again before every one of
   the last fifteen releases, and once it was not stripped cleanly. It is a build
   flag now: `node build.js --test` writes dist/test.html with the handle attached
   and never touches index.html, so what ships cannot carry it. */
const TEST = process.argv.includes("--test");
const OUT  = TEST ? "dist/test.html" : "index.html";

esbuild.buildSync({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: !TEST,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": TEST ? '"development"' : '"production"',
            "process.env.LVDVS_TEST": TEST ? "true" : "false" },
  outfile: "dist/bundle.js",
});

let bundle = fs.readFileSync("dist/bundle.js", "utf8").replace(/<\/script/g, "<\\/script");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>LVDVS — Blood &amp; Sand</title>
<meta name="theme-color" content="#171210"/>
<meta name="description" content="A gladiator school in Capua, 70 BC. Buy men, train them, and decide who goes to the sand."/>
<link rel="manifest" href="manifest.webmanifest"/>
<link rel="icon" href="icons/icon-192.png" sizes="192x192"/>
<link rel="apple-touch-icon" href="icons/icon-192.png"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="LVDVS"/>
<meta name="app-version" content="${VERSION}"/>
<script>window.__LVDVS_VERSION=${JSON.stringify(VERSION)};</script>
<style>*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0;background:#171210;max-width:100%;overflow-x:clip}#root{min-height:100vh}html:has(.shell),body:has(.shell){overscroll-behavior:none}</style>
<script>
(function(){
  if (window.storage) return;
  var mem = {}, ls = null, P = "lvdvs:";
  try { localStorage.setItem("__t","1"); localStorage.removeItem("__t"); ls = localStorage; } catch(e) {}
  window.storage = {
    get: function(k){ var v = ls ? ls.getItem(P+k) : (k in mem ? mem[k] : null); return Promise.resolve(v==null ? null : {key:k, value:v}); },
    set: function(k,v){ if(ls) ls.setItem(P+k, v); else mem[k]=v; return Promise.resolve({key:k, value:v}); },
    "delete": function(k){ if(ls) ls.removeItem(P+k); else delete mem[k]; return Promise.resolve({key:k, deleted:true}); },
    list: function(){ return Promise.resolve({keys:[]}); }
  };
})();
</script>
</head>
<body>
<div id="root"></div>
<script>
/* The downloaded file already works with no network. This makes the hosted copy
   installable and offline too, and is skipped entirely on file:// */
(function(){
  if (!("serviceWorker" in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return;
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").then(function(reg){
      reg.addEventListener("updatefound", function(){
        var w = reg.installing; if(!w) return;
        w.addEventListener("statechange", function(){
          if (w.state === "installed" && navigator.serviceWorker.controller) {
            window.__lvdvsUpdate = true;   /* a newer build is cached and waiting */
          }
        });
      });
    }).catch(function(){});
  });
})();
</script>
<script>${bundle}</script>
</body>
</html>
`;
fs.writeFileSync(OUT, html);
if(TEST){
  console.log("test build written:", OUT, "(" + (html.length/1024).toFixed(0) + " KB) — not for shipping");
  process.exit(0);
}

/* ---- the offline shell: manifest, worker, icons ---- */
const SHELL = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"];

fs.writeFileSync("manifest.webmanifest", JSON.stringify({
  name: "LVDVS — Blood & Sand",
  short_name: "LVDVS",
  description: "A gladiator school in Capua, 70 BC.",
  start_url: "./",
  scope: "./",
  display: "standalone",
  orientation: "portrait",
  background_color: "#171210",
  theme_color: "#171210",
  categories: ["games"],
  icons: [
    { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}, null, 2));

fs.writeFileSync("sw.js", `/* LVDVS offline shell — v${VERSION} */
const CACHE = "lvdvs-v${VERSION}";
const SHELL = ${JSON.stringify(SHELL)};

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* Cache first: the game is one file and never needs the network again.
   A background fetch keeps the copy fresh for the next launch. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit || caches.match("./index.html"));
      return hit || net;
    })
  );
});
`);
console.log("offline shell written: manifest.webmanifest, sw.js, " + SHELL.length + " precached");
console.log("index.html written:", (html.length/1024).toFixed(0), "KB");

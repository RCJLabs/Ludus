// Builds a fully self-contained index.html (no internet needed except optional fonts).
const fs = require("fs");
const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: "dist/bundle.js",
});

let bundle = fs.readFileSync("dist/bundle.js", "utf8").replace(/<\/script/g, "<\\/script");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>LVDVS — Blood &amp; Sand</title>
<style>*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0;background:#171210;max-width:100%;overflow-x:hidden}#root{min-height:100vh}</style>
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
<script>${bundle}</script>
</body>
</html>
`;
fs.writeFileSync("index.html", html);
console.log("index.html written:", (html.length/1024).toFixed(0), "KB");

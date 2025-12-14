(function(){
  'use strict';

  // Determine a sensible base path for component includes.
  // If the loader script was included via an absolute URL the script's
  // src will contain the repo base (e.g. https://.../capitovo/). If not,
  // fall back to the current document path's directory. This makes the
  // loader work when the site is served from a subpath (GitHub Pages).
  function getBaseDir(){
    try{
      var script = document.currentScript && document.currentScript.src;
      if(script){
        var m = script.match(/^(https?:\/\/[^\/]+)?(\/.*?)(?:\/src\/components\/insert_components\.js)$/);
        if(m && m[2]) return m[2].replace(/\/$/, '');
      }
    }catch(e){}
    // fallback to directory of current page
    return window.location.pathname.replace(/\/[^\/]*$/, '');
  }

  var baseDir = getBaseDir();

  function loadComponent(name, target){
    var url = (baseDir ? baseDir : '') + '/src/components/capitovo-' + name + '.html';
    // Normalize duplicate slashes (but keep protocol //)
    url = url.replace(/([^:\/])\/\/+/, '$1/');
    return fetch(url, {cache: 'no-cache'}).then(function(res){
      if(!res.ok) throw new Error('Failed to fetch ' + url + ' ('+res.status+')');
      return res.text();
    }).then(function(html){
      target.innerHTML = html;
      return true;
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    var elems = document.querySelectorAll('[data-include]');
    if(!elems || elems.length===0) return;
    elems.forEach(function(el){
      var name = el.dataset.include && String(el.dataset.include).trim();
      if(!name) return;
      loadComponent(name, el).catch(function(err){
        console.warn('insert_components: unable to load', name, err);
      });
    });
  });
})();

(function(){
  'use strict';
  function loadComponent(name, target){
    // Use absolute path so components are loaded correctly from any page depth
    var url = '/src/components/capitovo-' + name + '.html';
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

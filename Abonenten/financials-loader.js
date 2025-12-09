/* ARCHIVED: Abonenten/financials-loader.js

   The original financials loader has been archived and neutralized to avoid
   syntax/linting problems in the active workspace. If you need to restore it,
   retrieve the original from `/archive/api/Abonenten/financials-loader.js`.

*/

// No-op stub to satisfy references from pages but keep loader disabled.
(function(){
  if(typeof window !== 'undefined'){
    window.capitovoLoadFinancials = window.capitovoLoadFinancials || function(symbol){
      console.warn('capitovoLoadFinancials is archived and disabled. Symbol:', symbol);
    };
  }
})();

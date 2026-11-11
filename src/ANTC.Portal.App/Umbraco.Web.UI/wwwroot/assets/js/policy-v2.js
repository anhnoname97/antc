// Van ban chinh sach: nut "In ra giay" chi hien khi trinh duyet chay JavaScript.
(function () {
  var btn = document.querySelector('[data-policy-print]');
  if (!btn) return;
  btn.hidden = false;
  btn.addEventListener('click', function () { window.print(); });
})();

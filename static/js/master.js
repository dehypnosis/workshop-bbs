(function(window){
  var User = {};
  User.logout = function(){
    var form = document.createElement('form');
    form.action = '/user/logout';
    form.method = 'post';
    form.style.display = 'none';
    document.body.append(form);
    form.submit();
  };

  window.bbs = {
    User: User
  };
})(window);
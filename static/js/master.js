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

  var Article = {};
  Article.onSubmit = function(form, e){
    if (form.title.value.trim().length == 0) {
      alert('제목을 입력하세요!');
      form.title.focus();
      return false;
    } else if (form.content.value.trim().length == 0) {
      alert('내용을 입력하세요!');
      form.content.focus();
      return false;
    }
    return true;
  };
  Article.delete = function(board, id){
    if (!confirm('정말 삭제하시겠습니까?')) return;

    var form = document.createElement('form');
    form.action = '/delete?board=' + board + '&id='+id;
    form.method = 'post';
    form.style.display = 'none';
    document.body.append(form);
    form.submit();
  };
  Article.update = function(board, id){
    location.href = '/update?board=' + board + '&id='+id;
  };
  Article.cancel = function(){
    if (confirm('정말 취소하시겠습니까?')) history.back();
  }

  window.bbs = {
    User: User,
    Article: Article
  };
})(window);
(function(window, $){
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
  };

  var Comment = function(data){
    this.id = data.id;
    this.content = data.content;
    this.author = data.author;
    this.editable = data.editable;
    this.createdAt = data.createdAt;
  };
  Comment.instances = [];
  Comment.prototype.delete = function(){
    if (!confirm('정말 삭제하시겠습니까?')) return;

    $.ajax('/comments/'+this.id, {method: 'delete'})
      .then(() => {
        var index = Comment.instances.indexOf(this);
        Comment.instances.splice(index, 1);
        Comment.render();
      })
      .catch(() => {
        //
      });
  };
  Comment.prototype.update = function(){
    
  };

  Comment.get = function(articleId){
    $.get('/comments?articleId=' + articleId)
      .then(function(rawComments) {
        Comment.instances = rawComments.map(raw => new Comment(raw));
        Comment.render();
      })
      .catch(function() {
        // TODO
      });
  };

  Comment.create = function(articleId, content){
    $.post('/comments?articleId=' + articleId, {content: content})
      .then(function(data){
        Comment.instances.push(new Comment(data));
        Comment.render();
        Comment.$createForm[0].content.value = '';
      })
      .catch(function() {
        alert('내용을 입력하세요!');
        Comment.$createForm[0].content.focus();
      });
  };

  Comment.$createForm = $('form[data-bbs-comment-create]');
  Comment.$container = $("[data-bbs-comments]");
  Comment.$template = $("[data-bbs-comment-template]");
  Comment.render = function(){
    Comment.$container.children().not(Comment.$template).remove();

    var $comments = Comment.instances.map(function(comment){
      var $comment = Comment.$template.clone().show()
        .removeAttr('data-bbs-comment-template')
        .attr('data-bbs-comment', '')
        .data('comment', comment);

      $comment.find("[data-author]").text(comment.author);
      $comment.find("[data-date]").text(comment.createdAt.substr(0,10));
      $comment.find("[data-content]").html(comment.content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'));
      if (!comment.editable) $comment.find("[data-if-editable]").remove();
      
      return $comment;
    });

    Comment.$container.append($comments);
  };

  // init comment
  $(function(){
    if (Comment.$container.length != 0) {
      // get
      var articleId = Comment.$container.data('article-id');
      Comment.get(articleId);

      // delete
      Comment.$container.on('click', '[data-delete-btn]', function(e){
        var comment = $(this).closest('[data-bbs-comment]').data('comment');
        comment.delete();
        e.preventDefault();
      });

      // update
      Comment.$container.on('click', '[data-update-btn]', function(e){
        var comment = $(this).closest('[data-bbs-comment]').data('comment');
        comment.update();
        e.preventDefault();
      });

      // create
      Comment.$createForm.submit(function(e) {
        e.preventDefault();
        Comment.create(this.articleId.value, this.content.value);
      });
    }
  });

  window.bbs = {
    User: User,
    Article: Article,
    Comment: Comment
  };
})(window, $);
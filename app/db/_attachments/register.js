function register() {
  if($("#password").val() == $("#confirm").val()) {
    try {
      $("#submit").attr("disabled", "disabled");
      var name = $("#login").val();
      $.ajax({
        type: "PUT",
        url: "/_users/org.couchdb.user:" + name,
        contentType: "application/json",
        data: JSON.stringify({
          name: name,
          password: $("#password").val(),
          fullname: $("#fullname").val(),
          email: $("#email").val(),
          roles: [],
          type: "user"
        })
      }).done(onRegistred).fail(registerFail);
    } catch(err) {
      $("#submit").removeAttr("disabled");
      onError(err);
    }
  } else {
    onError("Passwords do not match");
  }
}

function onError(message) {
  $("#message").html(message);
}

function registerFail(message) {
  $("#submit").removeAttr("disabled");
  onError(message.status == 409 ? "\"" + $("#login").val() + "\"" + " username already exists." 
    : "Your request produced an error. " + message.responseText);
}

function onRegistred() {
  $("#submit").hide();
  $("#message").css("color", "#0c0").html("Your account has been created.");
  $("#register").find("fieldset").slideUp();
}
function alertOnPage(type, title, message) {
  $(".alerts").append("<div role='alert' class='alert alert-"+type+" alert-dismissible'>" +
    "<button type='button' class='close' data-dismiss='alert' aria-label='Close'>" +
      "<span aria-hidden='true' > &times; </span>" +
    "</button>" +
    "<strong class='alert-title'>" + title + "</strong>" +
  message + "</div>");
}
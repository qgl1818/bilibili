var last_id = "response-to-me-content";
document.getElementById("response-to-me").onclick=function(){
    document.getElementById(last_id).setAttribute('class','message3')
    document.getElementById("response-to-me-content").setAttribute('class','message2')
    console.log(last_id)
    last_id = "response-to-me-content";

};

document.getElementById("at-me").onclick=function(){
    document.getElementById(last_id).setAttribute('class','message3')
    document.getElementById("at-me-content").setAttribute('class','message2')
    console.log(last_id)
    last_id = "at-me-content";

};

document.getElementById("get-praise").onclick=function(){
    document.getElementById(last_id).setAttribute('class','message3')
    document.getElementById("get-praise-content").setAttribute('class','message2')
    last_id = "get-praise-content";

};

document.getElementById("my-message").onclick=function(){
    document.getElementById(last_id).setAttribute('class','message3')
    document.getElementById("my-message-content").setAttribute('class','message2')
    last_id = "my-message-content";

};

document.getElementById("system-advice").onclick=function(){
    document.getElementById(last_id).setAttribute('class','message3')
    document.getElementById("system-advice-content").setAttribute('class','message2')
    last_id = "system-advice-content";

};

document.getElementById("private-letter").onclick=function(){
    document.getElementById(last_id).setAttribute('class','message3')
    document.getElementById("private-letter-content").setAttribute('class','message2')
    last_id = "private-letter-content";

};
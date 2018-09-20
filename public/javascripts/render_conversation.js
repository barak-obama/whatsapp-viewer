let content_render = {};

function render(conversation) {
    console.log(conversation);
    return ask_for_identity(conversation.participants).then( me => conversation.chat.map(m => render_message(m, me)).join('\n'));
}


function render_message(message, me) {

    return `<div class="message">
      <div class="${message.sender === me ? 'from_me' : 'to_me'} ${message.type}">
        ${content_render[message.type](message.content)}
      </div>
    </div>`;
}


function ask_for_identity(senders){
    return new Promise(function (resolve, reject) {

        let buttons = {};
        senders.forEach(sender => {
           buttons[sender] = function(){
               resolve(sender);
           }
        });

        $.confirm({
            title: 'How You Are?',
            content: 'Choose which of the participants you are',
            buttons: buttons
        });
    })
}


content_render['text'] = content => content;

content_render['img'] = content => {
  return `<img src="${content}"/>`;
};


content_render['audio'] = content => {
    return `<audio controls src="${content}"/>`;
};

content_render['video'] = content => {
    return `<video controls>
  <source src="${content}" type="video/mp4">
</video>`;
};
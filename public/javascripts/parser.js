function parse_convesation(zip_file) {
    let zip = new JSZip();
    return zip.loadAsync( zip_file )
        .then(function(zip) {
            let files = {};
            let conversation = '';
            let promises = [];
            zip.forEach(function (relativePath, zipEntry) {  // 2) print entries
                let promise;
                if(zipEntry.name === '_chat.txt'){
                    promise = zip.file(zipEntry.name).async("string");
                    promises.unshift(promise);
                } else {
                    promise = zip.file(zipEntry.name).async("blob").then(blob => {
                        return {
                            name: zipEntry.name,
                            blob: blob,
                            url: URL.createObjectURL(blob)
                        }
                    });
                    promises.push(promise);
                }


            });
            return Promise.all(promises);
        }, function() {alert("Not a valid zip file")}).then( results => {
            let chat  = results[0];
            let attachments = results.slice(1);

            let files = {};

            attachments.forEach(attachment => {
                files[attachment.name] = {
                    blob: attachment.blob,
                    url: attachment.url
                }
            });

            chat  = chat_parser(chat, files);

            let participants = uniq(chat.map(chat => chat.sender));

            return {

                chat: chat,
                participants: participants,
                attachments: files
            }
        });
}

function chat_parser(chat, attachments) {

    return chat.split('\n').map( messages => {
        let time_start = messages.indexOf('[') + 1;
        let time_end = messages.indexOf(']');
        let time = parse_time(messages.substring(time_start, time_end));


        let sender_start = time_end + 2;
        let sender_end = messages.indexOf(':', time_end);
        let sender = messages.substring(sender_start, sender_end);

        let content = messages.substring(sender_end+2);

        content = parse_content(content, attachments);


        return {
            time: time,
            sender: sender,
            content: content.content,
            type: content.type
        }


    });


}

function parse_time(time) {

    let day = parseInt(time.substring(0, 2));
    let month = parseInt(time.substring(3,5));
    let year = parseInt(time.substring(6,10));

    let hours = parseInt(time.substring(12,14));
    let minutes = parseInt(time.substring(15, 17));
    let seconds = parseInt(time.substring(18, 21));

    return new Date(year, month - 1, day, hours, minutes, seconds, 0);
}

const TYPES = {
    'jpg': 'img',
    'mp4': 'video',
    'opus': 'audio'
};

function parse_content(content, attachments) {
    let parsed_content = {};
    let indicator = content.indexOf("<attached:");
    if(indicator !== -1){
        let attachment_start = indicator + 11;
        let attachment_end = content.lastIndexOf('>');
        let attachment = content.substring(attachment_start, attachment_end);
        let extension = attachment.substring(attachment.lastIndexOf('.') + 1, attachment.length);
        parsed_content.type =  TYPES[extension];
        parsed_content.content = attachments[attachment].url;
    } else {
        parsed_content.type = 'text';
        parsed_content.content = content;
    }
    return parsed_content;
}


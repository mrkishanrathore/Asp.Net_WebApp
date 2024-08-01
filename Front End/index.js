$(document).ready(function() {
    var ws;
    
    $("#messageInput").keypress(function(e) {
        if (e.which === 13) { // Enter key pressed
            sendMessage();
        }
    });

    $("#ChangeName").click(function (e) { 
        setName();
    });
    
    
    $("#sendMsg").click(function (e) { 
        sendMessage();
    });


    connect();
    

    function setName(){
        let name = prompt("Enter Your Name ...");

        if(name != null && name != ""){
            let data = {
                type: "username",
                username: name
            }
            if(name){
                ws.send(JSON.stringify(data));
            }
            $("#username").text(name);
        }
    }

    function connect() {
        ws = new WebSocket("ws://127.0.0.1:8181");
        
        ws.onopen = function() {
            addMsg("Connected To Socket",true);
            setName();
        };

        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log(data);
            if (data.Type === 'msg') {
                addMsg(data, false);
            }
            if (data.Type === 'updatedUsersList') {
                showAvaliableUser(data.UserNames);
            }
        };

        ws.onerror = function(error) {
            console.error("WebSocket error: ", error);
            addMsg("Error: Could not connect to WebSocket server",true);
        };

        ws.onclose = function() {
            console.log("Disconnected from WebSocket server");
            addMsg("Disconnected from WebSocket server. Reconnecting...",true);
            setTimeout(connect, 1000);
        };
    }

    function showAvaliableUser(userList){
        let list = `<option value="allUser">All Users</option>`
        userList.forEach(user => {
            list += `<option value="${user}">${user}</option>`;
        });
        $("#AllUserList").html(list);
    }

    function sendMessage() {
        var input = $("#messageInput");
        let user = $("#AllUserList").val();
        let data ;
        if(user === "allUser"){
            data = {
                type : 'msg',
                msg : input.val()
            }
        }else{
            data = {
                type : 'msgOne',
                msg : input.val(),
                sendTo: user
            }
        }
        if (input.val()) {
            ws.send(JSON.stringify(data));
            addMsg(input.val(),true);
            input.val("");
        }
    }

    function addMsg(data, myMsg) {
        if(!myMsg){
            $("#messages").html($("#messages").html()+
                `<div class="message-container">
                        <div class="message my-message">
                            <span class="username">${data.UserName}</span>
                            <span class="text">${data.Message}</span>
                        </div>
                    </div>`
            );
        }else{
            $("#messages").html( $("#messages").html()+
                   `<div class="message-container">
                        <div class="message other-message">
                            <span class="text">${data}</span>
                        </div>
                    </div>`
            );
        }
        $("#messages").scrollTop($("#messages").prop("scrollHeight"));
    }
});

//connecting to our signaling server
var conn = new WebSocket('ws://localhost:8080/socket');

conn.onopen = function() {
    console.log("Connected to the signaling server");
    initialize();
};

conn.onmessage = function(msg) {
    console.log("Got message", msg.data);
    //debugger
    var content = JSON.parse(msg.data);
    var data = content.data;
    switch (content.event) {
    // when somebody wants to call us
    case "offer":
        handleOffer(data);
        break;
    case "answer":
        handleAnswer(data);
        break;
    // when a remote peer sends an ice candidate to us
    case "candidate":
        handleCandidate(data);
        break;
    default:
        break;
    }
};

function send(message) {
    conn.send(JSON.stringify(message));
}

var peerConnection;
var dataChannel;
var input = document.getElementById("messageInput");

function initialize() {
    var configuration = null;

    peerConnection = new RTCPeerConnection(configuration);
    //debugger

    // Setup ice handling
    peerConnection.onicecandidate = function(event) {
        if (event.candidate) {
            send({
                event : "candidate",
                data : event.candidate
            });
        }
    };

    // creating data channel
    dataChannel = peerConnection.createDataChannel("dataChannel", {
        reliable : true
    });

    dataChannel.onerror = function(error) {
        console.log("Error occured on datachannel:", error);
    };

    // when we receive a message from the other peer, printing it on the console
    dataChannel.onmessage = function(event) {
//    debugger
        if (isJSON(event.data)) {
            var receivedMessage = JSON.parse(event.data);

              // Check the message type
              if (receivedMessage.type === 'file') {
                var fileData = receivedMessage.data;

                // Handle the received file data
                receiveFileData(fileData);
              } else {
                    console.log("again printing the data in else: ",event.data)
              }
          } else {
                console.log("message: ", event.data);
          }

    };

    dataChannel.onclose = function() {
        console.log("data channel is closed");
    };

    dataChannel.onopen = function() {
        console.log("data channel is opened!!")
    }

  	peerConnection.ondatachannel = function (event) {
        dataChannel = event.channel;
  	};

}

function createOffer() {
    //debugger
    peerConnection.createOffer(function(offer) {
        send({
            event : "offer",
            data : offer
        });
        peerConnection.setLocalDescription(offer);
        console.log("offer set successfully!!")
    }, function(error) {
        alert("Error creating an offer");
    });
}

function handleOffer(offer) {
    ////debugger
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // create and send an answer to an offer
    peerConnection.createAnswer(function(answer) {
        peerConnection.setLocalDescription(answer);
        send({
            event : "answer",
            data : answer
        });
    }, function(error) {
        alert("Error creating an answer");
    });

};

function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

function handleAnswer(answer) {
    ////debugger
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("connection established successfully!!");
};

function sendMessage() {
    if (dataChannel.readyState === 'open') {
        dataChannel.send(input.value);
        input.value = "";
    } else {
        console.log("Data channel is not open")
    }

}

function sendFile() {
  var fileInput = document.getElementById("fileInput");
  var files = fileInput.files;

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var reader = new FileReader();

    reader.onload = function (event) {
      var fileData = event.target.result;
      var message = {
          type: 'file',
          data: fileData
      };

      // Convert the message object to a JSON string
      var jsonString = JSON.stringify(message);

      if (dataChannel.readyState === 'open') {
        dataChannel.send(jsonString);
      } else {
        console.log("Data channel is not open")
      }
    };

    reader.readAsDataURL(file);
  }

  fileInput.value = "";
}

function receiveFileData(fileData) {
  var fileContainer = document.getElementById("fileContainer");
  var fileType = getFileType(fileData);

  if (fileType === "image") {
    // Create download link
    var downloadLink = document.createElement("a");
    downloadLink.href = fileData;
    downloadLink.download = "file";
    downloadLink.textContent = "Download File";
    // Append the url element to the fileContainer div
    fileContainer.appendChild(downloadLink);
    // Create an image (<img>) element
    var imageElement = document.createElement("img");
    imageElement.src = fileData;
    // Append the image element to the fileContainer div
    fileContainer.appendChild(imageElement);
  } else if (fileType === "pdf") {
    // Create an embedded PDF object
    var pdfEmbedObject = document.createElement("embed");
    pdfEmbedObject.src = fileData;
    pdfEmbedObject.type = "application/pdf";
    pdfEmbedObject.width = "100%";
    pdfEmbedObject.height = "500px";

    // Append the PDF object to the fileContainer div
    fileContainer.appendChild(pdfEmbedObject);
  } else {
    // Unsupported file type or unable to determine file type
    console.log("Unsupported file type or unable to determine file type");
  }
}

function getFileType(fileData) {
  var mimeType = fileData.substring(fileData.indexOf(":") + 1, fileData.indexOf(";"));
  if (mimeType === "image/jpeg") {
    fileType = "image";
  } else if (mimeType === "application/pdf") {
    fileType = "pdf";
  }
  return fileType;
}

function isJSON(message) {
  try {
    JSON.parse(message);
    return true;
  } catch (error) {
    return false;
  }
}

function closeChannel(){
    dataChannel.close();
}

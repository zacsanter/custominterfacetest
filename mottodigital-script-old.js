const typingIndicator = document.getElementById("typing-indicator");
const uniqueId = generateUniqueId();
const voiceflowRuntime = "general-runtime.voiceflow.com";
const voiceflowVersionID =
  document.getElementById("vfassistant").getAttribute("data-version") ||
  "production";
const voiceflowAPIKey = "VF.DM.650c4a1a7e1a04000744b6ea.GCmymdNkzCanFlqS";


const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("user-input");
const responseContainer = document.getElementById("response-container");
const inputPlaceholder = document.getElementById("input-placeholder");
const inputFieldContainer = document.getElementById("input-container");
const savedMessages = localStorage.getItem("messages");
const chatContainer = document.getElementById("chat-container");
const restartButton = document.getElementById("restart-button");

function displayResponse(response) {
  setTimeout(() => {
    let audioQueue = [];

    if (response) {
      response.forEach((item, index) => {
        const delay = index * 1000; // 1 second delay for each item

        if (item.type === "speak" || item.type === "text") {
          console.info("Speak/Text Step");

          const taglineElement = document.createElement("div");
          taglineElement.classList.add("assistanttagline");
          taglineElement.textContent = "株式会社Mottodigital";

          const assistantWrapper = document.createElement("div");
          assistantWrapper.classList.add("assistantwrapper");

          const assistantImage = document.createElement("div");
          assistantImage.classList.add("assistantimage");
          assistantWrapper.appendChild(assistantImage);

          const messageElement = document.createElement("div");
          messageElement.classList.add("message", "assistant");
          assistantWrapper.appendChild(messageElement);

          const paragraphs = item.payload.message.split("\n\n");
          const wrappedMessage = paragraphs.map(para => `<p>${para}</p>`).join("");
          
          messageElement.innerHTML = wrappedMessage;

          setTimeout(() => {
            chatWindow.appendChild(taglineElement);
            chatWindow.appendChild(assistantWrapper);
          }, delay); 

          if (item.payload.src) {
            audioQueue.push(item.payload.src);
          }
        } else if (item.type === "choice") {
          const buttonContainer = document.createElement("div");
          buttonContainer.classList.add("buttoncontainer");

          item.payload.buttons.forEach((button) => {
            const buttonElement = document.createElement("button");
            buttonElement.classList.add("assistant", "message", "button");
            buttonElement.textContent = button.name;
            buttonElement.dataset.key = button.request.type;
            buttonElement.addEventListener("click", (event) => {
              handleButtonClick(event);
            });

            setTimeout(() => {
              buttonContainer.appendChild(buttonElement);
            }, delay);
          });

          setTimeout(() => {
            chatWindow.appendChild(buttonContainer);
          }, delay);
        } else if (item.type === "visual") {
          console.info("Image Step");

          const imageElement = document.createElement("img");
          imageElement.src = item.payload.image;
          imageElement.alt = "Assistant Image";
          imageElement.style.width = "100%";

          setTimeout(() => {
            chatWindow.appendChild(imageElement);
          }, delay);
        }
        localStorage.setItem("messages", chatWindow.innerHTML);
      });
    }

    typingIndicator.classList.add("hidden");

    window.requestAnimationFrame(() => {
      setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }, 100);
    });

    responseContainer.style.opacity = "1";
    function playNextAudio() {
      if (audioQueue.length === 0) {
        // Set focus back to the input field after all audios are played
        instance.stop();
        input.blur();
        setTimeout(() => {
          input.focus();
        }, 100);
        return;
      }
      const audioSrc = audioQueue.shift();
      audio = new Audio(audioSrc);
      // Find and show the corresponding text
      const textElement = responseContainer.querySelector(
        `[data-src="${audioSrc}"]`
      );
      if (textElement) {
        // Change the opacity of previous text
        const previousTextElement = textElement.previousElementSibling;
        if (previousTextElement && previousTextElement.tagName === "P") {
          previousTextElement.style.opacity = "0.5";
        }
        // Show the current text
        textElement.style.transition = "opacity 0.5s";
        textElement.style.opacity = "1";
      }
      audio.addEventListener("canplaythrough", () => {
        audio.play();
      });
      audio.addEventListener("ended", () => {
        playNextAudio();
      });
      // Handle errors
      audio.addEventListener("error", () => {
        console.error("Error playing audio:", audio.error);
        playNextAudio(); // Skip the current audio and continue with the next one
      });
    }
    // Start playing audios sequentially
    playNextAudio();
  }, 250);
  setTimeout(() => {
    // Re-enable input field and remove focus
    input.disabled = false;
    input.value = "";
    input.classList.remove("fade-out");
    input.blur();
    input.focus();
    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 200);
}

document.addEventListener("DOMContentLoaded", (event) => {
  // Generate a unique ID for the user

  // Set chat-container height to viewport height
  chatContainer.style.height = `${window.innerHeight}px`;
  // Set the runtime, version and API key for the Voiceflow Dialog API

  let audio = new Audio();
  //   const chatWindow = document.getElementById("chat-window");
  // Load messages from local storage
  if (savedMessages) {
    chatWindow.innerHTML = savedMessages;
  }
  if (localStorage.getItem("messages")) {
    chatWindow.innerHTML = localStorage.getItem("messages");
    // Hide the typing indicator after loading chat history
    if (typingIndicator) {
      typingIndicator.style.display = "none"; // or typingIndicator.classList.add('hidden');
    }
    // Hide the typing indicator after processing the response
    if (typingIndicator) {
      typingIndicator.style.display = "none"; // or typingIndicator.classList.add('hidden');
    }
  }
  // Only call interact('#launch#') if there are no saved messages
  if (!savedMessages) {
    interact("#launch#");
  }
  // Select the restart button
  // Add click event listener to the restart button
  restartButton.addEventListener("click", () => {
    // Clear chat window and local storage
    chatWindow.innerHTML = "";
    localStorage.removeItem("messages");
    // Initiate new chat
    interact("#launch#");
  });
  inputFieldContainer.addEventListener("click", () => {
    input.focus();
  });
  // Hide placeholder on input focus
  input.addEventListener("focus", () => {
    input.style.caretColor = "transparent";
  });
  // Restore placeholder on input blur
  input.addEventListener("blur", () => {
    input.style.caretColor = "white";
  });

  // Send user input to Voiceflow Dialog API
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      const userInput = input.value.trim();

      if (userInput) {
        // Disable input field and apply fade-out animation
        input.disabled = true;
        input.classList.add("fade-out");

        // Fade out previous content
        responseContainer.style.opacity = "0";

        // Check if any audio is currently playing
        if (audio && !audio.paused) {
          // If audio is playing, pause it
          audio.pause();
        }
        // Add user message to the chat window
        const taglineElement = document.createElement("div");
taglineElement.classList.add("usertagline");
taglineElement.textContent = "ユーザー";
chatWindow.appendChild(taglineElement);

const userWrapper = document.createElement("div");
userWrapper.classList.add("userwrapper");

const userImage = document.createElement("div");
userImage.classList.add("userimage");
userWrapper.appendChild(userImage);

const userMessageElement = document.createElement("div");
            userMessageElement.classList.add("message", "user");
            userMessageElement.textContent = userInput;
            userWrapper.appendChild(userMessageElement);

chatWindow.appendChild(userWrapper);

        // Save messages to local storage
        localStorage.setItem("messages", chatWindow.innerHTML);

        // Scroll to the bottom of the chat window
        window.requestAnimationFrame(() => {
          setTimeout(() => {
            chatWindow.scrollTop = chatWindow.scrollHeight;
          }, 100); // A 100ms delay, which you can adjust as needed.
        });

        // Show typing indicator
        typingIndicator.classList.remove("hidden");
        chatWindow.appendChild(typingIndicator);

        interact(userInput);
      }
    }
  });

  // Send user input to Voiceflow Dialog API

  async function interact(input) {
    // Show the typing indicator before sending the message
    if (typingIndicator) {
      typingIndicator.style.display = "flex";
    }
    // or typingIndicator.classList.remove('hidden');

    let body = {
      config: { tts: true, stripSSML: true },
      action: { type: "text", payload: input },
    };

    // If input is #launch# > Use a launch action to the request body
    if (input == "#launch#") {
      body = {
        config: { tts: true, stripSSML: true },
        action: { type: "launch" },
      };
    }

    fetch(`https://${voiceflowRuntime}/state/user/${uniqueId}/interact/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: voiceflowAPIKey,
        versionID: voiceflowVersionID,
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        displayResponse(data);
      })
      .catch((err) => {
        displayResponse(null);
      });
  }
});
// Function to generate a unique ID for the user
function generateUniqueId() {
  // generate a random string of 6 characters
  const randomStr = Math.random().toString(36).substring(2, 8);
  // get the current date and time as a string
  const dateTimeStr = new Date().toISOString();
  // remove the separators and milliseconds from the date and time string
  const dateTimeStrWithoutSeparators = dateTimeStr
    .replace(/[-:]/g, "")
    .replace(/\.\d+/g, "");
  // concatenate the random string and date and time string
  const uniqueId = randomStr + dateTimeStrWithoutSeparators;
  return uniqueId;
}

function handleButtonClick(event) {
  // Log the button name as a user message
  const userMessageElement = document.createElement("div");

  const prevMessage = chatWindow.lastElementChild;
  if (!prevMessage || !prevMessage.classList.contains("user")) {
    const userTaglineElement = document.createElement("div");
    userTaglineElement.classList.add("usertagline");
    userTaglineElement.textContent = "ユーザー";
    chatWindow.appendChild(userTaglineElement);
  }

  const userWrapper = document.createElement("div");
  userWrapper.classList.add("userwrapper");

  const userImage = document.createElement("div");
  userImage.classList.add("userimage");
  userWrapper.appendChild(userImage);

  userMessageElement.classList.add("message", "user");
  userMessageElement.textContent = event.target.textContent;
  userWrapper.appendChild(userMessageElement);

  chatWindow.appendChild(userWrapper);

  let body = { request: { type: event.target.dataset.key } };
  event.target.parentElement.remove();
  fetch(`https://${voiceflowRuntime}/state/user/${uniqueId}/interact/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: voiceflowAPIKey,
      versionID: voiceflowVersionID,
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((data) => {
      displayResponse(data);
    })
    .catch((err) => {
      // console.error(err)
      displayResponse(null);
    });
  // Send the button label as input to the API and handle the response
}




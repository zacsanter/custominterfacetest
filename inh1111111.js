// <script data-version="production" src="https://cdn.jsdelivr.net/gh/zacsanter/inhealthjobs@main/inj--script-demo5.js" id="vfassistant"></script>

const typingIndicator = document.getElementById("typing-indicator");
const uniqueId = generateUniqueId();
const voiceflowRuntime = "general-runtime.voiceflow.com";
const voiceflowVersionID =
  document.getElementById("vfassistant").getAttribute("data-version") ||
  "production";
// const voiceflowAPIKey = "VF.DM.655b860c16e2a800073c64b8.Crth02ycb9UOeZ2H"; //Dabeer
const voiceflowAPIKey = "VF.DM.65231f69ffcc370007a1300b.VZhonEwUfY5zSJsY"; //INJ

const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("user-input");
const responseContainer = document.getElementById("response-container");
const inputPlaceholder = document.getElementById("input-placeholder");
const inputFieldContainer = document.getElementById("input-container");
const savedMessages = localStorage.getItem("messages");
const chatContainer = document.getElementById("chat-container");
const restartButton = document.getElementById("restart-button");

const assistantTag = "InHealth Jobs",
  userTag = "You";

async function fetchVoiceflowVariables(uniqueId) {
    try {
        const response = await fetch(`https://${voiceflowRuntime}/state/user/${uniqueId}/variables`, {
            method: 'GET',
            headers: {
                'Authorization': voiceflowAPIKey,
                'versionID': voiceflowVersionID
            }
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Voiceflow variables:', error);
        return {};
    }
}

// Function to store specific Voiceflow variables in local storage
async function storeSpecificVoiceflowVariablesInLocalStorage(uniqueId) {
    const variables = await fetchVoiceflowVariables(uniqueId);
    const keysToStore = ['Specialty', 'first_name', 'last_name', 'email']; // Variables to store

    keysToStore.forEach(key => {
        if (variables.hasOwnProperty(key)) {
            localStorage.setItem(key, JSON.stringify(variables[key]));
        }
    });
}

function displayResponse(response) {
  setTimeout(() => {
    if (response) {
      response.forEach((item, index, array) => {

        let hasLearnMoreButton = item.type === "choice" && 
                                 item.payload.buttons.some(button => button.name === "Learn More");

        if (hasLearnMoreButton) {
            // Fetch and store specific variables when 'Learn More' is present
            storeSpecificVoiceflowVariablesInLocalStorage(uniqueId);
        }
        
        if (item.type === "speak" || item.type === "text") {
          // const taglineElement = document.createElement("div");
          // taglineElement.classList.add("assistanttagline");
          // taglineElement.textContent = "InHealth Jobs";

          // chatWindow.appendChild(assistantTagLine);

          // const assistantWrapper = document.createElement("div");
          // assistantWrapper.classList.add("assistantwrapper");

          // const assistantImage = document.createElement("div");
          // assistantImage.classList.add("assistantimage");
          // assistantWrapper.appendChild(assistantImage);

          const messageElement = document.createElement("div");
          messageElement.classList.add("message", "assistant");

          const paragraphs = item.payload.message.split("\n\n");
          const wrappedMessage = paragraphs
            .map((para) => `<p>${para}</p>`)
            .join("");

          messageElement.innerHTML = wrappedMessage;

          // assistantWrapper.appendChild(messageElement);
          // chatWindow.appendChild(assistantWrapper);

          addAssistantMsg(messageElement);
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
            buttonContainer.appendChild(buttonElement);
          });
          chatWindow.appendChild(buttonContainer);
          localStorage.setItem("messages", chatWindow.innerHTML);
        } else if (item.type === "visual") {
          console.info("Image Step");

          const imageElement = document.createElement("img");
          imageElement.src = item.payload.image;
          imageElement.alt = "Assistant Image";
          imageElement.style.width = "100%";

          addAssistantMsg(imageElement);

          // chatWindow.appendChild(imageElement);
        } else if (item.type === "upload_resume") {
          const uppyElement = document.createElement("div");
          uppyElement.id = "uppyElement";
          uppyElement.style.flex = 1;
          // uppyElement.classList.add("assistantwrapper");

          // chatWindow.appendChild(assistantTagLine);
          // chatWindow.appendChild(uppyElement);
          addAssistantMsg(uppyElement);

          uppy = new Uppy.Uppy({
            autoProceed: true,
            allowMultipleUploadBatches: false,
            debug: false,
            restrictions: {
              allowedFileTypes: [".pdf"],
            },
          });
          uppy
            .use(Uppy.Dashboard, {
              target: "#uppyElement",
              inline: true,
              proudlyDisplayPoweredByUppy: false,
            })
            .use(Uppy.XHRUpload, {
              endpoint: "https://inj-cv-parser.adabeer445.repl.co/extract_text",
              fieldName: "file",
            });
          uppy.on("upload-success", async (file, response) => {
            // Parse the response body as JSON
            console.log(file);
            console.log(response);
            await updateVariable(
              "resume",
              response.body.text.replaceAll("\n", " ")
            );
            uppy.clearUploadedFiles();
            uppy.close();
            uppyElement.parentElement.parentElement.remove();
            interact({ type: "done", payload: null });
            // console.log(uppy);
          });
        } else if (item.type === "user_form") {
          addAssistantMsg(createForm(item.payload));
          // addAssistantMsg(element);
        } else if (item.type === "custom_locations") {
          // item.payload
          updateLocationCards(item.payload);
        }

        // After processing the last item, check for the specific message
        if (index === array.length - 1) {
          checkAndDisplayLocationContainer();
        }
      });
    }

    typingIndicator.classList.add("hidden");

    window.requestAnimationFrame(() => {
      setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }, 100);
    });

    responseContainer.style.opacity = "1";
  }, 250);

  setTimeout(() => {
    input.disabled = false;
    input.value = "";
    input.classList.remove("fade-out");
    input.blur();
    input.focus();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 200);
}

function checkAndDisplayLocationContainer() {
  const assistantMessages = document.querySelectorAll(".message.assistant");
  assistantMessages.forEach((messageDiv) => {
    const paragraphs = messageDiv.querySelectorAll("p");
    paragraphs.forEach((p) => {
      if (p.textContent.startsWith("Here are my top 3 recommendations")) {
        var locationContainer = document.getElementById("location-container");
        if (locationContainer) {
          locationContainer.style.display = "block";
          messageDiv.parentNode.insertAdjacentElement(
            "afterend",
            locationContainer
          );
        }
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", (event) => {
  // Generate a unique ID for the user
  // Set chat-container height to viewport height
  chatContainer.style.height = `${window.innerHeight}px`;
  // Set the runtime, version and API key for the Voiceflow Dialog API

  //   const chatWindow = document.getElementById("chat-window");

  // Only call interact('#launch#') if there are no saved messages
  if (!savedMessages) {
    interact("#launch#");
  }

  // Load messages from local storage
  if (savedMessages) {
    chatWindow.innerHTML = savedMessages;
    if (typingIndicator) {
      typingIndicator.style.display = "none"; // or typingIndicator.classList.add('hidden');
    }
  }

  restartButton.addEventListener("click", () => {
    chatWindow.innerHTML = "";
    localStorage.removeItem("messages");

    var locationContainer = document.getElementById("location-container");
    if (locationContainer) {
      locationContainer.style.display = "none";
      document.body.insertBefore(locationContainer, document.body.firstChild);
    }

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

        // // Add user message to the chat window
        // chatWindow.appendChild(userTagLine);

        // const userWrapper = document.createElement("div");
        // userWrapper.classList.add("userwrapper");

        // const userMessageElement = document.createElement("div");
        // userMessageElement.classList.add("message", "user");
        // userMessageElement.textContent = userInput;

        addUserMsg(userInput);
        // userWrapper.appendChild(userMessageElement);

        // chatWindow.appendChild(userWrapper);

        // Save messages to local storage
        // localStorage.setItem("messages", chatWindow.innerHTML);

        // Scroll to the bottom of the chat window
        window.requestAnimationFrame(() => {
          setTimeout(() => {
            chatWindow.scrollTop = chatWindow.scrollHeight;
          }, 100); // A 100ms delay, which you can adjust as needed.
        });

        // Show typing indicator
        typingIndicator.classList.remove("hidden");
        chatWindow.appendChild(typingIndicator);

        interact({ type: "text", payload: userInput });
      }
    }
  });

  // Send user input to Voiceflow Dialog API
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

async function interact(action) {
  // Show the typing indicator before sending the message
  if (typingIndicator) {
    typingIndicator.style.display = "flex";
  }
  // or typingIndicator.classList.remove('hidden');

  let body = {
    config: { tts: true, stripSSML: true },
    action: action,
  };
  // let body = {
  //   config: { tts: true, stripSSML: true },
  //   action: { type: "text", payload: input },
  // };

  // If input is #launch# > Use a launch action to the request body
  if (action == "#launch#") {
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

function handleButtonClick(event) {
  // Log the button name as a user message
  // const userMessageElement = document.createElement("div");

  // const prevMessage = chatWindow.lastElementChild;
  // if (!prevMessage || !prevMessage.classList.contains("user")) {
  //   const userTaglineElement = document.createElement("div");
  //   userTaglineElement.classList.add("usertagline");
  //   userTaglineElement.textContent = "You";
  //   chatWindow.appendChild(userTaglineElement);
  // }

  // const userWrapper = document.createElement("div");
  // userWrapper.classList.add("userwrapper");

  // const userImage = document.createElement("div");
  // userImage.classList.add("userimage");
  // userWrapper.appendChild(userImage);

  // userMessageElement.classList.add("message", "user");
  // userMessageElement.textContent = event.target.textContent;
  // userWrapper.appendChild(userMessageElement);

  // chatWindow.appendChild(userWrapper);

  addUserMsg(event.target.textContent);
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

function updateVariable(variable, value) {
  return new Promise(async (resolve, reject) => {
    let data = {};
    data[variable] = value;
    await fetch(
      `https://${voiceflowRuntime}/state/user/${uniqueId}/variables/`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          authorization: voiceflowAPIKey,
          "content-type": "application/json",
        },
      }
    );

    resolve(data.conversations);
  });
}

function addAssistantMsg(element) {
  const assistantTagLine = document.createElement("div");
  assistantTagLine.classList.add("assistanttagline");
  assistantTagLine.textContent = assistantTag;

  const assistantImage = document.createElement("div");
  assistantImage.classList.add("assistantimage");

  const assistantWrapper = document.createElement("div");
  assistantWrapper.classList.add("assistantwrapper");
  assistantWrapper.appendChild(assistantImage);
  assistantWrapper.appendChild(element);

  const assistantMsg = document.createElement("div");
  assistantMsg.classList.add("assistantMsg");
  assistantMsg.appendChild(assistantTagLine);
  assistantMsg.appendChild(assistantWrapper);

  chatWindow.appendChild(assistantMsg);
  localStorage.setItem("messages", chatWindow.innerHTML);
}

function addUserMsg(userInput) {
  const userTagLine = document.createElement("div");
  userTagLine.classList.add("usertagline");
  userTagLine.textContent = userTag;

  const userImage = document.createElement("div");
  userImage.classList.add("userimage");
  const userMessageElement = document.createElement("div");
  userMessageElement.classList.add("message", "user");
  userMessageElement.textContent = userInput;

  const userWrapper = document.createElement("div");
  userWrapper.classList.add("userwrapper");
  userWrapper.appendChild(userImage);
  userWrapper.appendChild(userMessageElement);

  const userMsg = document.createElement("div");
  userMsg.classList.add("userMsg");
  userMsg.appendChild(userTagLine);
  userMsg.appendChild(userWrapper);

  chatWindow.appendChild(userMsg);
  localStorage.setItem("messages", chatWindow.innerHTML);
}

function createForm(dataObject) {
  const form = document.createElement("form");
  form.classList.add("userdetailsform");

  for (const key in dataObject) {
    if (dataObject.hasOwnProperty(key)) {
      const label = document.createElement("label");
      label.textContent =
        key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " "); // Capitalize the first letter
      label.classList.add("userdetailsformlabel");
      label.htmlFor = "userDetailsFormInput";

      const input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("name", key);
      input.setAttribute("value", dataObject[key]);
      input.setAttribute("required", "true");
      input.classList.add("userdetailsforminput", "w-input");

      form.appendChild(label);
      form.appendChild(input);
    }
  }
  const submitButton = document.createElement("input");
  submitButton.setAttribute("type", "submit");
  submitButton.setAttribute("value", "Submit");
  submitButton.classList.add("assistant", "message", "button");

  submitButton.addEventListener("click", async function (event) {
    event.preventDefault(); // Prevent default form submission
    const isValid = form.checkValidity();
    if (!isValid) {
      alert("Please fill in all required fields.");
      return;
    }

    // Disable all input fields
    const inputFields = form.querySelectorAll("input");
    inputFields.forEach((input) => {
      input.setAttribute("disabled", "true");
    });

    // Remove the submit button
    submitButton.remove();

    const formData = {};
    inputFields.forEach((input) => {
      formData[input.name] = input.value;
    });
    // Make an asynchronous call to the updateData function
    await updateData(formData);
  });

  form.appendChild(submitButton);
  return form;
}

function updateData(formData) {
  return new Promise(async (resolve, reject) => {
    console.log(formData);
    const customFields = {
      hobbies: formData.hobbies,
      "last-name": formData.last_name,
      "first-name": formData.first_name,
      speciality: formData.speciality,
      "visa-status": formData.visa_status,
      "current-state": formData.state,
      "graduation-date": formData.graduation_date,
    };
    await window.$memberstackDom.updateMember({
      customFields,
    });
    updateTextContent(customFields);
    document
      .querySelector(".userdetailsform")
      .parentElement.parentElement.remove();
    localStorage.setItem("messages", chatWindow.innerHTML);
    interact({ type: "done", payload: null });

    resolve("");
  });
}

function updateTextContent(customFields) {
  // Loop through the items in the customFields object
  for (const key in customFields) {
    if (customFields.hasOwnProperty(key)) {
      // Find elements with the specified data-ms-member attribute
      const elements = document.querySelectorAll(`[data-ms-member="${key}"]`);

      // Update the textContent of each matching element
      elements.forEach((element) => {
        element.textContent = customFields[key];
      });
    }
  }
}

function updateLocationCards(stateData) {
  // Convert stateData object to an array of state codes
  const stateCodes = Object.keys(stateData);

  // Iterate through the state codes
  stateCodes.forEach((stateCode, index) => {
    const stateInfo = stateData[stateCode];

    // Determine which modal to update based on the state index
    const modalId = `#modal_${index + 1}`;
    const cardId = `#card_${index + 1}`;
    // Check if scoresByState exists and has scores
    if (
      stateInfo.scoresByState &&
      stateInfo.scoresByState.Scores &&
      stateInfo.scoresByState.Scores.length > 0
    ) {
      const scoreInfo = stateInfo.scoresByState.Scores[0].fields;
      let url = `url("${scoreInfo.stateImage}")`;

      jQuery(cardId).find("h1").text(scoreInfo.stateName);
      jQuery(cardId).parent().css("background-image", url);
      // Update the corresponding modal with state and stateBlurb
      jQuery(modalId).find(".lf_state").text(scoreInfo.stateName);
      jQuery(modalId).find(".lf_blurb").text(scoreInfo.stateBlurb);

      jQuery(modalId).find(".lf_bg_img").css("background-image", url);
      // Update other scores for the modal
      const scores = [
        "amenities",
        "livability",
        "commute",
        "entertainment",
        "education",
        "childcare",
      ];
      scores.forEach((score) => {
        if (scoreInfo[score] !== undefined) {
          jQuery(modalId)
            .find(`.lf_${score}`)
            .find(".score-inner")
            .text(scoreInfo[score]);
          jQuery(modalId)
            .find(`.lf_${score}`)
            .find(".score-inner")
            .css("width", `calc(100% * (${scoreInfo[score]} / 100))`);
        }
      });
    }

    if (
      stateInfo.physiciansByStateAndSpecialty &&
      stateInfo.physiciansByStateAndSpecialty.records &&
      stateInfo.physiciansByStateAndSpecialty.records.length > 0
    ) {
      jQuery(modalId)
        .find(".lf_speciality")
        .text(
          stateInfo.physiciansByStateAndSpecialty.records[0].fields.Specialty
        );
      jQuery(modalId)
        .find(".lf_doc_count")
        .text(stateInfo.physiciansByStateAndSpecialty.records[0].fields.Count);
    }
    if (
      stateInfo.hospitalsByState &&
      stateInfo.hospitalsByState.HospitalDetails &&
      stateInfo.hospitalsByState.HospitalDetails.length > 0
    ) {
      // jQuery(modalId).find(".hosp_map");
      // window[`map_${index + 1}`];
        stateInfo.hospitalsByState.HospitalDetails.forEach((hospital) => {         
        //   console.log([hospital.fields.Longitude, hospital.fields.Latitude]) 
          new mapboxgl.Marker()
          .setLngLat([hospital.fields.Longitude, hospital.fields.Latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`<span class='hosp_name'>${hospital.fields["Hospital Name"]}<br><a href="${hospital.URL}">Visit Site</a></span`)) // add popup
          .addTo(window[`map_gl_${index + 1}`]);
          window[`bounds_gl_${index + 1}`].extend([hospital.fields.Longitude, hospital.fields.Latitude]);
        });
        window[`map_gl_${index + 1}`].fitBounds(window[`bounds_gl_${index + 1}`], {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15
      });
    }
  });

  // chatWindow.appendChild(locationCards)
  locationCards.style.display = "block";
  addAssistantMsg(locationCards);
}

// modal_1,modal_2,modal_3
// jQuery("#modal_3").find(".lf_livability").find(".score-inner").text("26");
// jQuery("#modal_3")
//   .find(".lf_livability")
//   .find(".score-inner")
//   .css("width", "calc(100% * (26  / 100))");

// lf_state   jQuery("#modal_3").find(".lf_state").text("26")
// lf_blurb   jQuery("#modal_3").find(".lf_blurb").text("26")
// lf_bg_img
// lf_livability
// lf_commute
// lf_education
// lf_amenities
// lf_entertainment
// lf_childcare
// lf_doc_count
// lf_speciality

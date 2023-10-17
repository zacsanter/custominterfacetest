const typingIndicator = document.getElementById("typing-indicator");
const uniqueId = generateUniqueId();
const voiceflowRuntime = "general-runtime.voiceflow.com";
const voiceflowVersionID =
  document.getElementById("vfassistant").getAttribute("data-version") ||
  "production";
const voiceflowAPIKey = "VF.DM.652afb9244a86a0007bc9df9.g3zZdF12zd8c9A0S";
// const voiceflowAPIKey = "VF.DM.64fa295bb73b580008d71482.TLynxecU2SVgJG9n";

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
      response.forEach((item) => {
        if (item.type === "speak" || item.type === "text") {
          console.info("Speak/Text Step");

          const messageElement = document.createElement("div");
          messageElement.classList.add("message", "assistant");
          
          
          // Directly work with slate.content array
          const formatted_messages = item.payload.slate.content.map((contentItem) => {
            const child = contentItem.children[0];
            let text = child.text.trim();  // Trim the text

            // Apply formatting based on the styles
            if ('fontWeight' in child && child['fontWeight'] === "700") {
                text = `<b>${text}</b>`;
            }
            if ('italic' in child && child['italic']) {
                text = `<i>${text}</i>`;
            }
            if ('underline' in child && child['underline']) {
                text = `<u>${text}</u>`;
            }
            if ('strikeThrough' in child && child['strikeThrough']) {
                text = `<strike>${text}</strike>`;
            }

            // Wrap in <p> tags if the text is meaningful after formatting
            return text.replace(/<[^>]*>/g, "").trim() ? `<p>${text}</p>` : "";
          }).filter(Boolean);

          // Combine the paragraphs without any additional breaks
          const combinedMessage = formatted_messages.join("");
          
          // Add the assistant's message to the chat window
          addMessageToChatWindow("assistant", combinedMessage);


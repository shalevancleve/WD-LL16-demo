// Get chatbot elements
const chatbotToggleBtn = document.getElementById("chatbotToggleBtn");
const chatbotPanel = document.getElementById("chatbotPanel");

if (chatbotToggleBtn && chatbotPanel) {
  // Toggle chat open/closed when clicking the button
  chatbotToggleBtn.addEventListener("click", () => {
    chatbotPanel.classList.toggle("open");
  });

  // Close chat when clicking anywhere except the chat panel or button
  document.addEventListener("click", (e) => {
    // If chat is open AND user clicked outside chat area, close it
    if (
      chatbotPanel.classList.contains("open") &&
      !chatbotPanel.contains(e.target) &&
      !chatbotToggleBtn.contains(e.target)
    ) {
      chatbotPanel.classList.remove("open");
    }
  });
}

// Get input, send button, and messages area
const chatbotInput = document.getElementById("chatbotInput");
const chatbotSendBtn = document.getElementById("chatbotSendBtn");
const chatbotMessages = document.getElementById("chatbotMessages");

// Store conversation history, starting with a system message
let messages = [
  {
    role: "system",
    content: `You are WayChat, Waymark’s friendly creative assistant.

Waymark is a video ad creation platform that helps people turn ideas, products, or messages into high-quality, ready-to-run videos. The platform is used by small businesses, agencies, and marketers to create broadcast-   ads with minimal friction.

Your job is to help users shape raw input — whether it’s a business name, a tagline, a product, a vibe, or a rough idea — into a short-form video concept.

Your responses may include suggested video structures, voiceover lines, tone and visual direction, music suggestions, and clarifying follow-up questions.

If the user's input is unclear, ask 1–2 short questions to help sharpen the direction before offering creative suggestions.

Only respond to questions related to Waymark, its tools, its platform, or the creative process of making short-form video ads. If a question is unrelated, politely explain that you're focused on helping users create video ads with Waymark, and that their prompt was not related to your focus.

Keep your replies concise, collaborative, and focused on helping users express their message clearly. Always align with modern marketing best practices —and stay supportive and friendly.`,
  },
];

let isWaiting = false; // Track if waiting for assistant's reply

// Function to add a message to the chat window
function addMessage(text, sender, isThinking = false) {
  const msgDiv = document.createElement("div");
  // Add chat bubble classes for styling
  if (sender === "user") {
    msgDiv.className = "chat-bubble user-message";
    msgDiv.textContent = text;
  } else if (sender === "assistant") {
    msgDiv.className = "chat-bubble assistant-message";
    // Format assistant messages with line breaks for readability
    msgDiv.innerHTML = text.replace(/\n{2,}/g, "<br><br>").replace(/(?<!<br>)\n/g, "<br>");
  } else if (isThinking) {
    msgDiv.className = "chat-bubble assistant-message thinking";
    msgDiv.innerHTML = `<span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span> Thinking...`;
  }
  chatbotMessages.appendChild(msgDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  return msgDiv; // Return the div for later removal if needed
}

// Function to send user input to OpenAI and display the response
async function sendMessage() {
  if (isWaiting) return; // Prevent sending while waiting for a reply

  const userMessage = chatbotInput.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, "user");
  chatbotInput.value = "";

  messages.push({ role: "user", content: userMessage });

  // Show "Thinking..." animation
  isWaiting = true;
  const thinkingDiv = addMessage("", "assistant", true);

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
  const body = {
    model: "gpt-4o",
    messages: messages,
    temperature: 0.8,
    max_tokens: 300,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    // Remove the "Thinking..." animation
    chatbotMessages.removeChild(thinkingDiv);
    const assistantReply =
      data.choices && data.choices[0]?.message?.content
        ? data.choices[0].message.content
        : "Sorry, I couldn't get a response.";
    addMessage(assistantReply, "assistant");
    messages.push({ role: "assistant", content: assistantReply });
  } catch (error) {
    chatbotMessages.removeChild(thinkingDiv);
    addMessage("Error: Could not connect to OpenAI.", "assistant");
  }
  isWaiting = false;
}

// Send message when button is clicked
if (chatbotSendBtn && chatbotInput) {
  chatbotSendBtn.addEventListener("click", sendMessage);
}

// Send message when Enter is pressed (Shift+Enter for newline)
chatbotInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

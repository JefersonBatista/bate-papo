// Control variables
let username = "";
let contact = "Todos";
let private_msg = false;
let last_msg_time = "";
let alert_timeout;

// Interval variables of recurrent actions
let connection_interval;
let messages_interval;
let participants_interval;

function enter_room() {
  const login_input = document.querySelector(".login form input");
  username = login_input.value;

  const user_obj = {
    name: username,
  };

  axios
    .post("https://mock-api.driven.com.br/api/v4/uol/participants", user_obj)
    .then(go_to_chat)
    .catch(alert_user);
}

function alert_user() {
  const login_alert = document.querySelector(".login .alert");
  login_alert.classList.remove("hidden");

  // Refresh alert timer
  if (alert_timeout) {
    clearInterval(alert_timeout);
  }
  alert_timeout = setTimeout(() => login_alert.classList.add("hidden"), 2500);
}

function keep_connection() {
  const user_obj = {
    name: username,
  };

  axios
    .post("https://mock-api.driven.com.br/api/v4/uol/status", user_obj)
    .catch((error) => console.log(error.response));
}

function update_messages() {
  const msgs_promise = axios.get(
    "https://mock-api.driven.com.br/api/v4/uol/messages"
  );
  msgs_promise.then(load_messages);
  msgs_promise.catch((error) => console.log(error.response));
}

function go_to_chat() {
  // Changing from login to chat screen
  const login = document.querySelector(".login");
  login.classList.add("hidden");

  const chat = document.querySelector(".chat");
  chat.classList.remove("hidden");

  // Getting chat messages and participants
  update_messages();
  update_participants();

  // Keeping connection every five seconds
  connection_interval = setInterval(keep_connection, 5000);

  // Updating messages every three seconds
  messages_interval = setInterval(update_messages, 3000);

  // Updating participant list every ten seconds
  participants_interval = setInterval(update_participants, 10000);
}

function load_messages(msgs_response) {
  const msgs_data = msgs_response.data;
  let messages = "";

  for (let i = 0; i < msgs_data.length; i++) {
    msg = msgs_data[i];
    messages += message_html(msg.from, msg.to, msg.text, msg.type, msg.time);
  }

  const msgs_element = document.querySelector(".chat .messages");
  msgs_element.innerHTML = messages;

  // Did the last message changed?
  const last_msg = msgs_data[msgs_data.length - 1];
  if (last_msg_time !== last_msg.time) {
    last_msg_time = last_msg.time;
    msgs_element.lastElementChild.scrollIntoView();
  }
}

function message_html(from, to, text, type, time) {
  if (type === "message") {
    return `
      <article class="message" data-identifier="message">
        <span class="timestamp">(${time})</span>
        <span class="username">${from}</span>
        <span>para</span>
        <span class="username">${to}<span class="colon">:</span></span>
        <span>${text}</span>
      </article>
    `;
  }

  if (type === "status") {
    return `
      <article class="message status" data-identifier="message">
        <span class="timestamp">(${time})</span>
        <span class="username">${from}</span>
        <span>${text}</span>
      </article>
    `;
  }

  if (type === "private_message") {
    if (to === "Todos" || from === username || to === username) {
      return `
        <article class="message reserved" data-identifier="message">
          <span class="timestamp">(${time})</span>
          <span class="username">${from}</span>
          <span>reservadamente para</span>
          <span class="username">${to}<span class="colon">:</span></span>
          <span>${text}</span>
        </article>
      `;
    }
  }

  // Return empty string if no case is satisfied
  return "";
}

function send_message() {
  const input_element = document.querySelector(".chat footer form input");
  const text = input_element.value;
  input_element.value = "";

  const message = {
    from: username,
    to: contact,
    text,
    type: private_msg ? "private_message" : "message",
  };

  axios
    .post("https://mock-api.driven.com.br/api/v4/uol/messages", message)
    .then(update_messages)
    .catch(reconnect);
}

function reconnect(error) {
  console.log(error.response);

  alert("Seu usuário está offline.");
  window.location.reload();
}

function toggle_chat_menu() {
  // Switching menu
  const menu = document.querySelector(".chat .menu");
  menu.classList.toggle("hidden");

  const black_screen = document.querySelector(".chat .black_screen");
  black_screen.classList.toggle("hidden");
}

function update_participants() {
  axios
    .get("https://mock-api.driven.com.br/api/v4/uol/participants")
    .then(list_participants)
    .catch((error) => console.log(error.response));
}

function list_participants(participants_response) {
  const participants = document.querySelector(".chat .menu .participants");
  const is_for_all = contact === "Todos";

  participants.innerHTML = `
    <div id="all" class="contact item${
      is_for_all ? " selected" : ""
    }" data-identifier="participant" onclick="select_contact(this)">
      <ion-icon class="icon" name="people"></ion-icon>
      <span class="name">Todos</span>
      <ion-icon class="check${
        is_for_all ? "" : " hidden"
      }" name="checkmark-sharp"></ion-icon>
    </div>
  `;

  const participants_data = participants_response.data;
  let contact_left_chat = !is_for_all;
  for (let i = 0; i < participants_data.length; i++) {
    const participant = participants_data[i];
    const name = participant.name;
    const is_for_this = contact !== "Todos" && contact === name;

    if (is_for_this) {
      contact_left_chat = false;
    }

    participants.innerHTML += `
      <div class="contact item${
        is_for_this ? " selected" : ""
      }" data-identifier="participant" onclick="select_contact(this)">
        <ion-icon class="icon" name="person-circle"></ion-icon>
        <span class="name">${name}</span>
        <ion-icon class="check${
          is_for_this ? "" : " hidden"
        }" name="checkmark-sharp"></ion-icon>
      </div>
    `;
  }

  // If the selected participant left the chat, select "Todos"
  if (contact_left_chat) {
    const all = document.querySelector(".chat .menu .contact.item#all");
    select_contact(all);
  }
}

function select_contact(item) {
  // Undo current selection
  const prev_selected = document.querySelector(
    ".chat .menu .contact.item.selected"
  );
  if (prev_selected) {
    prev_selected.classList.remove("selected");

    const prev_check = prev_selected.querySelector(".check");
    prev_check.classList.add("hidden");
  }

  // Selecting new item
  item.classList.add("selected");

  const check = item.querySelector(".check");
  check.classList.remove("hidden");

  // Changing contact name
  contact = item.querySelector(".name").innerHTML;
  console.log("contact: " + contact);

  update_receiver_info();
}

function select_visibility(item) {
  // Undo current selection
  const prev_selected = document.querySelector(
    ".chat .menu .visibility.item.selected"
  );
  if (prev_selected) {
    prev_selected.classList.remove("selected");

    const prev_check = prev_selected.querySelector(".check");
    prev_check.classList.add("hidden");
  }

  // Selecting new item
  item.classList.add("selected");

  const check = item.querySelector(".check");
  check.classList.remove("hidden");

  // Changing message privacity
  private_msg = item.querySelector(".option").innerHTML === "Reservadamente";
  console.log("private_msg: " + private_msg);

  update_receiver_info();
}

function update_receiver_info() {
  let receiver_info = "";
  if (contact !== "Todos") {
    receiver_info = `Enviando para ${contact}`;

    if (private_msg) {
      receiver_info += " (reservadamente)";
    }
  }

  const receiver_element = document.querySelector(".chat footer .receiver");
  receiver_element.innerHTML = receiver_info;
}

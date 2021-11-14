let username = "";
let contact = "Todos";
let private_msg = false;
let last_msg_time = "";

enter_room();

function enter_room() {
  username = prompt("Escolha um nome de usuário:");
  const user_obj = {
    name: username,
  };

  axios
    .post("https://mock-api.driven.com.br/api/v4/uol/participants", user_obj)
    .then(get_messages)
    .catch(try_enter_room_again);
}

function try_enter_room_again() {
  alert("Esse nome já está sendo usado por um usuário online.");
  enter_room();
}

// Keeping connection every five seconds
const connection_interval = setInterval(keep_connection, 5000);

function keep_connection() {
  const user_obj = {
    name: username,
  };

  axios.post("https://mock-api.driven.com.br/api/v4/uol/status", user_obj);
}

// Updating messages every three seconds
const update_interval = setInterval(update_messages, 3000);

function get_messages() {
  const msgs_promise = axios.get(
    "https://mock-api.driven.com.br/api/v4/uol/messages"
  );
  msgs_promise.then(load_messages);
}

function update_messages() {
  get_messages();
}

function load_messages(msgs_response) {
  const msgs_data = msgs_response.data;
  let messages = "";

  for (let i = 0; i < msgs_data.length; i++) {
    msg = msgs_data[i];
    messages += message_html(msg.from, msg.to, msg.text, msg.type, msg.time);
  }

  const main_element = document.querySelector("main");
  main_element.innerHTML = messages;

  // Did the last message changed?
  const last_msg = msgs_data[msgs_data.length - 1];
  if (last_msg_time !== last_msg.time) {
    last_msg_time = last_msg.time;
    main_element.lastElementChild.scrollIntoView();
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
    if (from === username || to === username) {
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
  const input_element = document.querySelector("footer input");
  const text = input_element.value;
  input_element.value = "";

  const message = {
    from: username,
    to: "Todos",
    text,
    type: "message",
  };

  axios
    .post("https://mock-api.driven.com.br/api/v4/uol/messages", message)
    .then(update_messages)
    .catch(reconnect);
}

function reconnect(error) {
  alert("Seu usuário está offline.");
  enter_room();
}

function toggle_menu() {
  // Switching menu
  const menu = document.querySelector(".menu");
  menu.classList.toggle("hidden");

  const black_screen = document.querySelector(".black_screen");
  black_screen.classList.toggle("hidden");

  // If menu will be shown, update participant list
  const menu_is_shown = !menu.classList.contains("hidden");

  if (menu_is_shown) {
    axios
      .get("https://mock-api.driven.com.br/api/v4/uol/participants")
      .then(listParticipants);
  }
}

function listParticipants(participants_response) {
  const participants = document.querySelector(".participants");
  participants.innerHTML = `
    <div class="contact item selected" onclick="select_contact(this)">
      <ion-icon class="icon" name="people"></ion-icon>
      <span class="name">Todos</span>
      <ion-icon class="check" name="checkmark-sharp"></ion-icon>
    </div>
  `;

  const participants_data = participants_response.data;
  for (let i = 0; i < participants_data.length; i++) {
    const participant = participants_data[i];
    const name = participant.name;

    participants.innerHTML += `
      <div class="contact item" onclick="select_contact(this)">
        <ion-icon class="icon" name="person-circle"></ion-icon>
        <span class="name">${name}</span>
        <ion-icon class="check hidden" name="checkmark-sharp"></ion-icon>
      </div>
    `;
  }
}

function select_contact(item) {
  // Undo current selection
  const prev_selected = document.querySelector(".contact.item.selected");
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
}

function select_visibility(item) {
  // Undo current selection
  const prev_selected = document.querySelector(".visibility.item.selected");
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
}

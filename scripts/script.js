get_messages();

// Updating messages every three seconds
const updateInterval = setInterval(update_messages, 3000);

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
  main_element.lastElementChild.scrollIntoView();
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

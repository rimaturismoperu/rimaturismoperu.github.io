(() => {
  "use strict";
  const encoder = new TextEncoder();
  const form = document.querySelector("#credential-form");
  const message = document.querySelector("#form-message");
  const password = document.querySelector("#admin-password");
  const confirmation = document.querySelector("#admin-password-confirm");

  document.querySelector("#show-password").addEventListener("change", (event) => {
    const type = event.target.checked ? "text" : "password";
    password.type = type;
    confirmation.type = type;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const email = document.querySelector("#admin-email").value.trim().toLowerCase();
    if (!form.checkValidity()) {
      message.textContent = "Completa un correo válido y una contraseña de al menos 16 caracteres.";
      return;
    }
    if (password.value !== confirmation.value) {
      message.textContent = "Las dos contraseñas no coinciden.";
      return;
    }
    if (!/[a-záéíóúñ]/i.test(password.value) || !/\d/.test(password.value)) {
      message.textContent = "Para mayor seguridad, la contraseña debe combinar letras y números.";
      return;
    }

    const secret = crypto.getRandomValues(new Uint8Array(32));
    const secretText = toBase64Url(secret);
    const key = await crypto.subtle.importKey("raw", encoder.encode(secretText), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`password:${password.value}`)));
    document.querySelector("#result-email").textContent = email;
    document.querySelector("#result-hash").textContent = `hmac-sha256$${toBase64Url(signature)}`;
    document.querySelector("#result-secret").textContent = secretText;
    document.querySelector("#results").hidden = false;
    document.querySelector("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
    const value = document.querySelector(`#${button.dataset.copy}`).textContent;
    await navigator.clipboard.writeText(value);
    document.querySelector("#copy-message").textContent = `${button.dataset.copy === "result-email" ? "Correo" : "Valor seguro"} copiado.`;
  }));

  function toBase64(bytes) {
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function toBase64Url(bytes) {
    return toBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  }
})();

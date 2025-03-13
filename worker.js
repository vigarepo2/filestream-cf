// ---------- Insert Your Data ---------- //

const BOT_TOKEN = "7958850882:AAEyzWIpIO1AT0QcDEE8uZiYAP3fahvR5fc"; // Insert your bot token.
const BOT_WEBHOOK = "/endpoint"; // Let it be as it is.
const BOT_SECRET = "vikram"; // Insert a powerful secret text (only [A-Z, a-z, 0-9, _, -] are allowed).
const BOT_OWNER = 6986536422; // Insert your telegram account id.
const BOT_CHANNEL = -1001872371917; // Insert your telegram channel id which the bot is admin in.
const PUBLIC_BOT = true; // Make your bot public (only [true, false] are allowed).

// ---------- Event Listener ---------- // 

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event))
});

async function handleRequest(event) {
    const url = new URL(event.request.url);
     
    if (url.pathname === BOT_WEBHOOK) {return Bot.handleWebhook(event)}
    if (url.pathname === '/registerWebhook') {return Bot.registerWebhook(event, url, BOT_WEBHOOK, BOT_SECRET)}
    if (url.pathname === '/unregisterWebhook') {return Bot.unregisterWebhook(event)}
    if (url.pathname === '/getMe') {return new Response(JSON.stringify(await Bot.getMe()), {headers: {'Access-Control-Allow-Origin': '*', 'content-type': 'application/json'}, status: 202})}

    return new Response(JSON.stringify({"ok":false,"error_code":404,"description":"❌ Bad Request: Invalid request"}), {headers: {'Access-Control-Allow-Origin': '*', 'content-type': 'application/json'}, status: 404});
}

// ---------- Telegram Bot ---------- //

class Bot {
  static async handleWebhook(event) {
    if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== BOT_SECRET) {
      return new Response('Unauthorized', { status: 403 })
    }
    const update = await event.request.json()
    event.waitUntil(this.Update(event, update))
    return new Response('Ok')
  }

  static async registerWebhook(event, requestUrl, suffix, secret) {
    const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`
    const response = await fetch(await this.apiUrl('setWebhook', { url: webhookUrl, secret_token: secret }))
    return new Response(JSON.stringify(await response.json()), {headers: {'Access-Control-Allow-Origin': '*', 'content-type': 'application/json'}})
  }

  static async unregisterWebhook(event) { 
    const response = await fetch(await this.apiUrl('setWebhook', { url: '' }))
    return new Response(JSON.stringify(await response.json()), {headers: {'Access-Control-Allow-Origin': '*', 'content-type': 'application/json'}})
  }

  static async getMe() {
    const response = await fetch(await this.apiUrl('getMe'))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async copyMessage(chat_id, from_chat_id, message_id) {
    const response = await fetch(await this.apiUrl('copyMessage', {chat_id: chat_id, from_chat_id: from_chat_id, message_id: message_id}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async getMessage(chat_id, message_id) {
    const response = await fetch(await this.apiUrl('getMessage', {chat_id: chat_id, message_id: message_id}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendMessage(chat_id, reply_id, text, reply_markup=[]) {
    const response = await fetch(await this.apiUrl('sendMessage', {
      chat_id: chat_id, 
      reply_to_message_id: reply_id, 
      parse_mode: 'markdown', 
      text, 
      reply_markup: JSON.stringify({inline_keyboard: reply_markup})
    }))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendDocument(chat_id, file_id, caption = "") {
    const response = await fetch(await this.apiUrl('sendDocument', {
      chat_id: chat_id, 
      document: file_id,
      caption: caption || "",
      parse_mode: 'markdown'
    }))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendPhoto(chat_id, file_id, caption = "") {
    const response = await fetch(await this.apiUrl('sendPhoto', {
      chat_id: chat_id, 
      photo: file_id,
      caption: caption || "",
      parse_mode: 'markdown'
    }))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendVideo(chat_id, file_id, caption = "") {
    const response = await fetch(await this.apiUrl('sendVideo', {
      chat_id: chat_id, 
      video: file_id,
      caption: caption || "",
      parse_mode: 'markdown'
    }))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendAudio(chat_id, file_id, caption = "") {
    const response = await fetch(await this.apiUrl('sendAudio', {
      chat_id: chat_id, 
      audio: file_id,
      caption: caption || "",
      parse_mode: 'markdown'
    }))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async answerInlineArticle(query_id, title, description, text, reply_markup=[], id='1') {
    const data = [{
      type: 'article', 
      id: id, 
      title: title, 
      thumbnail_url: "https://i.ibb.co/5s8hhND/dac5fa134448.png", 
      description: description, 
      input_message_content: {message_text: text, parse_mode: 'markdown'}, 
      reply_markup: {inline_keyboard: reply_markup}
    }];
    const response = await fetch(await this.apiUrl('answerInlineQuery', {
      inline_query_id: query_id, 
      results: JSON.stringify(data), 
      cache_time: 1
    }))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async answerInlineDocument(query_id, title, file_id, mime_type, reply_markup=[], id='1') {
    const data = [{
      type: 'document', 
      id: id, 
      title: title, 
      document_file_id: file_id, 
      mime_type: mime_type, 
      description: mime_type, 
      reply_markup: {inline_keyboard: reply_markup}
    }];
    const response = await fetch(await this.apiUrl('answerInlineQuery', {
      inline_query_id: query_id, 
      results: JSON.stringify(data), 
      cache_time: 1
    }))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async answerInlinePhoto(query_id, title, photo_id, reply_markup=[], id='1') {
    const data = [{
      type: 'photo', 
      id: id, 
      title: title, 
      photo_file_id: photo_id, 
      reply_markup: {inline_keyboard: reply_markup}
    }];
    const response = await fetch(await this.apiUrl('answerInlineQuery', {
      inline_query_id: query_id, 
      results: JSON.stringify(data), 
      cache_time: 1
    }))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async apiUrl(methodName, params = null) {
    let query = '';
    if (params) {
      query = '?' + new URLSearchParams(params).toString();
    }
    return `https://api.telegram.org/bot${BOT_TOKEN}/${methodName}${query}`;
  }

  static async Update(event, update) {
    if (update.inline_query) {await onInline(event, update.inline_query)}
    if ('message' in update) {await onMessage(event, update.message)}
  }
}

// ---------- Inline Listener ---------- // 

async function onInline(event, inline) {
  let query = inline.query.trim();
  
  if (!PUBLIC_BOT && inline.from.id != BOT_OWNER) {
    const buttons = [[{ text: "🔐 Contact Developer", url: "https://t.me/yourusername" }]];
    return await Bot.answerInlineArticle(
      inline.id, 
      "⛔ Access Restricted", 
      "This bot is for private use only", 
      "*⛔ Access Restricted*\n\nThis bot is currently in private mode. Please contact the bot owner for access.", 
      buttons
    );
  }
  
  if (!query || isNaN(query)) {
    const buttons = [[{ text: "📋 How to Use", url: "https://t.me/yourusername" }]];
    return await Bot.answerInlineArticle(
      inline.id, 
      "ℹ️ Usage Guide", 
      "Type a valid message ID to share", 
      "*ℹ️ How to Use Inline Mode*\n\nTo share a file, type the message ID number of a previously shared file.", 
      buttons
    );
  }

  try {
    // Directly use message ID from query
    const messageId = parseInt(query);
    
    try {
      const message = await Bot.getMessage(BOT_CHANNEL, messageId);
      
      if (!message || message.error_code) {
        throw new Error("Message not found");
      }

      if (message.photo) {
        const photoId = message.photo[message.photo.length - 1].file_id;
        const buttons = [[{ text: "🔄 Share Again", switch_inline_query_current_chat: query }]];
        return await Bot.answerInlinePhoto(inline.id, "📷 Photo", photoId, buttons);
      } else if (message.document) {
        const fileId = message.document.file_id;
        const mimeType = message.document.mime_type;
        const fileName = message.document.file_name || "File";
        const buttons = [[{ text: "🔄 Share Again", switch_inline_query_current_chat: query }]];
        return await Bot.answerInlineDocument(inline.id, fileName, fileId, mimeType, buttons);
      } else {
        throw new Error("Unsupported media type");
      }
    } catch (error) {
      const buttons = [[{ text: "🆘 Support", url: "https://t.me/yourusername" }]];
      return await Bot.answerInlineArticle(
        inline.id, 
        "⚠️ Error", 
        "File not found or access denied", 
        "*⚠️ Error: File Not Found*\n\nThe specified message ID could not be found or contains unsupported content.", 
        buttons
      );
    }
  } catch (error) {
    const buttons = [[{ text: "🆘 Support", url: "https://t.me/yourusername" }]];
    return await Bot.answerInlineArticle(
      inline.id, 
      "⚠️ Invalid Input", 
      "Please enter a valid message ID", 
      "*⚠️ Invalid Input*\n\nPlease enter a valid message ID number.", 
      buttons
    );
  }
}

// ---------- Message Listener ---------- // 

async function onMessage(event, message) {
  let bot = await Bot.getMe();

  // Skip messages from inline mode or channels
  if (message.via_bot && message.via_bot.username === bot.username) {
    return;
  }
  
  if (message.chat.id.toString().includes("-100")) {
    return;
  }

  // Welcome message
  if (message.text && message.text === "/start") {
    const buttons = [
      [{ text: "👨‍💻 Developer", url: "https://t.me/yourusername" }],
      [{ text: "🛠 Support Channel", url: "https://t.me/yourchannel" }]
    ];
    
    return Bot.sendMessage(
      message.chat.id, 
      message.message_id, 
      "*🚀 Welcome to File Storage Bot!*\n\n📤 Send me any file, photo, video or audio to store it securely.\n\n💡 *Features:*\n• File storage with direct access\n• Inline sharing in any chat\n• Telegram file links\n\n📌 *Maximum file size:* 4GB (uploads), 20MB (inline sharing)", 
      buttons
    );
  }

  // Handle /start with parameters - DIRECT MESSAGE ID
  if (message.text && message.text.startsWith("/start ")) {
    const messageId = message.text.split("/start ")[1].trim();
    
    if (isNaN(messageId)) {
      return Bot.sendMessage(
        message.chat.id, 
        message.message_id, 
        "❌ *Invalid Format*\n\nThe ID format is invalid. Please use a numeric message ID."
      );
    }

    try {
      // Simply copy the message directly with the ID provided
      const result = await Bot.copyMessage(
        message.chat.id,  // Destination chat
        BOT_CHANNEL,      // Source chat 
        parseInt(messageId)  // Message ID to copy
      );
      
      if (!result || result.error_code) {
        return Bot.sendMessage(
          message.chat.id, 
          message.message_id, 
          "❌ *File Not Found*\n\nThe requested file could not be found. It may have been deleted or the ID is incorrect."
        );
      }
      
      // Success - no need to send anything else as the file is already copied
      return;
      
    } catch (error) {
      return Bot.sendMessage(
        message.chat.id, 
        message.message_id, 
        "❌ *Error Occurred*\n\nAn error occurred while retrieving the file. Please try again later."
      );
    }
  }

  // Access control
  if (!PUBLIC_BOT && message.chat.id != BOT_OWNER) {
    const buttons = [[{ text: "👨‍💻 Contact Developer", url: "https://t.me/yourusername" }]];
    return Bot.sendMessage(
      message.chat.id, 
      message.message_id, 
      "*⛔ Access Restricted*\n\nThis bot is currently in private mode. Please contact the bot owner for access.", 
      buttons
    );
  }

  // Handle media messages - copy to channel without forward tag
  let fileInfo = null;
  
  if (message.document || message.photo || message.video || message.audio) {
    fileInfo = await Bot.copyMessage(BOT_CHANNEL, message.chat.id, message.message_id);
  } else {
    const buttons = [[{ text: "📋 How to Use", url: "https://t.me/yourusername" }]];
    return Bot.sendMessage(
      message.chat.id, 
      message.message_id, 
      "📤 *Send Me Files*\n\nPlease send me photos, videos, documents or audio files to store.", 
      buttons
    );
  }

  if (!fileInfo || fileInfo.error_code) {
    return Bot.sendMessage(
      message.chat.id, 
      message.message_id, 
      "❌ *Error Occurred*\n\nFailed to save your file. Please try again later."
    );
  }

  // Get the message ID of the saved file
  const messageId = fileInfo.message_id;
  const telegramLink = `https://t.me/${bot.username}?start=${messageId}`;

  // Create buttons with the file info
  const buttons = [
    [{ text: "🔗 Telegram Link", url: telegramLink }, 
     { text: "📤 Inline Share", switch_inline_query: messageId.toString() }]
  ];

  // Success message with file info
  let mediaType = "File";
  if (message.document) mediaType = "Document";
  if (message.photo) mediaType = "Photo";
  if (message.video) mediaType = "Video";
  if (message.audio) mediaType = "Audio";

  // Generate user-friendly success message
  let successMessage = `*✅ ${mediaType} Saved Successfully!*\n\n`;
  successMessage += `📌 *Message ID:* \`${messageId}\`\n`;
  
  if (message.document && message.document.file_name) {
    successMessage += `📄 *File Name:* \`${message.document.file_name}\`\n`;
  }
  
  if ((message.document && message.document.file_size) || 
      (message.video && message.video.file_size) || 
      (message.audio && message.audio.file_size)) {
    const size = message.document?.file_size || message.video?.file_size || message.audio?.file_size;
    const formattedSize = formatFileSize(size);
    successMessage += `📊 *File Size:* ${formattedSize}\n`;
  }
  
  successMessage += `\n💡 *Share your file:*\n• Use the Telegram Link to share directly\n• Use Inline Share to send in any chat`;
  
  return Bot.sendMessage(message.chat.id, message.message_id, successMessage, buttons);
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  else return (bytes / 1073741824).toFixed(2) + ' GB';
}

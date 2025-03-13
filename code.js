// ---------- Configuration ---------- //

const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"; // Your bot token
const BOT_WEBHOOK = "/endpoint"; // Webhook endpoint
const BOT_SECRET = "YOUR_SECRET_TOKEN"; // Secret for webhook security
const BOT_OWNER = 123456789; // Your Telegram ID
const MONGODB_URI = "YOUR_MONGODB_URI"; // MongoDB connection string
const MONGODB_DB_NAME = "filebot"; // Database name
const VERIFICATION_HOURS = 24; // Verification period

// URL shortener configuration
const SHORTENER_API = "YOUR_SHORTENER_API"; // e.g., Bitly, TinyURL API
const SHORTENER_API_KEY = "YOUR_SHORTENER_API_KEY";
const WORKER_DOMAIN = "your-worker-domain.workers.dev"; // Your worker domain

// ---------- Event Listener ---------- // 

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const url = new URL(event.request.url);
  
  // Handle Telegram webhook
  if (url.pathname === BOT_WEBHOOK) {
    return Bot.handleWebhook(event);
  }
  
  // Handle verification endpoints
  if (url.pathname.startsWith('/verify/')) {
    return handleVerification(url.pathname.substring(8), event);
  }
  
  // Handle URL shortener redirect
  if (url.pathname.startsWith('/s/')) {
    return handleShortUrl(url.pathname.substring(3), event);
  }
  
  return new Response("Not found", {status: 404});
}

// ---------- MongoDB Integration ---------- //

class Database {
  static async connect() {
    // Using MongoDB Data API for serverless environments
    const endpoint = `${MONGODB_URI}/action`;
    return { endpoint };
  }
  
  static async findUser(userId) {
    const { endpoint } = await this.connect();
    
    const response = await fetch(`${endpoint}/findOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'api-key': MONGODB_URI
      },
      body: JSON.stringify({
        dataSource: "Cluster0",
        database: MONGODB_DB_NAME,
        collection: "users",
        filter: { userId: parseInt(userId) }
      })
    });
    
    const result = await response.json();
    return result.document;
  }
  
  static async saveUser(userId, username, firstName, lastName) {
    const { endpoint } = await this.connect();
    
    const user = {
      userId: parseInt(userId),
      username: username || "",
      firstName: firstName || "",
      lastName: lastName || "",
      joinedAt: new Date().toISOString(),
      verified: false,
      verificationExpires: null
    };
    
    await fetch(`${endpoint}/updateOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'api-key': MONGODB_URI
      },
      body: JSON.stringify({
        dataSource: "Cluster0",
        database: MONGODB_DB_NAME,
        collection: "users",
        filter: { userId: parseInt(userId) },
        update: { $set: user },
        upsert: true
      })
    });
    
    return user;
  }
  
  static async updateUserVerification(userId, verified = true) {
    const { endpoint } = await this.connect();
    
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + VERIFICATION_HOURS);
    
    await fetch(`${endpoint}/updateOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'api-key': MONGODB_URI
      },
      body: JSON.stringify({
        dataSource: "Cluster0",
        database: MONGODB_DB_NAME,
        collection: "users",
        filter: { userId: parseInt(userId) },
        update: {
          $set: {
            verified: verified,
            verificationExpires: expirationTime.toISOString()
          }
        }
      })
    });
  }
  
  static async getAllUsers() {
    const { endpoint } = await this.connect();
    
    const response = await fetch(`${endpoint}/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'api-key': MONGODB_URI
      },
      body: JSON.stringify({
        dataSource: "Cluster0",
        database: MONGODB_DB_NAME,
        collection: "users",
        projection: { userId: 1, _id: 0 }
      })
    });
    
    const result = await response.json();
    return result.documents;
  }
  
  static async saveFile(fileId, fileUniqueId, fileName, fileSize, userId) {
    const { endpoint } = await this.connect();
    
    const file = {
      fileId: fileId,
      fileUniqueId: fileUniqueId,
      fileName: fileName || "Unnamed file",
      fileSize: fileSize || 0,
      uploadedBy: parseInt(userId),
      uploadedAt: new Date().toISOString()
    };
    
    const response = await fetch(`${endpoint}/insertOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'api-key': MONGODB_URI
      },
      body: JSON.stringify({
        dataSource: "Cluster0",
        database: MONGODB_DB_NAME,
        collection: "files",
        document: file
      })
    });
    
    const result = await response.json();
    return { ...file, _id: result.insertedId };
  }
}

// ---------- Verification System ---------- //

async function handleVerification(token, event) {
  try {
    // Decode and validate token
    const userId = atob(token);
    
    if (!userId || isNaN(parseInt(userId))) {
      return new Response("Invalid verification token", { status: 400 });
    }
    
    // Update user verification in database
    await Database.updateUserVerification(userId, true);
    
    // Return success HTML page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Verification Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 500px;
              margin: 50px auto;
              padding: 20px;
              background-color: white;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #4CAF50;
            }
            p {
              line-height: 1.6;
              color: #333;
            }
            .button {
              display: inline-block;
              margin-top: 20px;
              padding: 10px 20px;
              background-color: #2196F3;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Verification Successful!</h1>
            <p>Your account has been successfully verified. You can now use the file bot for the next ${VERIFICATION_HOURS} hours without needing to verify again.</p>
            <p>You can close this window and return to the bot.</p>
            <a class="button" href="https://t.me/YOUR_BOT_USERNAME">Return to Bot</a>
          </div>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    return new Response("Verification failed: " + error.message, { status: 500 });
  }
}

// Generate a verification link
function generateVerificationLink(userId) {
  // Simple token - in production use a more secure method
  const token = btoa(userId.toString());
  return `https://${WORKER_DOMAIN}/verify/${token}`;
}

// Create a shortened URL for verification
async function createShortUrl(longUrl) {
  try {
    // Implementation will depend on the URL shortener service you use
    // Example using a generic API:
    const response = await fetch(`${SHORTENER_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SHORTENER_API_KEY}`
      },
      body: JSON.stringify({
        long_url: longUrl
      })
    });
    
    const data = await response.json();
    return data.short_url || data.result.short_link || longUrl;
  } catch (error) {
    console.error('Error creating short URL:', error);
    return longUrl; // Fallback to the original URL if shortening fails
  }
}

// Handle short URL redirect
async function handleShortUrl(shortCode, event) {
  // This would normally query your URL shortener database
  // For this example, we'll just redirect to the verification page
  return Response.redirect(`https://${WORKER_DOMAIN}/verify/${shortCode}`, 302);
}

// ---------- Telegram Bot ---------- //

class Bot {
  static async handleWebhook(event) {
    // Verify secret token for security
    if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== BOT_SECRET) {
      return new Response('Unauthorized', { status: 403 });
    }
    
    const update = await event.request.json();
    event.waitUntil(this.processUpdate(update));
    return new Response('OK');
  }
  
  static async processUpdate(update) {
    if (update.message) {
      return this.handleMessage(update.message);
    }
  }
  
  static async handleMessage(message) {
    // Extract user data
    const userId = message.from.id;
    const username = message.from.username;
    const firstName = message.from.first_name;
    const lastName = message.from.last_name;
    
    // Save or update user in database
    let user = await Database.findUser(userId);
    if (!user) {
      user = await Database.saveUser(userId, username, firstName, lastName);
    }
    
    // Check if verification has expired
    const isVerified = user && user.verified && new Date(user.verificationExpires) > new Date();
    
    // Handle commands
    if (message.text) {
      // Handle /start command
      if (message.text === '/start') {
        return this.sendWelcomeMessage(message.chat.id);
      }
      
      // Handle /verify command
      if (message.text === '/verify') {
        return this.sendVerificationLink(message.chat.id, userId);
      }
      
      // Handle /status command
      if (message.text === '/status') {
        return this.sendStatusMessage(message.chat.id, user);
      }
      
      // Handle /broadcast command (admin only)
      if (message.text.startsWith('/broadcast') && message.from.id === BOT_OWNER && message.reply_to_message) {
        return this.broadcastMessage(message.chat.id, message.reply_to_message);
      }
      
      // If not verified and not using a command, request verification
      if (!isVerified) {
        return this.sendVerificationLink(message.chat.id, userId);
      }
    }
    
    // Handle file uploads (if verified)
    if (isVerified && (message.document || message.photo || message.video || message.audio)) {
      return this.handleFileUpload(message);
    }
    
    // Default response for unrecognized messages
    return this.sendMessage(message.chat.id, "I didn't understand that. Send me a file to store it, or use /help to see available commands.");
  }
  
  static async sendWelcomeMessage(chatId) {
    const message = `
🎉 *Welcome to the File Storage Bot!*

This bot allows you to store and share files easily. 

*Available commands:*
• /start - Start the bot
• /verify - Get verification link
• /status - Check your verification status
• /help - Show help message

To use the bot, you need to verify yourself first. Use the /verify command to get started.
`;
    
    return this.sendMessage(chatId, message);
  }
  
  static async sendVerificationLink(chatId, userId) {
    // Generate verification link
    const verificationUrl = generateVerificationLink(userId);
    
    // Create short URL
    const shortUrl = await createShortUrl(verificationUrl);
    
    const message = `
🔐 *Verification Required*

To use the bot, please verify yourself by clicking the link below:

[🔑 Click here to verify](${shortUrl})

This verification will be valid for ${VERIFICATION_HOURS} hours. After that, you'll need to verify again.
`;
    
    return this.sendMessage(chatId, message);
  }
  
  static async sendStatusMessage(chatId, user) {
    const isVerified = user && user.verified && new Date(user.verificationExpires) > new Date();
    
    let message = `
📊 *Your Status*

`;
    
    if (isVerified) {
      const expiresDate = new Date(user.verificationExpires);
      const hoursLeft = Math.round((expiresDate - new Date()) / (1000 * 60 * 60));
      
      message += `
✅ *Verified*: Yes
⏱ *Expires in*: ~${hoursLeft} hours
📅 *Expiry Time*: ${expiresDate.toLocaleString()}

You can continue to use the bot normally.
`;
    } else {
      message += `
❌ *Verified*: No

Please use /verify to get a verification link.
`;
    }
    
    return this.sendMessage(chatId, message);
  }
  
  static async handleFileUpload(message) {
    const userId = message.from.id;
    let fileId, fileUniqueId, fileName, fileSize;
    
    // Extract file details based on media type
    if (message.document) {
      fileId = message.document.file_id;
      fileUniqueId = message.document.file_unique_id;
      fileName = message.document.file_name;
      fileSize = message.document.file_size;
    } else if (message.photo) {
      // For photos, use the highest resolution
      const photo = message.photo[message.photo.length - 1];
      fileId = photo.file_id;
      fileUniqueId = photo.file_unique_id;
      fileName = "Photo";
      fileSize = photo.file_size;
    } else if (message.video) {
      fileId = message.video.file_id;
      fileUniqueId = message.video.file_unique_id;
      fileName = "Video";
      fileSize = message.video.file_size;
    } else if (message.audio) {
      fileId = message.audio.file_id;
      fileUniqueId = message.audio.file_unique_id;
      fileName = message.audio.title || "Audio";
      fileSize = message.audio.file_size;
    }
    
    // Save file details to database
    const savedFile = await Database.saveFile(fileId, fileUniqueId, fileName, fileSize, userId);
    
    // Format file size
    const formattedSize = formatFileSize(fileSize);
    
    // Send confirmation with file details
    const responseMessage = `
✅ *File Successfully Stored!*

📄 *File Name*: ${fileName}
📦 *Size*: ${formattedSize}
🆔 *ID*: \`${savedFile._id}\`

Your file has been saved to our database. You can access it anytime using this bot.
`;
    
    return this.sendMessage(message.chat.id, responseMessage);
  }
  
  static async broadcastMessage(chatId, messageToForward) {
    try {
      // Only allow the bot owner to broadcast
      if (chatId !== BOT_OWNER) {
        return this.sendMessage(chatId, "⛔ You are not authorized to use the broadcast function.");
      }
      
      // Get all users from database
      const users = await Database.getAllUsers();
      
      if (!users || users.length === 0) {
        return this.sendMessage(chatId, "⚠️ No users found in the database for broadcasting.");
      }
      
      // Send status message
      await this.sendMessage(chatId, `🔄 Broadcasting message to ${users.length} users...`);
      
      let successCount = 0;
      let failCount = 0;
      
      // Create copy of message to forward to all users
      for (const user of users) {
        try {
          // Copy message to user
          await this.copyMessage(user.userId, chatId, messageToForward.message_id);
          successCount++;
        } catch (error) {
          failCount++;
        }
        
        // Add a small delay to prevent hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Send completion message
      return this.sendMessage(chatId, `✅ Broadcast completed!\n\n✅ Successfully sent: ${successCount}\n❌ Failed: ${failCount}`);
    } catch (error) {
      return this.sendMessage(chatId, `❌ Error broadcasting message: ${error.message}`);
    }
  }
  
  static async sendMessage(chatId, text) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
  }
  
  static async copyMessage(chatId, fromChatId, messageId) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/copyMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        from_chat_id: fromChatId,
        message_id: messageId
      })
    });
  }
}

// ---------- Utility Functions ---------- //

// Format file size to human-readable form
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

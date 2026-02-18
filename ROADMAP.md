# Product Roadmap & Enhancement Guide

This document outlines the future direction of **RedisGui**. We welcome contributions from the community to help make these features a reality!

## 🚀 Near-Term Goals (Priority)

### 1. Advanced Data Type Support
Currently, the Key Editor focuses on Strings and JSON. We need dedicated editors for:
- **Hashes (`HGETALL`)**: A table-like view for editing field-value pairs.
- **Lists (`LRANGE`)**: A list view with push/pop capabilities.
- **Sets (`SMEMBERS`)**: A collection view for managing unique members.
- **Sorted Sets (`ZRANGE`)**: A ranked table view showing members and their scores.
- **Streams (`XRANGE`)**: A real-time log view for stream entries.

### 2. Server Statistics Dashboard
Create a dedicated "Stats" tab to visualize key Redis metrics:
- **Real-time Memory Usage**: Charts showing memory consumption over time.
- **CPU Load**: Monitor Redis server CPU usage.
- **Connected Clients**: List and manage active client connections.
- **Command Stats**: Visual breakdown of most frequently used commands.

### 3. Enhanced Console Experience
Improve the raw Redis Console (`/console`) with:
- **Autocompletion**: IntelliSense-style suggestions for Redis commands and keys.
- **Syntax Highlighting**: Color-code commands, keys, and arguments.
- **Command History**: Persist command history across sessions (using LocalStorage or SQLite).

---

## 🌟 Mid-Term Enhancements

### 4. Import / Export Data
- **Bulk Import**: Allow uploading `.rdb` or `.json` files to populate a database.
- **Export Keys**: functionality to export selected keys (or entire DB) to JSON/CSV for backup or analysis.

### 5. Pub/Sub Viewer
- A dedicated interface to subscribe to channels and view messages in real-time.
- Ability to publish messages to channels directly from the UI.

### 6. User Experience (UX) Polish
- **Command Palette (`Cmd+K`)**: Quick navigation between connections, keys, and settings.
- **Keyboard Shortcuts**: Hotkeys for common actions (Save, Refresh, Delete Key, Switch DB).
- **Themes**: Add a Light Mode or custom theme support (currently optimized for Dark Mode).

---

## 🛠 Technical Improvements

### 7. Security & Team Features
- **Role-Based Access Control (RBAC)**: Define "Read-Only" vs "Admin" connections.
- **Team Sharing**: Allow sharing connection configurations (encrypted) between team members via export/link.

### 8. Redis Cluster Support
- Add native support for **Redis Cluster** mode, allowing automatic slot discovery and node management.
- Support for **Redis Sentinel** configurations for high-availability setups.

### 9. Testing & Quality
- **E2E Testing**: Implement Playwright/Cypress tests for critical flows (Connection -> Scan -> Edit).
- **Unit Tests**: Increase coverage for `redis-service.ts` and utility functions.

---

## 💡 How to Propose a New Feature?

1. Check the [Issues](https://github.com/fawasam/redis-gui/issues) to see if it has already been requested.
2. Open a **Feature Request** using the provided template.
3. If you want to build it yourself, comment on the issue to assign it to yourself!

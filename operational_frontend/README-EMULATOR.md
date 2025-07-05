# Firebase Emulator Setup

This guide explains how to set up and use the Firebase Emulator Suite for local development.

## Prerequisites

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

## Starting the Emulator

1. Start the Firebase emulators and responder simulation:
   ```bash
   npm run dev
   ```

   This will start:
   - Firebase Firestore emulator on port 8080
   - Firebase Auth emulator on port 9099
   - Responder simulation script

2. Access the Firebase Emulator UI at:
   http://localhost:4000

## Monitoring Responder Location

1. Open the monitoring page in a browser:
   ```bash
   # Using Python's built-in HTTP server
   cd scripts
   python3 -m http.server 3000
   ```
   Then open: http://localhost:3000/monitor.html

## Available Scripts

- `npm run emulator` - Start only the Firebase emulators
- `npm run simulate-responder` - Start only the responder simulation
- `npm run dev` - Start both emulators and simulation

## Troubleshooting

- If you get connection errors, ensure the emulators are running and accessible
- Check the console logs for any error messages
- Make sure the Firebase project ID in the configuration matches your project

## Resetting Data

To reset the emulator data, stop the emulators and delete the `emulator-data` directory:

```bash
rm -rf emulator-data
```

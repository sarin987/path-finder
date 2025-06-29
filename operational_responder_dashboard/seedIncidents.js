// seedIncidents.js
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function seed() {
  const incidents = [
    {
      createdAt: new Date().toISOString(),
      location: { lat: 18.559, lng: 73.776 },
      locationName: "Mahalunge, Pune",
      userName: "Sekece d",
      role: "Parent",
      status: "pending"
    },
    {
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      location: { lat: 18.5204, lng: 73.8567 },
      locationName: "Shivajinagar, Pune",
      userName: "John Doe",
      role: "Teacher",
      status: "accepted"
    }
  ];

  for (const incident of incidents) {
    await db.collection('incidents').add(incident);
    console.log('Added:', incident);
  }
  process.exit(0);
}

seed();

async function trigger() {
  try {
    const resp = await fetch('http://localhost:3000/api/admin/setup-firestore-seed', { method: 'POST' });
    const text = await resp.text();
    console.log("Success:", text);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
trigger();

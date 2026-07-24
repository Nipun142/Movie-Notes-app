fetch("https://api.github.com")
  .then((res) => res.json())
  .then((data) => console.log("SUCCESS"))
  .catch((err) => console.error("FAILED", err));

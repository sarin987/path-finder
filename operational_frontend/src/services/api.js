const bcrypt = require("bcrypt");

const hashPassword = async () => {
  const plainPassword = "Sarin123";  // Your dummy password
  const saltRounds = 10;

  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  console.log("🔐 Hashed Password:", hashedPassword);
};

hashPassword();

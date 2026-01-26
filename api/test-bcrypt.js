const bcrypt = require('bcrypt');

async function test() {
  const pass = '12345678';
  // Hash lấy từ log debug trước (step 613)
  const hash = '$2b$10$zkvuNRdg'; // Hash này bị cắt ở '...', cần full hash để test.
  
  // Nhưng tôi ko có full hash.
  // Tôi sẽ generate hash mới console log ra.
  const newHash = await bcrypt.hash(pass, 10);
  console.log('New Hash:', newHash);
  const match = await bcrypt.compare(pass, newHash);
  console.log('Match New:', match);
}

test();
